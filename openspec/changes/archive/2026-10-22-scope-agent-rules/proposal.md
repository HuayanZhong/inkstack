# Proposal

## Why

`.claude/rules/` 下的 6 个规则文件都没有 `paths:` frontmatter。按 Claude Code 的加载规则，这类规则在每次会话启动时全部载入，共 7,355 个非空白字符；而它们大多只在特定任务中才相关。刚完成的文档审计只统计了 `AGENTS.md` 的预算，没有覆盖这部分常驻上下文，也没有机制防止以后新增规则继续全量常驻。

## What Changes

- 给 `testing.md`、`env.md`、`agent-docs.md` 增加 `paths:` frontmatter，改为在匹配文件时按需加载。
- 保留 `cli-first.md`、`git.md`、`comments.md` 常驻，并在检查器中登记为“常驻白名单”，每条写明理由。
- 扩展 `scripts/check-agent-docs.mjs`：
  - 每个 `.claude/rules/*.md` 必须有非空 `paths:`，或在常驻白名单中且带理由；
  - 每条路径范围规则必须被至少一个 `AGENTS.md` 以相对路径链接，避免按需加载后无法发现；
  - 新增对应自检夹具。
- 在 `.claude/rules/agent-docs.md` 补记加载模型：规则默认按路径加载，常驻必须登记，根文件保留一行指针。
- 实测常驻规则从 7,355 字降到约 4,200 字；不改变 `AGENTS.md` 预算、运行时行为、依赖或 CI 结构。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `agent-guidance`: 新增“规则必须显式声明加载范围”与“路径范围规则必须可发现”两条 requirement，并扩展文档检查的失败条件；现有 6 条 requirement 不变。

## Impact

- 规则：`.claude/rules/testing.md`、`.claude/rules/env.md`、`.claude/rules/agent-docs.md` 增加 frontmatter；`cli-first.md`、`git.md`、`comments.md` 进入常驻白名单。
- 检查器：`scripts/check-agent-docs.mjs` 增加规则清单解析、白名单与可发现性校验及自检。
- 文档：`.claude/rules/agent-docs.md` 更新维护说明；根 `AGENTS.md` 已有指向这三条规则的链接，无需新增。
- 门禁：`pnpm check:docs` 已在 `pnpm verify` 与 `ci-static.yml` 中，无新增接线。
- 不涉及运行时源码、公共 API、依赖版本、部署配置。无 **BREAKING** 变更。
