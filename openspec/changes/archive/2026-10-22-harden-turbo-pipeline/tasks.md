# Tasks

## 1. Turbo 缓存与 env 分类

- [x] 1.1 在 `turbo.json` 的 `build.outputs` 增加 `"!.next/dev/**"`；运行 `pnpm exec turbo run build --dry=json` 确认 `excludedOutputs` 包含 `.next/dev/**`，并执行一次 `pnpm --filter @inkstack/shell build --force` 后检查 `.turbo/cache/*-manifest.json` 不含 `.next/dev` 条目
- [x] 1.2 在 `turbo.json` 把 `PORT`、`CANVAS_HOST`、`CANVAS_PORT`、`CANVAS_DEV_CORS_ORIGIN`、`BFF_PORT`、`GATEWAY_PORT`、`GATEWAY_WS_PATH` 从 `globalEnv` 移到 `globalPassThroughEnv`，并把 `NEXT_TELEMETRY_DISABLED` 加入 `globalPassThroughEnv`；用 `PORT=3000` 与 `PORT=9999` 分别运行 `turbo run build --filter=@inkstack/shell --dry=json`，确认 `shell#build` 哈希不变，且 `passThroughEnv` 列出这些变量
- [x] 1.3 保留 `NODE_ENV` 在根 `globalEnv`；把 `NEXT_PUBLIC_CANVAS_MF_ENTRY` 放到 `apps/shell/turbo.json` 的 `build.env`；分别用两个不同的 `NEXT_PUBLIC_CANVAS_MF_ENTRY` 值运行 `turbo run build --filter=@inkstack/shell --dry=json`，确认 `shell#build` 哈希发生变化
- [x] 1.4 修正 `turbo.json` 中 `typecheck.description`，使其不再声称“不产出文件”，并说明会写 tsbuildinfo 与 Next 生成类型；运行 `pnpm exec turbo run typecheck --dry=json` 确认配置仍可解析

## 2. Lint 覆盖与输入确定性

- [x] 2.1 在根 `package.json` 的 `lint` 脚本链尾增加 `oxlint --config .oxlintrc.staged.json scripts knip.config.ts commitlint.config.mjs`；运行 `pnpm lint` 确认退出码为 0，且该命令单独执行时覆盖根目录脚本与配置
- [x] 2.2 在 `apps/shell/package.json` 的 `lint` 脚本前增加 `next typegen`，沿用 typecheck 的 dotenv 链（含 `.env.example` 兜底）；删除 `apps/shell/.next` 与 `apps/shell/next-env.d.ts` 后运行 `pnpm --filter @inkstack/shell lint`，确认通过且 `git status` 没有意外的 `tsconfig.json` 改写
- [x] 2.3 在 `docs/toolchain.md` 的 lint 章节补充“根目录脚本与配置由 `.oxlintrc.staged.json` 主规则检查”；按文档中的命令执行一次，确认与 `pnpm lint` 行为一致

## 3. 测试任务依赖

- [x] 3.1 把 `turbo.json` 的 `test` 与 `test:coverage` 的 `dependsOn` 改为 `["^build"]`；运行 `pnpm exec turbo run test:coverage --dry=json`，确认 `shell#test:coverage`、`bff#test:coverage`、`gateway#test:coverage` 不再依赖本包 `build`
- [x] 3.2 新增 `apps/canvas/turbo.json`，以 `"extends": ["//"]` 为 `test` 与 `test:coverage` 声明 `dependsOn: ["build"]`；运行 `turbo run test:coverage --filter=@inkstack/canvas --dry=json`，确认 canvas 依赖自身 `build`，且其 `build` 仍依赖 `^build`
- [x] 3.3 更新 `turbo.json` 中 `test`/`test:coverage` 的 description 与 `docs/testing.md` 的“测试在 build 之后运行”表述，改为“依赖包先构建；只有读取本包产物的测试才构建本包”；按文档描述运行 `pnpm --filter @inkstack/canvas test:coverage`，确认与 dry-run 一致

## 4. 增量编译状态隔离

- [x] 4.1 修改 `apps/bff/package.json` 的 `typecheck` 为 `tsc -p tsconfig.json --noEmit --tsBuildInfoFile .turbo/tsconfig.typecheck.tsbuildinfo`，并在 `apps/bff/tsconfig.build.json` 设置 `"incremental": false`；先运行 typecheck，再运行 `pnpm --filter @inkstack/bff build`，确认 `.turbo/tsconfig.typecheck.tsbuildinfo` 在 build 后仍存在且 build 成功
- [x] 4.2 对 `apps/gateway` 做与 4.1 相同的修改与验证，确认 gateway 的 typecheck 增量文件不被 `nest build` 删除
- [x] 4.3 在 `docs/typescript.md` 记录 build/typecheck 的 tsbuildinfo 路径约定与 `deleteOutDir` 的关系；按文档执行一次 typecheck 与 build，确认路径与描述一致

