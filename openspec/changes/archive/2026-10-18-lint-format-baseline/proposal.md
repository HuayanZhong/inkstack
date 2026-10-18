# Proposal

## Why

仓库处于骨架阶段，只有 `packages/contracts` 有代码，lint 与 format 还没有落地。等到多个应用同时开始写代码再补，会产生一次覆盖全仓库的格式 diff，并让各包在没有统一基线的情况下各自引入规则。

现在建立基线成本最低：现有代码量很小，工具版本可以在应用依赖进入前锁定；后续 Nest / Next / React 落地时只需要按路径增加平面 override，而不是在每个包复制一份配置。

## What Changes

- 在 `toolchain` catalog 中精确固定：`oxfmt` 0.73.0、`oxlint` 1.88.0、`oxlint-tsgolint` 7.0.2004。三者都支持当前 Node 24.14.1，不触发 `engine-strict`。
- 新增根 `.oxfmtrc.json`：按现有代码风格（单引号、无分号、2 空格、`printWidth` 100）格式化 `ts/tsx/mts/cts/js/mjs/cjs`，暂不格式化 Markdown、YAML 与 `package.json`。
- 新增根 `.oxlintrc.json`：共享规则 + 按平面（browser / node / nest / next）的 `files` glob override。环境差异在一个文件内表达，不拆成多份环境配置。
- 新增根 `.oxlintrc.turbo.json` 与 `lint:env` 命令：通过 oxlint 的 `jsPlugins` 加载 `eslint-plugin-turbo` 2.11.9，启用 `turbo/no-undeclared-env-vars`。`eslint` peer 通过 pnpm `peerDependencyRules.ignoreMissing` 显式忽略，不引入 ESLint。
- 根 scripts 增加 `format`、`format:check`；`lint` 在 `turbo run lint` 之后追加 turbo env 检查。
- `packages/contracts` 增加 `lint` script，作为包级 type-aware lint 的第一个消费者。
- 新增 `docs/toolchain.md`，记录平面模型、配置所有权、命令、版本策略与推迟项；同步更新 `docs/AGENTS.md`、`docs/package-metadata.md` 和根 `AGENTS.md`。

明确不在本次范围：Node 升级、`vitest` / `vite`、`@inkstack/config` 的 tsconfig / vitest 预设、Nest / Next / React 运行时依赖、pre-commit hook、CI 与 Renovate 配置。

## Capabilities

### New Capabilities

无。本变更只涉及工具链与文档，不改变系统运行时行为，`.openspec.yaml` 已设置 `skip_specs: true`。

### Modified Capabilities

无。

## Impact

- 依赖：`pnpm-workspace.yaml` 的 `toolchain` catalog 新增三项；`package.json` 新增 `oxfmt`、`oxlint`、`oxlint-tsgolint`、`eslint-plugin-turbo` 与 `peerDependencyRules`；`pnpm-lock.yaml` 更新。
- 配置：新增 `.oxfmtrc.json`、`.oxlintrc.json`、`.oxlintrc.turbo.json`。
- 包：`packages/contracts/package.json` 增加 `lint` script。
- 文档：新增 `docs/toolchain.md`；修改 `AGENTS.md`、`docs/AGENTS.md`、`docs/package-metadata.md`。
- 不改变任何运行时 API、应用行为或现有 tsconfig。
