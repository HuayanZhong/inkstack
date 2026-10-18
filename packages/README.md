# packages

墨栈的共享包。所有包使用 `@inkstack/*` 命名，通过 `workspace:*` 被应用消费，外部依赖统一走 pnpm catalog。

| 包                        | 作用                                    | 产物      |
| ------------------------- | --------------------------------------- | --------- |
| [`config`](config/)       | 环境变量解析与校验、URL 与前缀标准化    | `dist`    |
| [`contracts`](contracts/) | 画布 action 协议、共享类型与 codegen IR | `dist`    |
| [`tsconfig`](tsconfig/)   | 共享 TypeScript 预设                    | JSON 配置 |

每个包目录必须同时包含 `AGENTS.md`、`CLAUDE.md`、`README.md`；新增包时按 [`docs/package-metadata.md`](../docs/package-metadata.md) 与 [`docs/typescript.md`](../docs/typescript.md) 补齐元数据和预设。
