# Proposal

## Why

架构约定前端 REST/SSE 统一走 BFF，shell 与 canvas 都会成为消费方，但仓库目前没有任何 HTTP 客户端，也没有统一的 baseUrl、鉴权、错误模型与流式消费约定。若两个应用各自实现，错误形状、重试语义和 SSE 生命周期很快会分叉；先建立一层薄而明确的共享请求层，后续接入端点时只需增加调用，不再重复解决传输问题。

## What Changes

- 新增 `packages/api-client`，包名 `@inkstack/api-client`，作为 shell 与 canvas 共用的前端请求层。
- 提供客户端工厂 `createApiClient(config)`，baseUrl、credentials、headers、timeout、retry 与 fetch 全部由调用方注入，包内不读取环境变量、不提供模块级单例。
- 提供统一请求 API：`request`、`get`、`post`、`put`、`patch`、`delete` 与 `requestRaw`，支持 JSON 请求体、查询参数、`AbortSignal` 与空响应体。
- 提供错误归一化：除调用方主动 abort 外，HTTP、超时与网络错误统一为 `ApiError`，携带 `status`、`code`、`requestId`、`data` 与原始 `cause`。
- 提供 SSE 流式消费：`stream()` 返回异步可迭代事件流，支持 GET/POST、`AbortSignal`、事件解析与可选的断线重连；重连默认关闭，避免非幂等请求重复执行。
- 运行时依赖固定为 `ky` 与 `eventsource-parser`，通过 pnpm catalog 的 `runtime` 分类引入。
- 补齐包级测试、README、AGENTS/CLAUDE 三件套与 manifest 检查所需脚本。

不在本次范围：按 BFF 端点封装的业务函数、React hooks、缓存与去重、WebSocket、上传下载专用 API、BFF 侧 CORS 与鉴权实现。

## Capabilities

### New Capabilities

- `frontend-api-client`: 定义前端共享请求层的行为契约，包括客户端工厂与配置注入、统一请求 API、错误归一化、SSE 流式消费，以及框架与运行时的中立性。

### Modified Capabilities

无。

## Impact

- 新增 `packages/api-client` 及其 `package.json`、`tsconfig`、`vitest.config.ts`、`src/`、`test/`、`README.md`、`AGENTS.md` 与 `CLAUDE.md`。
- `pnpm-workspace.yaml` 的 `runtime` catalog 新增 `ky` 与 `eventsource-parser`；`pnpm-lock.yaml` 随之更新。
- `docs/typescript.md` 的包与预设表新增一行；`docs/testing.md` 的当前范围与覆盖率基线在实现后更新。
- 不修改 shell、canvas、BFF 或 Gateway 的现有代码；两个前端应用的接入属于后续变更。
- BFF 的跨域与凭据配置不在本次范围，但会作为首个真实调用落地时的前置条件记录在 `design.md`。
