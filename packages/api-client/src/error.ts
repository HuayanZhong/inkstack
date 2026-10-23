import { HTTPError, NetworkError, TimeoutError } from 'ky'

export interface ApiErrorOptions {
  status?: number | null
  code: string
  requestId?: string | null
  data?: unknown
  cause?: unknown
}

/**
 * 传输层错误的统一形态。
 *
 * 主动 abort 不会变成 `ApiError`：调用方需要能区分「我取消了」和「请求失败」。
 */
export class ApiError extends Error {
  readonly status: number | null
  readonly code: string
  readonly requestId: string | null
  readonly data: unknown

  constructor(message: string, options: ApiErrorOptions) {
    super(message, 'cause' in options ? { cause: options.cause } : undefined)
    this.name = 'ApiError'
    this.status = options.status ?? null
    this.code = options.code
    this.requestId = options.requestId ?? null
    this.data = options.data
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function readString(source: unknown, key: string): string | null {
  if (!isRecord(source)) return null
  const value = source[key]
  return typeof value === 'string' ? value : null
}

function isAbortError(error: unknown): boolean {
  if (!isRecord(error)) return false
  return error['name'] === 'AbortError'
}

/** 把 ky 的传输错误映射为 `ApiError`；abort 与未知异常原样抛出。 */
export function normalizeTransportError(error: unknown, requestIdHeader: string): ApiError {
  if (isAbortError(error)) throw error

  if (error instanceof HTTPError) {
    const status = error.response.status
    const data = error.data
    const code = readString(data, 'code') ?? 'HTTP_ERROR'
    const requestId = readString(data, 'requestId') ?? error.response.headers.get(requestIdHeader)
    return new ApiError(`HTTP ${status}`, {
      status,
      code,
      ...(requestId !== null ? { requestId } : {}),
      data,
      cause: error,
    })
  }

  if (error instanceof TimeoutError) {
    return new ApiError('请求超时', { status: null, code: 'TIMEOUT', cause: error })
  }

  if (error instanceof NetworkError) {
    return new ApiError('网络请求失败', { status: null, code: 'NETWORK_ERROR', cause: error })
  }

  throw error
}

/** 从非 2xx 的 SSE 建连响应构造 `ApiError`。 */
export async function errorFromResponse(
  response: Response,
  requestIdHeader: string,
): Promise<ApiError> {
  let data: unknown
  const text = await response.text().catch(() => '')
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = text
    }
  }

  const code = readString(data, 'code') ?? 'HTTP_ERROR'
  const requestId = readString(data, 'requestId') ?? response.headers.get(requestIdHeader)

  return new ApiError(`HTTP ${response.status}`, {
    status: response.status,
    code,
    ...(requestId !== null ? { requestId } : {}),
    ...(data !== undefined ? { data } : {}),
  })
}
