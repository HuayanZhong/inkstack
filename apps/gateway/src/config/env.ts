import { envIntString, parseEnv, z } from '@inkstack/config'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production', 'staging']).optional(),
  GATEWAY_PORT: envIntString().default(4001),
  GATEWAY_WS_PATH: z.string().regex(/^\//, 'must start with /').default('/ws'),
})

/** 校验后的 Gateway 环境变量；模块加载时校验失败会直接抛错，阻止带病启动。 */
export const env = parseEnv(envSchema, process.env, { label: 'gateway' })
