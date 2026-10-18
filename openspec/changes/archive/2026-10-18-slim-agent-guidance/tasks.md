# Tasks

## 1. 重写根 AGENTS.md

- [x] 1.1 按 standing-orders 骨架重写 `AGENTS.md`：定位与设计记录指针、指引分层、阶段策略、常用命令、仓库约定、依赖与工具链、OpenSpec、架构不变量、工作约束、编辑本文件。验证：逐段 `grep` 标题，确认十个段落齐全。
- [x] 1.2 删除根文件中的阶段状态、目录树、包级实现细节、OpenSpec 命令清单和重复的 Archify 规则；把状态与目录留在 `README.md`，把 Archify 与生成物规则留在 `docs/architecture/README.md`，把包级细节留给包文档。验证：`grep` 不到已删除内容，且每个被删主题在目标文件中存在对应说明。
- [x] 1.3 写入包级文档契约：`apps/*`、`packages/*`、`docs/`、`infra/` 的 `AGENTS.md` 以"补充根文件的规则"开头，不重复根规则，通常不超过 25 行；当前占位包不创建空文件。验证：根文件中可检索到该契约的三项要求。
- [x] 1.4 写入"编辑本文件"元规则：规则自包含并链接细节，先下沉、再压缩、最后才扩预算；根文件上限 70 行。验证：`wc -l AGENTS.md` 输出不超过 70。
- [x] 1.5 新增"工作约束"段，各 1 行覆盖 Git 写操作禁令、注释规范、完成前验证，并链接 `.claude/rules/git.md` 与 `.claude/rules/comments.md`。验证：三条约束均存在，链接目标文件存在。

## 2. 修订 .claude/rules

- [x] 2.1 将 `git.md` 改为"只读白名单 + 默认禁止写操作"：列出允许的只读命令（`status`、`diff`、`log`、`show`、`branch`、`ls-files`、`blame`、`grep`、`rev-parse`、`remote -v`），并明确 `switch -c`、`add`、`commit`、`push`、`reset`、`clean`、`restore`、`stash`、`rebase`、`merge`、`pull` 仅在用户当次明确要求时执行。验证：文件中可检索到白名单与全部禁止项。
- [x] 2.2 在 `git.md` 中加入 `--no-verify` 禁令，并链接 Conventional Commits 与 `pnpm lint:commit`。验证：禁令与链接均存在，且命令与 `AGENTS.md` 中的写法一致。
- [x] 2.3 将 `comments.md` 的原则改为"该写的必须写，不该写的一条都不写"，并补充：导出符号使用 TSDoc；`@ts-expect-error` / `eslint-disable` / `as any` 必须写明理由与移除条件；TODO 只允许带归属和退出条件；过时注释按缺陷处理。验证：五项要求均可在文件中检索到。

## 3. 修正配置漂移

- [x] 3.1 将根 `package.json` 的 `@types/node` 改为 `"catalog:dev"`，并将 catalog 中 `@types/node` 的值调整为 `^24.19.2`。验证：`pnpm install` 成功，lockfile 中 `@types/node` 解析为 24.19.x。
- [x] 3.2 将 catalog 中 `@fission-ai/openspec` 改为精确 `1.14.3`。验证：`pnpm install` 后 `pnpm exec openspec --version` 输出 `1.14.3`，且 catalog 中该行为精确版本。
- [x] 3.3 统一 CI 与生成物口径：根文件只保留"骨架期延后"的策略并注明 CI 规划位于 `docs/`；在仓库约定中写明 `interactive/*.html` 随仓库提交、不手改；删除 `DESIGN-RECORD.md` 第 9 节中"建议只提交 source + images"的未决表述。验证：`grep` 三处相关表述，确认不再互相矛盾。

## 4. 集成验证

- [x] 4.1 运行 `pnpm typecheck` 和 `pnpm build`，确认通过；若某任务尚未配置脚本，记录实际输出而不是跳过。
- [x] 4.2 运行 `openspec validate slim-agent-guidance`，确认变更校验通过。
- [x] 4.3 统计根文件规模并抽查链接：`wc -l AGENTS.md` 不超过 70 行，所有相对链接目标存在。

## Workflow follow-up

- 由用户检查工作区改动并自行提交；本项目规则不允许 Agent 自行 `git add` / `commit` / `push`。
- 评审通过后运行 `/opsx:archive` 归档该变更。
