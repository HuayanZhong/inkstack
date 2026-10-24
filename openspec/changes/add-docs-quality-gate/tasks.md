# Tasks

## 1. README 检查器

- [x] 1.1 在 `scripts/check-agent-docs.mjs` 增加 README 收集与文档类型分类（根、包索引、包、应用、专题），验证 `node scripts/check-agent-docs.mjs --self-test` 覆盖分类用例并通过。
- [x] 1.2 实现索引一致性规则：根 README 目录树与 `packages/README.md` 表对 `apps/*`、`packages/*` 双向比对；在 `--self-test` 增加漏项、多列、一致三个 fixture，验证自测通过。
- [x] 1.3 实现结构与引用规则：H1、命令/使用/运行/相关文档章节、空章节与占位、相对链接、反引号路径、fenced code 命令、端口、exports 子路径；为每条规则补失败与通过 fixture，验证自测通过。
- [x] 1.4 修改根 `check:docs` 脚本为先跑自测再跑真实检查；验证 `pnpm check:docs` 在修复前的文档上报告预期缺失项并以非零状态退出。

## 2. 修复现有文档

- [x] 2.1 根 README 的 `packages/` 目录树补 `api-client/`；验证 `pnpm check:docs` 不再报告根索引缺失。
- [x] 2.2 `packages/README.md` 索引表补 `api-client`、`ui`、`vitest-config` 及作用与产物；验证索引规则通过。
- [x] 2.3 `packages/AGENTS.md` 目录清单补 `api-client/`、`ui/`；验证 `pnpm check:docs` 通过且 AGENTS 手写区未超预算。
- [x] 2.4 `packages/tsconfig/README.md` 增加“命令”章节，写入 `pnpm --filter @inkstack/tsconfig publint`；验证必备章节规则通过。

## 3. 规则归属与 CI 文档

- [x] 3.1 在 `docs/AGENTS.md` 权威表登记 `documentation-quality` 为 README 检查的规范 home，并在 `.claude/rules/agent-docs.md` 用一句摘要加链接指向；验证 `pnpm check:docs` 通过且没有重复子句 warning。
- [x] 3.2 更新 `docs/ci-cd.md` 中 `check:docs` 的职责描述，说明同时检查 README 与 AGENTS；确认没有新增 workflow 或 secret，`ci-static.yml` 仍只调用 `pnpm check:docs`。
- [x] 3.3 确认 `check:manifests` 只保留文档三件套的存在性检查，README 内容规则只在 `check:docs` 中实现；验证 `pnpm check:manifests` 通过且没有重复规则。

## 4. 集成验证

- [x] 4.1 运行 `pnpm check:docs` 与 `pnpm check:manifests`，确认自测、README 规则与包清单检查全部通过。
- [x] 4.2 运行 `pnpm verify` 并报告实际输出，确认 lint、typecheck、测试、构建、format 与 hygiene 全部通过。

## Workflow follow-up

- 实现完成后归档本变更。
- `packages/ui/README.md` 的 postcss 指引、根 README 的 `pnpm dev` 描述、`vitest-config` 的预设归属等语义问题另起修复或本地 agent 审查，不并入本变更。
