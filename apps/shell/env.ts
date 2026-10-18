import { envIntString, envUrlString, parseEnv, z } from '@inkstack/config'

const envSchema = z.object({
  // Next CLI 原生读取 PORT；这里只负责校验与类型化。
  PORT: envIntString().default(3000),
  NEXT_PUBLIC_CANVAS_MF_ENTRY: envUrlString(),
})

/** next.config.ts 在 dev / build 启动时导入本模块，配置缺失会直接中断。 */
parseEnv(envSchema, process.env, { label: 'shell' })
