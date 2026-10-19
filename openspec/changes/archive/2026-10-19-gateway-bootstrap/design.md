# Design

## Context

动机见 [proposal.md](proposal.md)。影响设计选择的现状：

- `apps/gateway` 只有 `package.json`，没有 `type: module`、scripts、tsconfig 与源码；它目前甚至不是一个可运行的包。
- `apps/bff` 已经验证了 Nest 12 + Node ESM + `@inkstack/tsconfig/nest.json` + `@inkstack/config` + dotenv 链的路径，可以直接复用。
- 根 `.oxlintrc.json` 的 `overrides` 已经同时覆盖 `apps/gateway` 与 `apps/bff`，并关闭了 Nest 需要的三条规则；本次不需要改 lint 规则。
- `turbo.json` 已有 `build` / `dev` / `start` / `lint` / `typecheck`，`dev` / `start` 是 `persistent: true` 且不缓存；Gateway 不需要新增任务。
- 实际核对基准（不是模型记忆）：
  - `@nestjs/cli@12.0.8`、`@nestjs/schematics@12.0.7`。
  - `@nestjs/cli@12 new --help` 提供 `--skip-tests`、`--no-observe`、`--skip-git`、`--skip-install`、`--strict`，没有 `--type`；schematics 的 `type` 默认是 `esm`。
  - 在临时目录执行 `nest new gateway --dry-run --package-manager pnpm --skip-git --skip-install --skip-tests --no-observe`，实际计划生成 `.gitattributes`、`.oxlintrc.json`、`.prettierrc`、`nest-cli.json`、`package.json`、`README.md`、`src/app.controller.ts`、`src/app.module.ts`、`src/app.service.ts`、`src/main.ts`、`tsconfig.build.json`、`tsconfig.json`、`vitest.config.ts`、`vitest.config.e2e.ts`。
  - ESM 模板使用 **oxlint + Prettier + Vitest**；ESLint 与 Jest 只出现在 CJS / JS 模板里。
  - `@nestjs/platform-socket.io@12.2.0` 的 peer 是 `@nestjs/common@^12`、`@nestjs/websockets@^12`、`rxjs@^7`；依赖是 `socket.io@4.8.4`。
  - `socket.io-client@4.8.4` 与 `socket.io@4.8.4` 同版本；用于 Gateway 的 WS smoke 验证。
  - `IoAdapter.create` 接受 Socket.IO `ServerOptions`（含 `path`）以及 `namespace` / `server`；`path` 适合作为 `/ws` 的入口路径。
  - `@nestjs/core@12.1.3` 的 `useWebSocketAdapter(adapter)` 要求在任何 WebSocket gateway 初始化前调用；`app.listen()` 会触发初始化。

## Goals / Non-Goals

**Goals:**

- `apps/gateway` 成为一个可启动、可构建、可 typecheck、可 lint 的 Nest 应用。
- HTTP `GET /health` 与 WebSocket `/ws` 两个运行时入口都能在本地验证。
- 端口与 WS 路径只通过 env 分发，配置在模块加载时校验。
- 包元数据、tsconfig、文档与根 README 与仓库现有约定一致。

**Non-Goals:**

- 不定义 action 协议、不做队列、seq、校验、广播或持久化。
- 不接 canvas、BFF、Agent 或 MCP。
- 不引入 Vitest / Jest / Supertest，不生成测试脚手架。
- 不引入 `@nestjs/observe`、`@nestjs/mau` 或 `@nestjs/platform-ws`；WS 使用 Socket.IO 适配器。
- 不新增 turbo 任务，不修改根 lint 规则。

## Decisions

### 1. 脚手架命令与模板清理

在临时目录执行：

```bash
pnpm dlx @nestjs/cli@12.0.8 new gateway \
  --package-manager pnpm \
  --skip-git \
  --skip-install \
  --strict \
  --skip-tests \
  --no-observe
```

生成后并入 `apps/gateway`。`--skip-tests` 已经跳过 `src/app.controller.spec.ts` 与 `test/`，但 **`vitest.config.ts` / `vitest.config.e2e.ts` 仍会生成**，需要手动删除。

删除：

| 文件                                          | 原因                       |
| --------------------------------------------- | -------------------------- |
| `.gitattributes`                              | 根目录已有                 |
| `.oxlintrc.json`                              | 根规则是唯一 home          |
| `.prettierrc`                                 | 格式由根 oxfmt 负责        |
| `README.md`                                   | 替换为仓库自己的说明       |
| `vitest.config.ts`、`vitest.config.e2e.ts`    | 测试按阶段策略延后         |
| `src/app.controller.ts`、`src/app.service.ts` | 替换为 Health 控制器与服务 |

保留 `nest-cli.json`、`tsconfig.json`、`tsconfig.build.json`、`src/main.ts`、`src/app.module.ts`。

不使用 `--skip-tests` 之外的模板过滤：测试配置文件不在 schematics 的 `spec` 过滤范围内，只能手动删。

### 2. ESM 包与 scripts

`package.json` 对齐 BFF 的当前形态：

