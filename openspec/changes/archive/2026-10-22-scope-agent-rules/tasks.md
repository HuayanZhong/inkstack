# Tasks

## 1. 检查器

- [x] 1.1 在 `scripts/check-agent-docs.mjs` 增加规则扫描、frontmatter 解析与 `ALWAYS_ON_RULES` 白名单校验；验证：`node scripts/check-agent-docs.mjs --self-test` 覆盖“无 paths 且未登记”“空 paths”“白名单缺理由”并通过
- [x] 1.2 增加路径范围规则的可发现性校验：规则路径必须出现在至少一个 `AGENTS.md` 中；验证：`--self-test` 覆盖“已链接”“未链接”“常驻豁免”并通过
- [x] 1.3 在检查器输出中加入规则统计（always-on / scoped 数量），并补充对应自检；验证：`--self-test` 全部通过，且输出格式包含 `rule(s)` 统计

## 2. 规则迁移

- [x] 2.1 给 `.claude/rules/testing.md` 增加 `paths:` frontmatter（测试目录、`*.test.ts(x)`、`vitest.config.ts`、`tsconfig.test.json`）；验证：检查器识别为非空 paths，且不再报告该文件
- [x] 2.2 给 `.claude/rules/env.md` 增加 `paths:` frontmatter（`env.ts`、`config/**`、`turbo.json`、`next.config.ts`、`.env*`）；验证：检查器识别为非空 paths
- [x] 2.3 给 `.claude/rules/agent-docs.md` 增加 `paths:` frontmatter（`AGENTS.md`、`CLAUDE.md`、`.claude/rules/**`）；验证：检查器识别为非空 paths
- [x] 2.4 在检查器的常驻白名单登记 `cli-first.md`、`git.md`、`comments.md` 并写明理由；验证：`node scripts/check-agent-docs.mjs` 输出 0 error，统计为 3 always-on / 3 scoped

## 3. 文档与度量

- [x] 3.1 在 `.claude/rules/agent-docs.md` 增加“加载范围”说明：规则默认按路径加载，常驻必须登记并写理由，根 `AGENTS.md` 保留一行指针；验证：内容与 design.md 的 D1 / D2 一致
- [x] 3.2 测量常驻规则的迁移前后字符数并记录；验证：迁移后常驻规则合计 ≤4,300 个非空白字符，结果写入完成说明

## 4. 集成验证

- [x] 4.1 运行 `pnpm check:docs`，确认 0 error，且 6 条规则被正确分类；验证：输出包含 `3 always-on, 3 scoped`
- [x] 4.2 运行 `pnpm verify`，确认完整门禁通过；验证：命令以 0 退出，并报告实际输出
- [x] 4.3 运行 `openspec validate scope-agent-rules --strict`；验证：校验通过，无 warning

## Workflow follow-up

- 修复完成、评审通过后归档本变更，并把 `agent-guidance` 的新增 requirement 同步到主 spec。
