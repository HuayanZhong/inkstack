# Proposal

## Why

`.env` 一套文件已经建立，但没有任何代码读取或校验它们，BFF 的 `4003` 端口仍是硬编码。随着 BFF / Gateway 开始接入 Supabase、SSE 等配置，如果每个服务各自读 `process.env`、各自兜底，缺失或错误的配置只会在运行期暴露。先把「解析 + 校验」收敛成共享包，并在 BFF 建立配置入口，后续接入其他应用时只需补自己的 schema。

## What Changes

- 新增 `@inkstack/config`：`env.ts` 提供 `EnvError`、`parseEnv` 与字符串 / URL / 端口 / 整数 / 布尔解析器；`normalize.ts` 提供 `normalizeBaseUrl`、`normalizePrefix`、`joinUrl`；`index.ts` 统一导出。
- BFF 新增 `src/config/env.ts` 与 `src/config/index.ts`：用 zod schema 解析 `process.env`，启动时 fail-fast；业务代码消费类型化的 `config`，不直接读 `process.env`。
- BFF 监听端口改为 `BFF_PORT`（默认 `4003`），不再硬编码。
- `turbo.json` 把 `NODE_ENV`、`BFF_PORT` 声明为 `globalEnv`；`dev` 与 `typecheck` 先构建依赖包，保证 `@inkstack/config` 的 `dist` 在启动与检查前存在。
- `.env.example` 启用 `BFF_PORT`。
- 更新 `apps/bff/AGENTS.md` 与 `docs/toolchain.md` 中的 env 约定。
- 本次不接入 shell / canvas，也不接入根目录 dotenv 加载链；这些留给后续变更。

**BREAKING**：无。

## Capabilities

### New Capabilities

- `environment-configuration`: 共享配置解析约定，以及服务在启动时校验环境变量、暴露类型化配置的行为。

### Modified Capabilities

<!-- 无既有 capability 的行为变化。 -->

## Impact

- **代码**：新增 `packages/config/**`；修改 `apps/bff/src/main.ts`，新增 `apps/bff/src/config/**`。
- **依赖**：`zod` 进入 `runtime` catalog；`@inkstack/config` 以 `workspace:*` 进入 BFF。
- **构建**：`turbo run build` 新增 `packages/config/dist`；`dev` / `typecheck` 的执行顺序改为依赖包先行构建。
- **配置**：`.env.example` 启用 `BFF_PORT`；`turbo.json` 增加 `globalEnv`。
- **文档**：BFF 的 `AGENTS.md` 与 `docs/toolchain.md`。
