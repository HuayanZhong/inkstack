# Tasks

## 1. 包骨架与依赖

- [x] 1.1 按 `packages/contracts` 的结构创建 `packages/config`：`package.json`、继承 `@inkstack/tsconfig/library.json` 的 `tsconfig.json`、`src/index.ts`，以及本层 `AGENTS.md` 和只写 `@AGENTS.md` 的 `CLAUDE.md`。验证 `pnpm install` 与 `pnpm check:manifests` 通过。
- [x] 1.2 用 `pnpm add --filter @inkstack/config --save-catalog-name runtime zod` 加入 zod，用 `pnpm add -D --filter @inkstack/config @inkstack/tsconfig@workspace:*` 与 `pnpm add -D --filter @inkstack/config --save-catalog-name toolchain typescript` 补齐开发依赖。验证 `pnpm-workspace.yaml` 的 `runtime` catalog 只有一条 zod 条目，且 `pnpm install` 成功。
- [x] 1.3 补齐 `dev`（`tsc --watch`）、`build`、`lint`、`typecheck` 四个 scripts。验证 `pnpm --filter @inkstack/config build` 产出 `dist/index.js` 与 `dist/index.d.ts`。

## 2. 共享解析实现

- [x] 2.1 实现 `src/env.ts`：`EnvError`、`parseEnv`、`envString`、`envOptionalString`、`envUrlString`、`envIntString`、`envNonNegativeIntString`、`envBoolString`。验证布尔解析：用 `node --input-type=module -e` 导入 `dist`，确认 `false`/`0` 解析为 `false`，`yes` 校验失败。
- [x] 2.2 实现 `src/normalize.ts` 与 `src/index.ts`，导出 `normalizeBaseUrl`、`normalizePrefix`、`joinUrl` 及全部 env 符号。验证 `pnpm --filter @inkstack/config typecheck` 与 `lint` 通过，且构建后用 `node -e` 能导入全部导出。
- [x] 2.3 在 `packages/config/AGENTS.md` 记录「只解析不加载、schema 由各应用定义、布尔值只接受四个字面量」的约定。验证文档描述与 `src/env.ts` 一致。

## 3. BFF 配置接入

- [x] 3.1 用 `pnpm add --filter @inkstack/bff @inkstack/config@workspace:*` 添加依赖，验证 `pnpm install` 后 BFF 能解析该包。
- [x] 3.2 新增 `apps/bff/src/config/env.ts`：zod schema 包含 `NODE_ENV`（`development` / `test` / `production` / `staging`，可选）与 `BFF_PORT`（正整数，默认 `4003`），导出 `env = parseEnv(schema, process.env, { label: 'bff' })`。验证 `pnpm --filter @inkstack/bff typecheck` 通过。
- [x] 3.3 新增 `apps/bff/src/config/index.ts`，导出类型化的 `config`（`runtime.nodeEnv`、`runtime.isDev`、`server.port`），并把 `main.ts` 的硬编码 `4003` 改为 `config.server.port`。验证 `pnpm --filter @inkstack/bff build` 通过。
- [x] 3.4 更新 `apps/bff/AGENTS.md`：记录 `src/config` 的职责、业务代码不得直接读 `process.env`、以及 `.env` 尚未接入的现状。验证文档与 `src/config` 文件一致。

## 4. Turbo 与 env 模板

- [x] 4.1 修改 `turbo.json`：增加 `globalEnv: ["NODE_ENV", "BFF_PORT"]`；`dev`、`typecheck`、`lint` 的 `dependsOn` 改为依赖 `^build`。验证 `pnpm exec turbo run typecheck --dry=json` 中 `@inkstack/config#build` 排在 `@inkstack/bff#typecheck` 之前。
- [x] 4.2 在 `.env.example` 的端口分组中启用 `BFF_PORT=4003`。验证模板与 `apps/bff/src/config/env.ts` 的默认值一致。
- [x] 4.3 删除 `packages/config/dist` 后执行 `pnpm typecheck` 与 `pnpm lint`，确认依赖构建会自动补回 `dist` 且两项检查都通过。
- [x] 4.4 更新 `docs/toolchain.md` 的环境变量章节：记录 `globalEnv`、构建顺序与「`.env` 文件尚未被加载」的边界。验证文档描述与 `turbo.json` 一致。

## 5. 集成验证

- [x] 5.1 在仓库根执行 `pnpm check:manifests && pnpm lint && pnpm typecheck && pnpm build`，确认全部通过。
- [x] 5.2 用 `BFF_PORT=4100 pnpm --filter @inkstack/bff start` 启动，请求 `http://localhost:4100/health` 返回成功；再用 `BFF_PORT=abc` 启动，确认进程以包含 `BFF_PORT` 的错误退出。
- [x] 5.3 在不设置 `BFF_PORT` 的情况下启动 BFF，确认监听 `4003`，证明默认值生效。

## Workflow follow-up

- 评审通过后按项目流程归档本次变更。