```json
{
  "name": "@inkstack/gateway",
  "version": "0.0.0",
  "private": true,
  "description": "墨栈 Gateway 服务：负责画布 action 的排队、单调编号、校验、广播与持久化，是唯一的 action 序列器。",
  "license": "ISC",
  "type": "module",
  "scripts": {
    "dev": "dotenv -e ../../.env.local -e ../../.env.development -e ../../.env -- nest start --watch",
    "build": "dotenv -e ../../.env.local -e ../../.env.production -e ../../.env -- nest build",
    "start": "dotenv -e ../../.env.local -e ../../.env.production -e ../../.env -- nest start",
    "lint": "oxlint --config ../../.oxlintrc.json --type-aware .",
    "typecheck": "tsc -p tsconfig.build.json --noEmit",
    "smoke:ws": "dotenv -e ../../.env.local -e ../../.env.development -e ../../.env -e ../../.env.example -- node scripts/smoke-ws.mjs"
  }
}
```

删除模板的 `deploy`、`format`、`start:dev`、`start:debug`、`start:prod`、`test*` scripts。模板的 `format` 使用 Prettier，与根 oxfmt 冲突。

依赖：

```json
{
  "dependencies": {
    "@inkstack/config": "workspace:*",
    "@nestjs/common": "catalog:runtime",
    "@nestjs/core": "catalog:runtime",
    "@nestjs/platform-express": "catalog:runtime",
    "@nestjs/platform-socket.io": "catalog:runtime",
    "@nestjs/websockets": "catalog:runtime",
    "reflect-metadata": "catalog:runtime",
    "rxjs": "catalog:runtime"
  },
  "devDependencies": {
    "@inkstack/tsconfig": "workspace:*",
    "@nestjs/cli": "catalog:dev",
    "@nestjs/schematics": "catalog:dev",
    "@types/node": "catalog:dev",
    "dotenv-cli": "catalog:dev",
    "socket.io-client": "catalog:runtime",
    "typescript": "catalog:toolchain"
  }
}
```

不直接声明 `socket.io`：`@nestjs/platform-socket.io` 已经依赖 `socket.io@4.8.4`。`socket.io-client` 在 Gateway 中只由 `scripts/smoke-ws.mjs` 使用，因此放在 devDependencies；它放在 `runtime` catalog，因为后续 canvas 会作为浏览器端运行时依赖消费。

### 3. 环境变量

`apps/gateway/src/config/env.ts`：

```ts
import { envIntString, parseEnv, z } from '@inkstack/config'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production', 'staging']).optional(),
  GATEWAY_PORT: envIntString().default(4001),
  GATEWAY_WS_PATH: z.string().regex(/^\//, 'must start with /').default('/ws'),
})

export const env = parseEnv(envSchema, process.env, { label: 'gateway' })
```

`apps/gateway/src/config/index.ts`：

```ts
import { normalizePrefix } from '@inkstack/config'
import { env } from './env.js'

const nodeEnv = env.NODE_ENV ?? 'development'

export const config = {
  runtime: {
    nodeEnv,
    isDev: nodeEnv === 'development',
  },
  server: {
    port: env.GATEWAY_PORT,
  },
  ws: {
    path: normalizePrefix(env.GATEWAY_WS_PATH),
  },
} as const
```

同步三个 home：

1. `.env.example`：取消 `GATEWAY_PORT` 注释并设为 `4001`，新增 `GATEWAY_WS_PATH=/ws`。
2. `turbo.json` 的 `globalEnv`：加入 `GATEWAY_PORT`、`GATEWAY_WS_PATH`。
3. `docs/toolchain.md` 的 `globalEnv` 列表：同步这两个变量。

### 4. HTTP 健康检查

复用 BFF 的 controller + service 结构，不直接让 controller 返回字符串：

```text
GET /health
  -> HealthController
  -> HealthService
  -> { status: 'ok', service: 'gateway' }
```

保留这条链路是为了继续验证 `emitDecoratorMetadata` 与构造器注入在 Gateway 中生效。

### 5. WebSocket 接入

使用 Nest 默认的 Socket.IO 适配器 `@nestjs/platform-socket.io` 的 `IoAdapter`。这与官方 Gateways 页的安装命令一致：`npm i --save @nestjs/websockets @nestjs/platform-socket.io`。

```ts
// src/main.ts
import { NestFactory } from '@nestjs/core'
import { IoAdapter } from '@nestjs/platform-socket.io'
import { AppModule } from './app.module.js'
import { config } from './config/index.js'

const app = await NestFactory.create(AppModule)
app.useWebSocketAdapter(new IoAdapter(app))
await app.listen(config.server.port)
```

`useWebSocketAdapter` 必须在 `app.listen()` 之前调用；`@nestjs/core@12.1.3` 明确警告，初始化后再替换适配器不会作用于已创建的 gateway。

`GATEWAY_WS_PATH` 对应 Socket.IO 的 `path` 选项，不是 `namespace`。命名空间留到需要逻辑分组时再加；骨架只使用一个路径：

