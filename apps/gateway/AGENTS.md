# AGENTS.md

补充根文件的规则。本目录是 NestJS 12 的 Gateway 服务，Node ESM，端口来自 `GATEWAY_PORT`（默认 `:4001`）。

## 职责

- 唯一的 action 序列器：后续负责 action 排队、单调编号、校验、广播与持久化。
- 不执行画布操作，不直接写 design.json；执行器是 canvas。
- 不承担 BFF 的会话、SSE 或前端聚合。

## 目录

- `src/main.ts`：启动入口，安装 Socket.IO `IoAdapter`，从 `config` 读取端口。
- `src/config/`：`env.ts` 定义并校验 schema，`index.ts` 暴露类型化配置。
- `src/ws/`：WebSocket gateway；当前只有 `ping`/`pong` 传输验证。
- `scripts/smoke-ws.mjs`：本地 WS smoke 脚本。

## 约束

- 在仓库根执行：`pnpm --filter @inkstack/gateway dev|build|start|typecheck|lint|smoke:ws`。
- 业务代码只读 `config`，不直接访问 `process.env`；新增变量先写进 `turbo.json` 的 `globalEnv`。
- WS 使用 Socket.IO（`@nestjs/platform-socket.io`）；`GATEWAY_WS_PATH` 对应 Socket.IO 的 `path`，不是 namespace。
- 依赖只通过 `catalog:` 引用；`tsconfig.json` 继承 `@inkstack/tsconfig/nest.json`，构造器注入的类不要改成 `import type`。
