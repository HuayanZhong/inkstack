# AGENTS.md

墨栈 Inkstack 是一个 AI design-to-code 画布（tldraw），支持 AI 控笔、人工编辑、设计转代码，并通过 MCP 暴露给外部 Agent。改动架构前先读 [`docs/architecture/DESIGN-RECORD.md`](docs/architecture/DESIGN-RECORD.md)。

指引按目录分层：根 `AGENTS.md` 只放跨包规则；每个包自己的职责、约束和命令写在 `apps/<name>/AGENTS.md` 或 `packages/<name>/AGENTS.md`。每层的 `CLAUDE.md` 只写 `@AGENTS.md` 作为入口，不要重复内容。

## 当前阶段

仓库处于**骨架阶段**：`apps/` 下仍是占位，没有应用代码。`packages/config` 提供共享 tsconfig，`packages/contracts` 已可编译（CommonJS 产物，供 Next 与 Nest 共同消费）。

以下内容是刻意延后的，不要在无关任务里顺手补上：lint、测试、Changesets、CI。包的实现顺序和各自约束随包写入对应的 `AGENTS.md`。

## 常用命令

```bash
pnpm install
pnpm dev            # turbo run dev（应用尚未实现）
pnpm build          # turbo run build
pnpm lint           # turbo run lint（尚未配置）
pnpm typecheck      # turbo run typecheck
pnpm lint:commit    # commitlint，从 stdin 读提交信息
```

提交信息受 husky 的 `commit-msg` hook 约束，必须符合 Conventional Commits。手动检查：

```bash
echo "chore: 验证提交信息" | pnpm lint:commit
git log -1 --pretty=%B | pnpm lint:commit
```

## 目录结构

```
apps/       可部署应用（shell / canvas / gateway / bff，当前均为占位）
packages/   共享包（contracts 已可编译，config 提供 tsconfig）
docs/       架构文档与设计记录
infra/      部署与可观测性骨架
```

所有包统一使用 `@inkstack/*` 命名。pnpm workspace 只包含 `apps/*` 和 `packages/*`；`docs/`、`infra/` 不是包。

新增包时同时建该包的 `AGENTS.md`（职责、目录、命令、约束）和指向它的 `CLAUDE.md`，根文件不要展开包内细节。

图的可编辑源是 `docs/architecture/source/*.json`。不要手改 `interactive/*.html`，它由 Archify CLI 生成。

## 依赖约定（必须遵守）

- **所有依赖走 pnpm catalog**。版本只写在 `pnpm-workspace.yaml` 的 `catalogs.dev`，`package.json` 里写 `"catalog:dev"`，禁止裸 semver 范围。
- 安装依赖用：
  ```bash
  pnpm add -Dw <pkg> --save-catalog-name dev
  ```
  它会同时写入 catalog 和 `catalog:dev` 引用。
- pnpm 11+ 的构建脚本白名单是 `allowBuilds`（不是旧的 `onlyBuiltDependencies`）。遇到 `ERR_PNPM_IGNORED_BUILDS` 时用 `pnpm approve-builds`。

## 工具链约束

- Node `>=24.14.1`，pnpm `12.14.0`，已由 `.nvmrc`、`engines`、`packageManager` 固定。
- TypeScript 固定 `6.0.3`。Next.js 16 的类型检查依赖 `typescript/lib/typescript.js`，而 TS 7 已移除该文件。升级时只改 catalog 里的一行，不要在单个包里单独升级。
- Turborepo 任务定义在 `turbo.json`，`ui` 固定为 `tui`。新增包时要补对应的 `dev` / `build` / `lint` / `typecheck` scripts。
- `packages/config` 导出 `tsconfig.base.json`、`tsconfig.node.json`、`tsconfig.react.json`。包内 `tsconfig.json` 用 `"extends": "@inkstack/config/tsconfig.<env>.json"` 继承，并在 devDependencies 声明 `"@inkstack/config": "workspace:*"`。

## OpenSpec / OPSX 工作流

项目使用 OpenSpec（`@fission-ai/openspec@1.14.3`）管理 spec-driven 变更。

- `openspec/specs/` — 已归档的主规格，是需求的唯一来源
- `openspec/changes/<id>/` — 进行中的变更（proposal / specs / design / tasks）
- `openspec/changes/archive/` — 已归档的变更
- `openspec/config.yaml` — schema 与项目上下文；产物使用简体中文，结构性标题和 SHALL/MUST 保留英文

Claude Code 中的命令：

```
/opsx:explore        想清楚再动手
/opsx:propose <idea> 生成提案与全部规划产物
/opsx:apply          按 tasks 实施
/opsx:update         修订已有规划产物
/opsx:sync           把增量规格合并回主规格
/opsx:archive        归档已完成变更
```

约定：

- 技能实体在 `.agents/skills/openspec-*`，`.claude/skills` 是指向 `../.agents/skills` 的符号链接；不要直接编辑生成的技能文件。
- 刷新生成物用 `pnpm exec openspec update`，它会写入 `.agents/skills` 并保留符号链接。
- 项目 devDependency 与全局 `openspec` 都固定 `1.14.3`；升级时两处一起改。
- `/opsx:propose` 只产出规划产物，不改代码；实现从 `/opsx:apply` 开始。

## 架构不变量

这些来自设计记录，跨包改动时必须保持：

- **Canvas 是唯一执行器**：所有画布修改最终由 tldraw editor 执行并 ack。
- **Gateway 是唯一序列器**：所有 action 排队、编号、校验、广播、持久化。
- **BFF 是独立一层**：负责前端聚合、Auth/session、SSE，不持有 action 队列。
- **代码生成是确定性编译器**：模型只负责调用工具，不自由写代码。
- **设计文件是 JSON**：tldraw snapshot 随仓库进 Git，不使用 `.pen` 格式。

## 文档

- [`docs/architecture/DESIGN-RECORD.md`](docs/architecture/DESIGN-RECORD.md) — 设计决策、里程碑、未决问题
- [`docs/architecture/README.md`](docs/architecture/README.md) — 四张架构图与重新生成命令
