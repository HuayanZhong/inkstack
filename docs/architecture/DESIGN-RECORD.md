# 墨栈 Inkstack · 设计记录

> 本文是 2026-10-18 架构讨论的整理版，不是原始聊天记录。原始对话不会自动进入 Git 仓库；项目里保留这份决策记录即可。

## 1. 项目定位

- 学习型项目，周期约 2–3 个月。
- 目标：做一个 AI design-to-code 画布，支持 AI 控笔、人工编辑、设计转代码，并通过 MCP 暴露给外部 Agent / 仿 Coze 平台。
- 非目标：多人实时协作、云部署、图片资产管理、完整设计系统。

## 2. 命名

- 产品名：**墨栈 / Inkstack**
- 技术代号：`aid2c`
- 口号：让 AI 落笔，让代码落地

## 3. 核心架构约束

- **Canvas 是单一执行器**：所有画布修改最终由 tldraw editor 执行并回 ack。
- **Gateway 是单一序列器**：所有 action 排队、编号、校验、广播、持久化。
- **BFF 是独立一层**：前端聚合、Auth/session、SSE、上传/下载；不持有 action 队列。
- **实时 WS 可直连 Gateway**：REST/SSE/Auth 走 BFF，降低 action 延迟。
- **代码生成是确定性编译器**：不让模型自由写代码。
- **设计文件是 JSON**：tldraw snapshot，随仓库进 Git，不使用 Pencil 的 `.pen` 格式。

## 4. 技术选型

| 层            | 选择                                                                                     |
| ------------- | ---------------------------------------------------------------------------------------- |
| 前端 Shell    | Next.js + React                                                                          |
| 画布          | tldraw + Agent starter kit（MIT）                                                        |
| 微前端        | Module Federation：canvas 为 remote，shell 用 runtime API 消费；退路 Multi-Zones         |
| BFF           | NestJS BFF 或 Next.js Route Handlers                                                     |
| 后端          | NestJS：Gateway / Agent Service / Codegen Service / MCP Adapter                          |
| 多 Agent 编排 | LangGraph.js；Deep Agents 作为基于 LangGraph 的候选；Mastra 作为 TypeScript-native 备选  |
| 模型调用      | Vercel AI SDK（`ai` + `@ai-sdk/anthropic`）                                              |
| 外部 Agent    | MCP SDK（stdio 现在，HTTP 给平台）                                                       |
| 数据          | `design.json` + SQLite/Drizzle（本地）+ Supabase（BaaS：Postgres/Auth/Storage/Realtime） |
| 测试          | Vitest + React Testing Library + Playwright + codegen golden                             |
| 工程化        | pnpm + Turborepo + GitHub Actions + Changesets + Sentry                                  |
| CI/CD         | PR → 质量门禁 → Preview/Staging → Prod Approval → Production → Smoke/Rollback            |

## 5. 关键决策（ADR 摘要）

| 决策                            | 理由                                                          | 备选                                      | 状态 |
| ------------------------------- | ------------------------------------------------------------- | ----------------------------------------- | ---- |
| 画布用 tldraw Agent starter kit | 自带画布、属性面板、agent action（含 PenAction）              | Polotno / OpenPolotno / 自建 Konva/Leafer | 已定 |
| 代码生成用确定性编译器          | 可测试、可复现；模型只负责调用工具                            | Agent 自由生成                            | 已定 |
| BFF 独立一层                    | 前端聚合/Auth/SSE 与 action 编排分离                          | Gateway 兼任 BFF；Next.js Route Handlers  | 已定 |
| Supabase 作为 BaaS              | Postgres/Auth/Storage/Realtime 一体（平台化）                 | 纯 SQLite；自建 Postgres                  | 已定 |
| LangGraph.js 作为编排层         | 图/状态/检查点/HITL，适合 Planner→Designer→Critic；当前主选   | Deep Agents / Mastra                      | 已定 |
| Deep Agents 作为候选            | 基于 LangGraph 的规划/子 Agent harness                        | 直接手写 LangGraph                        | 待定 |
| Mastra 作为备选                 | TypeScript-native、typed workflow                             | LangGraph.js                              | 待定 |
| Module Federation 作为微前端    | 画布作为 remote 练微前端；Next App Router 用 runtime API 消费 | Multi-Zones / iframe                      | 已定 |
| MCP 先 stdio 后 HTTP            | Claude Code 本地接入快；平台阶段换 HTTP；分阶段实施           | 直接 HTTP                                 | 已定 |
| interactive HTML 随仓库提交     | 当前没有 CI 生成流程，HTML 是架构文档的查看面                 | 只提交 source + images                    | 已定 |

决策状态只用 `已定 / 已取代 / 待定`。`已取代` 必须在状态列链接到取代它的新决策；`openspec/changes/archive/` 是冻结历史，`openspec/specs/` 是行为要求的当前来源。

## 6. 三条主流程

1. **内嵌 AI**：Chat → BFF → Agent Service（LangGraph）→ Gateway → Canvas。
2. **人工编辑**：Canvas → Gateway → design.json（Git）。
3. **外部 Agent**：Claude Code / Coze → MCP Adapter → Gateway → Canvas。

## 7. 开发工作流（暂不启用 worktree）

- 当前采用主 checkout + feature branch：`git switch -c feat/xxx`，完成后走 PR 合并。
- 每个任务一个分支、一个 PR；CI 由分支 / PR 触发。
- Git worktree 暂不引入；等需要并行开发或多 Agent 代码隔离时再加。
- 多 Agent 在画布里的协同是运行时功能，与 Git 分支策略无关。

## 8. 里程碑

> 里程碑是规划而不是当前状态。骨架期 lint、测试、Changesets、CI 延后，实际接入以 `AGENTS.md` 的阶段策略为准。

| 周  | 交付                                                             |
| --- | ---------------------------------------------------------------- |
| 1   | monorepo、contracts、Gateway 骨架、Next shell、画布嵌入；CI 骨架 |
| 2   | MF spike、preview 部署                                           |
| 3   | action 队列 + WS + canvas ack + 持久化                           |
| 4   | MCP stdio 读写工具                                               |
| 5   | agent-service 拆分、聊天面板接 SSE                               |
| 6   | 多 agent 光标 overlay、集成测试 + Docker                         |
| 7   | codegen-service + IR + golden 测试                               |
| 8   | 属性面板、错误处理                                               |
| 9   | staging、数据库迁移、E2E                                         |
| 10  | 演示场景、性能与边界情况                                         |
| 11  | production、回滚、Sentry + smoke                                 |
| 12  | 文档、演示视频、复盘                                             |

## 9. 未决问题

- LangGraph.js、Deep Agents、Mastra 最终选哪个？先用 LangGraph.js 做最小三节点图，再评估。
- Supabase 是否作为主数据库？本地仍用 SQLite/Drizzle，平台化时切 Supabase Postgres。
- 多 Agent 的角色划分与冲突策略（Planner/Designer/Critic 是否足够）。

## 10. 产物

- 业务架构图：`images/business-architecture.png`
- 技术栈架构图：`images/tech-stack-architecture.png`
- 运行时架构图：`images/combined-architecture.png`
- CI/CD 流水线：`images/cicd-workflow.png`
- 交互版：`interactive/*.html`
- 可编辑源文件：`source/*.json`

## 11. 继续工作

- 在 VS Code 中打开项目根目录，架构文档放在 `docs/architecture/`。
- 以后让 Claude Code 从项目根目录启动，会话才会关联到该项目；本记录不会自动同步聊天记录。
