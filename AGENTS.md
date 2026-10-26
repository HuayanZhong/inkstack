# AGENTS.md

墨栈 Inkstack 是一个 AI design-to-code 画布（tldraw），支持 AI 控笔、人工编辑、设计转代码，并通过 MCP 暴露给外部 Agent。改动架构前先读 [`docs/architecture/DESIGN-RECORD.md`](docs/architecture/DESIGN-RECORD.md)。

## 指引分层

根 `AGENTS.md` 只放跨包常驻规则。子树 `AGENTS.md` 以“补充根文件的规则”开头，只写目录特有内容，不重复根规则，≤25 行；占位包不创建空文件。每层 `CLAUDE.md` 只写 `@AGENTS.md`；`packages/*` 需 `README.md`。优先级、预算与单一归属见 [`.claude/rules/agent-docs.md`](.claude/rules/agent-docs.md)；文档规则见 [`docs/AGENTS.md`](docs/AGENTS.md)。

## 阶段策略

仓库处于骨架阶段，Changesets 刻意延后；状态与部署见 [`README.md`](README.md) 与 [架构文档](docs/architecture/README.md)。

## 常用命令

```bash
pnpm install
pnpm dev              # turbo run dev
pnpm build            # turbo run build
pnpm lint             # turbo run lint
pnpm typecheck        # turbo run typecheck
pnpm test             # turbo run test
pnpm verify           # lint → manifest → docs → typecheck → coverage → build → format → hygiene
pnpm check:manifests
pnpm format           # oxfmt --write .
pnpm lint:commit      # commitlint，从 stdin 读取提交信息
```

提交信息必须符合 Conventional Commits；husky 的 `commit-msg` hook 会拒绝不合规信息。

## 仓库约定

- 包统一使用 `@inkstack/*` 命名；pnpm workspace 只包含 `apps/*` 和 `packages/*`，`docs/`、`infra/` 不是包。
- `.claude/skills` 指向 `../.agents/skills`；`.claude/settings.json` 与根 `CLAUDE.md` 位置固定，不要移动。
- 图的可编辑源是 `docs/architecture/source/*.json`，不要手改 `interactive/*.html`。生成物入库；重新生成命令见 [`docs/architecture/README.md`](docs/architecture/README.md)。

## 依赖与工具链

- 依赖只走 catalog，版本写在 `pnpm-workspace.yaml`；命名、字段与版本分层见 [`docs/package-metadata.md`](docs/package-metadata.md)。禁止裸 semver。
- 根工具链：`pnpm add -Dw <pkg> --save-catalog-name toolchain`；运行时：`pnpm add --filter @inkstack/<pkg> --save-catalog-name runtime <pkg>`，开发依赖加 `-D`。构建脚本白名单是 `allowBuilds`，用 `pnpm approve-builds`。
- Node `>=26.12.1`、pnpm `12.14.0`、TypeScript `6.0.3` 已固定。不要升级到 TS 7：Nest CLI 12 仍要求旧的编译器 API；Next 16.4 已支持 TS 7 的 CLI 模式。`@types/node` 的主版本跟随 Node。
- 包内 `tsconfig.json` 继承 `@inkstack/tsconfig` 预设，并在 devDependencies 声明 `"@inkstack/tsconfig": "workspace:*"`；模块格式见 [`docs/typescript.md`](docs/typescript.md)。Turborepo 任务见 `turbo.json`，`ui` 固定为 `tui`。
- format 与 lint 由根目录的 oxfmt / oxlint 负责；规则见 [`docs/toolchain.md`](docs/toolchain.md)。

## OpenSpec

需求以 `openspec/specs/` 为唯一来源，进行中的变更在 `openspec/changes/<id>/`。`/opsx:propose` 只规划，`/opsx:apply` 才实现。产物语言与标题见 `openspec/config.yaml`。不要手改生成的技能与命令，刷新用 `pnpm exec openspec update`；devDependency 与全局 `openspec` 同固定 `1.14.3`。

## 架构不变量

- **Canvas 是单一执行器**：所有画布修改最终由 tldraw editor 执行并回 ack。
- **Gateway 是单一序列器**：所有 action 排队、编号、校验、广播、持久化。
- **BFF 是独立一层**：前端聚合、Auth/session、SSE、上传/下载；不持有 action 队列。
- **实时 WS 可直连 Gateway**：REST/SSE/Auth 走 BFF，降低 action 延迟。
- **代码生成是确定性编译器**：不让模型自由写代码。
- **设计文件是 JSON**：tldraw snapshot，随仓库进 Git，不使用 Pencil 的 `.pen` 格式。

## 工作约束

- 工具与事实优先：依赖、任务、检查、规格、脚手架、生成器都走官方 CLI，版本与 API 先核实，不手写工具产物；见 [`.claude/rules/cli-first.md`](.claude/rules/cli-first.md)。
- 测试：运行时代码同变更补测试，见 [规则](.claude/rules/testing.md)。
- 设计：视觉方向、组件纯度、主题与动效见 [`.claude/rules/design.md`](.claude/rules/design.md)。
- Git：除非用户当次明确要求，不执行任何会改变工作区、分支或历史的命令；详见 [`.claude/rules/git.md`](.claude/rules/git.md)。
- 注释：解释代码长期成立的事实，不复述过程或代码；详见 [`.claude/rules/comments.md`](.claude/rules/comments.md)。
- 环境变量：端口、host、URL、凭据只通过 env 分发，规则见 [`.claude/rules/env.md`](.claude/rules/env.md)。
- 指引维护：改 `AGENTS.md` / `CLAUDE.md` 前读 [`.claude/rules/agent-docs.md`](.claude/rules/agent-docs.md)。
- 完成前跑 `pnpm verify`，并报告实际输出。

<!-- BEGIN:turborepo-agent-rules -->

# This is NOT the Turborepo you know

Turborepo configuration, task behavior, and CLI commands can vary between installed versions and may differ from your training data. Resolve the `turbo` package from this file's directory or relevant workspace; in monorepos, it may not be visible from the repository root. For example, run `node -p "require.resolve('turbo/package.json')"` from a workspace that depends on `turbo`.

Read `docs/README.md` inside that installed package first, then read the relevant pages from its `docs/` directory before changing Turborepo configuration or commands. Heed deprecation notices. These bundled docs match the installed package version and are available without network access.

This block is written and re-added by `turbo` before repository-scoped commands when an AI agent is detected. In the Turborepo source repository, its template is defined in `crates/turborepo-cli/src/cli/agent_guidance.rs`. Removing the managed block while updates are enabled means a later qualifying invocation will add it again. Set `"agentGuidance": true` in the root `turbo.json` or `turbo.jsonc` to opt in; this does not remove an existing block. Keep the block committed with your work to avoid an uncommitted change on the next agent invocation.
<!-- END:turborepo-agent-rules -->
