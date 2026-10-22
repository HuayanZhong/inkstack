# CI/CD 蓝图

本文是 GitHub Actions、依赖更新、分支保护、预览/部署与发布的唯一 home。当前已启用的文件在 `.github/`；未启用的按“激活条件”落地，不提前建空文件。目录内的 agent 约束见 [`../.github/AGENTS.md`](../.github/AGENTS.md)。

## 设计原则

- PR 与 main 分开：`ci.yml` 只跑 PR；`ci-master.yml` 跑 `main` push 与手动。
- 编排与检查分离：编排文件只调用 reusable workflow 与聚合；每个 `ci-*.yml` 只做一类检查。
- 分支保护只认一个稳定检查：`all checks passed`。新增检查加到 gate，不改 GitHub 设置。
- 所有 job 最小权限、`persist-credentials: false`、`pnpm install --frozen-lockfile`、`concurrency`、`timeout-minutes`。
- 需要 secrets 的 workflow 不监听 fork PR；禁止 `pull_request_target` 检出并执行 PR 代码。
- 未激活的 workflow 不建空文件；本文的激活表就是占位。

## 当前已启用

| 文件                    | 触发                                 | 职责                                                                         |
| ----------------------- | ------------------------------------ | ---------------------------------------------------------------------------- |
| `ci.yml`                | `pull_request`                       | PR 编排：static / test / build / dependency-review，汇总 `all checks passed` |
| `ci-master.yml`         | `push main`、`workflow_dispatch`     | main 与手动：static / test / build                                           |
| `ci-static.yml`         | `workflow_call`、`workflow_dispatch` | lint、check:manifests、check:docs、typecheck、format:check                   |
| `ci-test.yml`           | `workflow_call`、`workflow_dispatch` | test:coverage、上传覆盖率                                                    |
| `ci-build.yml`          | `workflow_call`、`workflow_dispatch` | build、hygiene（knip/publint）                                               |
| `dependency-review.yml` | `workflow_call`                      | PR 新增依赖审查，high 阻断                                                   |
| `dependabot.yml`        | 每日 04:00 Asia/Shanghai             | npm（含 pnpm catalog）与 GitHub Actions 更新                                 |

分支保护目标：`main` 要求 `all checks passed`、分支最新、对话解决；禁止 force push（需在 GitHub 设置）。当前 secrets：无。

## Turbo 缓存

- `ci-static.yml`、`ci-test.yml`、`ci-build.yml` 各自用 `actions/cache` 持久化 `.turbo/cache`，键为 `${{ runner.os }}-turbo-<job>-${{ hashFiles('pnpm-lock.yaml', 'turbo.json') }}`，`restore-keys` 使用 `${{ runner.os }}-turbo-<job>-` 前缀。
- 三个 job 并行执行，per-job 键避免同一 run 内互相覆盖；跨 run 复用即可跳过未变化任务。同一 run 内跨 job 的实时复用需要 Remote Cache，当前未配置，作为后续可选升级。
- 缓存 step 设置 `continue-on-error: true`；缓存不可用时 CI 仍全量构建并通过。
- 仓库级 `TURBO_TOKEN` / `TURBO_TEAM` 仍为可选项；启用 Remote Cache 时优先于本地缓存持久化。

## 激活顺序

M3 = DESIGN-RECORD 第 3 周，依此类推。

