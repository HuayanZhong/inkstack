import { envIntString, envString, parseEnv, z } from '@inkstack/config'

// 客户端 tsconfig 设置 types: []，不引入 Node 全局；本模块只在构建期读取 process.env。
declare const process: { env: Record<string, string | undefined> }

const envSchema = z.object({
  CANVAS_HOST: envString().default('localhost'),
  CANVAS_PORT: envIntString().default(4002),
  CANVAS_DEV_CORS_ORIGIN: envString().default('*'),
})

/** rspack.config.ts 在 dev / build 启动时导入本模块，配置非法会直接中断。 */
export const env = parseEnv(envSchema, process.env, { label: 'canvas' })
