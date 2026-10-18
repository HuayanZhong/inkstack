# Proposal

## Why

根 `AGENTS.md` 已经从 107 行压到 61 行，但"文档会不会腐烂"还没有被设计：状态、命令、版本、图源和决策状态仍靠手写同步；OpenWiki 接入后还会自动改写 `AGENTS.md` / `CLAUDE.md`。现在需要先用最小成本定下权威边界、归属规则和预算口径，否则每次加包或接入新工具都会重新制造重复与漂移。

## What Changes

- 新增 `docs/AGENTS.md`（≤25 行 / ≤1,000 非空白字符），定义：
  - 文档权威表：specs、AGENTS、rules、DESIGN-RECORD、README、图源、生成物、OpenWiki 各管什么；
  - 一条事实一个 home，其他位置只链接，不复述；
  - 只写当前状态，不写变更历史；状态只留在 README，并带复查条件；
  - 生成物规则：Archify 的 HTML/PNG 与未来的 OpenWiki 页面都是派生物，不手改；
  - `AGENTS.md` / `CLAUDE.md` 中的生成块用标记区分，预算和链接检查跳过；
  - 决策生命周期：`DESIGN-RECORD` 使用 `已定 / 已取代 / 待定`，取代项链接到新条目，归档变更冻结。
- 根 `AGENTS.md` 增加指向 `docs/AGENTS.md` 的一行；"编辑本文件"补充生成块规则；预算改为"只手写区计数"：根 ≤70 行且 ≤3,200 非空白字符（当前 2,565）。
- `DESIGN-RECORD.md` 增加决策状态与取代约定，并明确 `openspec/changes/archive/` 是冻结历史。
- `README.md` 的骨架状态段增加复查条件（首个应用落地后重写）。
- 子树 `AGENTS.md` 的契约明确为"补充根规则、不重复、≤25 行且 ≤1,000 非空白字符"。
- 为 OpenWiki 预留接入点：`openwiki/` 是生成树，`openwiki/INSTRUCTIONS.md` 是生成策略源，`.run.json` 不提交；本变更不安装 OpenWiki，也不改 `.gitignore`。
- **BREAKING**：无。仅文档规则与文档本身。

## Capabilities

### New Capabilities

无。这是纯文档治理变更，不改变运行时行为；`.openspec.yaml` 已设置 `skip_specs: true`。

### Modified Capabilities

无。

## Impact

- 文档：新增 `docs/AGENTS.md`；修改 `AGENTS.md`、`docs/architecture/DESIGN-RECORD.md`、`README.md`。
- 不涉及应用代码、依赖、脚本、CI 或 OpenWiki 安装。
- 风险：`docs/AGENTS.md` 可能变成第二个根文件；用 25 行 / 1,000 字符上限和"只放归属与保鲜规则"约束。
