import { createParser, type EventSourceMessage } from 'eventsource-parser'

import { ApiError, errorFromResponse, isApiError } from './error.js'
import type {
  Credentials,
  EventMeta,
  EventStream,
  HeadersInput,
  ReconnectOptions,
  ServerEvent,
  StreamOptions,
} from './types.js'
import { appendSearchParams, resolveUrl } from './url.js'

const RETRYABLE_STATUS_CODES = new Set([408, 429, 502, 503, 504])
const ABORTED = Symbol('aborted')

interface StreamContext {
  baseUrl: string
  fetch: typeof fetch
  resolveHeaders: (headers?: HeadersInput) => Promise<Headers | undefined>
  credentials: Credentials
  requestIdHeader: string
}

interface NormalizedReconnect {
  enabled: boolean
  maxAttempts: number
  initialDelayMs: number
  maxDelayMs: number
}

interface Waiter<T> {
  resolve: (result: IteratorResult<T>) => void
  reject: (error: unknown) => void
}

/**
 * 创建一个懒启动的 SSE 事件流。
 *
 * 第一次迭代才发起连接；重连默认关闭，开启后由本函数负责退避与 `Last-Event-ID`。
 */
export function createEventStream<T = string>(
  context: StreamContext,
  path: string,
  options: StreamOptions<T> = {},
): EventStream<ServerEvent<T>> {
  const reconnect = normalizeReconnect(options.reconnect)
  const controller = new AbortController()
  const queue: Array<ServerEvent<T>> = []
  const waiters: Array<Waiter<ServerEvent<T>>> = []

  let started = false
  let finished = false
  let closed = false
  let hasPendingError = false
  let pendingError: unknown
  let lastEventId: string | undefined
  let serverRetryMs: number | undefined

  const externalSignal = options.signal ?? undefined
  const onExternalAbort = () => finish()

  if (externalSignal) {
    if (externalSignal.aborted) finish()
    else externalSignal.addEventListener('abort', onExternalAbort, { once: true })
  }

  function removeAbortListener(): void {
    externalSignal?.removeEventListener('abort', onExternalAbort)
  }

  function finish(): void {
    if (finished) return
    finished = true
    closed = true
    controller.abort()
    removeAbortListener()
    for (const waiter of waiters.splice(0)) {
      waiter.resolve({ done: true, value: undefined })
    }
  }

  function fail(error: unknown): void {
    if (finished) return
    finished = true
    closed = true
    controller.abort()
    removeAbortListener()

    if (waiters.length > 0) {
      for (const waiter of waiters.splice(0)) waiter.reject(error)
      return
    }

    hasPendingError = true
    pendingError = error
  }

  function enqueue(event: ServerEvent<T>): void {
    if (finished) return

    if (event.id) {
      if (event.id === lastEventId) return
      lastEventId = event.id
    }

    if (waiters.length > 0) {
      waiters.shift()!.resolve({ done: false, value: event })
      return
    }

    queue.push(event)
  }

  function toServerEvent(message: EventSourceMessage): ServerEvent<T> {
    const meta: EventMeta = {
      ...(message.event !== undefined ? { event: message.event } : {}),
      ...(message.id !== undefined ? { id: message.id } : {}),
    }

    if (!options.parse) {
      return { data: message.data as T, ...meta }
    }

    try {
      return { data: options.parse(message.data, meta), ...meta }
    } catch (error) {
      throw new ApiError('SSE 事件解析失败', {
        status: null,
        code: 'SSE_PARSE_ERROR',
        cause: error,
      })
    }
  }

  async function consume(body: ReadableStream<Uint8Array>): Promise<void> {
    const reader = body.getReader()
    const decoder = new TextDecoder()
    let parseFailure: unknown
    let hasParseFailure = false

    const parser = createParser({
      onEvent(message) {
        enqueue(toServerEvent(message))
      },
      onRetry(ms) {
        serverRetryMs = ms
      },
      onError(error) {
        parseFailure = error
        hasParseFailure = true
      },
    })

    try {
      while (!closed) {
        const result = await raceWithAbort(reader.read(), controller.signal)
        if (result === ABORTED) {
          await reader.cancel().catch(() => undefined)
          return
        }

        if (result.done) break
        parser.feed(decoder.decode(result.value, { stream: true }))

        if (hasParseFailure) {
          throw new ApiError('SSE 解析失败', {
            status: null,
            code: 'SSE_PARSE_ERROR',
            cause: parseFailure,
          })
        }
      }

      if (!closed) parser.feed(decoder.decode())
    } finally {
      // 取消或中止后 reader 可能已经释放，这里只做尽力清理。
      try {
        reader.releaseLock()
      } catch {
        // 已释放或已取消，无需再次处理。
      }
    }
  }

  async function fetchOnce(): Promise<Response> {
    const headers = new Headers()
    const configured = await context.resolveHeaders(options.headers)
    configured?.forEach((value, key) => headers.set(key, value))

    if (!headers.has('accept')) headers.set('accept', 'text/event-stream')
    if (lastEventId) headers.set('last-event-id', lastEventId)

    const body = options.json !== undefined ? JSON.stringify(options.json) : undefined
    if (body !== undefined && !headers.has('content-type')) {
      headers.set('content-type', 'application/json')
    }

    const {
      headers: _headers,
      json: _json,
      method,
      searchParams,
      parse: _parse,
      reconnect: _reconnect,
      signal: _signal,
      credentials,
      ...init
    } = options

    const url = appendSearchParams(resolveUrl(context.baseUrl, path), searchParams)

    return context.fetch(url, {
      ...init,
      method: method ?? (body !== undefined ? 'POST' : 'GET'),
      headers,
      credentials: credentials ?? context.credentials,
      ...(body !== undefined ? { body } : {}),
      signal: controller.signal,
    })
  }

  async function run(): Promise<void> {
    let attempt = 0

    while (!closed) {
      try {
        const response = await fetchOnce()
        if (closed) return

        if (!response.ok) {
          const error = await errorFromResponse(response, context.requestIdHeader)

          if (
            reconnect.enabled &&
            attempt < reconnect.maxAttempts &&
            RETRYABLE_STATUS_CODES.has(response.status)
          ) {
            const delay = retryAfterMs(response) ?? computeDelay(reconnect, attempt, serverRetryMs)
            attempt += 1
            await sleep(delay, controller.signal)
            continue
          }

          fail(error)
          return
        }

        if (!response.body) {
          fail(
            new ApiError('SSE 响应没有 body', {
              status: response.status,
              code: 'EMPTY_STREAM',
            }),
          )
          return
        }

        await consume(response.body)
        if (!closed) finish()
        return
      } catch (error) {
        if (closed) return

        const apiError = toStreamError(error)
        if (reconnect.enabled && attempt < reconnect.maxAttempts && isRetryableError(apiError)) {
          const delay = computeDelay(reconnect, attempt, serverRetryMs)
          attempt += 1
          await sleep(delay, controller.signal)
          continue
        }

        fail(apiError)
        return
      }
    }
  }

  async function next(): Promise<IteratorResult<ServerEvent<T>>> {
    if (hasPendingError) {
      const error = pendingError
      hasPendingError = false
      pendingError = undefined
      throw error
    }

    if (queue.length > 0) {
      return { done: false, value: queue.shift()! }
    }

    if (finished) return { done: true, value: undefined }

    if (!started) {
      started = true
      void run().catch((error: unknown) => fail(error))
    }

    return new Promise<IteratorResult<ServerEvent<T>>>((resolve, reject) => {
      waiters.push({ resolve, reject })
    })
  }

  return {
    close: finish,
    [Symbol.asyncIterator]() {
      return {
        next,
        return: async () => {
          finish()
          return { done: true, value: undefined }
        },
      }
    },
  }
}

