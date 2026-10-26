import { env } from './env'

import type { NextConfig } from 'next'

const allowedDevOrigins = env.ALLOWED_DEV_ORIGINS.split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  typedRoutes: true,
  // dev server 默认只认启动时的 hostname；局域网调试的 hostname 由 env 提供，未配置时不启用。
  ...(allowedDevOrigins.length > 0 ? { allowedDevOrigins } : {}),
}

export default nextConfig
