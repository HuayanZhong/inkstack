# Proposal

## Why

`packages/config` 已有 Vitest 基线，但四个应用仍然没有任何自动化测试：shell 的 MF 加载状态机、canvas 的 MF 构建契约、bff 的 HTTP 面与 gateway 的 WS ack 都只能靠手工验证。接下来的 action 协议、队列与持久化会落在 Gateway，如果没有可复用的 Nest + Socket.IO 测试骨架，每次改动都只能靠 `smoke:ws` 脚本。现在补齐应用级基线，同时不引入 E2E。

## What Changes

- 新增 `packages/vitest-config`，提供 `node` / `react` / `nest` 三个共享预设；每个应用的 `vitest.config.ts` 用官方推荐的 `defineProject` + `mergeConfig` 组合。
- 四个应用按 `src/` ↔ `test/` 平级映射接入测试：
  - **gateway**：`handlePing` 单元、`/health` HTTP 集成、真实 `socket.io-client` 的 WS 集成（握手路径、`ping` → `pong` ack）。
  - **bff**：`/health` 的 Nest Testing + Supertest 集成测试，作为后续 auth / SSE 的模板。
  - **shell**：jsdom + React Testing Library 测 `CanvasHost` 的 loading / ready / error 状态，mock Module Federation runtime。
  - **canvas**：env 配置测试；读取 `dist/mf-manifest.json` 的构建契约测试（`exposes` 含 `./Canvas`、地址不含 localhost）。
- 每个应用增加 `test` 与 `test:coverage` script、`vitest` / `vite` devDependencies 与 `vitest.config.ts`；shell 额外引入 `jsdom`、RTL、jest-dom。
- 引入 `@vitest/coverage-v8`：每个包声明 `coverage.include`，统一门槛为 statements / lines 80%、branches / functions 70%；`pnpm verify` 执行 `test:coverage`。
- 调整类型检查范围：canvas 的 `tsconfig.json` 纳入 `test`；bff / gateway 的 `typecheck` 改用 `tsconfig.json`，让 `test/` 参与检查，构建配置保持只收 `src`。
- Turbo `test` 任务改为在本包 `build` 之后执行，保证 canvas 的产物契约测试在干净检出中也能读取 `dist`。
- 不引入 E2E、Playwright 或 Vitest browser mode；覆盖率只统计可测的运行时文件，渲染与跨应用流程留给后续 E2E。

**BREAKING**：无。不改变任何运行时行为。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

无。本次只增加测试与测试基础设施，不改变规格描述的系统行为；`repository-hygiene` 的现有要求已经覆盖 `pnpm verify` 与包级测试边界。因此 `.openspec.yaml` 声明 `skip_specs: true`。

## Impact

- 新包：`packages/vitest-config`（含 `AGENTS.md` / `CLAUDE.md` / `README.md`）。
- 应用：`apps/{shell,canvas,bff,gateway}` 的 `package.json`、`vitest.config.ts`、`tsconfig.json`、`test/`。
- 工具链：`turbo.json` 的 `test` / `test:coverage` 依赖；`pnpm-workspace.yaml` 的 `dev` catalog 增加测试与覆盖率依赖。
- 文档：`docs/testing.md` 增加应用层结构与共享预设说明。
- 不涉及 E2E、CI、Changesets 或运行时协议实现。
