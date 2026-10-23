/** 凭据模式。只声明包需要的三个值，避免依赖非全局的 DOM 类型。 */
export type Credentials = 'omit' | 'same-origin' | 'include'

/** 请求头输入。支持普通对象或 `Headers` 实例。 */
export type HeadersInput = Record<string, string> | Headers

/** 请求头来源：静态值或每次请求前解析的函数。 */
export type HeadersSource = HeadersInput | (() => HeadersInput | Promise<HeadersInput>)

/** 重试配置。默认 limit 为 0，只有显式配置才重试。 */
export interface RetryOptions {
  limit: number
  methods?: readonly string[]
  statusCodes?: readonly number[]
  delay?: (attemptCount: number) => number
  jitter?: boolean
}

export type RetryConfig = RetryOptions | number

export interface ApiClientConfig {
  /** 必须是绝对 `http`/`https` URL，由调用方按运行环境注入。 */
  baseUrl: string
  credentials?: Credentials
  headers?: HeadersSource
  timeout?: number | false
  retry?: RetryConfig
  fetch?: typeof fetch
  requestIdHeader?: string
}

export type SearchParamsInput =
  | string
  | URLSearchParams
  | Record<string, string | number | boolean | undefined>
  | Array<[string, string | number | boolean]>

export type RequestOptions = Omit<RequestInit, 'body' | 'headers'> & {
  json?: unknown
  searchParams?: SearchParamsInput
  headers?: HeadersInput
  timeout?: number | false
  retry?: RetryConfig
}

/** 一个已解析的 SSE 事件。`data` 默认是原始字符串。 */
export interface ServerEvent<T = string> {
  event?: string
  data: T
  id?: string
}

export interface EventMeta {
  event?: string
  id?: string
}

export interface ReconnectOptions {
  maxAttempts?: number
  initialDelayMs?: number
  maxDelayMs?: number
}

/** SSE 不设请求超时，也不复用一元请求的重试配置。 */
export type StreamOptions<T = string> = Omit<RequestOptions, 'timeout' | 'retry' | 'json'> & {
  json?: unknown
  parse?: (data: string, meta: EventMeta) => T
  reconnect?: false | ReconnectOptions
}

export interface EventStream<T> extends AsyncIterable<T> {
  close(): void
}

export interface ApiClient {
  request<T>(path: string, options?: RequestOptions): Promise<T>
  get<T>(path: string, options?: RequestOptions): Promise<T>
  post<T>(path: string, options?: RequestOptions): Promise<T>
  put<T>(path: string, options?: RequestOptions): Promise<T>
  patch<T>(path: string, options?: RequestOptions): Promise<T>
  delete<T>(path: string, options?: RequestOptions): Promise<T>
  requestRaw(path: string, options?: RequestOptions): Promise<Response>
  stream<T = string>(path: string, options?: StreamOptions<T>): EventStream<ServerEvent<T>>
}
