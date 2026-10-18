# Tasks

## 1. 依赖与 staged 配置

- [x] 1.1 在 `pnpm-workspace.yaml` 的 `dev` catalog 增加 `lint-staged: ^17.6.0`，在根 `package.json` 的 `devDependencies` 增加 `"lint-staged": "catalog:dev"`；运行 `pnpm install`，确认 lockfile 更新且 `pnpm exec lint-staged --version` 输出版本号。
- [x] 1.2 新增根 `.oxlintrc.staged.json`，内容为 `extends: ["./.oxlintrc.json"]` 加 `options: { typeAware: false, reportUnusedDisableDirectives: "warn" }`；运行 `pnpm exec oxlint --config .oxlintrc.staged.json packages/contracts/src/index.ts` 确认退出码为 0，并用 `--print-config` 确认该文件解析出的 `typeAware` 为 `false`。

## 2. Hook 脚本

- [x] 2.1 新增 `.husky/pre-commit`，内容为 `pnpm exec lint-staged`；在没有暂存文件时运行 `sh .husky/pre-commit`，确认退出码为 0 且没有报错。
- [x] 2.2 新增 `.husky/pre-push`，内容为 `pnpm typecheck`；运行 `sh .husky/pre-push`，确认 `pnpm typecheck` 通过且退出码为 0。

## 3. 提交流程场景验证

- [x] 3.1 用临时探针文件验证两条路径：格式错误 + lint 错误时，pre-commit 退出码为 1，lint-staged 还原暂存区与工作区（格式修复也被丢弃）；仅格式错误时，pre-commit 退出码为 0，oxfmt 修复后的内容已回写暂存区。验证后取消暂存并删除探针文件，确认 `git diff --cached --name-only` 为空。
- [x] 3.2 同一个文件暂存第一版、工作区追加第二版，运行 pre-commit 后确认暂存区仍只有第一版、工作区两版都在；验证后取消暂存并删除探针文件。

## 4. 文档

- [x] 4.1 在 `docs/toolchain.md` 新增 Git hooks 小节：`pre-commit` 使用 lint-staged 只处理暂存文件、staged lint 关闭 type-aware 的理由、`pre-push` 执行 `pnpm typecheck`、`commit-msg` 保持不变；对照新增的 hook 文件与 `package.json` 配置确认文中命令与路径真实存在。

## 5. 集成验证

- [x] 5.1 依次运行 `pnpm format`、`pnpm format:check`、`pnpm lint`、`pnpm typecheck`、`pnpm check:manifests`，确认全部退出码为 0。
- [x] 5.2 运行 `git status --short` 与 `git diff --stat`，确认改动只包含根 `package.json`、`pnpm-workspace.yaml`、`pnpm-lock.yaml`、`.oxlintrc.staged.json`、`.husky/pre-commit`、`.husky/pre-push`、`docs/toolchain.md`；确认没有临时测试文件或索引残留。

## Workflow follow-up

- 变更实现并验证完成后，按项目流程运行 `/opsx:archive`。
- 场景验证涉及 `git add` / 取消暂存，必须在用户当次明确同意后执行；未获同意时按 3.1 的降级方案记录覆盖缺口。
- 提交由用户执行，不代用户 staging 或 commit。
