# Proposal

## Why

`apps/shell`、`apps/canvas`、`apps/bff` 已能启动，`apps/gateway` 仍只有 `package.json`。Gateway 是架构中的唯一 action 序列器，也是后续 AI 控笔、MCP 与持久化的共同前提；先把它变成可运行、可连接的服务，才能在写 action 协议前验证 Nest 12 + Node ESM + WebSocket + env 这组组合。

本次只做骨架，不实现 action 队列。目的是让 Gateway 具备真实的运行时边界：HTTP 健康检查、WebSocket 连接入口、类型化配置和仓库约定的构建/检查链路。

## What Changes

- 用实际安装的 `@nestjs/cli@12.0.8` 生成 `apps/gateway` 骨架，使用 ESM 模板（`@nestjs/schematics@12.0.7` 的 `ts-esm`）；在临时目录生成后并入现有占位目录。
- 清理模板产物：`.gitattributes`、`.oxlintrc.json`、`.prettierrc`、示例 `README.md`、Vitest 配置与示例测试；仓库统一使用根 oxlint / oxfmt，测试按阶段策略延后。
- `apps/gateway` 在 `GATEWAY_PORT`（默认 `4001`）启动，提供 `GET /health`，返回 `{ status: 'ok', service: 'gateway' }`。
- 使用 `@nestjs/platform-socket.io` 的 `IoAdapter` 建立 `/ws` 连接入口；骨架阶段只接受连接，不处理 action。
- 新增 `GATEWAY_PORT`、`GATEWAY_WS_PATH` 两个环境变量，同步 `.env.example`、`turbo.json` 的 `globalEnv`、`apps/gateway/src/config/`。
- `package.json` 改为仓库标准：`@inkstack/gateway`、`0.0.0`、`private`、`ISC`、`type: module`，补齐 `dev` / `build` / `start` / `lint` / `typecheck`，依赖全部走 catalog。
- 新增 `apps/gateway/AGENTS.md`、只写 `@AGENTS.md` 的 `CLAUDE.md`、`README.md`；更新根 `README.md` 的应用状态。

**BREAKING**：无。

不在本次范围：action 协议、队列、seq、校验、广播、`design.json` 持久化、canvas 执行器、BFF 聚合、鉴权、测试运行器。

## Capabilities

### New Capabilities

无。本次只让应用达到「能启动、能连接」，不产生需要长期维护的行为契约；`.openspec.yaml` 已声明 `skip_specs: true`。

### Modified Capabilities

无。`environment-configuration` 当前只覆盖 BFF；Gateway 的 action 行为与端口契约留到 `action-protocol-and-gateway` 变更中定义，避免在骨架阶段写入过早的规范。

## Impact

- **代码**：`apps/gateway/**` 首次出现源码；新增 `config`、health、WebSocket 入口。
- **依赖**：`runtime` catalog 增加 `@nestjs/platform-socket.io`、`@nestjs/websockets`、`socket.io-client`；`socket.io` 由 `@nestjs/platform-socket.io` 传递引入。`socket.io-client` 当前用于 Gateway 的 WS smoke 验证，后续由 canvas 作为浏览器端依赖消费。Nest 核心依赖沿用现有 catalog 版本。
- **构建**：`turbo run build` 开始产出 `apps/gateway/dist`；`pnpm dev` 增加 Gateway 进程。
- **配置**：`.env.example` 与 `turbo.json` 增加 `GATEWAY_PORT`、`GATEWAY_WS_PATH`；根 `.oxlintrc.json` 已覆盖 `apps/gateway`，预计无需修改。
- **验证基准**：Nest CLI 12.0.8 的 `new --help`、`--dry-run` 产物，`@nestjs/platform-socket.io@12.2.0` 的类型与 peer 信息，`socket.io@4.8.4` / `socket.io-client@4.8.4`，以及 `@nestjs/core@12.1.3` 的 `useWebSocketAdapter` 签名。