## 5. CI 缓存与环境

- [x] 5.1 在 `.github/workflows/ci-static.yml` 增加 `actions/cache`，缓存 `.turbo/cache`，键包含 runner OS、job 名、`pnpm-lock.yaml` 与 `turbo.json` 的哈希，`restore-keys` 使用 `OS-turbo-static-` 前缀；用 `node -e "require('yaml').parse(...)"` 解析 YAML，确认 cache 路径与键存在
- [x] 5.2 在 `.github/workflows/ci-test.yml` 增加同样的 per-job 缓存，`restore-keys` 使用 `OS-turbo-test-` 前缀，并保留 coverage 上传路径；解析 YAML 并确认缓存 step 在 `pnpm test:coverage` 之前
- [x] 5.3 在 `.github/workflows/ci-build.yml` 增加 per-job 缓存，`restore-keys` 使用 `OS-turbo-build-` 前缀，并补 `CI: 'true'` 与 `TURBO_UI: 'false'`；在三个 workflow 的 `env` 中统一补 `TURBO_UI: 'false'`，解析 YAML 确认变量一致
- [x] 5.4 更新 `docs/ci-cd.md`，记录三个 job 的 per-job Turbo 缓存键、缓存失败不阻断构建，以及 Remote Cache 作为后续可选方案；按文档逐项核对 workflow 中的 path/key/restore-keys

## 6. 环境文档与规则

- [x] 6.1 更新 `.env.example`，删除“test 由测试命令加载 `.env.test`”的说明，保留 dev/build 链；用 `rg "\.env\.test" .env.example` 确认只剩测试段落中明确的“测试不加载”表述
- [x] 6.2 更新 `.claude/rules/env.md`，把测试条目改为“测试不加载 `.env`，配置由 stub 提供”，并在变量归属中加入 `globalPassThroughEnv`；用 `rg "env.test|globalPassThroughEnv" .claude/rules/env.md` 核对文案
- [x] 6.3 更新 `docs/toolchain.md` 的 verify 链为 `test:coverage`，并同步 `globalEnv`/`globalPassThroughEnv` 的说明；用 `rg "test:coverage|globalPassThroughEnv" docs/toolchain.md` 核对
- [x] 6.4 更新 `docs/testing.md` 与 `docs/ci-cd.md` 中与测试依赖、缓存相关的表述；用 `rg "dependsOn|\\^build|actions/cache" docs/testing.md docs/ci-cd.md` 核对

## 7. 集成验证

- [x] 7.1 运行 `pnpm install --frozen-lockfile`、`pnpm check:manifests`、`pnpm check:docs` 与 `pnpm exec openspec validate harden-turbo-pipeline --strict`，确认全部成功
- [x] 7.2 运行 `pnpm lint` 与 `pnpm typecheck`，确认通过；检查 `git status` 没有未预期的生成文件
- [x] 7.3 运行 `pnpm test:coverage`，确认通过；重新运行 `turbo run test:coverage --dry=json`，确认只有 canvas 依赖本包 `build`
- [x] 7.4 运行 `pnpm build`，确认通过；检查 `shell#build` 的缓存 manifest 不含 `.next/dev`，且缓存体积不再随 dev 历史增长
- [x] 7.5 运行 `pnpm verify`，记录实际输出；确认 lint、typecheck、test:coverage、build、format 与 hygiene 全部通过。本机 oxc-parser 的 6 GiB raw transfer 超出可用虚拟内存，hygiene 需以 `KNIP_DISABLE_RAW_TRANSFER=1 pnpm verify` 运行；CI runner 不受此限制
- [x] 7.6 运行 `git diff --check`，确认没有空白或冲突标记；汇总改动文件与验证命令结果，供 apply 阶段复核

## 8. 脚本与包级配置按角色收敛

- [x] 8.1 移除 `packages/contracts` 与 `packages/vitest-config` 的 `dev`（纯类型包与 dev-only 预设包不参与应用 dev）；运行 `turbo run dev --filter=./packages/* --dry=json`，确认只剩 config 与 ui 两个 watch 任务
- [x] 8.2 根 `package.json` 的 `dev` 改为 `turbo run dev --filter=./apps/*`，新增 `dev:packages=./packages/*`；分别 dry-run，确认 apps 为 4 个、packages 为 2 个 dev 任务
- [x] 8.3 包级 `turbo.json` 收敛为三个真实例外（shell 的 `build.env`、canvas 的测试依赖、tsconfig 的 publint）；删除其余重复配置与 outputs 覆盖，运行 `turbo run build --dry=json` 确认所有包仍使用根默认产物

## Workflow follow-up

- 变更完成并通过评审后，使用 `/opsx:archive` 归档。
- 归档前确认 `openspec validate harden-turbo-pipeline --strict` 仍通过。
