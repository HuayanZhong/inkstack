# Design

## Context

Claude Code 在启动时加载 `.claude/rules/` 下没有 `paths:` frontmatter 的规则；有 `paths:` 的规则只在处理匹配文件时加载。当前 6 个规则文件都没有 frontmatter，实测常驻 7,355 个非空白字符。根 `AGENTS.md` 已经为 `testing.md`、`env.md`、`agent-docs.md` 保留了一行指针，因此把详细规则改为按需加载不会失去可发现性。约束与动机见 proposal.md。

## Goals / Non-Goals

**Goals:**

- 规则默认按路径加载，常驻必须显式登记并写明理由。
- 常驻规则从 7,355 字降到约 4,200 字。
- 检查器能阻止“新规则悄悄全量常驻”和“scoped 规则无法发现”两类回归。
- 现有 `AGENTS.md` 预算、`pnpm check:docs` 门禁与运行时行为保持不变。

**Non-Goals:**

- 不引入 `permissions.deny`、TypeScript LSP 插件或 worktree sparse checkout。
- 不拆分 `cli-first.md` 的表格到 skill；那是更大的独立变更。
- 不调整 `AGENTS.md` 的行数或字符预算。
- 不改变规则的规范内容，只改变加载范围与维护约束。

## Decisions

### D1 哪些规则按路径加载

| 规则            | `paths:`                                                                                      | 理由                                               |
| --------------- | --------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| `testing.md`    | `**/test/**`、`**/*.test.ts`、`**/*.test.tsx`、`**/vitest.config.ts`、`**/tsconfig.test.json` | 只在写测试或测试配置时相关                         |
| `env.md`        | `**/env.ts`、`**/config/**`、`**/turbo.json`、`**/next.config.ts`、`**/.env*`                 | 只在改 env schema、配置加载或 turbo 环境声明时相关 |
| `agent-docs.md` | `**/AGENTS.md`、`**/CLAUDE.md`、`.claude/rules/**`                                            | 只在改指引或规则文件时相关                         |

匹配范围故意取宽：宁可多加载一次，也不要因为 glob 太窄而漏掉规则。

### D2 哪些规则保持常驻

| 规则           | 理由                                                               |
| -------------- | ------------------------------------------------------------------ |
| `cli-first.md` | 决定所有任务该用哪个 CLI，必须在读文件前就生效                     |
| `git.md`       | 决定是否允许执行改工作区/分支/历史的命令，必须先于任何 git 操作    |
| `comments.md`  | 适用于所有代码编辑，且只有 736 字；按代码路径 scoping 几乎等于常驻 |

常驻名单放在 `scripts/check-agent-docs.mjs` 的 `ALWAYS_ON_RULES` Map 中，键为相对 `.claude/rules/` 的路径，值为理由。没有单独建配置文件：名单只有 3 条，检查器是唯一消费者，多一个文件反而多一个 home。

### D3 检查器如何判定

新增三类 error：

1. 规则既没有非空 `paths:`，也不在常驻白名单。
2. 常驻白名单条目的理由为空。
3. 有 `paths:` 的规则没有被任何 `AGENTS.md` 以 `.claude/rules/<路径>` 形式链接。

Frontmatter 解析：文件以 `---` 开头时读取到下一个 `---`，用已声明的 `yaml` 解析；`paths` 必须是字符串数组且非空。解析失败按 error 处理，避免坏 frontmatter 被静默忽略。

可发现性检查只扫描 `AGENTS.md`，不扫描 README 或 rules 自身：根与子树 `AGENTS.md` 才是会被加载的指引层。

### D4 为什么不用 skill 替代

规则是规范性约束（“必须”“禁止”），skill 是任务 playbook。把 `testing.md` 改成 skill 会让它在写测试前不一定被加载；路径范围规则可以在触及测试文件时自动进入上下文，更符合约束的语义。`cli-first.md` 的参考表格更适合 skill，但那是独立的后续变更。

### D5 输出与度量

检查器输出增加规则统计：

```text
check-agent-docs: 13 AGENT(s), 6 rule(s) (3 always-on, 3 scoped), 0 error(s), 0 warning(s)
```

常驻字符数由白名单文件求和得到；实现后用同一个测量方式记录迁移前后的值。目标 ≤4,300 字（2,767 + 709 + 736 = 4,212）。

## Risks / Trade-offs

- [按路径加载后，写源码时看不到测试细则] → 根 `AGENTS.md` 保留“运行时代码同变更补测试”的一行约束与规则链接；触及测试文件时规则自动加载。
- [env 规则在改普通源码时未加载] → 根 `AGENTS.md` 保留“端口、host、URL、凭据只通过 env 分发”的一行约束与链接；`**/config/**` 覆盖 schema 与配置入口。
- [glob 太窄导致规则不加载] → 取宽匹配；新增规则先在任务中验证匹配路径，再收紧。
- [frontmatter 写坏被静默忽略] → 解析失败直接 error；自检覆盖空 `paths`、坏 YAML 与白名单缺理由。
- [常驻白名单被滥用] → 每条必须写理由；新增常驻项要在变更说明中给出上下文成本理由。

## Migration Plan

1. 扩展检查器与自检，先在当前仓库跑出 3 条“未声明范围”的预期失败。
2. 给 `testing.md`、`env.md`、`agent-docs.md` 加 frontmatter，登记 3 条常驻规则。
3. 跑 `pnpm check:docs`，确认可发现性与统计输出。
4. 测量常驻规则字符数并记录。
5. 跑 `pnpm verify`。

回滚：删除 frontmatter 与白名单条目、回退检查器改动即可恢复原状；不影响运行时。
