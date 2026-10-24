# Design

## Context

现有 [scripts/check-agent-docs.mjs](../../../scripts/check-agent-docs.mjs) 已经负责 AGENTS.md 的结构、预算、链接、命令、端口、版本与重复子句检查，并提供 `--self-test`。它通过 `loadFacts()` 读取根 `package.json`、`pnpm-workspace.yaml`、`.env.example` 与各包 `package.json`，因此“workspace 包清单、脚本、端口”这些事实已经有现成的单一来源。

`pnpm check:docs` 已在 [ci-static.yml](../../../.github/workflows/ci-static.yml) 中执行，`pnpm verify` 也会调用；本变更不需要新增 workflow 或 secret。README 目前只由 `check-manifests` 检查“文件存在”，没有任何内容或引用约束。

## Goals / Non-Goals

**Goals:**

- 用确定性规则发现 README 索引漂移、标题不匹配、必备章节缺失、失效引用与命令。
- 复用现有 `check:docs` 入口和事实加载逻辑，不引入新依赖或新 CI job。
- 让新增规则有 fixture 自测，避免检查器本身成为不可验证的脚本。

**Non-Goals:**

- 不引入 LLM/agent 审查；语义准确性、状态句过时、文档与代码矛盾留给后续本地审查或独立变更。
- 不引入 prose linter、markdownlint、外部链接检查器或新测试框架。
- 不自动生成 README 索引；索引仍手写，由检查器保证完整。
- 不修改分支保护或新增 required check。

## Decisions

### 1. 扩展现有检查器，而不是新建脚本

在 `scripts/check-agent-docs.mjs` 中增加 README 收集与规则，复用 `loadFacts`、`evaluateLink`、`evaluateCommand`、`evaluatePort` 和 `runSelfTest`。

备选方案：

- 新增 `scripts/check-readmes.mjs`：职责更纯，但会复制链接、路径、命令、端口扫描逻辑，并增加一个命令与 CI step。
- 引入 `remark-validate-links` 或 `lychee`：能查链接，但查不了 workspace 索引、包名、命令、端口与 exports 子路径，仍需自建检查。

当前规模下，扩展单脚本的成本最低；规则多到脚本难维护时，再把公共函数抽到 `scripts/lib/`。

### 2. 按文档类型套用不同规则

| 类型        | 匹配                   | 检查                                      |
| ----------- | ---------------------- | ----------------------------------------- |
| 根 README   | `README.md`            | 目录索引、`目录`/`开发`/`文档` 章节、引用 |
| 包索引      | `packages/README.md`   | 包索引、引用                              |
| 包 README   | `packages/*/README.md` | H1、命令与使用章节、引用、exports 子路径  |
| 应用 README | `apps/*/README.md`     | H1、`运行`/`相关文档` 章节、引用          |
| 专题 README | `docs/**/README.md`    | 只查引用，不查包名与章节                  |

`docs/architecture/README.md` 是专题文档，不套用包 README 规则，避免把架构说明误判为缺章节。

### 3. 索引以 workspace 目录为唯一事实源

`loadFacts()` 已经能枚举含 `package.json` 的 `apps/*` 与 `packages/*`。检查器把它作为期望集合：

- 根 README：解析 `## 目录` 后的 fenced block，收集 `apps/<dir>/` 与 `packages/<dir>/`。
- `packages/README.md`：解析表格行里的 `](<dir>/)` 链接，收集包目录。
- 双向比较：缺失和多列都报错，并给出具体条目。解析不到索引时直接失败，不静默跳过。

备选方案：生成索引。生成能彻底消除漂移，但会把 README 变成生成物，影响手写说明与评审；当前先用检查器强制，等索引规则稳定后再评估生成。

### 4. README 引用检查复用现有规则，并补 fenced code 命令扫描

- 相对链接、反引号路径沿用现有 `evaluateLink`。
- 命令检查新增 fenced code 提取：README 的 `pnpm --filter @inkstack/<pkg> <script>` 多写在代码块里，现有只扫描行内反引号的逻辑覆盖不到。提取时去掉行尾 `#` 注释。
- 路径检查跳过外部 URL、锚点、生成目录（`dist`、`.next`、`coverage`）、通配符与未来文件；fenced code 里的路径不作为项目路径检查。
- 端口只检查显式的 `*_PORT`（默认 `:N`）与 `.env.example` 的一致性；URL 示例视为说明，不做端口推断。
- exports 子路径检查行内反引号中的 `@inkstack/<pkg>/<subpath>`，把 `*` 通配展开后与 `package.json` 的 `exports` 键比对。

### 5. 自测随 `check:docs` 执行

沿用现有 `runSelfTest()` 的纯函数 + fixture 模式，为索引、H1、章节、命令提取、exports 子路径各补失败与通过用例。根脚本改为：

```json
"check:docs": "node scripts/check-agent-docs.mjs --self-test && node scripts/check-agent-docs.mjs"
```

这样 `pnpm verify` 与 CI static 自动覆盖自测，不需要新的测试框架或包级 Vitest 配置。

### 6. 本变更只做确定性一层

Agent 审查的价值已经由实际审计验证：`packages/ui/README.md` 的 postcss 指引与两个应用配置相反、根 README 的 `pnpm dev` 描述与脚本矛盾，这些都不是确定性规则能可靠判断的。但它们需要读代码、有误报风险，且仓库禁止在 `pull_request` 读 secret，因此不进入本次门禁。后续可以单独做本地 `/docs-review`，或合并后 `workflow_run` 审计，均不阻断 PR。

## Risks / Trade-offs

- [手写索引仍需改两处] → 检查器报错时列出缺失/多余的具体包名，修复成本可见；索引规则稳定后再评估生成。
- [正则解析 Markdown 误报] → 链接与路径检查跳过 fenced code、通配符与生成目录；新增规则必须有 fixture 自测。
- [中文标题同义词不一致] → 章节检查只要求最小集合，并接受 `使用`/`消费`、`导出`/`公开导出` 等等价标题；不做措辞评分。
- [既有文档首次运行失败] → 本变更同时修复已确认的索引漂移与 `tsconfig` README 的命令章节，不增加宽泛豁免。
- [检查器变长] → 规则集中在少数纯函数，fixture 自测覆盖；超过可维护阈值再拆 `scripts/lib/`。

## Migration Plan

1. 扩展检查器与自测，先让 fixture 通过。
2. 修复根 README、`packages/README.md`、`packages/AGENTS.md` 的索引漂移，补 `packages/tsconfig/README.md` 的命令章节。
3. 运行 `pnpm check:docs`、`pnpm check:manifests`、`pnpm verify`，确认现有文档全部通过。
4. 回滚策略：本变更只影响脚本与文档，回滚即恢复上一版 `check:docs`；无运行时、数据或部署影响。

## Open Questions

无。语义审查的落位（本地 skill 或合并后 `workflow_run`）单独决策，不阻塞本变更。
