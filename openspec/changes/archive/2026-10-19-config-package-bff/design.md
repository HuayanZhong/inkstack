# Design

## Context

见 `proposal.md` 的 Why。当前仓库没有配置包，BFF 的端口硬编码在 `main.ts`；根目录 `.env` 一套文件已经建立但尚未被任何进程加载。`packages/contracts` 已经提供了「共享包构建到 `dist`、以 `workspace:*` 被消费」的样板，`turbo.json` 的 `typecheck` / `lint` 目前只依赖同任务的传递执行。

## Goals / Non-Goals

**Goals:**

- 共享包只负责解析与校验，不负责加载环境变量。
- BFF 在监听端口前完成一次完整校验，业务代码只消费类型化的配置对象。
- 在干净检出上，`pnpm dev`、`pnpm typecheck`、`pnpm lint` 都能直接跑通。

**Non-Goals:**

- 不接入根目录 dotenv 加载链；`.env` 文件在本变更中仍然不生效。
- 不接入 shell / canvas / gateway 的配置。
- 不引入 `service-urls.ts`（多服务寻址出现后再加）。
- 不引入 `@nestjs/config` 或依赖注入形式的配置。

## Decisions

### 1. 新建 `@inkstack/config`，不放进 contracts

`contracts` 的边界是 action 协议与 codegen IR；配置解析与 URL 标准化是跨运行时工具，放在 contracts 会让契约包承担两类职责。替代方案是每端复制 `env.ts`，但校验语义（尤其布尔值）很容易漂移。

包内首版包含：

- `src/env.ts`：`EnvError`、`parseEnv`、`envString`、`envOptionalString`、`envUrlString`、`envIntString`、`envNonNegativeIntString`、`envBoolString`。
- `src/normalize.ts`：`normalizeBaseUrl`、`normalizePrefix`、`joinUrl`。
- `src/index.ts`：统一导出。

### 2. 在模块加载时解析，而不是用 `@nestjs/config`

参考 CSISP 的 `apps/bff/src/config/env.ts`：模块加载时调用 `parseEnv(schema, process.env)`，失败直接抛 `EnvError`。替代方案是 Growth OS 的 `ConfigModule.forRoot({ validate })`，但它需要新增 `@nestjs/config`，而当前配置是静态的，不需要依赖注入。等出现按请求/按模块变化的配置时再引入 ConfigModule。

`apps/bff/src/config/index.ts` 把校验结果映射为：

```ts
export const config = {
  runtime: { nodeEnv, isDev },
  server: { port },
}
```

业务代码从 `config` 读取，不直接碰 `process.env`。

### 3. 包构建到 `dist`，并用 turbo 保证构建顺序

与 contracts 一致：`main` / `types` / `exports` 指向 `dist`，包内提供 `dev`（`tsc --watch`）与 `build`。替代方案是让 `types` 指向 `src`，但运行时仍需 `dist`，两种解析路径容易混淆；TS project references 则是更大的改动。

因为 `typecheck` / `lint` 会解析 `@inkstack/config` 的类型，而干净检出没有 `dist`，所以：

- `dev.dependsOn` 增加 `^build`；
- `typecheck.dependsOn` 改为 `^build`；
- `lint.dependsOn` 改为 `^build`。

构建结果由 turbo 缓存，重复执行成本可控。config 自身的 `dev` watch 让开发期修改能继续生效。

### 4. 布尔解析只接受四个字面量

`envBoolString` 使用 `z.enum(['true', 'false', '1', '0'])` 再映射为布尔值，避免 `z.coerce.boolean()` 把 `"false"` 解析成 `true`。这是 CSISP 与 Growth OS 两套实现之间的关键差异，采用后者。

### 5. 环境变量声明进 turbo，但暂不做加载

BFF 进程只读取 `process.env`；turbo 的 `envMode: strict` 会过滤未声明变量，因此把 `NODE_ENV`、`BFF_PORT` 加入 `globalEnv`。根 `.env` 文件仍然不参与加载，BFF 在未收到 `BFF_PORT` 时使用默认 `4003`。加载链留给后续变更，届时在根 scripts 接入 `dotenv-cli` 并给 `build.inputs` 加 `.env*`。

## Risks / Trade-offs

- **turbo strict 过滤导致变量丢失** → 所有被 BFF 消费的变量必须同时出现在 `globalEnv` 或任务 `env` 中；本次只涉及 `NODE_ENV`、`BFF_PORT`。
- **干净检出任一任务缺 `dist`** → 通过 `dev` / `typecheck` / `lint` 的 `^build` 依赖解决。
- **校验只在导入 config 时执行** → `main.ts` 必须先导入 `config` 再创建应用；测试若单独构造 `AppModule`，需要显式导入 config。
- **`.env` 文件仍然不生效** → 在 BFF 的 `AGENTS.md` 与 `docs/toolchain.md` 写明当前边界，避免误以为已接入。
- **只接 BFF 会造成两端配置风格不一致** → shell / canvas 的接入列入下一次变更，本次先把模式和构建约束固定下来。