| 里程碑          | workflow                                                                                     | 触发                                          | 职责                                                      | 依赖 / secret                                  | 激活条件                        |
| --------------- | -------------------------------------------------------------------------------------------- | --------------------------------------------- | --------------------------------------------------------- | ---------------------------------------------- | ------------------------------- |
| M3 协议与持久化 | `ci-test.yml` 增补                                                                           | 随 PR/main                                    | action 契约、gateway 队列/seq/ack、snapshot round-trip    | 无                                             | action 协议与 contracts 落地    |
| M3 数据库       | `db-migration.yml`                                                                           | `workflow_call`、`workflow_dispatch`          | migration:check；staging 执行 expand → migrate → contract | SQLite 无；Postgres 用 staging DB              | 第一份 MikroORM migration       |
| M4 MCP          | `ci-mcp.yml`                                                                                 | `workflow_call`、`workflow_dispatch`          | 启动 stdio server，断言 tools/list 与 tools/call          | 无                                             | MCP adapter 包存在              |
| M5 Agent/SSE    | `ci-integration.yml`                                                                         | `workflow_call`、`workflow_dispatch`          | 起 gateway/bff/agent，跑 HTTP/WS/SSE 集成                 | 无；模型用替身                                 | agent-service 与 SSE 端点       |
| M5 真模型       | `e2e-live.yml`                                                                               | `workflow_dispatch`、nightly、`push main`     | 真实模型 E2E                                              | `ANTHROPIC_API_KEY_EXTERNAL`                   | agent-service 接入真实模型      |
| M6 Docker       | `container.yml`                                                                              | PR（只构建）、main（推 GHCR）、tag（推 GHCR） | gateway/bff/agent/codegen 镜像矩阵                        | `GITHUB_TOKEN`（`packages: write`）            | Dockerfile 与 compose           |
| M7 Codegen      | `codegen-golden.yml`                                                                         | `workflow_call`、`workflow_dispatch`          | IR 编译两次输出等价、golden diff                          | 无                                             | codegen-service + IR + fixtures |
| M9 E2E          | `e2e.yml`                                                                                    | PR、main、nightly、手动                       | Playwright 浏览器流程、trace/screenshot                   | 无                                             | Playwright 与稳定本地栈         |
| M9 预览         | `preview.yml`                                                                                | `pull_request`                                | 每个 PR 的预览部署与 URL 评论                             | 部署平台 token；`preview` environment          | 选定 Vercel/Cloudflare/Fly      |
| M9 Staging      | `deploy-staging.yml`                                                                         | `push main`、手动                             | 构建镜像、迁移、部署、smoke                               | staging DB/deploy token；`staging` environment | staging 环境可用                |
| M11 生产        | `deploy-production.yml`                                                                      | `workflow_dispatch`、`push tags v*`           | 迁移、部署、smoke                                         | production secrets；`production` environment   | production 环境与回滚方案       |
| M11 回滚        | `rollback.yml`                                                                               | `workflow_dispatch`                           | 指定镜像 tag 回滚并 smoke                                 | production secrets；`production` environment   | 首次生产发布                    |
| M11 安全        | `security.yml`                                                                               | PR、main、weekly                              | CodeQL                                                    | `security-events: write`                       | 仓库公开或进入生产              |
| M11 观测        | `deploy-production.yml` 内步骤                                                               | 随生产                                        | Sentry release / sourcemap                                | `SENTRY_AUTH_TOKEN`                            | Sentry 接入                     |
| M12 文档        | `docs-pages.yml`                                                                             | `workflow_dispatch`、`push tags v*`           | 构建并部署文档站                                          | `github-pages` environment                     | 文档站成型                      |
| M12 发布        | `release.yml`                                                                                | `push main`                                   | Changesets release PR、打包演练                           | `GITHUB_TOKEN`                                 | Changesets 接入                 |
| M12 发布        | `release-publish.yml`                                                                        | `workflow_dispatch`（`v*` tag）               | pack（无凭据）+ publish（审批）                           | `NPM_TOKEN`；`npm-publish` environment         | 第一个可发布包                  |
| 可选            | `issue-policy.yml`、`issue-lifecycle.yml`、`weighted-approval.yml`、`expected-filenames.yml` | 事件驱动                                      | issue/PR 治理                                             | GitHub App / token                             | 接受外部贡献后再加              |

## 未来 workflow 的最小规格

### `db-migration.yml`

- PR 只跑 `migration:check`，不连接共享数据库；staging 手动触发才执行 `migration:up`。
- Postgres 用 service container；SQLite 用临时文件。
- 顺序固定为 expand → migrate → contract；失败即停止，不自动回滚数据库。

### `ci-mcp.yml`

- 构建 `@inkstack/mcp-adapter` 后启动 stdio server，断言 `tools/list` 的工具集与 `tools/call` 的 ack。
- Gateway 用替身或本地实例；测试不依赖真实模型。

### `ci-integration.yml`

- 用 service containers 或 `docker compose` 起 gateway、bff、agent-service，等待 `/health` 后跑集成测试。
- 模型调用使用 deterministic stub；真实模型只在 `e2e-live.yml`。

### `e2e-live.yml`

- 触发：`workflow_dispatch`、nightly、`push main`；如需 PR 触发，job 级 `if` 必须跳过 fork 与 `dependabot[bot]`。
- Secret：`ANTHROPIC_API_KEY_EXTERNAL` 映射为 `ANTHROPIC_API_KEY`，只在该步骤注入；缺失时 preflight 直接失败，避免“全跳过”假绿。
- 禁止 `pull_request_target`；禁止把 secret 传给 checkout/setup/install。

### `container.yml`

- 矩阵：`gateway`、`bff`、`agent-service`、`codegen-service`；PR 只构建，不推送。
- main/tag 推送 GHCR；只有 push job 声明 `packages: write`。
- 构建参数不放 secret；多阶段构建，使用 `docker/build-push-action` 与 GHA cache。

