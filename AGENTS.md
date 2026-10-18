# AGENTS.md

墨栈 Inkstack 是一个 AI design-to-code 画布（tldraw），支持 AI 控笔、人工编辑、设计转代码，并通过 MCP 暴露给外部 Agent。改动架构前先读 [`docs/architecture/DESIGN-RECORD.md`](docs/architecture/DESIGN-RECORD.md)。

## 指引分层

根 `AGENTS.md` 只放跨包的常驻规则。`apps/*`、`packages/*`、`docs/`、`infra/` 可拥有自己的 `AGENTS.md`，以"补充根文件的规则"开头，只写该目录特有的内容，不重复根规则，通常不超过 25 行。当前占位包不创建空文件，包首次实现时落地。每层 `CLAUDE.md` 只写 `@AGENTS.md`。文档归属与保鲜规则见 [`docs/AGENTS.md`](docs/AGENTS.md)。

## 阶段策略

仓库处于骨架阶段。lint、测试、Changesets、CI 刻意延后，不要在无关任务里顺手补上；CI 规划见 [`docs/architecture/README.md`](docs/architecture/README.md)，那是规划而不是现状。本段在 CI 接入或首次发布后删除或改写。

## 常用命令

```bash
pnpm install
pnpm dev            # turbo run dev
pnpm build          # turbo run build
pnpm lint           # turbo run lint
pnpm typecheck      # turbo run typecheck
pnpm lint:commit    # commitlint，从 stdin 读取提交信息
```

提交信息必须符合 Conventional Commits；husky 的 `commit-msg` hook 会拒绝不合规信息。

## 仓库约定

- 所有包统一使用 `@inkstack/*` 命名；pnpm workspace 只包含 `apps/*` 和 `packages/*`，`docs/`、`infra/` 不是包。
- 新增包或独立目录时，同时创建该层的 `AGENTS.md`（职责、目录、命令、约束）和只写 `@AGENTS.md` 的 `CLAUDE.md`。
- `.claude/skills` 指向 `../.agents/skills`；`.claude/settings.json` 与根 `CLAUDE.md` 位置固定，不要移动。
- 图的可编辑源是 `docs/architecture/source/*.json`，不要手改 `interactive/*.html`。生成物随仓库提交；重新生成命令见 [`docs/architecture/README.md`](docs/architecture/README.md)。

## 依赖与工具链

- 所有依赖走 pnpm catalog，版本只写在 `pnpm-workspace.yaml`；catalog 分为 `toolchain`（精确 pin）、`dev`（开发工具）、`runtime`（运行时库），`package.json` 分别使用 `catalog:toolchain`、`catalog:dev`、`catalog:runtime`，禁止裸 semver。规则见 [`docs/package-metadata.md`](docs/package-metadata.md)。
- 根工具链依赖用 `pnpm add -Dw <pkg> --save-catalog-name toolchain`；运行时依赖用 `pnpm add --filter @inkstack/<pkg> --save-catalog-name runtime <pkg>`，开发依赖再加 `-D`。
- pnpm 11+ 的构建脚本白名单是 `allowBuilds`；遇到 `ERR_PNPM_IGNORED_BUILDS` 时用 `pnpm approve-builds`。
- Node `>=26.12.0`、pnpm `12.14.0`、TypeScript `6.0.3` 已固定（catalog `toolchain` 精确 pin）。不要升级到 TS 7：Next.js 16 的类型检查依赖 `typescript/lib/typescript.js`，该文件在 TS 7 已移除。`@types/node` 的主版本跟随 Node 主版本。
- 包内 `tsconfig.json` 继承 `@inkstack/tsconfig` 的平面预设，并在 devDependencies 声明 `"@inkstack/tsconfig": "workspace:*"`；预设与模块格式见 [`docs/typescript.md`](docs/typescript.md)。Turborepo 任务定义在 `turbo.json`，`ui` 固定为 `tui`；新增包要补 `dev`、`build`、`lint`、`typecheck` scripts。
- format 与 lint 由根目录的 oxfmt / oxlint 负责：`pnpm format`、`pnpm format:check`、`pnpm lint`。环境差异用 `.oxlintrc.json` 的 `overrides` 表达，不要在包内新建规则文件；规则见 [`docs/toolchain.md`](docs/toolchain.md)。

## OpenSpec

需求以 `openspec/specs/` 为唯一来源，进行中的变更在 `openspec/changes/<id>/`。`/opsx:propose` 只产出规划，`/opsx:apply` 才开始实现。产物语言与标题格式见 `openspec/config.yaml`。不要直接编辑生成的技能与命令文件，刷新用 `pnpm exec openspec update`。项目 devDependency 与全局 `openspec` 都固定 `1.14.3`，升级时两处一起改。

## 架构不变量

- **Canvas 是唯一执行器**：所有画布修改最终由 tldraw editor 执行并 ack。
- **Gateway 是唯一序列器**：所有 action 排队、编号、校验、广播、持久化。
- **BFF 是独立一层**：负责前端聚合、Auth/session、SSE，不持有 action 队列。
- **代码生成是确定性编译器**：模型只负责调用工具，不自由写代码。
- **设计文件是 JSON**：tldraw snapshot 随仓库进 Git，不使用 `.pen` 格式。

## 工作约束

- Git：除非用户当次明确要求，不执行任何会改变工作区、分支或历史的命令；详见 [`.claude/rules/git.md`](.claude/rules/git.md)。
- 注释：解释代码长期成立的事实，不复述过程或代码；详见 [`.claude/rules/comments.md`](.claude/rules/comments.md)。
- 完成前跑 `pnpm typecheck`（以及已存在的 `pnpm build`），并报告实际输出。

## 编辑本文件

根文件只放跨包、稳定、不读会做错的规则；每条规则自包含，细节链接到唯一归属地。新增内容前先确认是否已有归属地。超标时按"下沉 → 压缩 → 扩预算"的顺序处理，并在变更说明中给出理由。预算只统计手写区：根文件 ≤70 行且 ≤3,200 非空白字符，子树 `AGENTS.md` ≤25 行且 ≤1,000。`OPENWIKI:START/END`、`nextjs-agent-rules`、`turborepo-agent-rules` 等标记块由工具维护，只编辑标记外，预算和链接检查跳过标记内。

<!-- BEGIN:turborepo-agent-rules -->

# This is NOT the Turborepo you know

Turborepo configuration, task behavior, and CLI commands can vary between installed versions and may differ from your training data. Resolve the `turbo` package from this file's directory or relevant workspace; in monorepos, it may not be visible from the repository root. For example, run `node -p "require.resolve('turbo/package.json')"` from a workspace that depends on `turbo`.

Read `docs/README.md` inside that installed package first, then read the relevant pages from its `docs/` directory before changing Turborepo configuration or commands. Heed deprecation notices. These bundled docs match the installed package version and are available without network access.

This block is written and re-added by `turbo` before repository-scoped commands when an AI agent is detected. In the Turborepo source repository, its template is defined in `crates/turborepo-cli/src/cli/agent_guidance.rs`. Removing the managed block while updates are enabled means a later qualifying invocation will add it again. Set `"agentGuidance": true` in the root `turbo.json` or `turbo.jsonc` to opt in; this does not remove an existing block. Keep the block committed with your work to avoid an uncommitted change on the next agent invocation.
<!-- END:turborepo-agent-rules -->
