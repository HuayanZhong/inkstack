# @inkstack/config

墨栈共享配置包。只负责环境变量解析与校验、URL 与前缀标准化，不加载 `.env` 文件。

## 导出

- `parseEnv(schema, env, { label })`：用 zod schema 解析环境变量，失败抛 `EnvError`。
- `envString` / `envOptionalString` / `envUrlString` / `envIntString` / `envNonNegativeIntString` / `envBoolString`。
- `normalizeBaseUrl` / `normalizePrefix` / `joinUrl`。
- `z`：重新导出 zod，消费方无需再声明依赖。

## 使用

```ts
import { envIntString, parseEnv, z } from '@inkstack/config'

const env = parseEnv(z.object({ PORT: envIntString().default(3000) }), process.env, {
  label: 'my-app',
})
```

## 命令

在仓库根执行：`pnpm --filter @inkstack/config build|typecheck|lint`。

## 约束

- 布尔值只接受 `true` / `false` / `1` / `0`。
- 各应用的 schema 留在应用内，不汇入本包。
