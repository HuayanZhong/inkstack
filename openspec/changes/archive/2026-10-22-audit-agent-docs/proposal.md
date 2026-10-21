# Proposal

## Why

仓库有 13 个 `AGENTS.md` 与 12 个 `CLAUDE.md`，单篇质量不差，但跨文件已经出现结构性失真：同一事实有多个 home、相邻文件给出互斥命令、最该加载的 `docs/AGENTS.md` 对 Claude Code 不可达，而预算与链接检查只写在文档里、没有对应脚本。结果是 agent 按根文件的完成标准自检后会 push 失败，按 shell 的 shadcn 指引会从错误目录执行。刚完成的 shadcn 变更把根文件推到 3,180 / 3,200 字，继续新增包或应用只会放大重复与漂移。

## What Changes

- 确定“一个事实一个 home”的归属矩阵与统一的优先级阶梯：用户当次指令 > specs / 决策记录 > 根规则 > 子树规则 > 技能默认；子树要覆盖根规则必须显式声明。
- 修复会直接导致错误行为的事实冲突：
  - 把根文件的完成门禁改为 `pnpm verify`，与 pre-push 和 spec 一致。
  - 统一 shadcn 的唯一执行方式（仓库根 + `-c apps/shell`），并补生成后构建 `@inkstack/ui` 的步骤。
  - 新增 `docs/CLAUDE.md`，让 `docs/AGENTS.md` 可被 Claude Code 加载；补齐约定的开头句。
  - 修正 `packages/tsconfig/AGENTS.md` 关于“不引入依赖或构建脚本”的错误描述。
  - 让根文件的架构不变量与 `DESIGN-RECORD.md` 逐条对齐（补回实时 WS 直连，统一措辞）。
- 消除重复：catalog、测试、env、shadcn、CI workflow 清单下沉或改为链接；根文件的“编辑本文件”规则下沉到 `docs/AGENTS.md`，释放预算；状态信息只留在 `README.md`。
- 补齐命令与目录事实：根命令块加入 `test`、`verify`、`check:manifests`、`format`；每个应用命令加入 `test`；README 目录树补 `packages/ui`。
- 新增 `scripts/check-agent-docs.mjs` 与 `pnpm check:docs`：校验结构、CLAUDE 桥接、手写区预算、相对链接、被引用命令与路径存在、canonical facts（版本 / 端口 / 关键命令）；重复子句只告警。接入 `pnpm verify` 与 CI static。
- 建立一次性行为探针：五个只读任务（加组件、加 env、加包、改 CI、完成任务），以 agent 实际给出的步骤检验文档效果，结论写入设计记录，不进入自动化测试。
- 不改变任何运行时行为、公共 API、依赖或部署方式。

## Capabilities

### New Capabilities

- `agent-guidance`: 约束仓库内 agent 指引文件的可加载性、单一归属、预算、事实准确性与自动校验，覆盖根与各层 `AGENTS.md` / `CLAUDE.md` 的维护规则。

### Modified Capabilities

- `repository-hygiene`: “推送前执行检查”枚举的 `pnpm verify` 覆盖范围新增 agent 文档检查，保证文档约束与代码检查走同一道门禁。

## Impact

- 文档：根 `AGENTS.md`、`README.md`、`docs/AGENTS.md`、`docs/toolchain.md`、`apps/shell/AGENTS.md`、`apps/canvas/AGENTS.md`、`apps/bff/AGENTS.md`、`apps/gateway/AGENTS.md`、`packages/AGENTS.md`、`packages/*/AGENTS.md`、`packages/ui/README.md`，新增 `docs/CLAUDE.md`。
- 工具：新增 `scripts/check-agent-docs.mjs`；根 `package.json` 增加 `check:docs`；`verify` 与 `.github/workflows/ci-static.yml` 增加该步骤。
- 规格：新增 `openspec/specs/agent-guidance/spec.md`；`repository-hygiene` 的检查范围更新。
- 不涉及运行时源码、数据库、依赖版本与部署配置。无 **BREAKING** 变更。
