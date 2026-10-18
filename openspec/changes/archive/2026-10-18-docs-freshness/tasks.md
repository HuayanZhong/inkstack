# Tasks

## 1. 新增 docs/AGENTS.md

- [x] 1.1 创建 `docs/AGENTS.md`，写入六项内容：权威表、一条事实一个 home、当前状态而非变更历史、生成物规则、生成块标记规则、决策生命周期与 OpenWiki 定位。验证：文件存在，行数 ≤25，非空白字符 ≤1,000，六项均可检索到。
- [x] 1.2 确认 `docs/AGENTS.md` 不重复根文件的命令、依赖和包级细节。验证：`grep` 不到 `pnpm install`、`catalog:dev`、`turbo.json` 等根文件专属内容。

## 2. 更新根 AGENTS.md

- [x] 2.1 在"指引分层"或"编辑本文件"中加入指向 `docs/AGENTS.md` 的链接。验证：链接目标存在，根文件仍 ≤70 行。
- [x] 2.2 在"编辑本文件"中写入生成块规则：`OPENWIKI:START/END`、`nextjs-agent-rules` 由工具维护；预算只统计手写区，根手写区 ≤3,200 非空白字符。验证：规则可检索；`node -e` 统计非空白字符 ≤3,200。
- [x] 2.3 确认根文件没有重新加入目录树、包级状态或 OpenSpec 命令清单。验证：`grep` 不到已删除内容，二级标题仍为九个。

## 3. 补充决策生命周期

- [x] 3.1 在 `DESIGN-RECORD.md` 的决策表附近加入状态约定：`已定 / 已取代 / 待定`；`已取代` 必须链接到新决策；`openspec/changes/archive/` 是冻结历史；`openspec/specs/` 是行为要求的当前来源。验证：四项均可检索到。
- [x] 3.2 检查现有决策行都带合法状态值，没有需要标记为 `已取代` 的条目。验证：逐行扫描决策表，状态列只出现约定值。

## 4. README 状态复查条件

- [x] 4.1 在 `README.md` 的骨架阶段说明中加入复查条件（首个应用落地后重写本段）。验证：句子可检索，且没有把状态复制回根 `AGENTS.md`。

## 5. 集成验证

- [x] 5.1 运行 `pnpm typecheck` 和 `pnpm build`，记录实际输出；只有 `@inkstack/contracts` 配置了脚本时，记录为 1 个成功任务。
- [x] 5.2 运行 `openspec validate docs-freshness`，确认变更校验通过。
- [x] 5.3 复核预算与链接：根 `AGENTS.md` ≤70 行且手写区 ≤3,200 非空白字符；`docs/AGENTS.md` ≤25 行且 ≤1,000 非空白字符；所有相对链接目标存在。
- [x] 5.4 确认本变更没有安装 OpenWiki、没有修改 `.gitignore`、没有新增脚本或 CI。验证：`git status` 中没有相关文件，`package.json` 与 `.github/` 未变化。

## Workflow follow-up

- 由用户检查工作区改动并自行提交；本项目规则不允许 Agent 自行 `git add` / `commit` / `push`。
- 评审通过后运行 `/opsx:archive` 归档该变更。
