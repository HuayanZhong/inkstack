# Design

## Context

参见 `proposal.md` 的 Why。当前约束：

- 根 `AGENTS.md` 61 行 / 2,565 非空白字符；`README.md` 43 行、`docs/architecture/README.md` 76 行、`DESIGN-RECORD.md` 109 行。
- lint、测试、CI 刻意延后，当前没有任何文档门禁或脚本。
- 架构图已有生成链：`docs/architecture/source/*.json` → `interactive/*.html` / `images/*.png`。
- OpenWiki 尚未接入，但已确认它的形态：生成 `openwiki/` 证据索引，向 `AGENTS.md` / `CLAUDE.md` 注入带标记的说明块，定时开 PR 而不是在合并时校验。
- dsh 的参照结论：根文件只放常驻命令；子树文件是补充；预算用于防膨胀；生成物永不手改；决策用取代而非改写。

## Goals / Non-Goals

**Goals：**

- 用一份短的 `docs/AGENTS.md` 固定"什么事实归谁管"。
- 让预算口径对中文可计算，并能容纳 OpenWiki / Next.js 的生成块。
- 给 `DESIGN-RECORD` 增加最小可执行的决策生命周期。
- 在 OpenWiki 接入前把冲突点（`AGENTS.md` / `CLAUDE.md` 生成块、`openwiki/` 的排除）写成规则。

**Non-Goals：**

- 不安装 OpenWiki，不写 `.github/workflows`，不改 `.gitignore`。
- 不实现 `docs:check` 脚本，不接 CI。
- 不引入双语配对、Agent Notes 树、VitePress 或文档站点。
- 不改变任何应用代码、依赖或运行时行为。

## Decisions

### 1. 权威按事实类型划分，而不是按文件位置

采用下表作为唯一的权威声明；`docs/AGENTS.md` 只承载这张表和归属规则，不承载细节。

| 事实                   | 权威来源                             | 性质           |
| ---------------------- | ------------------------------------ | -------------- |
| 行为要求（应该做什么） | `openspec/specs/`                    | 规范           |
| Agent 常驻规则         | 根 / 子树 `AGENTS.md` 手写区         | 规范           |
| Claude Code 硬约束     | `.claude/rules/`                     | 规范           |
| 架构决策与放弃的备选   | `docs/architecture/DESIGN-RECORD.md` | 规范 + 历史    |
| 架构图的可编辑源       | `docs/architecture/source/*.json`    | 规范           |
| 状态、目录、开发入口   | `README.md`                          | 信息性         |
| 代码实际怎么运行       | 源码 + 测试                          | 事实           |
| 代码结构地图           | `openwiki/`（未来）                  | 描述性、非规范 |
| 架构图生成物           | `interactive/*.html`、`images/*.png` | 派生物         |
| 构建/生成的目录        | `openwiki/`、`.next/`、`dist/`       | 派生物         |

冲突时的优先级：行为意图看 specs，Agent 行为看 AGENTS/rules，原因看 DESIGN-RECORD，实现真相看源码与测试，wiki/图只作参考。

备选方案是把所有事实继续集中到 `AGENTS.md`；放弃，因为它会重新变成手册，并与 `README`、`docs/` 重复。

### 2. `docs/AGENTS.md` 是子树文档，不是第二个根

它只写"归属与保鲜规则"，不写命令、不写工具链、不写包级细节；上限 25 行 / 1,000 非空白字符。根 `AGENTS.md` 用一行链接指向它。

备选方案是把这些规则塞进根文件；放弃，因为根文件会超过预算，而且三层规则混在一起难以维护。

### 3. 预算按"手写区的非空白字符数"计算

- 根 `AGENTS.md`：≤70 行且 ≤3,200 非空白字符（当前 2,565，保留约 25% headroom）。
- 子树 `AGENTS.md`：≤25 行且 ≤1,000 非空白字符。
- 生成块（见决策 4）不计入。
- 超标顺序：下沉 → 压缩 → 最后才调高预算并说明理由。