```ts
// src/ws/events.gateway.ts
import { SubscribeMessage, WebSocketGateway } from '@nestjs/websockets'
import { config } from '../config/index.js'

@WebSocketGateway({ path: config.ws.path })
export class EventsGateway {
  @SubscribeMessage('ping')
  handlePing(): string {
    return 'pong'
  }
}
```

`ping` / `pong` 只用于确认适配器的消息解析与路由可用，不属于 action 协议；后续 `action-protocol-and-gateway` 变更会替换或扩展这里。

`@SubscribeMessage` 的返回值通过 Socket.IO ack 回传；客户端必须传入回调，不能只监听同名事件：

```js
// scripts/smoke-ws.mjs
import { io } from 'socket.io-client'

const port = process.env.GATEWAY_PORT
const path = process.env.GATEWAY_WS_PATH
if (!port || !path) throw new Error('GATEWAY_PORT / GATEWAY_WS_PATH are required')

const socket = io(`http://localhost:${port}`, {
  path,
  transports: ['websocket'],
})

socket.emit('ping', {}, (response) => {
  console.log(response)
  socket.close()
})
```

`AppModule` 把 `EventsGateway` 放进 `providers`，同时注册 `HealthController` / `HealthService`。

### 6. tsconfig

`apps/gateway/tsconfig.json` 以 BFF 为模板：

- `"extends": "@inkstack/tsconfig/nest.json"`
- 保留模板的 NodeNext、decorator、`strict`、`strictPropertyInitialization: false` 等设置
- 删除 `"types": ["vitest/globals", "node"]`；`node` 由预设提供
- `"tsBuildInfoFile": ".turbo/tsconfig.tsbuildinfo"`，避免 `nest build` 的 `deleteOutDir: true` 清掉缓存

`tsconfig.build.json` 保持 `rootDir: "./src"`、`include: ["src"]` 与对 `test` / spec 的排除。

### 7. 文档与根配置

- 新增 `apps/gateway/AGENTS.md`：以「补充根文件的规则」开头，写职责、目录、命令、约束；≤25 行且 ≤1,000 非空白字符。
- 新增 `apps/gateway/CLAUDE.md`：只写 `@AGENTS.md`。
- 新增 `apps/gateway/README.md`：职责、运行命令、当前能力（health + `/ws` ping/pong）、相关文档。
- 更新根 `README.md`：Gateway 不再是“只有 package.json”，说明它会随 `pnpm dev` 启动。
- 新增 `apps/gateway/scripts/smoke-ws.mjs`，并在 `knip.config.ts` 的 `apps/gateway.entry` 加入 `scripts/**/*.mjs`，避免 `socket.io-client` 被判为未使用。
- 不改 `.oxlintrc.json` 与 `turbo.json` 的任务定义。

### 8. 验证顺序

在仓库根依次执行：

```bash
pnpm install
pnpm check:manifests
pnpm typecheck
pnpm lint
pnpm build
pnpm hygiene
```

手动验证：

```bash
pnpm --filter @inkstack/gateway dev
curl -s http://localhost:4001/health
pnpm --filter @inkstack/gateway smoke:ws
```

预期：health 返回 `{ "status": "ok", "service": "gateway" }`，WS smoke 打印 `pong` 后关闭。

## Risks / Trade-offs

- **Socket.IO 客户端依赖** → canvas / shell 后续连接 Gateway 时需要 `socket.io-client`；本次只在 Gateway 的 smoke script 中使用，放在 `runtime` catalog、`devDependencies`，后续由 canvas 自己声明运行时依赖。
- **`IoAdapter` 的初始化顺序** → 必须在 `app.listen()` 前调用 `useWebSocketAdapter`；把这一步固定在 `main.ts`，不要放进模块生命周期。
- **`path` 与 `namespace` 混淆** → `GATEWAY_WS_PATH` 映射 Socket.IO 的 `path`（握手路径），不是 namespace；需要逻辑分组时再加 namespace，不把它塞进现有变量。
- **`socket.io` 直接依赖与 knip** → 不直接声明 `socket.io`，由 `@nestjs/platform-socket.io` 传递引入；`socket.io-client` 通过 smoke script 使用并加入 knip entry。
- **模板清理不完整** → `--skip-tests` 不会删除 `vitest.config.*`；以 dry-run 文件清单为准逐个核对，不要按旧版本的 ESLint / Jest 清单找文件。
- **端口冲突** → 4001 可能被本地其他进程占用；启动失败时先确认端口，不要改代码绕过 env。
- **`nest build` 与 tsbuildinfo** → 缓存放在 `.turbo/`，避免被 `deleteOutDir` 清掉；若模板在根目录生成 `*.tsbuildinfo`，以实际输出为准调整路径。
- **`README.md` / `AGENTS.md` 预算** → Gateway 文档按子树预算写；根 README 只改状态段落，不扩写架构说明。

## Open Questions

无。action 帧、seq、持久化与 canvas ack 都属于后续 `action-protocol-and-gateway` 变更，不影响本次骨架的范围与任务拆分。
