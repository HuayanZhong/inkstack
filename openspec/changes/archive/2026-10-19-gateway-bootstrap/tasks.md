# Tasks

## 1. Catalog 与环境变量

- [x] 1.1 在 `pnpm-workspace.yaml` 的 `runtime` catalog 增加 `@nestjs/platform-socket.io`、`@nestjs/websockets`、`socket.io-client`，Nest 包范围与现有 Nest 包一致使用 `^12.1.3`；验证：`pnpm install` 成功，`pnpm check:manifests` 输出 0 errors，三个条目都能从 `pnpm-workspace.yaml` 读到。
- [x] 1.2 在 `.env.example` 取消 `GATEWAY_PORT` 注释并设为 `4001`，新增 `GATEWAY_WS_PATH=/ws`；在 `turbo.json` 的 `globalEnv` 与 `docs/toolchain.md` 的 `globalEnv` 列表中同步两个变量；验证：`pnpm lint:env` 通过，检索两个文件都能找到 `GATEWAY_PORT` 与 `GATEWAY_WS_PATH`。

## 2. 脚手架并入

- [x] 2.1 在临时目录先执行 `pnpm dlx @nestjs/cli@12.0.8 new gateway --package-manager pnpm --skip-git --skip-install --strict --skip-tests --no-observe --dry-run` 核对产物，再去掉 `--dry-run` 生成并并入 `apps/gateway`；删除 `.gitattributes`、`.oxlintrc.json`、`.prettierrc`、模板 `README.md`、`vitest.config.ts`、`vitest.config.e2e.ts`、`src/app.controller.ts`、`src/app.service.ts`；验证：`find apps/gateway -maxdepth 2 -type f` 只剩 `nest-cli.json`、`package.json`、`tsconfig.json`、`tsconfig.build.json` 与 `src/` 下的入口/模块文件。
- [x] 2.2 改写 `apps/gateway/package.json`：名称 `@inkstack/gateway`、版本 `0.0.0`、`private: true`、`license: ISC`、40–120 字符描述、`type: module`；依赖全部换成 catalog / workspace 引用；补齐 `dev`、`build`、`start`、`lint`、`typecheck`、`smoke:ws`；`socket.io-client` 放在 devDependencies，其余 WS 依赖放在 dependencies；删除模板的 `deploy`、`format`、`start:dev`、`start:debug`、`start:prod`、`test*`；验证：`pnpm install` 成功，`pnpm check:manifests` 输出 0 errors，`pnpm --filter @inkstack/gateway exec nest --version` 输出 `12.x`。
- [x] 2.3 在 `apps/gateway/tsconfig.json` 增加 `"extends": "@inkstack/tsconfig/nest.json"`，删除 `types` 中的 `vitest/globals`，增加 `"tsBuildInfoFile": ".turbo/tsconfig.tsbuildinfo"`；保持 `tsconfig.build.json` 的 `rootDir: "./src"` 与 `include: ["src"]`；验证：`pnpm --filter @inkstack/gateway typecheck` 通过，`pnpm --filter @inkstack/gateway build` 后应用根目录没有 `*.tsbuildinfo`。

## 3. 配置与 HTTP 健康检查

- [x] 3.1 新增 `apps/gateway/src/config/env.ts` 与 `index.ts`：用 `parseEnv` 校验 `GATEWAY_PORT`（默认 4001）与 `GATEWAY_WS_PATH`（默认 `/ws`，必须以 `/` 开头），业务代码只读 `config`；验证：`pnpm --filter @inkstack/gateway typecheck` 通过，`rg "process\\.env" apps/gateway/src` 只出现在 `config/env.ts`。
- [x] 3.2 新增 `HealthController` / `HealthService` 并在 `AppModule` 接线，`GET /health` 返回 `{ status: 'ok', service: 'gateway' }`；验证：`pnpm --filter @inkstack/gateway build` 通过，启动后 `curl -s http://localhost:4001/health` 返回包含 `"service":"gateway"` 的 JSON。

## 4. WebSocket 入口

- [x] 4.1 在 `src/main.ts` 中用 `app.useWebSocketAdapter(new IoAdapter(app))` 安装 `@nestjs/platform-socket.io`，且必须位于 `app.listen()` 之前；新增 `EventsGateway`，使用 `@WebSocketGateway({ path: config.ws.path })` 与 `@SubscribeMessage('ping')` 返回 `pong`，并在 `AppModule` 注册；验证：`pnpm --filter @inkstack/gateway typecheck` 与 `build` 通过，`rg "useWebSocketAdapter|IoAdapter" apps/gateway/src` 有结果。
- [x] 4.2 新增 `apps/gateway/scripts/smoke-ws.mjs`：从 `GATEWAY_PORT` / `GATEWAY_WS_PATH` 读取地址，用 `socket.io-client` 连接并通过 ack 接收 `pong`；在 `knip.config.ts` 的 `apps/gateway.entry` 加入 `scripts/**/*.mjs`；验证：启动 Gateway 后运行 `pnpm --filter @inkstack/gateway smoke:ws` 打印 `pong` 并正常退出，`pnpm hygiene` 不报未使用依赖。

## 5. 文档

- [x] 5.1 新增 `apps/gateway/AGENTS.md`（以「补充根文件的规则」开头，写职责、目录、命令、约束）、只写 `@AGENTS.md` 的 `CLAUDE.md`、`README.md`（职责、运行命令、当前只有 health 与 `/ws` ping/pong）；验证：`AGENTS.md` ≤25 行且 ≤1,000 非空白字符，`CLAUDE.md` 内容仅为 `@AGENTS.md`。
- [x] 5.2 更新根 `README.md`：Gateway 不再是“只有 package.json”，说明它会随 `pnpm dev` 启动、当前只有健康检查与 WS 入口；验证：根 README 不再出现“gateway 仍只有 `package.json`”的旧状态描述。

## 6. 集成验证

- [x] 6.1 在仓库根依次运行 `pnpm install`、`pnpm check:manifests`、`pnpm typecheck`、`pnpm lint`、`pnpm build`、`pnpm format:check`、`pnpm hygiene`；验证：全部命令退出码为 0，输出中没有未处理错误。
- [x] 6.2 在仓库根运行 `pnpm dev`，确认 Gateway 与 shell、bff、canvas 一起启动；验证：`curl -s http://localhost:4001/health` 返回 `"service":"gateway"`，`pnpm dev` 日志中没有 Gateway 端口或 WebSocket 适配器错误。
- [x] 6.3 检查 `git status` 与 `git diff --stat`：改动只应落在 `apps/gateway/`、`.env.example`、`turbo.json`、`docs/toolchain.md`、`README.md`、`knip.config.ts`、`pnpm-workspace.yaml`、`pnpm-lock.yaml`、`.claude/rules/cli-first.md`、根 `AGENTS.md` 与本次 change 目录；验证：没有 `dist/`、`.turbo/`、`*.tsbuildinfo` 被跟踪。

## Workflow follow-up

- 评审通过并完成集成验证后归档本次 change。
- 归档后开始 `action-protocol-and-gateway` 变更，定义 action 协议、队列、seq、校验、广播与持久化。
