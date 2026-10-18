import { env } from './env.js'

const nodeEnv = env.NODE_ENV ?? 'development'

/** BFF 的类型化运行配置；业务代码从这里读取，不直接访问 `process.env`。 */
export const config = {
  runtime: {
    nodeEnv,
    isDev: nodeEnv === 'development',
  },
  server: {
    port: env.BFF_PORT,
  },
} as const
