import ky, { type Options as KyOptions, type RetryOptions as KyRetryOptions } from 'ky'

import { normalizeTransportError } from './error.js'
import { createEventStream } from './sse.js'
import type {
  ApiClient,
  ApiClientConfig,
  EventStream,
  HeadersInput,
  RequestOptions,
  RetryConfig,
  RetryOptions,
  ServerEvent,
  StreamOptions,
} from './types.js'
import { normalizeBaseUrl, resolveUrl } from './url.js'

const DEFAULT_TIMEOUT = 10_000
const DEFAULT_REQUEST_ID_HEADER = 'x-request-id'
const IDEMPOTENT_METHODS = ['get', 'put', 'head', 'delete', 'options', 'trace'] as const

function normalizeRetry(config: RetryConfig | undefined): KyRetryOptions {
  if (config === undefined) return { limit: 0 }

  const resolved: RetryOptions = typeof config === 'number' ? { limit: config } : config
  if (!Number.isInteger(resolved.limit) || resolved.limit < 0) {
    throw new TypeError('retry.limit 必须是非负整数')
  }

  return {
    limit: resolved.limit,
    methods: resolved.methods?.map((method) => method.toLowerCase()) ?? IDEMPOTENT_METHODS,
    ...(resolved.statusCodes !== undefined ? { statusCodes: resolved.statusCodes } : {}),
    ...(resolved.delay !== undefined ? { delay: resolved.delay } : {}),
    ...(resolved.jitter !== undefined ? { jitter: resolved.jitter } : {}),
  }
}

function parseResponse<T>(response: Response): Promise<T> {
  if (response.status === 204 || response.status === 205 || response.status === 304) {
    return Promise.resolve(undefined as T)
  }

  const contentType = response.headers.get('content-type') ?? ''
  if (contentType.includes('application/json') || contentType.includes('+json')) {
    return response.text().then((text) => (text ? (JSON.parse(text) as T) : (undefined as T)))
  }

  return response.text() as Promise<T>
}

/**
 * 创建与具体应用无关的请求客户端。
 *
 * baseUrl、凭据与请求头都由调用方注入；每次调用返回独立实例，
 * 服务端与浏览器可以各自持有不同配置的客户端。
 */
export function createApiClient(config: ApiClientConfig): ApiClient {
  if (!config || typeof config.baseUrl !== 'string' || config.baseUrl.trim() === '') {
    throw new TypeError('createApiClient: baseUrl 必填')
  }

  const baseUrl = normalizeBaseUrl(config.baseUrl)
  const fetchImpl = config.fetch ?? globalThis.fetch
  if (typeof fetchImpl !== 'function') {
    throw new TypeError('createApiClient: 当前环境没有可用的 fetch，请通过 config.fetch 注入')
  }

  if (
    config.timeout !== undefined &&
    config.timeout !== false &&
    (!Number.isFinite(config.timeout) || config.timeout < 0)
  ) {
    throw new TypeError('createApiClient: timeout 必须是非负数或 false')
  }

  const credentials = config.credentials ?? 'include'
  const requestIdHeader = config.requestIdHeader ?? DEFAULT_REQUEST_ID_HEADER
  const kyInstance = ky.create({
    credentials,
    timeout: config.timeout ?? DEFAULT_TIMEOUT,
    retry: normalizeRetry(config.retry),
    fetch: fetchImpl,
  })

  async function resolveHeaders(requestHeaders?: HeadersInput): Promise<Headers | undefined> {
    const source = config.headers
    const configured = typeof source === 'function' ? await source() : source
    if (!configured && !requestHeaders) return undefined

    const merged = new Headers()
    if (configured) {
      new Headers(configured).forEach((value, key) => merged.set(key, value))
    }
    if (requestHeaders) {
      new Headers(requestHeaders).forEach((value, key) => merged.set(key, value))
    }
    return merged
  }

  async function requestRaw(path: string, options: RequestOptions = {}): Promise<Response> {
    const url = resolveUrl(baseUrl, path)
    const headers = await resolveHeaders(options.headers)
    const { json, searchParams, timeout, retry: requestRetry, headers: _headers, ...init } = options

    const requestOptions: KyOptions = {
      ...init,
      ...(json !== undefined ? { json } : {}),
      ...(searchParams !== undefined ? { searchParams } : {}),
      ...(timeout !== undefined ? { timeout } : {}),
      ...(requestRetry !== undefined ? { retry: normalizeRetry(requestRetry) } : {}),
      ...(headers ? { headers } : {}),
    }

    try {
      return await kyInstance(url, requestOptions)
    } catch (error) {
      throw normalizeTransportError(error, requestIdHeader)
    }
  }

  async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const response = await requestRaw(path, options)
    return parseResponse<T>(response)
  }

  function withMethod(method: string) {
    return <T>(path: string, options: RequestOptions = {}): Promise<T> =>
      request<T>(path, { ...options, method })
  }

  function stream<T = string>(
    path: string,
    options: StreamOptions<T> = {},
  ): EventStream<ServerEvent<T>> {
    return createEventStream<T>(
      {
        baseUrl,
        fetch: fetchImpl,
        resolveHeaders,
        credentials,
        requestIdHeader,
      },
      path,
      options,
    )
  }

  return {
    request,
    get: withMethod('GET'),
    post: withMethod('POST'),
    put: withMethod('PUT'),
    patch: withMethod('PATCH'),
    delete: withMethod('DELETE'),
    requestRaw,
    stream,
  }
}
