# Design

## Context

- `husky@9.1.7` 已安装，`prepare` 脚本已接入；仓库只有 `.husky/commit-msg`，`.husky/_/` 由 husky 生成。
- 根 `.oxlintrc.json` 设置 `options.typeAware: true`，并用 `overrides` 表达浏览器 / Node / Nest 差异；根 `lint` 由各包自己的 script 调用 `oxlint --type-aware`。
- oxlint 1.88 没有 `--staged` / `--changed`，处理暂存文件必须显式传入路径；配置支持 `extends`，多个配置按顺序合并，后者覆盖前者。
- oxfmt 的默认模式就是 `--write`，并支持 `--no-error-on-unmatched-pattern`。
- `lint-staged@17.6.0` 要求 Node ≥22.22.1；当前固定 Node 24.14.1。
- 依赖版本只能写在 `pnpm-workspace.yaml` 的 catalog 中，开发工具放 `dev`（允许 `^`）。

## Goals / Non-Goals

**Goals:**

- 在提交路径上以最小成本保证「进仓库的文件已格式化、无基础 lint 错误」。
- 不因为提交检查而覆盖或吞掉用户未暂存的改动。
- 保持规则单一来源：staged 配置继承根配置，不复制规则。
- 把类型错误挡在推送前，而不是等 CI。

**Non-Goals:**

- 不做全仓库 pre-commit 检查。
- 不在 pre-commit 里跑 `turbo run lint`、`typecheck` 或 `build`。
- 不调整 commitlint 规则，不新增 commit 信息格式检查。
- 不引入 lefthook / simple-git-hooks 等替代框架。

## Decisions

### 1. pre-commit 使用 lint-staged

- `.husky/pre-commit` 只有一行：`pnpm exec lint-staged`。
- 替代方案：自写 `scripts/staged.mjs` 取 `git diff --cached --name-only`。拒绝原因：部分暂存场景下，对工作区文件执行 `oxfmt --write` 会把未暂存的改动一起写入；要正确处理必须重新实现 lint-staged 的 stash / 回写逻辑，风险高于收益。
- 替代方案：pre-commit 直接跑 `pnpm format:check && pnpm lint`。拒绝原因：全仓库 type-aware lint 与提交内容无关，包增多后延迟不可接受。
- 遵循上游 Turborepo 仓库的同类做法（husky + lint-staged + oxfmt）。

### 2. staged lint 关闭 type-aware

- `.oxlintrc.staged.json` 通过 `extends: ["./.oxlintrc.json"]` 继承全部规则与 `overrides`，只覆盖 `options`：

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "extends": ["./.oxlintrc.json"],
  "options": {
    "typeAware": false,
    "reportUnusedDisableDirectives": "warn"
  }
}
```

- 两个 `options` 键都显式写，避免实现按整个对象替换时丢掉 `reportUnusedDisableDirectives`。
- 关闭理由：type-aware 需要为每个文件解析 tsconfig，提交路径上延迟明显；且 `.mjs` 脚本、根配置文件不在任何包的 tsconfig 内，容易产生与改动无关的失败。类型问题由 pre-push 的 `pnpm typecheck` 覆盖。
- 替代方案：pre-commit 保留 type-aware。拒绝原因：把完整类型检查塞进每次提交，与 pre-push 职责重复。
- 替代方案：staged 配置复制一份规则。拒绝原因：规则会出现两个 home，长期必然漂移。

### 3. lint-staged 只做格式化与检查，不自动修 lint

- TS/JS 组：`oxfmt --no-error-on-unmatched-pattern` → `oxlint --config .oxlintrc.staged.json`。
- 其他文本组：只跑 `oxfmt --no-error-on-unmatched-pattern`。
- 不给 oxlint 加 `--fix`：自动修复可能改变行为（如删除未使用导入），提交路径上应保持结果可预期；格式问题由 oxfmt 自动修复并回写暂存区。
- 不传 `--deny-warnings`：与根 `pnpm lint` 的严重级别保持一致。
- oxfmt 默认写回，lint-staged 会把修改后的文件重新加入暂存区。

### 4. pre-push 执行 `pnpm typecheck`

- `.husky/pre-push` 只有一行：`pnpm typecheck`。
- Turborepo 按包缓存，未变化的包命中缓存；当前仓库只有 contracts 一个代码包，成本很低。
- 替代方案：pre-push 跑 `pnpm build`。拒绝原因：构建会写 `dist/`，与推送动作无关，且 typecheck 已覆盖类型错误。
- 替代方案：只在 CI 跑。拒绝原因：骨架阶段还没有 CI，本地拦截是唯一防线；接入 CI 后可保留或降级。

### 5. 依赖与 hook 形态

- `lint-staged` 加入 `dev` catalog（`^17.6.0`），根 `devDependencies` 写 `catalog:dev`。
- husky 9 的 hook 文件不需要 shebang 或 husky 引导脚本；与现有 `.husky/commit-msg` 保持同样的一行命令风格。
- hook 非零退出即中断提交 / 推送，不额外打印自定义提示；lint-staged 与 tsc 的输出已足够定位问题。

## Risks / Trade-offs

- [pre-commit 不跑类型检查，类型错误可能进入本地提交] → pre-push 强制 `pnpm typecheck`；CI 接入后再评估。
- [lint-staged 处理部分暂存时依赖 stash 机制] → 验证任务覆盖「暂存一部分、未暂存一部分」场景，确认未暂存改动未被修改或丢失。
- [oxfmt 会格式化生成的 HTML / Markdown] → 已有策略接受全仓库格式化；pre-commit 只处理暂存文件，不会额外扩大范围。
- [`lint-staged` 主版本升级可能改变行为] → 固定在 `dev` catalog，升级作为独立提交并重跑 hook 场景验证。
- [pre-push 在仅文档改动时也运行] → turbo 缓存命中后开销很小；若未来变慢，再加入路径过滤，而不是现在提前优化。
- [Windows 下 hook 与路径处理] → lint-staged 自行处理路径转义；验证任务在 Windows 上真实执行一次 hook。
