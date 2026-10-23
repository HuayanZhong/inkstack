import { envIntString, envString, envUrlString, parseEnv, z } from '@inkstack/config'

const envSchema = z.object({
  // Next CLI 原生读取 PORT；这里只负责校验与类型化。
  PORT: envIntString().default(3000),
  NEXT_PUBLIC_CANVAS_MF_ENTRY: envUrlString(),
  // 局域网或隧道调试时额外允许访问 dev server 的 hostname，逗号分隔，不带协议与端口。
  ALLOWED_DEV_ORIGINS: envString().default(''),
})

/** next.config.ts 在 dev / build 启动时导入本模块，配置缺失会直接中断。 */
export const env = parseEnv(envSchema, process.env, { label: 'shell' })
