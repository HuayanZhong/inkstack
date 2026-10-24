# Proposal

## Why

`pnpm check:docs` 目前只校验 `AGENTS.md`，README 除存在性外没有任何约束，已经出现真实漂移：根 README 漏列 `api-client`，`packages/README.md` 的索引表只列了 3 个包，`packages/AGENTS.md` 的目录清单漏掉 `api-client` 与 `ui`。成熟项目把这类可计算的文档事实放在 PR 门禁里，把语义判断留给评论式审查；本变更先补齐确定性的一层，并修复已确认的索引漂移。

## What Changes

- 扩展 `scripts/check-agent-docs.mjs`，同时收集 `README.md`，按文档类型执行确定性检查：
  - 根 README 的 `apps/`、`packages/` 目录树与 `packages/README.md` 的索引表，必须与真实 workspace 包双向一致，漏项和多列都失败。
  - 包与应用 README 的 H1 必须匹配 `package.json` 的 `name`；按文档类型校验必备章节，禁止空章节与 `TODO`/`TBD` 占位。
  - README 的相对链接、反引号项目路径、`pnpm --filter @inkstack/<pkg> <script>`、端口与 `exports` 子路径必须可解析；生成目录与未来文件不参与路径检查。
- 为新增规则补 fixture 自测，沿用脚本现有的 `--self-test` 模式；不新增测试框架或依赖。
- 修复当前索引漂移：根 README 补 `api-client`，`packages/README.md` 补 `api-client`、`ui`、`vitest-config`，`packages/AGENTS.md` 补 `api-client/` 与 `ui/`；补 `packages/tsconfig/README.md` 的命令章节。
- 在 `docs/AGENTS.md` 与 `.claude/rules/agent-docs.md` 登记 README 检查的归属；`docs/ci-cd.md` 只更新 `check:docs` 的职责描述，不新增 workflow。
- 不新增依赖、不新增 CI workflow、不读取 secret、不引入 LLM/agent 审查。

## Capabilities

### New Capabilities

- `documentation-quality`: 约束 README 与仓库结构、引用和章节的一致性，并通过统一文档检查进入本地与 CI 门禁。

### Modified Capabilities

无。`agent-guidance` 已经规定 `pnpm check:docs` 进入 `pnpm verify` 与 CI static；本变更只扩展该命令的覆盖范围，不修改既有要求。

## Impact

- 代码：`scripts/check-agent-docs.mjs`；无运行时代码、无包依赖、无构建配置变化。
- 文档：根 `README.md`、`packages/README.md`、`packages/AGENTS.md`、`docs/AGENTS.md`、`.claude/rules/agent-docs.md`、`docs/ci-cd.md`。
- CI：`ci-static.yml` 已执行 `pnpm check:docs`，无需新增 job；`all checks passed` 自动覆盖新规则。
- 不在本变更范围：`packages/ui/README.md` 的 postcss 指引、根 README 的 `pnpm dev` 描述等语义问题；它们需要读代码对照，留给后续文档修复或本地 agent 审查。
