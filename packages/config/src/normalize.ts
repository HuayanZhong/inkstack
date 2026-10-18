/**
 * 标准化路由前缀：保证以单个 `/` 开头且没有末尾斜杠。
 * 空字符串与 `/` 都归一为 `/`。
 */
export function normalizePrefix(prefix: string): string {
  const raw = prefix.trim()
  if (!raw || raw === '/') return '/'
  const withLeading = raw.startsWith('/') ? raw : `/${raw}`
  return withLeading.replace(/\/+$/, '')
}

/** 移除 URL 末尾的斜杠；空字符串原样返回。 */
export function normalizeBaseUrl(url: string): string {
  return url.trim().replace(/\/+$/, '')
}

/** 拼接 base URL 与路径，处理两侧斜杠；任一侧为空时返回另一侧。 */
export function joinUrl(baseUrl: string, path: string): string {
  const base = normalizeBaseUrl(baseUrl)
  const segment = path.trim()
  if (!base) return segment
  if (!segment) return base
  if (segment === '/') return base
  if (segment.startsWith('/')) return `${base}${segment}`
  return `${base}/${segment}`
}
