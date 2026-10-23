import type { SearchParamsInput } from './types.js'

/**
 * 校验并标准化 baseUrl。
 *
 * 只接受绝对 `http`/`https` URL：相对地址在浏览器依赖 `document.baseURI`，
 * 在 Node 没有等价物，会让同一份配置产生两种行为。
 */
export function normalizeBaseUrl(baseUrl: string): string {
  const value = baseUrl.trim()
  let url: URL
  try {
    url = new URL(value)
  } catch {
    throw new TypeError(`baseUrl 必须是绝对 URL: ${baseUrl}`)
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new TypeError(`baseUrl 只支持 http/https: ${baseUrl}`)
  }

  if (url.search || url.hash) {
    throw new TypeError(`baseUrl 不能包含查询参数或片段: ${baseUrl}`)
  }

  return url.href.replace(/\/+$/, '')
}

/**
 * 把相对路径解析到 baseUrl 下。
 *
 * 路径开头的斜杠会被去掉，保证结果始终落在 baseUrl 的路径之下；
 * 绝对 URL 与 `..` 段直接拒绝，避免绕过 baseUrl 或逃逸出前缀。
 */
export function resolveUrl(baseUrl: string, path: string): string {
  const normalizedBase = normalizeBaseUrl(baseUrl)
  const base = new URL(`${normalizedBase}/`)
  const raw = path.trim()

  if (!raw) return normalizedBase

  if (/^[a-z][a-z\d+.-]*:/i.test(raw) || raw.startsWith('//')) {
    throw new TypeError(`path 必须是相对路径: ${path}`)
  }

  const relative = raw.replace(/^\/+/, '')
  if (relative.split('/').includes('..')) {
    throw new TypeError(`path 不能包含 ..: ${path}`)
  }

  const url = new URL(relative, base)
  if (url.origin !== base.origin) {
    throw new TypeError(`path 不能指向其他 origin: ${path}`)
  }

  const basePath = base.pathname
  const basePathWithoutSlash = basePath.endsWith('/') ? basePath.slice(0, -1) : basePath
  if (url.pathname !== basePathWithoutSlash && !url.pathname.startsWith(basePath)) {
    throw new TypeError(`path 超出 baseUrl 范围: ${path}`)
  }

  return url.href
}

/** 把查询参数追加到已解析的 URL；`undefined` 值被忽略。 */
export function appendSearchParams(url: string, params?: SearchParamsInput): string {
  if (params === undefined) return url

  const search = new URLSearchParams()

  if (typeof params === 'string') {
    const raw = params.startsWith('?') ? params.slice(1) : params
    new URLSearchParams(raw).forEach((value, key) => search.append(key, value))
  } else if (params instanceof URLSearchParams) {
    params.forEach((value, key) => search.append(key, value))
  } else if (Array.isArray(params)) {
    for (const [key, value] of params) search.append(key, String(value))
  } else {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) search.set(key, String(value))
    }
  }

  const query = search.toString()
  if (!query) return url
  return `${url}${url.includes('?') ? '&' : '?'}${query}`
}
