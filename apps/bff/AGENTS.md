# AGENTS.md

补充根文件的规则。本目录是 NestJS 12 的 BFF 服务，Node ESM，端口来自 `BFF_PORT`（默认 `:4003`）。

## 职责

- 面向前端的会话、SSE 与请求聚合；不持有 action 队列，不执行画布操作，不直接写 design.json。
- 唯一允许持有 Supabase service role 的服务端进程（后续接入）。
- 启动时校验环境变量，并向业务代码提供类型化配置。

## 目录

- `src/main.ts`：启动入口，从 `config` 读取端口。
- `src/config/`：`env.ts` 定义并校验 schema，`index.ts` 暴露类型化配置。
- `src/app.module.ts`：模块装配；`nest-cli.json`、`tsconfig.build.json` 保留 CLI 生成的结构。

## 命令

在仓库根执行：`pnpm --filter @inkstack/bff dev|build|typecheck|lint|test`。

## 约束

- 业务代码只读 `config`，新增变量按 [env 规则](../../.claude/rules/env.md)。
- env 由应用 scripts 的 dotenv 链加载；`BFF_PORT` 缺省 `4003`。
- `tsconfig.json` 继承 `@inkstack/tsconfig/nest.json`，构造器注入的类不要改成 `import type`；不启用 ESLint / Prettier。
