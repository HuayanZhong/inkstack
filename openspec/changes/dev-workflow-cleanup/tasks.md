# Tasks

## 1. 启动脚本统一

- [x] 1.1 删除根 `package.json` 的 `start` script、`turbo.json` 的 `start` 任务，以及 `apps/shell/package.json`、`apps/bff/package.json`、`apps/gateway/package.json` 的 `start` scripts；验证：`rg -n '"start"|turbo run start' package.json turbo.json apps/*/package.json` 无结果，`pnpm check:manifests` 输出 0 errors。
- [x] 1.2 同步删除后的文档：`docs/toolchain.md:65-66` 去掉 `start`，`.env.example:5-8` 只保留 dev / build，`apps/gateway/README.md` 的 WS smoke 说明只写 `dev`；验证：`rg -n "build / start|dev / typecheck|pnpm start|dev 或 start" docs/toolchain.md .env.example apps/gateway/README.md` 无结果，`pnpm format:check` 通过。

## 2. 依赖、缓存与 knip

- [x] 2.1 在 `pnpm-workspace.yaml` 顶层增加 `autoInstallPeers: false`；验证：`pnpm install` 成功，`pnpm why eslint` 无输出，`pnpm lint` 通过。若 lint 因缺少 eslint 失败，则把 `eslint` 显式加入 `dev` catalog 与根 `devDependencies`，并在配置中写明原因，再重复验证。
- [x] 2.2 在 `turbo.json` 的 `typecheck` 增加 `inputs: ["$TURBO_DEFAULT$", "$TURBO_ROOT$/.env*"]`；验证：`pnpm typecheck` 通过，`turbo.json` 中该任务包含 env 输入。
- [x] 2.3 在 `packages/contracts/package.json` 的 devDependencies 增加 `"typescript": "catalog:toolchain"`；验证：`pnpm install` 成功，`pnpm check:manifests` 输出 0 errors，`pnpm --filter @inkstack/contracts typecheck` 通过。
- [x] 2.4 把 `socket.io-client` 从 `pnpm-workspace.yaml` 的 `runtime` catalog 移到 `dev`，并把 `apps/gateway/package.json` 的 devDependency 改为 `catalog:dev`；验证：`pnpm install` 成功，`pnpm check:manifests` 输出 0 errors，`pnpm why socket.io-client` 能解析到 Gateway 的 devDependency。
- [x] 2.5 清理 `knip.config.ts`：删除 `.claude/**` ignore 与 `packages/config`、`packages/contracts`、`apps/canvas` 的冗余 entry；保留 Gateway entry、canvas `module-federation.config.ts` 和根 `scripts/**/*.mjs`；给 `.agents/**` 补中文理由；验证：`pnpm exec knip --treat-config-hints-as-errors` 退出码为 0，`pnpm hygiene` 通过。

## 3. verify 与 pre-push

- [x] 3.1 在根 `package.json` 增加 `verify`：`pnpm install --frozen-lockfile && pnpm lint && pnpm check:manifests && pnpm typecheck && pnpm build && pnpm format:check && pnpm hygiene`；把 `.husky/pre-push` 改为 `pnpm verify`；在 `docs/toolchain.md` 的命令表增加 `pnpm verify`，并把 pre-push 描述改为 `pnpm verify`；验证：`pnpm verify` 退出码为 0，`cat .husky/pre-push` 只调用 `pnpm verify`。

## 4. 集成验证

- [x] 4.1 在仓库根依次运行 `pnpm verify` 与 `pnpm format:check`；验证：两条命令退出码均为 0，输出中没有未处理错误。
- [x] 4.2 运行 `pnpm dev`，确认 shell、bff、canvas、gateway 仍正常启动；验证：`curl -s http://localhost:4001/health` 返回 `"service":"gateway"`，`pnpm dev` 日志中没有因删除 `start` 产生的脚本错误；验证后停止进程。
- [x] 4.3 检查 `git status` 与 `git diff --stat`：改动只应落在 `package.json`、`turbo.json`、`apps/*/package.json`、`apps/gateway/README.md`、`docs/toolchain.md`、`.env.example`、`.husky/pre-push`、`pnpm-workspace.yaml`、`pnpm-lock.yaml`、`packages/contracts/package.json`、`knip.config.ts` 与本次 change 目录；验证：没有 `dist/`、`.turbo/`、`*.tsbuildinfo` 被跟踪。

## Workflow follow-up

- 评审通过并完成集成验证后归档本次 change。
- 归档后开始 `spec-docs-reconciliation`，处理 Gateway 持久化归属、shell / canvas 规格与文档漂移。
- Vitest 作为后续可选变更，只覆盖 `packages/config` 纯函数与 env 契约。
