---
paths:
  - '**/AGENTS.md'
  - '**/CLAUDE.md'
  - '.claude/rules/**'
---

# Agent 指引维护

适用于根与各层的 `AGENTS.md`、`CLAUDE.md`，以及指向它们的规则文档。改指引前先读本文件。

## 加载范围

`.claude/rules/` 下的规则默认按 `paths:` 加载；没有 `paths:` 的规则会在每次会话启动时载入。常驻只允许 `cli-first.md`、`git.md`、`comments.md`，并在 `scripts/check-agent-docs.mjs` 的 `ALWAYS_ON_RULES` 中写明理由。新增规则必须声明非空 `paths:`，并在根或子树 `AGENTS.md` 留下链接；`pnpm check:docs` 会校验这两点。

## 优先级

1. 用户当次指令。
2. `openspec/specs/`（行为）与 `docs/architecture/DESIGN-RECORD.md`（架构）。
3. `.claude/rules/` 的跨包规则。
4. 根 `AGENTS.md`。
5. 子树 `AGENTS.md`。
6. 技能与工具默认。

子树要覆盖根规则，必须写“覆盖根规则：<原因>”；否则视为补充。技能与工具默认建议与仓库规则冲突时，以仓库规则为准。

## 单一归属

| 事实               | 唯一 home                                        |
| ------------------ | ------------------------------------------------ |
| catalog 与版本策略 | `docs/package-metadata.md`                       |
| 测试流程与门槛     | `.claude/rules/testing.md`                       |
| env 四个 home      | `.claude/rules/env.md`                           |
| shadcn 生成与构建  | `packages/ui/AGENTS.md`                          |
| 完成门禁           | 根 `AGENTS.md` 的 `pnpm verify`                  |
| 架构不变量         | `docs/architecture/DESIGN-RECORD.md`，根逐字同步 |
| CI workflow 清单   | `docs/ci-cd.md`                                  |
| 指引维护与预算     | 本文件                                           |

其他位置只写一句摘要 + 链接，禁止完整规则的第二份副本。

## 预算

手写区：根 ≤70 行且 ≤3,200 非空白字符；子树 ≤25 行且 ≤1,000。行只统计非空行，字符去掉所有空白。`<!-- BEGIN:... -->` 与 `<!-- END:... -->` 标记块不计入。超预算按“下沉 → 压缩 → 扩预算”处理，并在变更说明中给出理由。

## 写什么

- 写：猜不到的命令、非默认风格、测试方式、仓库礼仪、架构决策、环境怪癖。
- 不写：读代码就能知道的结构、标准语言惯例、API 文档、频繁变化的状态、逐文件目录说明、自明建议。
- 每行做删除测试：删掉它，agent 会不会做错？不会就删。
- 文件过长会让规则被忽略；某条规则总被跳过时，先精简文件，再考虑强调。

## 修改流程

- 改 `AGENTS.md` / `CLAUDE.md` 后跑 `pnpm check:docs`。
- 改 `DESIGN-RECORD.md` 的架构约束时，同步根 `AGENTS.md` 的不变量；检查器会逐条比对。
- 新增或修改命令、路径、导出时，同步拥有它的 AGENTS / README；检查器会校验引用存在。
- 新增事实前先查单一归属表；没有 home 时先建 home，再在根留下指针。
