import { z } from 'zod'

/**
 * 环境变量校验失败时抛出的错误。
 *
 * `issues` 保留每个失败字段的路径与原因；错误消息也包含同样的明细，
 * 未捕获时能直接看到是哪些字段导致启动失败。
 */
export class EnvError extends Error {
  readonly issues: Array<{ path: string; message: string }>

  constructor(message: string, issues: Array<{ path: string; message: string }>) {
    super(message)
    this.name = 'EnvError'
    this.issues = issues
  }
}

/**
 * 用 schema 解析环境变量。
 *
 * 只负责解析与校验，不负责加载：调用方传入 `process.env` 或测试替身，
 * 失败时抛 {@link EnvError}，成功时返回类型安全的配置对象。
 *
 * @param schema - zod schema，字段名与 `env` 的键一致
 * @param env - 待解析的环境变量集合
 * @param opts.label - 出现在错误消息里的运行端名称，例如 `bff`
 */
export function parseEnv<TSchema extends z.ZodType>(
  schema: TSchema,
  env: Record<string, unknown>,
  opts?: { label?: string },
): z.infer<TSchema> {
  const parsed = schema.safeParse(env)
  if (parsed.success) return parsed.data

  const issues = parsed.error.issues.map((issue) => ({
    path: issue.path.map(String).join('.'),
    message: issue.message,
  }))
  const label = opts?.label ? ` (${opts.label})` : ''
  const detail = issues.map((issue) => `${issue.path}: ${issue.message}`).join('; ')
  throw new EnvError(`Invalid environment${label}: ${detail}`, issues)
}

/** 必填非空字符串。 */
export function envString() {
  return z.string().min(1)
}

/** 可选字符串；缺失时为 `undefined`。 */
export function envOptionalString() {
  return z.string().optional()
}

/** 合法 URL。 */
export function envUrlString() {
  return z.url()
}

/** 正整数，自动从字符串转换为 number。 */
export function envIntString() {
  return z.coerce.number().int().positive()
}

/** 非负整数，用于端口 0 等边界。 */
export function envNonNegativeIntString() {
  return z.coerce.number().int().nonnegative()
}

/**
 * 布尔值，只接受 `true` / `false` / `1` / `0`。
 *
 * 不用 `z.coerce.boolean()`：它按 JavaScript 真值语义解析，
 * `"false"` 等非空字符串都会变成 `true`。
 */
export function envBoolString() {
  return z.enum(['true', 'false', '1', '0']).transform((value) => value === 'true' || value === '1')
}
