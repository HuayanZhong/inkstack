# Design

## Context

仓库当前有 13 个 `AGENTS.md` 与 12 个 `CLAUDE.md`，`docs/` 是唯一缺少桥接文件的目录。根文件手写区 3,180 / 3,200 字，`apps/shell` 980 / 1,000，预算几乎耗尽。`pnpm check:manifests` 只校验包清单与 `packages/*` 的文档三件套，不校验 AGENTS 的结构、预算、链接与事实。

Claude Code 只原生加载 `CLAUDE.md`，Codex 等工具原生读取 `AGENTS.md`；两种加载方式必须同时成立。工具维护块（turborepo / nextjs）会重写自身内容，不能计入预算或参与去重。约束见 proposal.md 的 Why 与 specs 中的 `agent-guidance`。

## Goals / Non-Goals

**Goals:**

- 13 个指引文件在 Claude Code 与原生 AGENTS 工具下都能按预期加载。
- 每个事实只有一个权威 home，根文件留出至少 10% 预算。
- 结构、事实、冲突、预算由 `pnpm check:docs` 判定失败；重复只告警。
- 用行为探针验证“文档是否真的改变 agent 行为”，而不只靠通读。

**Non-Goals:**

- 不重写全部文档文风，不把“字数最少”当作目标。
- 不把行为探针做成 CI 测试：成本高、结果依赖模型，不适合门禁。
- 不引入 markdown linter 或第二套文档体系。
- 不改变运行时行为、公共 API、依赖与部署。

## Decisions

### D1 优先级阶梯：显式覆盖，而非纯最近优先

agents.md 标准说“最近的文件优先”，仓库原语义是“子树补充根规则”，两者在冲突时结论不同。采用：

```
1. 用户当次指令
2. openspec/specs/（行为）、DESIGN-RECORD.md（架构）
3. .claude/rules/（跨包规则的细节）
4. 根 AGENTS.md（常驻摘要与跨包规则）
5. 子树 AGENTS.md（目录特例）
6. 技能与工具默认
```

子树要覆盖根规则，必须显式写“覆盖根规则：<原因>”；否则视为补充。理由：Canvas 执行器、catalog、完成门禁这类不变量不能被某个子目录静默替换，而局部特例仍需保留。替代方案是纯最近优先，已拒绝：它会让根规则在子树失效，也与现有“补充根文件”的叙述冲突。

### D2 单一归属矩阵

| 事实               | 唯一 home                     | 其他位置允许保留                   |
| ------------------ | ----------------------------- | ---------------------------------- |
| catalog / 版本策略 | `docs/package-metadata.md`    | 根一句指针；子树不写               |
| 测试流程与门槛     | `.claude/rules/testing.md`    | 根一句指针                         |
| env 四个 home      | `.claude/rules/env.md`        | 应用只写本应用特有变量             |
| shadcn 生成与构建  | `packages/ui/AGENTS.md`       | shell 只写“从 `@inkstack/ui` 导入” |
| 完成门禁           | 根一行 `pnpm verify`          | `docs/testing.md` 展开             |
| 架构不变量         | `DESIGN-RECORD.md`            | 根逐字复制，由检查器比对           |
| CI workflow 清单   | `docs/ci-cd.md`               | `.github/AGENTS.md` 只写落位规则   |
| 指引维护与预算     | `.claude/rules/agent-docs.md` | 根与 `docs/AGENTS.md` 各一行指针   |

重复不总是错误：根需要常驻摘要，子树需要本地提醒。允许“一句摘要 + 链接”，禁止完整规则的第二份副本。

### D3 检查器独立成脚本

新增 `scripts/check-agent-docs.mjs`，暴露 `pnpm check:docs`。

- 不并入 `check-manifests`：后者是包清单契约，失败语义与文档检查不同。
- 不依赖外部 markdown linter：需要仓库特有的事实（catalog 版本、scripts、桥接文件）。
- 只使用 Node 内置模块与已声明的 `yaml`；不新增依赖。

判定分级：

| 级别    | 条目                                                                                             |
| ------- | ------------------------------------------------------------------------------------------------ |
| error   | 桥接缺失、桥接内容不纯、预算超限、相对链接失效、引用命令不存在、版本不一致、canonical facts 冲突 |
| warning | 归一化后的规范子句在多个当前文件重复                                                             |

重复只告警，是因为根摘要、指针句和示例命令天然会相似；硬失败会迅速堆出白名单，反而降低信号。

### D4 手写区解析规则

