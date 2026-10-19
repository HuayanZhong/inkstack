# Proposal

## Why

当前启动方式混用 `dev` 与 `start`：shell / BFF / Gateway 有 `start`，canvas 没有；根 `pnpm start` 既不会先构建应用，也无法启动 canvas。生产启动尚未真正设计，保留这套半成品脚本只会制造歧义。

同时，本地门禁没有覆盖 `pnpm lint`、`pnpm check:manifests` 和应用构建；在 CI 尚未接入的情况下，type-aware lint、manifest 漂移和 shell / canvas 构建错误都可能直接推送到远端。`eslint` 也是被 pnpm 作为 peer 隐式安装的，并非项目主动使用。

本次只统一开发工作流与检查链路，不改变产品行为，也不深入运行时或安全改造。

## What Changes

- 统一为 **`pnpm dev` 作为唯一本地启动入口**：删除根 `start`、turbo `start` 任务，以及 shell / BFF / Gateway 的 `start` scripts；各应用保留 `dev` / `build` / `lint` / `typecheck`，Gateway 额外保留 `smoke:ws`。
- 更新相关文档与模板：`docs/toolchain.md`、`.env.example`、`apps/gateway/README.md` 等不再提 `start`；说明生产启动以后单独设计。
- 新增根 `verify` 脚本，并让 pre-push 执行它；覆盖 `lint`、`check:manifests`、`typecheck`、`build`、`format:check`、`hygiene`。
- 在 `pnpm-workspace.yaml` 设置 `autoInstallPeers: false`，阻止 eslint 被隐式安装；验证 `pnpm why eslint` 为空，`pnpm lint` 仍通过。若插件确实需要 eslint，再将它显式放入 `dev` catalog，作为受控例外。
- `turbo.json` 的 `typecheck` 增加 `$TURBO_ROOT$/.env*` 输入，避免 env 变化后命中旧缓存。
- `packages/contracts` 补 `"typescript": "catalog:toolchain"`，与 `packages/config` 保持一致。
- 清理 knip 的 5 条配置提示，并为 `.agents/**` / `.claude/**` 忽略项补理由。
- 把 `socket.io-client` 从 `runtime` catalog 移到 `dev`；Gateway 当前只在 smoke 脚本中使用它。

**BREAKING**：`pnpm start` 不再可用；本地统一使用 `pnpm dev`。生产启动在真正部署时再单独设计。

不在本次范围：host / CORS / 鉴权 / env 边界等运行时改造；文档与规格回正（另起 `spec-docs-reconciliation`）；Vitest；action 协议；公共包抽离。

## Capabilities

### New Capabilities

无。本次只调整开发命令、仓库检查与依赖分类，不产生需要长期维护的产品行为；`.openspec.yaml` 已声明 `skip_specs: true`。

### Modified Capabilities

无。`repository-hygiene` 的 pre-push 仍包含 typecheck 与 hygiene；`verify` 只是在其前后增加 lint、manifest 与应用构建，不改变该能力的产品行为要求。

## Impact

- **脚本与任务**：根 `package.json`、`turbo.json`、shell / BFF / Gateway 的 `package.json`。
- **检查链路**：`.husky/pre-push`、根 `verify` 脚本。
- **依赖与配置**：`pnpm-workspace.yaml`、`pnpm-lock.yaml`、`packages/contracts/package.json`、`knip.config.ts`。
- **文档**：`docs/toolchain.md`、`.env.example`、`apps/gateway/README.md`；根 README 与 AGENTS 如出现 `start` 一并同步。
- **不涉及**：应用运行时代码、CORS、鉴权、WebSocket 行为、产品规格。
