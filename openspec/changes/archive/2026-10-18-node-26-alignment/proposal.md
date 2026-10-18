# Proposal

## Why

机器上的 Node 已从 `24.14.1` 升级到 `26.12.0`（npm 11.20.0、pnpm 12.14.0），全局工具也已重装，但仓库仍声明 `>=24.14.1`，`@types/node` 仍停在 24.x。声明与运行时不一致会让类型检查看到旧 API，也会掩盖 Node 26 下的兼容问题。

同时，这次升级跨了两个大版本，需要一次性确认 pnpm 安装、原生绑定、Turborepo、husky hooks 与全局 CLI 在新运行时下都正常，而不是等到写应用时才发现。

## What Changes

- `.nvmrc` 改为 `26.12.0`，根 `package.json` 的 `engines.node` 改为 `>=26.12.0`；两者保持相等，现有 `check-manifests` 等值检查继续通过。
- `@types/node` 从 24.x 升到 `^26.6.5`（`dev` catalog），更新 lockfile。
- 清理文档中的旧版本声明：`AGENTS.md`、`README.md`，并移除 `docs/toolchain.md` 推迟项里的「Node 升级到 24.15+」。
- 全面验证：`pnpm install`、format、lint、typecheck、build、manifest 检查、husky 两个 hook、Turborepo 与 oxfmt/oxlint 原生绑定、全局 CLI（claude / codex / opencode / openwiki / nest / openspec 等）。
- 记录升级后的有效状态；如果发现 Node 26 不兼容，记录失败点并给出回退到 24.22.0 LTS 的条件。

明确不在本次范围：卸载旧 Node 24、重装或调整全局工具的版本策略、CI、应用骨架、运行时依赖、Vitest / Playwright。

## Capabilities

### New Capabilities

无。本变更只涉及工具链声明、文档与验证，不改变系统运行时行为，`.openspec.yaml` 已设置 `skip_specs: true`。

### Modified Capabilities

无。

## Impact

- 工具链声明：`.nvmrc`、`package.json`、`pnpm-workspace.yaml`（`@types/node`）、`pnpm-lock.yaml`。
- 文档：`AGENTS.md`、`README.md`、`docs/toolchain.md`。
- 验证范围：仓库脚本、husky hooks、Turborepo、oxc 原生绑定、全局 CLI。
- 无运行时依赖变化，无应用代码变化。
- 风险：Node 26 对个别工具或原生绑定不兼容；本变更的验证任务负责暴露，并保留 24.22.0 LTS 回退路径。