- 以 `<!-- BEGIN:... -->` 与 `<!-- END:... -->` 成对切分，标记块内全部跳过。
- 行数只统计非空行；字符数统计非空白字符（去掉所有 Unicode 空白）。
- 根文件预算 70 行 / 3,200 字；其他层 25 行 / 1,000 字。
- 解析结果与 `docs/AGENTS.md` 的表述保持同一套定义，避免“文档说超了、脚本说没超”。

### D5 Canonical facts 的来源

优先读仓库文件，不把版本写死在脚本里：

- Node：`.nvmrc` 与根 `engines.node`。
- pnpm：根 `packageManager` 与 `devEngines.packageManager.version`。
- TypeScript / openspec：`pnpm-workspace.yaml` 的 `toolchain` catalog。
- 命令：各 `package.json` 的 `scripts`。
- 端口：`.env.example` 的 `*_PORT` 默认值。

无法从文件推断的两条写成脚本常量并注释原因：shadcn 唯一执行方式、完成门禁命令。根“架构不变量”与 `DESIGN-RECORD.md` §3 逐条做归一化比对，解决双写漂移。

### D6 修复顺序与预算迁移

先修事实，再上线检查器，避免首次运行就红：

1. 根完成门禁改为 `pnpm verify`，命令块补 `test` / `verify` / `check:manifests` / `format`。
2. shadcn 唯一命令放进 `packages/ui/AGENTS.md`；shell 与 ui README 改为链接；补“生成后 build”。
3. 新增 `docs/CLAUDE.md`；`docs/AGENTS.md` 补开头句。
4. 修正 `packages/tsconfig/AGENTS.md` 的 `publint` 描述。
5. 根不变量逐字对齐 `DESIGN-RECORD.md` 的 6 条。
6. 预算迁移：根“编辑本文件”（244 字）下沉到 `.claude/rules/agent-docs.md`，根与 `docs/AGENTS.md` 各留一行指针（`docs/AGENTS.md` 已接近 1,000 字，不能承载全文）；“阶段策略”的状态句移到 README；catalog 细节只留指针。目标根文件 ≤2,900 字。
7. 去重：删除各 app / package 中重复的 catalog、TSDoc、dist、workspace 条目；bff 与 gateway 的完全重复句改为链接 `rules/env.md`。
8. README 目录树补 `packages/ui`；`.github/AGENTS.md` 的 workflow 清单改为指向 `docs/ci-cd.md`。

### D7 行为探针

五个只读任务，用新 subagent 执行，只收集它给出的步骤与命令，不修改工作区：

| 探针              | 期望                                                                    | 验证点                    |
| ----------------- | ----------------------------------------------------------------------- | ------------------------- |
| 给 shell 加组件   | 根执行 `-c apps/shell` → 确认写入 `packages/ui/src` → build ui → verify | shadcn 唯一命令与构建步骤 |
| 给 gateway 加 env | `.env.example` → `turbo.json` → `config/env.ts` → 源码只读 config       | env 四个 home             |
| 新增一个包        | 临时目录脚手架 → catalog → 文档三件套 → check:manifests                 | cli-first 与清单检查      |
| 改 CI 检查        | 先查 `docs/ci-cd.md` 落位规则 → 复用 workflow                           | 权威归属                  |
| 完成任务          | 最后跑 `pnpm verify`                                                    | 完成门禁                  |

探针结果用于确认修复是否生效；不进入 CI，也不生成新的常驻文档。

## Risks / Trade-offs

- [重复检测误报] → 只告警；归一化阈值排除短句；首版只把“完整规则副本”计入，指针句不计。
- [canonical facts 硬编码漂移] → 两条常量集中放在脚本顶部并注释来源；其余全部读仓库文件。
- [根不变量双写] → 检查器逐条比对 `DESIGN-RECORD.md`，漂移即失败；`docs/AGENTS.md` 增加同步提醒。
- [文档检查拖慢 verify] → 纯 Node 脚本，毫秒级；只在 verify 与 CI static 各跑一次。
- [过度裁剪删掉有用提醒] → 每行先做删除测试；保留包特有约束与不显然的入口说明，不按字数一刀切。
- [shadcn CLI 行为随版本变化] → 任务中用 `--dry-run` 重新验证；唯一命令只存在一处，改一处即可。

## Migration Plan

1. 完成 P0 事实修复与预算迁移，使现有文档先自洽。
2. 落地 `check-agent-docs`，基线为 0 error；warning 列出待去重项。
3. 逐文件去重，每改一个跑一次 `pnpm check:docs`。
4. 接入 `verify` 与 `.github/workflows/ci-static.yml`。
5. 跑 5 个行为探针，偏差回填为剩余修复任务。

回滚：文档与脚本相互独立；从 `verify` 与 CI 中移除 `check:docs` 即恢复原状，不影响运行时。
