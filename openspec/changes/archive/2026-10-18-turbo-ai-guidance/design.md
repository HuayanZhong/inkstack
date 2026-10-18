# Design

## Context

- 仓库安装 `turbo@2.11.9`；本地 `schema.json` 已包含根级 `agentGuidance` 与 `Pipeline.description`，原生二进制包含 `<!-- BEGIN:turborepo-agent-rules -->` 标记与 `docs/README.md` 引用。
- `node_modules/turbo/docs/` 随包分发，含 `README.md`、`index.mdx`、`reference/`、`crafting-your-repository/` 等，与安装版本一致。
- `pnpm exec turbo docs "<query>"` 可用，返回 `v2-11-9.turborepo.dev` 的版本化链接；文档站支持在 URL 后加 `.md`。
- 根 `AGENTS.md` 有手写区预算（≤70 行、≤3,200 非空白字符），并已规定工具维护的标记块不参与预算与链接检查。
- `.claude/skills` 是指向 `../.agents/skills` 的软链；`.agents/skills/` 存放 OpenSpec 生成的技能，没有安装 `skills` CLI。
- oxfmt 覆盖全仓库 Markdown，包括根 `AGENTS.md`；turbo 会在检测到 `CLAUDE_CODE` 等 agent 环境变量时改写自己的托管块。

## Goals / Non-Goals

**Goals:**

- 让 Agent 在改动 `turbo.json`、任务编排或 CLI 用法前，能读到与安装版本精确匹配的文档，而不是依赖训练数据。
- 让任务语义在 `turbo.json` 内自解释，不需要读各包 scripts。
- 保持零运行时依赖、零行为变化；所有新增内容都有唯一 home。
- 托管块与格式化工具有确定的先后关系，重复执行不产生 diff。

**Non-Goals:**

- 不自动初始化或升级 `turbo.json`，不引入 `turbo generate`。
- 不接入 Remote Cache、`boundaries` / `tags`、`env` / `globalEnv`。
- 不安装 `skills` CLI，不建立技能更新流程。
- 不复制 `llms.txt` 或在线文档到仓库。

## Decisions

### 1. 使用 `agentGuidance` 托管块，而不是手写一段说明

- 在根 `turbo.json` 设置 `"agentGuidance": true`，由 turbo 自己写入并刷新 `AGENTS.md` 的标记块。
- 替代方案：手写「请阅读 node_modules/turbo/docs」段落。拒绝原因：版本升级后需要人工维护，且无法保证与安装版本同步。
- 替代方案：只在 `docs/toolchain.md` 记录。拒绝原因：Agent 不会主动读该文档，托管块的价值在于「常驻上下文」。
- 托管块归 turbo 所有；我们只保证它被提交，并在预算规则中排除。解释性内容放 `docs/toolchain.md`，不重复块内文字。

### 2. 版本匹配文档以 bundled docs 为唯一事实源

- 托管块与 Skill 都指向 `node_modules/turbo/docs/README.md`；`turbo docs` 只作为联网检索入口记录在文档里。
- 不缓存文档副本进仓库：副本会与安装版本脱节，且 `node_modules` 已由 pnpm 保证版本一致。
- 不把 `turbo docs` 写进 `AGENTS.md` 手写区，避免预算膨胀；它属于 `docs/toolchain.md` 的命令清单。

### 3. vendor Skill，而不是运行 `npx skills add`

- 直接把上游 `skills/turborepo/SKILL.md`（约 30 行，无脚本、无资源）放到 `.agents/skills/turborepo/SKILL.md`。
- 替代方案：`npx skills add vercel/turborepo`。拒绝原因：CLI 默认写入 `./<agent>/skills/`，与我们「`.agents/skills` 为唯一副本 + `.claude/skills` 软链」的结构冲突；同时引入一个未纳入 catalog 的临时工具。
- 替代方案：不装 Skill，只保留托管块。拒绝原因：托管块是被动上下文，Skill 提供按话题触发的入口；两者成本都很低。
- 上游更新作为 turbo 升级检查项：升级 turbo 时对照一次 `skills/turborepo/SKILL.md`，内容变化才同步。Skill 本身明确要求「以 bundled docs 为准」，漂移风险低。

### 4. 任务描述使用中文

- `description` 是给人读的语义说明，不是标识符；仓库文档语言为中文，保持一致。
- 替代方案：英文。拒绝原因：同一份 `turbo.json` 里中文描述更利于本仓库评审，模型对两种语言都能理解。
- 描述只写「做什么 + 关键约束」，不复述 `dependsOn` / `outputs`。

### 5. 生成顺序与幂等性验证

执行顺序固定为：

```
改 turbo.json
  -> 在 agent 环境（CLAUDE_CODE 已设置）跑一次 turbo 命令，生成托管块
  -> pnpm format（oxfmt 格式化 AGENTS.md）
  -> 再跑一次 turbo 命令
  -> git diff --exit-code AGENTS.md
```

- 如果第三步后仍有 diff，说明 oxfmt 与 turbo 对块的排版不一致；此时在块前加 `<!-- prettier-ignore -->`（oxfmt 对非 JS 内容沿用 Prettier 的忽略注释），再重复验证。
- 托管块只在检测到 agent 时刷新；CI 不设置相关变量，因此不会在流水线里产生意外写入。

### 6. 预算规则的归属

- 根 `AGENTS.md` 的「编辑本文件」段落已列出工具维护标记；把 `turborepo-agent-rules` 加入该列表。
- `docs/AGENTS.md` 的「规则」段同样列出标记；同步加入。
- 两处都只加标记名，不解释 turbo 的行为；行为说明在 `docs/toolchain.md`。

## Risks / Trade-offs

- [oxfmt 与 turbo 循环改写托管块] → 用固定顺序验证幂等；不稳定时用 `prettier-ignore` 包住，仍不稳定则把 `AGENTS.md` 从格式范围排除并记录理由。
- [首次生成后未提交，后续每次 turbo 调用都出现脏文件] → 生成后立即纳入本次改动，并在任务中检查 `git status`。
- [fresh clone 在 `pnpm install` 前读不到 bundled docs] → Skill 与托管块都要求先解析 `turbo` 包位置；仓库约定本来就要求先安装依赖。
- [turbo 升级后托管块内容变化，产生一次额外 diff] → 视为预期变更，与 turbo 升级放在同一个提交。
- [vendor 的 Skill 与上游漂移] → 在 turbo 升级检查项中对照上游文件；Skill 只做转发，不承载具体规则。
- [托管块被手动编辑后又被 turbo 覆盖] → 在 `docs/toolchain.md` 明确块归 turbo 所有，只编辑块外内容。
