# Design

## Context

参见 `proposal.md` 的 Why。当前约束：

- 根 `AGENTS.md` 107 行 / 5,689 字符，其中约一半是状态、目录树、包级细节和可发现知识。
- `README.md` 与 `docs/architecture/README.md` 已经承载目录、开发命令和 Archify 规则，根文件存在重复。
- `.claude/rules/*.md` 在本仓库的 Claude Code 会话中会自动加载，但只读 `AGENTS.md` 的其他 Agent 看不到它们。
- dsh（`deepseek-harness`）的根 `AGENTS.md` 采用"常驻命令（standing orders）"模式：每条规则 1–3 行，细节链接到唯一归属地；子树 `AGENTS.md` 只写补充规则。
- 仓库仍处于骨架期，lint、测试、CI 刻意延后，不能依赖自动化门禁来防止文档膨胀。

## Goals / Non-Goals

**Goals：**

- 把根文件收缩为跨包、稳定、不读会做错的规则集合，目标 45–55 行。
- 建立可复用的归属规则：一条规则只有一个 home，其他位置只链接。
- 为后续每个包/目录扩张 `AGENTS.md` 提供明确契约和行数上限。
- 让 Git 与注释约束对非 Claude Agent 也可见。
- 消除已确认的事实与配置漂移。

**Non-Goals：**

- 不引入 dsh 的完整文档层级（Agent Notes、postmortems、cookbook、subsystems）。
- 不在本变更中创建占位包的 `AGENTS.md`。
- 不接入 `verify-doc-budgets` 之类的文档门禁；等 CI 恢复后再评估。
- 不改变任何应用代码、协议或运行时行为。

## Decisions

### 1. 根文件采用 standing-orders 结构

根 `AGENTS.md` 按以下顺序组织：定位与设计记录指针、指引分层、阶段策略、常用命令、仓库约定、依赖与工具链、OpenSpec、架构不变量、工作约束、编辑本文件。

选择理由：dsh 的模式已经被验证，且与"每条规则自包含 + 链接 home"一致。备选方案是保留现有结构只做措辞压缩；放弃，因为它没有建立归属规则，下一次加包时还会膨胀。

### 2. 子树文档是补充，不是副本

根文件写明契约：`apps/*`、`packages/*`、`docs/`、`infra/` 可拥有自己的 `AGENTS.md`，以"补充根文件的规则"开头，不重复根规则，通常不超过 25 行；`CLAUDE.md` 只写 `@AGENTS.md`。当前占位包不创建空文件，包首次实现时落地。

选择理由：这直接对应"每个包都会增加东西"的预期，把增量约束限制在本地。备选方案是每个包现在就建占位文档；放弃，因为占位内容会立刻腐烂。

### 3. 用行数预算代替字数门禁

根文件预算 70 行、子树 25 行，先写入"编辑本文件"段落并手动执行。dsh 用词数预算，但中文字数用 `wc -w` 不可靠，且我们还没有 CI。

超标处理顺序固定为：下沉（relocate）→ 压缩（condense）→ 最后才调高预算并在变更说明中给出理由。

### 4. 规则可见性用"一行规则 + 指针"

在根文件新增"工作约束"段，复述三条硬约束并链接 `.claude/rules/`：Git 写操作禁令、注释规范、完成前验证。

备选方案是把两份规则全文复制进 `AGENTS.md`（放弃：根文件重新膨胀，且会产生两份真相），或在根文件用文件包含语法引用规则（放弃：不是所有读取 `AGENTS.md` 的工具都支持）。

### 5. git.md 改为"白名单只读 + 默认禁止写"

明确列出允许的只读命令：`status`、`diff`、`log`、`show`、`branch`、`ls-files`、`blame`、`grep`、`rev-parse`、`remote -v`。其余命令默认不执行；`switch -c`、`add`、`commit`、`push`、`reset`、`clean`、`restore`、`stash`、`rebase`、`merge`、`pull` 都只在用户当次明确要求时执行。禁止 `--no-verify`，除非用户当次明确要求。

选择理由：现有 "add/commit/push/tag 等" 的枚举漏掉了更危险的破坏性命令，且"等"无法约束新命令。备选方案是继续枚举禁止项；放弃，因为永远列不全。

### 6. comments.md 改为"少而准 + 可执行要求"

- 原则从"多而干净"改为"该写的必须写，不该写的一条都不写"。
- 导出符号（尤其 `packages/*`）使用 TSDoc，说明协议语义、不变量和兼容性约束。
- `@ts-expect-error`、`eslint-disable`、`as any` 等压制型语句必须写明理由和移除条件。
- TODO 只允许带归属与退出条件的形式，例如 `TODO(#123): 原因 + 移除条件`。
- 过时注释按缺陷处理；改实现时同步改注释。

备选方案是维持现有措辞；放弃，因为"多而干净"会被模型读成"多写"，而模型的主要失败模式是注释过量。

### 7. 配置漂移按"版本事实"修正

- `@types/node`：根 `package.json` 改为 `catalog:dev`；catalog 值改为 `^24.19.2`，与 Node 24 和当前已安装版本一致。约定随之写明：`@types/node` 的主版本跟随 Node 主版本。
- `@fission-ai/openspec`：catalog 值改为精确 `1.14.3`，与"固定"表述一致。
- CI：根文件只保留"骨架期延后"的阶段策略；CI 规划继续留在 `docs/`，并注明是规划而非现状。
- `interactive/*.html`：继续随仓库提交（当前没有 CI 生成流程，HTML 是架构文档的查看面），同步删除设计记录中"建议只提交 source + images"的未决表述。

## Risks / Trade-offs

- [根文件删减导致非 Claude Agent 缺少背景] → 保留"规则 + 链接"，新增工作约束段；关键不变量仍留在根文件。
- [子树文档各自膨胀或重复根规则] → 在根文件写死契约与 25 行预算，并在"编辑本文件"中要求先压缩后扩张。
- [行数预算过于粗糙，可能误伤必要的长规则] → 预算先作为提示而非门禁；超标时要求说明理由，等 CI 恢复后再考虑脚本化。
- [`@types/node` 从 `^26.6.5` 降到 `^24.19.2` 可能影响未来升级] → 写明"主版本跟随 Node 主版本"的规则，升级 Node 时同步升级。
- [精确固定 openspec 版本增加升级维护成本] → 与现有 Node/pnpm/TS 固定策略一致；升级时 catalog 与全局版本一起改。
- [继续提交 interactive HTML 增大仓库体积] → 接受现状；等 CI 能生成 HTML 时再重新评估是否取消跟踪。

## Migration Plan

纯文档与配置变更，无运行时迁移。回滚方式为还原对应文件；catalog 调整需要重新执行 `pnpm install` 以更新 lockfile。

## Open Questions

无。
