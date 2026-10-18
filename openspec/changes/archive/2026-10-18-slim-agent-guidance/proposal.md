# Proposal

## Why

根 `AGENTS.md` 目前同时承担项目介绍、阶段状态、目录清单、依赖教程、OpenSpec 手册和包级实现细节。随着每个包开始增加自己的内容，这些内容会继续在根文件里堆叠、重复，并在多处产生漂移。dsh（deepseek-harness）的做法是把根文件压缩成一组常驻命令（standing orders）：每条 1–3 行，只写跨包规则，细节链接到唯一归属地。仓库仍在骨架期，此时重构成本最低。

## What Changes

- 按 standing-orders 模式重写根 `AGENTS.md`，目标从 107 行降到约 45–55 行。
- 删除根文件中的阶段状态、目录树、包级实现细节、OpenSpec 命令清单和重复的 Archify 规则；这些内容分别下沉到 README、包级 `AGENTS.md`、`docs/` 或现有 skills。
- 新增"指引分层"契约：根只放跨包规则；`apps/*`、`packages/*`、`docs/`、`infra/` 可拥有自己的 `AGENTS.md`，作为补充而不重复根规则，通常不超过 25 行。
- 新增"编辑本文件"元规则：规则自包含并链接细节；优先压缩；根文件行数上限 70 行，先手动执行，后续再接脚本门禁。
- 新增跨工具可见的"工作约束"段：Git 写操作禁令、注释规范、完成前验证各 1 行，并指向 `.claude/rules/`，避免只读 `AGENTS.md` 的非 Claude Agent 丢失这些约束。
- 修订 `.claude/rules/git.md`：明确默认禁止所有会改变工作区、分支或历史的命令，列出允许的只读命令，明确分支创建与 `--no-verify` 规则，并链接 Conventional Commits。
- 修订 `.claude/rules/comments.md`：将"多而干净"改为"少而准"；补充 TSDoc、压制型语句（`@ts-expect-error` 等）的理由要求、带归属的 TODO 规则、过时注释处理。
- 修正文档与配置漂移：
  - 根 `package.json` 的 `@types/node` 改为 `catalog:dev`；catalog 值从 `^26.6.5` 调整为与 Node 24 匹配的 `^24.19.2`（当前已安装 24.19.2）。
  - 将 `@fission-ai/openspec` 的 catalog 值改为精确 `1.14.3`，与"固定 1.14.3"的表述一致。
  - 统一 CI 口径：根文件只保留"骨架期延后"的策略，CI 规划留在 `docs/`，不再把规划写成现状。
  - 明确 `interactive/*.html` 的提交策略：当前继续跟踪生成物，因为尚未有 CI 生成流程；同步修订设计记录中的未决表述。
- 不为当前占位包创建空的 `AGENTS.md`；只在根文件定义包级文档契约，包首次落地时再创建。
- **BREAKING**：无。仅文档、规则和依赖清单变化，不改应用代码或运行时行为。

## Capabilities

### New Capabilities

无。该变更是纯文档与工具链整理，不改变任何运行时行为；`.openspec.yaml` 已设置 `skip_specs: true`。

### Modified Capabilities

无。

## Impact

- 文档：`AGENTS.md`、`.claude/rules/git.md`、`.claude/rules/comments.md`、`README.md`、`docs/architecture/DESIGN-RECORD.md`。
- 配置：根 `package.json`、`pnpm-workspace.yaml`、`pnpm-lock.yaml`（catalog 版本调整）。
- 不涉及 `apps/` 与 `packages/contracts` 的代码、API 或运行时依赖。
- 风险：根文件删减可能让只读 `AGENTS.md` 的非 Claude Agent 失去部分背景信息；通过"规则 + 链接"结构和新增工作约束段控制。