选择理由：中文字符用 `wc -w` 不可靠；纯行数会把长段落算小。非空白字符数对中英文都稳定，且不惩罚换行。

备选方案：继续只用行数（放弃：无法反映内容量）；用词数（放弃：中文失真）；不设预算（放弃：无法防止缓慢膨胀）。

### 4. 生成块用标记隔离，预算和检查跳过

`AGENTS.md` / `CLAUDE.md` 中可能出现的生成块：

```html
<!-- OPENWIKI:START -->
...
<!-- OPENWIKI:END -->
<!-- BEGIN:nextjs-agent-rules -->
...
<!-- END:nextjs-agent-rules -->
```

规则：

- 只编辑标记之外的内容；标记内部由工具维护。
- 预算、slop 审查和链接检查跳过标记内部。
- `CLAUDE.md` 的 `@AGENTS.md` 指针必须留在标记之外。
- OpenWiki 接入后，`openwiki/` 整体排除在文档预算和手写风格检查之外；`openwiki/INSTRUCTIONS.md`、`.claims/`、`.page-manifest.json` 提交，`.run.json` 不提交。

选择理由：不隔离的话，生成块会顶破预算，或者预算逼着人去删生成内容。备选方案是让工具只写独立文件；放弃，因为 OpenWiki 的实际行为是注入 `AGENTS.md` / `CLAUDE.md`。

### 5. 决策生命周期采用轻量版"状态 + 取代"

`DESIGN-RECORD` 的决策表增加状态约定：

- `已定`：当前有效。
- `已取代`：不再有效，必须在同一行链接到取代它的新决策。
- `待定`：尚未决定。

`openspec/changes/archive/` 中的变更是冻结历史，不作为当前权威。`openspec/specs/` 是行为要求的唯一当前来源。

备选方案是照搬 dsh 的 Agent Notes 树；放弃，因为 OpenSpec changes + DESIGN-RECORD 已经覆盖"为什么/放弃了什么"，再加一层会违反 one home。

### 6. OpenWiki 是描述性证据索引，不是规范

- 页面只描述代码现实，引用源码行作为证据；不能覆盖 specs、AGENTS 或 DESIGN-RECORD。
- 页面是可选上下文，不是启动必读。
- 页面或 brief 中的未知项是验证缺口，不是需求。
- `openwiki/INSTRUCTIONS.md` 是生成策略的唯一 home；接入时写"只描述代码结构与契约，不复述规范"。
- 刷新是定时 PR，属于 eventually fresh；大架构变更后手动触发一次。

备选方案是把 wiki 当作文档源；放弃，因为它会与 specs、AGENTS 形成两份真相。

### 7. 本变更不引入脚本或 CI

预算和规则先手动执行；等 lint/CI 恢复后，再用一个 `docs:check` 组合链接、锚点、生成物新鲜度和版本/命令一致性。现在写脚本没有执行点，只会成为另一个会腐烂的工件。

## Risks / Trade-offs

- [`docs/AGENTS.md` 变成第二个根文件] → 25 行 / 1,000 字符上限，只放权威表与归属规则；根文件只链接。
- [生成块标记被误编辑] → "编辑本文件"明确禁止；生成块由工具重建；评审检查标记完整性。
- [OpenWiki 尚未接入，规则可能过时] → 规则只写稳定事实（生成物、非规范、排除项）；接入时在变更中复核。
- [`DESIGN-RECORD` 状态列被遗忘] → 决策变更时与 specs/代码同一变更更新；评审检查 `已取代` 是否有链接。
- [字符预算没有脚本，靠人工] → 先手动；CI 恢复后用 `docs:check` 机械校验，口径不变。
- [预算过紧导致删规则] → 3,200 字符保留约 25% headroom；超标先下沉/压缩，最后才调高。

## Migration Plan

纯文档变更，无运行时迁移。回滚方式是还原 `docs/AGENTS.md`、`AGENTS.md`、`DESIGN-RECORD.md`、`README.md`。不涉及依赖或 lockfile。

## Open Questions

无。