function normalizeReconnect(input: false | ReconnectOptions | undefined): NormalizedReconnect {
  if (!input) {
    return { enabled: false, maxAttempts: 0, initialDelayMs: 0, maxDelayMs: 0 }
  }

  const maxAttempts = input.maxAttempts ?? 3
  const initialDelayMs = input.initialDelayMs ?? 500
  const maxDelayMs = input.maxDelayMs ?? 5000

  if (!Number.isInteger(maxAttempts) || maxAttempts < 0) {
    throw new TypeError('reconnect.maxAttempts 必须是非负整数')
  }
  if (!Number.isFinite(initialDelayMs) || initialDelayMs < 0) {
    throw new TypeError('reconnect.initialDelayMs 必须是非负数')
  }
  if (!Number.isFinite(maxDelayMs) || maxDelayMs < 0) {
    throw new TypeError('reconnect.maxDelayMs 必须是非负数')
  }

  return { enabled: true, maxAttempts, initialDelayMs, maxDelayMs }
}

function computeDelay(
  reconnect: NormalizedReconnect,
  attempt: number,
  serverRetryMs: number | undefined,
): number {
  const exponential = Math.min(reconnect.maxDelayMs, reconnect.initialDelayMs * 2 ** attempt)
  const base =
    serverRetryMs !== undefined ? Math.min(reconnect.maxDelayMs, serverRetryMs) : exponential
  return base <= 0 ? 0 : Math.floor(Math.random() * base)
}

function retryAfterMs(response: Response): number | undefined {
  const value = response.headers.get('retry-after')
  if (!value) return undefined

  const seconds = Number(value)
  if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000)

  const timestamp = Date.parse(value)
  if (Number.isFinite(timestamp)) return Math.max(0, timestamp - Date.now())

  return undefined
}

function isRetryableError(error: ApiError): boolean {
  if (error.code === 'SSE_PARSE_ERROR' || error.code === 'EMPTY_STREAM') return false
  if (error.status === null) return error.code === 'NETWORK_ERROR'
  return RETRYABLE_STATUS_CODES.has(error.status)
}

function toStreamError(error: unknown): ApiError {
  if (isApiError(error)) return error
  return new ApiError('SSE 请求失败', {
    status: null,
    code: 'NETWORK_ERROR',
    cause: error,
  })
}

async function raceWithAbort<T>(
  promise: Promise<T>,
  signal: AbortSignal,
): Promise<T | typeof ABORTED> {
  if (signal.aborted) return ABORTED

  return new Promise<T | typeof ABORTED>((resolve, reject) => {
    const onAbort = () => resolve(ABORTED)
    signal.addEventListener('abort', onAbort, { once: true })

    promise.then(
      (value) => {
        signal.removeEventListener('abort', onAbort)
        resolve(value)
      },
      (error: unknown) => {
        signal.removeEventListener('abort', onAbort)
        reject(error)
      },
    )
  })
}

function sleep(ms: number, signal: AbortSignal): Promise<void> {
  if (ms <= 0) return Promise.resolve()

  return new Promise((resolve) => {
    if (signal.aborted) {
      resolve()
      return
    }

    const onAbort = () => {
      clearTimeout(timer)
      resolve()
    }

    const timer = setTimeout(() => {
      signal.removeEventListener('abort', onAbort)
      resolve()
    }, ms)
    signal.addEventListener('abort', onAbort, { once: true })
  })
}
