# AGENTS.md

补充根文件的规则。本目录是 GitHub Actions、Dependabot 与 PR 模板。完整蓝图与激活顺序见 [`../docs/ci-cd.md`](../docs/ci-cd.md)。

## 工作流

- `ci.yml`：PR 门禁，调用 static / test / build / dependency-review，并汇总为 `all checks passed`；分支保护只要求这个检查。
- `ci-master.yml`：`main` push 与手动触发，调用同一组 static / test / build；工作流整体状态就是门禁。
- `ci-static.yml` / `ci-test.yml` / `ci-build.yml`：可复用检查单元（`workflow_call`），也可单独 `workflow_dispatch` 调试。
- `ci-build.yml` 内同时跑 build 与 hygiene；hygiene 增长后再拆独立文件。
- `dependency-review.yml`：只被 `ci.yml` 调用；PR 上检查新增依赖。
- 部署、E2E、发布、文档站等流水线尚未接入；对应里程碑到来时再新增 workflow，不提前建空文件。

## 约束

- 每个 workflow 只负责一组检查；新增命令加到对应文件，不堆回 `ci.yml`。新增检查先查 `docs/ci-cd.md` 的落位规则，能加进现有文件就不新建 workflow。
- 默认 `permissions: contents: read`；需要写权限的 job 单独声明，保持最小。
- checkout 使用 `persist-credentials: false`，不把 token 留给后续步骤。
- 不在 `pull_request` 中读取 secrets；禁止用 `pull_request_target` 检出并执行 PR 代码。
- Actions 使用主版本标签，由 Dependabot 升级；处理 secrets 的 workflow 固定到 commit SHA。
- Dependabot 见 `dependabot.yml`：npm（含 pnpm catalog）与 GitHub Actions 每日检查，commit 前缀 `chore(deps)` / `chore(ci)`。
- 新增变量或 secret 时同步 workflow、仓库设置与文档；YAML 中不写明文凭据。