### `e2e.yml`

- 安装 Playwright 浏览器，起本地 shell/canvas/gateway/bff，跑 `pnpm test:e2e`。
- 上传 trace、screenshot、video；不读取 secrets。
- 初期允许 PR 上非阻断；稳定后把结果接入 `all checks passed`。

### `preview.yml`

- 每个 PR 一个预览 URL，按 PR number 做 concurrency；fork PR 不注入生产 secret。
- `preview` environment 只放预览凭据；构建产物上传到部署平台，不把源码交给平台。
- 用 idempotent 评论写回 URL；重复 push 只更新部署。

### `deploy-staging.yml`

- `push main` 后运行；先构建并推送镜像，再迁移，再部署，最后 smoke。
- `staging` environment 保存 staging DB 与部署 token；不使用 production secret。
- 失败停止，不自动升级到 production。

### `deploy-production.yml`

- `workflow_dispatch` 或 `v*` tag；`production` environment 配置 required reviewers。
- 拆成 prepare（无凭据）、migrate（expand）、deploy、smoke；发布产物必须来自已构建的镜像 tag，不在发布 job 重新构建。
- 并发组固定，`cancel-in-progress: false`；失败走 `rollback.yml`，不自动掩盖。

### `rollback.yml`

- 输入要回滚的镜像 tag；`production` environment 审批；部署后跑同一套 smoke。
- 数据库只做向前兼容的 expand；contract 步骤单独评审，不放进自动回滚。

### `release.yml` / `release-publish.yml`

- `release.yml` 在 main 上由 Changesets 生成 release PR 与打包演练，不发布。
- `release-publish.yml` 只从 `v*` tag 手动触发；pack job 无凭据，publish job 用 `npm-publish` environment 与 `NPM_TOKEN`；发布 job 不重新构建，只上传 pack 产物。

### `docs-pages.yml`

- 只从发布 tag 或手动触发；`github-pages` environment；构建产物上传 Pages。
- 文档站不在 PR 上部署，PR 只做构建检查。

### `security.yml`

- CodeQL 覆盖 `javascript-typescript`；PR、main、每周 schedule；`security-events: write`。
- 与 `dependency-review.yml` 分工：前者查代码，后者查依赖变更。

## Secrets 与环境

| 名称                                     | 使用方                     | 范围                               |
| ---------------------------------------- | -------------------------- | ---------------------------------- |
| `ANTHROPIC_API_KEY_EXTERNAL`             | `e2e-live.yml`             | trusted events / `e2e` environment |
| `NPM_TOKEN`                              | `release-publish.yml`      | `npm-publish` environment          |
| `TURBO_TOKEN`、`TURBO_TEAM`              | CI（可选）                 | 仓库级；不配置则用本地缓存         |
| `SENTRY_AUTH_TOKEN`                      | production 发布/观测       | `production` environment           |
| `VERCEL_TOKEN` 或 `CLOUDFLARE_API_TOKEN` | preview/staging/production | 按 environment 拆分                |
| `DATABASE_URL_*`、`SUPABASE_*`           | migration/deploy           | 按 environment 拆分                |
| `GITHUB_TOKEN`                           | GHCR 推送                  | 仅 push job 的 `packages: write`   |

Environment：`preview`（无审批、无生产 secret）、`staging`（staging secret）、`production`（required reviewers）、`npm-publish`（required reviewers）、`github-pages`（tag 策略）。

## 新增检查的落位规则

1. 能加进现有 `ci-*.yml` 的，加 step 或 job，不新建文件。
2. 只在以下情况新建 workflow：独立运行时/平台、service containers、长时 E2E、需要 secrets/environment、部署或发布。
3. 新检查文件用 `ci-<area>.yml`（检查单元）或 `<purpose>.yml`（部署/发布/E2E）；检查单元用 `workflow_call` + `workflow_dispatch`。
4. 在 `ci.yml` 和/或 `ci-master.yml` 加一行 caller；在 `all checks passed` 的 `needs` 与结果检查里加一行；分支保护仍只要求这一个检查。
5. 更新本文的“当前已启用”表；`.github/AGENTS.md` 只在落位规则变化时更新；首次 PR 验证通过后再标记为已启用。

## 明确不做

- 不为未激活的流水线建空 workflow。
- 不复制 dsh 的 Windows/macOS/Desktop/Python/native 打包；Inkstack 没有这些产物。
- 不在 PR 中读取 secrets；不用 `pull_request_target` 执行 PR 代码。
- 不把命令堆回 `ci.yml`；编排文件只做调用与聚合。
