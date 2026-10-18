# Proposal

## Why

`apps/shell` 已经能启动，`apps/bff` 仍是只有 `package.json` 的占位应用。BFF 是架构上独立的一层，也是唯一允许持有 Supabase service role 的服务端进程；先把它的骨架立起来，后续 `bff-auth` 才有地方落地。

本次只做骨架，不写业务。目的是验证 TypeScript 的 Nest 平面（装饰器、DI、ESM）在仓库现有预设与工具链下能正常构建与启动。

## What Changes

- 用 `@nestjs/cli` 12 生成 `apps/bff` 骨架：TypeScript、pnpm、strict 模式，跳过 git 初始化与依赖安装；生成物并入现有占位目录，仓库里不保留临时脚手架。
- 应用在 `:4003` 启动，提供 `GET /health`。
- 清理模板自带的 ESLint / Prettier / Vitest / 示例测试，以及仓库不需要的依赖；`tsconfig.json` 继承 `@inkstack/tsconfig/nest.json`。
- 补齐 `dev` / `build` / `start` / `lint` / `typecheck` 五个 scripts。
- `runtime` catalog 加入 Nest 运行时依赖，`dev` catalog 加入 `@nestjs/cli` 与 `@types/express`。
- **修正共享 lint 配置**：`.oxlintrc.json` 中关闭三条 Nest 规则的 override 目前只覆盖 `apps/gateway`，加入 `apps/bff`。
- 新增 `apps/bff/AGENTS.md`、`CLAUDE.md`、`README.md`。

**BREAKING**：无。

不在本次范围：Supabase 与会话、auth / 守卫、CORS、SSE、聚合、上传、对 gateway 的调用。这些留给 `bff-auth` 与后续变更。

## Capabilities

### New Capabilities

无。本次只让应用达到「能启动」，不产生需要长期维护的行为契约；`.openspec.yaml` 已声明 `skip_specs: true`。

### Modified Capabilities

无。

## Impact

- **代码**：`apps/bff/**` 首次出现源码；`.oxlintrc.json` 的 override 范围扩大。
- **依赖**：`@nestjs/common`、`@nestjs/core`、`@nestjs/platform-express`、`reflect-metadata`、`rxjs` 进入 `runtime` catalog；`@nestjs/cli`、`@types/express` 进入 `dev` catalog。
- **构建**：`turbo run build` 开始产出 `apps/bff/dist`；`pnpm dev` 同时启动 shell 与 bff。
- **配置**：`pnpm-workspace.yaml` 的 catalog 扩充；`.gitignore` 无需改动（`dist/` 已覆盖）。
