# Proposal

## Why

Turborepo 配置审计确认任务图与 env 分发总体成立，但缓存边界、lint 覆盖与 CI 复用存在可复现的缺口：`shell#build` 的缓存清单中 310/511 个文件、约 104 MB 来自 `.next/dev`；仓库根目录的脚本与配置从未按主 lint 规则检查；运行时端口变量参与所有任务哈希，改端口会让 lint/typecheck 等无关任务缓存失效；`pnpm test` 在单测前构建全部应用；CI 三个 job 各自全量构建；BFF/Gateway 的增量状态被 Nest 的 `deleteOutDir` 删除；`.env.test` 的说明与测试规则互相矛盾。这些问题不影响当前 CI 通过，但会持续放大缓存体积、拖慢反馈并留下检查盲区。

## What Changes

- 缓存产物：`build.outputs` 排除 `.next/dev/**`，与 `.next/cache/**` 一样不进入构建缓存；缓存命中时不再恢复 dev server 状态。
- env 分类：只影响运行时或 dev server 的 `PORT`、`CANVAS_HOST`、`CANVAS_PORT`、`CANVAS_DEV_CORS_ORIGIN`、`BFF_PORT`、`GATEWAY_PORT`、`GATEWAY_WS_PATH` 放根 `globalPassThroughEnv` 透传，不参与哈希；shell 的 `NEXT_PUBLIC_CANVAS_MF_ENTRY` 放 `apps/shell/turbo.json` 的 `build.env`；根 `globalEnv` 只保留 `NODE_ENV`；补充 `NEXT_TELEMETRY_DISABLED` 透传。
- lint 覆盖：`pnpm lint` 增加根目录 `scripts/**/*.mjs`、`knip.config.ts`、`commitlint.config.mjs` 的主规则检查；shell 的 type-aware lint 先执行 `next typegen`，使其读取的生成类型可确定。
- 测试依赖：根 `test` / `test:coverage` 的 `dependsOn` 改为 `["^build"]`；canvas 通过包级 `turbo.json` 保留“测试前构建本包”，继续覆盖 MF manifest 契约。
- 增量状态：BFF/Gateway 的 `build` 与 `typecheck` 使用不同的 `tsBuildInfoFile`，避免不同 `rootDir`/`include` 互相作废，也避免 Nest 清理 `outDir` 时删除 typecheck 的增量状态。
- CI：三个 `ci-*.yml` 增加 `.turbo/cache` 的 `actions/cache` 持久化，使后续 run 复用缓存；Remote Cache 作为可选升级，本变更不依赖新 secret。
- 文档与规则：修正 `docs/toolchain.md` 的 verify 链为 `test:coverage`；修正 turbo task description 中 typecheck “不产出文件”的说法；把 `.env.test` 统一为“测试不加载 `.env`，配置由测试内 stub 提供”，同步 `.env.example` 与 `.claude/rules/env.md`。
- 包级配置：根 `turbo.json` 保留共享任务图与默认产物；包级 `turbo.json` 只保留真实例外——shell 的 `build.env`、canvas 的测试依赖、tsconfig 的 `publint.dependsOn: []`。
- dev 脚本：库包只在被应用通过 `dist` 消费且需要热更新时提供 `dev`；contracts 与 vitest-config 移除 `dev`；根 `dev` 只跑 apps，新增 `dev:packages` 跑库包 watch。

## Capabilities

### New Capabilities

- `build-pipeline`: 定义 Turborepo 任务图、缓存 inputs/outputs、环境变量哈希分类、CI 缓存复用、测试/lint 任务依赖与增量编译状态的系统行为。

### Modified Capabilities

- `environment-configuration`: 调整测试环境文件策略，测试 MUST NOT 依赖 `.env` 文件，删除对 `.env.test` 的加载承诺。
- `repository-hygiene`: 增加“lint 必须覆盖仓库根目录脚本与配置”的要求，并明确 pre-push/verify 执行 `test:coverage`。

## Impact

- 配置与脚本：根 `turbo.json`、根 `package.json`、新增 `apps/canvas/turbo.json`、`apps/shell/turbo.json`、`apps/bff/turbo.json`、`apps/gateway/turbo.json`、`apps/shell/package.json`、`apps/bff/tsconfig.json`、`apps/gateway/tsconfig.json`。
- CI：`.github/workflows/ci-static.yml`、`ci-test.yml`、`ci-build.yml`。
- 规则与文档：`.env.example`、`.claude/rules/env.md`、`docs/toolchain.md`、`docs/testing.md`、`docs/ci-cd.md`。
- 无 API、协议或外部依赖变更；用户可见变化主要是更快的测试/CI、更小的缓存与更完整的 lint 覆盖。
- 风险：缓存键变化会让首次运行 miss 并重建；旧的本地缓存条目会保留到淘汰。测试依赖调整后，`pnpm test` 不再验证非 canvas 应用的本包构建产物，构建产物契约仍由 `pnpm build` 与 canvas 的 MF manifest 测试覆盖。
