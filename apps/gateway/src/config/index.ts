import { normalizePrefix } from '@inkstack/config'
import { env } from './env.js'

const nodeEnv = env.NODE_ENV ?? 'development'

/** Gateway 的类型化运行配置；业务代码从这里读取，不直接访问环境变量。 */
export const config = {
  runtime: {
    nodeEnv,
    isDev: nodeEnv === 'development',
  },
  server: {
    port: env.GATEWAY_PORT,
  },
  ws: {
    path: normalizePrefix(env.GATEWAY_WS_PATH),
  },
} as const
