# Proposal

## Why

仓库已经统一了 oxfmt 与 oxlint，但没有任何 pre-commit 检查：格式化与 lint 只能靠人工记得执行，提交里可能混入未格式化或带 lint 错误的文件。提交信息已由 `commit-msg` 拦截，类型错误却直到手动运行 `pnpm typecheck` 才会暴露。

## What Changes

- 新增 `.husky/pre-commit`，执行 `pnpm exec lint-staged`：只处理暂存文件，先 `oxfmt` 格式化，再 `oxlint` 检查。
- 根 `package.json` 增加 `lint-staged` 配置：TS/JS 走格式化 + lint，Markdown / JSON / YAML / CSS / HTML 只走格式化。
- 新增 `.oxlintrc.staged.json`，通过 `extends` 继承根 `.oxlintrc.json` 并关闭 `typeAware`；pre-commit 只做格式与基础正确性，类型检查留给 pre-push 与 CI。
- 新增 `.husky/pre-push`，执行 `pnpm typecheck`；Turborepo 缓存让重复执行保持较快。
- 在 `pnpm-workspace.yaml` 的 `dev` catalog 增加 `lint-staged`，根 `devDependencies` 引用 `catalog:dev`。
- `docs/toolchain.md` 新增 Git hooks 小节，记录各 hook 的职责与 staged lint 关闭 type-aware 的理由。
- `commit-msg` 保持不变。

明确不在本次范围：CI、全仓库 pre-commit 检查、commitlint 规则调整、manifest 检查进入 hook、`simple-git-hooks` 或 `lefthook` 等替代方案。

## Capabilities

### New Capabilities

无。本变更只涉及开发工具链与文档，不改变系统运行时行为，`.openspec.yaml` 已设置 `skip_specs: true`。

### Modified Capabilities

无。

## Impact

- 依赖：新增一个开发依赖 `lint-staged`（`catalog:dev`），`pnpm-lock.yaml` 更新；无运行时依赖。
- 配置：根 `package.json`、`pnpm-workspace.yaml`、新增 `.oxlintrc.staged.json`。
- Git hooks：新增 `pre-commit`、`pre-push`，`commit-msg` 不变。
- 开发者体验：提交延迟增加（仅 staged 文件 + 非 type-aware lint）；推送前增加一次类型检查。
- 文档：`docs/toolchain.md` 增加 hook 说明。
