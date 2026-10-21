# Tasks

## 1. 事实修复

- [x] 1.1 把根 `AGENTS.md` 的完成门禁改为 `pnpm verify`，并在命令块补 `test`、`verify`、`check:manifests`、`format`；验证：检索根文件不再出现“只跑 typecheck/build”的完成标准，且四条命令都存在
- [x] 1.2 把 shadcn 唯一执行方式收敛到 `packages/ui/AGENTS.md`（仓库根 + `-c apps/shell`），补“生成后 build `@inkstack/ui`”，shell 与 `packages/ui/README.md` 改为链接；验证：`pnpm dlx shadcn@latest add --dry-run badge -c apps/shell` 的目标仍为 `packages/ui/src/components`，且三处不再出现互斥表述
- [x] 1.3 新增 `docs/CLAUDE.md`（只写 `@AGENTS.md`），并给 `docs/AGENTS.md` 补“补充根文件的规则”开头句；验证：文件内容与开头句符合约定
- [x] 1.4 修正 `packages/tsconfig/AGENTS.md` 关于“不引入依赖或构建脚本”的描述，如实写 `publint`；验证：描述与 `packages/tsconfig/package.json` 的 scripts / devDependencies 一致
- [x] 1.5 让根 `AGENTS.md` 的架构不变量与 `DESIGN-RECORD.md` §3 的 6 条逐字对齐（补实时 WS 直连，统一“单一”措辞，补 BFF 的上传/下载）；验证：逐条人工比对一致
- [x] 1.6 修正 `README.md` 目录树（补 `packages/ui`），并把 `.github/AGENTS.md` 的 workflow 清单改为指向 `docs/ci-cd.md`；验证：目录树与 `ls packages` 一致，`.github/AGENTS.md` 只保留落位规则

## 2. 预算与去重

- [x] 2.1 把根 `AGENTS.md` 的“编辑本文件”下沉到 `.claude/rules/agent-docs.md`，根与 `docs/AGENTS.md` 各保留一行指针；把“骨架阶段”的状态句移到 `README.md`；验证：根手写区降到 2,900 字以内，且规则文件包含完整预算定义
- [x] 2.2 删除各 app / package 中重复的 catalog、TSDoc、`dist`、`workspace` 条目，只保留该目录特有约束；bff 与 gateway 的完全重复句改为链接 `.claude/rules/env.md`；验证：重复规范子句清单明显缩短，`pnpm check:manifests` 仍通过
- [x] 2.3 删除 `apps/shell/AGENTS.md` 中重复的 shadcn 命令与技能提醒，改为指向 `packages/ui/AGENTS.md`；所有应用命令行补 `test`；验证：shell 手写区继续低于 1,000 字，每个应用命令包含 `test`
- [x] 2.4 在 `.claude/rules/agent-docs.md` 写入优先级阶梯、单一归属矩阵与“改 `DESIGN-RECORD.md` 时同步根不变量”的提醒，并统一预算定义（非空行、非空白字符）；`docs/AGENTS.md` 只加链接；验证：内容与 design.md 的 D1 / D2 / D4 一致

## 3. 文档检查器

- [x] 3.1 实现 `scripts/check-agent-docs.mjs`：桥接、结构、预算、相对链接、引用命令、版本文档、canonical facts、根不变量比对与重复子句告警；验证：`node scripts/check-agent-docs.mjs` 在当前仓库输出 0 error，并列出重复告警
- [x] 3.2 为检查器加 `--self-test`，用内存夹具覆盖每条 error 与 warning 规则；验证：`node scripts/check-agent-docs.mjs --self-test` 全部通过
- [x] 3.3 根 `package.json` 增加 `check:docs`，并把它插入 `verify` 的 manifest 之后、typecheck 之前；验证：`pnpm check:docs` 成功，`verify` 脚本包含该步骤
- [x] 3.4 在 `.github/workflows/ci-static.yml` 增加 `pnpm check:docs` 步骤；验证：用 `yaml` 解析该文件成功，且 static job 包含该步骤

## 4. 行为探针

- [x] 4.1 只读探针：让新 subagent 规划“给 shell 加一个组件”；验证：步骤包含根命令、写入 `packages/ui/src`、build ui、最后 verify
- [x] 4.2 只读探针：让新 subagent 规划“给 gateway 加一个 env 变量”；验证：步骤覆盖 `.env.example`、`turbo.json`、`config/env.ts`、源码只读 config 四个 home
- [x] 4.3 只读探针：让新 subagent 规划“新增一个包”；验证：步骤包含临时目录脚手架、catalog、文档三件套、`check:manifests`
- [x] 4.4 只读探针：让新 subagent 规划“修改 CI 检查”；验证：先查 `docs/ci-cd.md` 落位规则，再复用现有 workflow
- [x] 4.5 只读探针：让新 subagent 规划“完成任务”；验证：最后一步是 `pnpm verify`，而不是只跑 typecheck
- [x] 4.6 修复探针暴露的偏差并重跑对应探针；验证：受影响的探针输出与期望一致

## 5. 集成验证

- [x] 5.1 运行 `pnpm check:docs`，确认 0 error，并逐条确认剩余 warning 是允许的指针式复述；验证：输出无 error
- [x] 5.2 运行 `pnpm verify`，确认完整门禁通过；验证：命令以 0 退出，并报告实际输出
- [x] 5.3 运行 `openspec validate audit-agent-docs --strict`；验证：校验通过，无 warning
- [x] 5.4 重新统计 13 个 `AGENTS.md` 的手写区，记录根与各子树的行数/字符数；验证：根 ≤2,900 字，所有子树 ≤1,000 字，结果写入完成说明

## Workflow follow-up

- 修复完成、评审通过后归档本变更，并把 `agent-guidance` 与 `repository-hygiene` 的 delta 同步到主 specs。
