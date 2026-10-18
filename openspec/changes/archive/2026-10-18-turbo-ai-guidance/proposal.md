# Proposal

## Why

Turborepo 的配置项与 CLI 行为随版本变化，而模型训练数据通常停留在旧版本；仓库目前的 `turbo.json` 也没有任何任务描述，AI 与新人必须读每个包的 scripts 才能理解任务语义。官方 AI guide 提供了与已安装版本精确匹配的文档入口，接入成本只有一行配置。

## What Changes

- `turbo.json` 增加 `"agentGuidance": true`，并为 `build`、`dev`、`lint`、`typecheck` 四个任务补 `description`。
- 由 turbo 在根 `AGENTS.md` 自动维护 `<!-- BEGIN:turborepo-agent-rules -->` 托管块；该块指向随包安装的 `node_modules/turbo/docs/README.md`，随版本升级自动刷新。
- 在 `.agents/skills/turborepo/SKILL.md` vendor 上游 Turborepo Skill，使 Agent 在处理 `turbo.json`、缓存、过滤、CI 等话题时能按需加载。不引入 `skills` CLI，不改变现有 `.claude/skills -> ../.agents/skills` 结构。
- `docs/toolchain.md` 新增「Turborepo 与 AI」小节，记录 bundled docs、`turbo docs` 命令与托管块所有权；`AGENTS.md` 与 `docs/AGENTS.md` 的工具维护标记列表加入 `turborepo-agent-rules`。
- 验证 oxfmt 与 turbo 对 `AGENTS.md` 的写入不会产生循环 diff。

明确不在本次范围：husky pre-commit / pre-push（拆分到 `husky-hooks`）、Remote Cache、`boundaries` / `tags`、`env` / `globalEnv`、CI、`llms.txt` 与在线 Markdown 路由。

## Capabilities

### New Capabilities

无。本变更只涉及工具链配置与文档，不改变系统运行时行为，`.openspec.yaml` 已设置 `skip_specs: true`。

### Modified Capabilities

无。

## Impact

- 配置：`turbo.json` 新增根级选项与任务描述。
- 文档：`AGENTS.md`（新增托管块、预算排除标记）、`docs/AGENTS.md`（标记列表）、`docs/toolchain.md`（新增小节）。
- Agent 资源：新增 `.agents/skills/turborepo/SKILL.md`。
- 依赖：无变化，不新增 package。
- 风险：托管块与 oxfmt 的格式化可能互相改写；由任务中的幂等性检查确认。
