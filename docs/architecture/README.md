# 墨栈 Inkstack · AI Design-to-Code 架构图

- 项目名：**墨栈 / Inkstack**
- 技术代号：`aid2c`
- 口号：让 AI 落笔，让代码落地

设计决策与背景见 [`DESIGN-RECORD.md`](DESIGN-RECORD.md)。

四张图分别回答四个问题：

| 图           | 回答的问题                                                                                   | 图片                                 | 交互版                                     | 源文件                                |
| ------------ | -------------------------------------------------------------------------------------------- | ------------------------------------ | ------------------------------------------ | ------------------------------------- |
| 业务架构     | 谁在用、做什么、需要哪些能力与资产                                                           | `images/business-architecture.png`   | `interactive/business-architecture.html`   | `source/business-architecture.json`   |
| 技术栈架构   | 按层分解的技术栈（含微前端、BFF、Supabase、AI SDK、多 Agent 编排、CI/CD 工具），连线表示归属 | `images/tech-stack-architecture.png` | `interactive/tech-stack-architecture.html` | `source/tech-stack-architecture.json` |
| 运行时架构   | 三条主流程、BFF 边界，以及谁写谁执行                                                         | `images/combined-architecture.png`   | `interactive/combined-architecture.html`   | `source/combined-architecture.json`   |
| CI/CD 流水线 | 从 PR 到生产的质量门禁、部署环境与回滚                                                       | `images/cicd-workflow.png`           | `interactive/cicd-workflow.html`           | `source/cicd-workflow.json`           |

## 目录

```
aid2c-architecture/
├── images/        四张 PNG，直接双击查看
├── interactive/   四张交互版 HTML，浏览器打开
├── source/        四份 JSON，改图时只改这里
└── README.md
```

交互版支持：搜索节点、追踪路径、深浅色切换、导出 PNG/SVG/WebM。

## 修改与重新生成

重新生成需要 Archify CLI。安装：

```bash
npx skills add tt-a1i/archify -g
```

或者克隆 `tt-a1i/archify`，使用其中的 `archify/bin/archify.mjs`。然后在当前目录运行：

```bash
node <archify-repo>/archify/bin/archify.mjs finalize architecture source/business-architecture.json interactive/business-architecture.html --quality showcase --json
node <archify-repo>/archify/bin/archify.mjs finalize tree source/tech-stack-architecture.json interactive/tech-stack-architecture.html --quality showcase --json
node <archify-repo>/archify/bin/archify.mjs finalize architecture source/combined-architecture.json interactive/combined-architecture.html --quality showcase --json
node <archify-repo>/archify/bin/archify.mjs finalize workflow source/cicd-workflow.json interactive/cicd-workflow.html --quality showcase --json
```

只改 `source/*.json`，不要手改 HTML；每份 JSON 的 `meta.output` 已经指向对应的 `interactive/*.html`。

## 开发工作流（暂不启用 worktree）

- 当前用主 checkout + feature branch：`git switch -c feat/xxx`，完成后走 PR 合并。
- 每个任务一个分支、一个 PR；CI 已由分支 / PR 触发。
- Git worktree 暂时不引入；等需要并行开发或多 Agent 代码隔离时再加。

## CI/CD 规划

> 本节是部署与发布规划；PR/main CI、依赖审查、Dependabot 与未来流水线的激活顺序见 [CI/CD 蓝图](../ci-cd.md)，不在这里重复。DESIGN-RECORD 中的「云部署」非目标指当前不实际部署。

- **当前已落地**：PR/main 执行 static / test / build（含 hygiene）三组检查（等价于 `pnpm verify`），PR 额外运行 dependency review，Dependabot 每日检查依赖；部署、E2E、发布与回滚仍按下文规划。
- **主流程**：PR → install/cache → lint/typecheck → unit/build → codegen golden → integration → E2E → preview/staging → prod approval → production → smoke/Sentry → rollback。
- **环境**：local → preview → staging → production；production 必须经过 GitHub Environment 审批，preview 不使用生产密钥。
- **部署目标**：
  - Shell / Canvas：Vercel 或静态 CDN
  - BFF / Gateway / Agent / Codegen：Docker 镜像 → Fly.io / Render / VPS
  - Supabase：托管 Postgres / Auth / Storage
  - MCP：npm 包 + HTTP 服务
- **质量门禁**：lint、typecheck、Vitest 单测、codegen golden、Nest/MCP 集成测试、Playwright E2E；Turborepo affected + 缓存。
- **回滚与观测**：Vercel 即时回滚；Docker 按镜像 tag 回滚；MikroORM/Supabase 迁移采用 expand → migrate → contract；Sentry + smoke test + 健康检查。
- **密钥**：Anthropic key 只放 agent-service；Supabase service role 只放 BFF/后端；前端只用 anon key；通过 GitHub Actions Secrets 注入。

## 说明

- 四张图生成时都通过了 Archify 的 validate / deliver / check / browser-check 自动校验。
- 技术栈图的微前端分支：Canvas 作为 Module Federation provider（remote），Next.js Shell 用 `@module-federation/enhanced/runtime` 在客户端消费。
- BFF 是独立一层，位于前端与后端服务之间：面向前端做聚合、Auth、SSE；实时 canvas WS 可直连 Gateway；action 编排仍由 Gateway 负责。
- Supabase 作为 BaaS 放在后端服务层（Postgres / Auth / Storage / Realtime）；本地开发仍保留 SQLite + MikroORM。
- AI 层分三层：模型调用/流式用 Vercel AI SDK（`ai` + `@ai-sdk/anthropic`）；多 Agent 编排用 LangGraph.js（Deep Agents 作为基于 LangGraph 的候选 harness，Mastra 作为 TypeScript-native 备选）；画布 action 用 tldraw Agent Kit；MCP 使用 `@modelcontextprotocol/sdk`。
- 技术栈图采用树形分解：层是父节点，组件是子节点；连线只表示归属，不表示调用关系。
- PNG 是交互版 HTML 的全页截图；技术栈图与 CI/CD 图为避免索引过长，截图时隐藏了节点索引。
