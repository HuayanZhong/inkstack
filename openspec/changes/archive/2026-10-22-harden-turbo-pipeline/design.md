# Design

## Context

当前 `turbo.json` 的任务图、`persistent`/`cache` 与 strict env 已经成立；问题集中在缓存边界与任务输入的可复现性。`build.outputs` 的 `.next/**` 会连 `.next/dev` 一起归档；`globalEnv` 把运行时端口变量计入所有任务哈希；`test`/`test:coverage` 依赖本包 `build`；根目录脚本不在 `pnpm lint` 的主规则覆盖内；BFF/Gateway 的 `build` 与 `typecheck` 共用 `tsBuildInfoFile`，而 Nest 的 `deleteOutDir` 会删除它；CI 三个 job 各自全量构建。约束是不改变应用运行时行为、不引入新依赖、不升级框架，并保留 Canvas MF manifest 这类构建产物契约测试。

## Goals / Non-Goals

**Goals:**

- `build` 缓存只包含构建产物，`.next/dev` 与 `.next/cache` 不进入缓存。
- 运行时变量不参与任务哈希，构建期变量仍正确失效。
- `pnpm lint` 覆盖根目录脚本与配置，且 shell 的 type-aware lint 输入可确定。
- `pnpm test` 只为实际读取的构建产物执行本包构建。
- `build` 与 `typecheck` 的增量状态互不干扰。
- CI 在后续 run 复用 `.turbo/cache`，缓存不可用时仍能全量构建。

**Non-Goals:**

- 不配置 Vercel Remote Cache 或新增 CI secret；跨 job 的实时复用留给后续独立变更。
- 不改变应用端口、启动方式、构建工具或框架版本。
- 不删除用户本地未入库的 `.env.test` 文件，只统一文档与规则。
- 不把 `publint` 对 `@inkstack/tsconfig` 的 Transit Node 依赖视为错误。

## Decisions

### 1. 在根 `build.outputs` 排除 `.next/dev`

选择在根 `turbo.json` 的 `build.outputs` 增加 `"!.next/dev/**"`，与现有 `"!.next/cache/**"` 并列。当前只有 shell 使用 Next，根级排除简单且不会误伤其他包；未来新增 Next 应用时同样适用。替代方案是给 shell 增加包级 `turbo.json` 并用 `$TURBO_EXTENDS$` 追加排除，能缩小作用域但多一个配置文件，暂不必要。

### 2. 运行时变量放根 `globalPassThroughEnv`，构建期变量按应用声明

根 `globalEnv` 只保留所有构建都可能依赖的 `NODE_ENV`；`PORT`、`CANVAS_HOST`、`CANVAS_PORT`、`CANVAS_DEV_CORS_ORIGIN`、`BFF_PORT`、`GATEWAY_PORT`、`GATEWAY_WS_PATH` 与 `NEXT_TELEMETRY_DISABLED` 放根 `globalPassThroughEnv`：strict 模式下仍传给任务，但不参与哈希。`NEXT_PUBLIC_CANVAS_MF_ENTRY` 影响 shell 构建期内联，放在 `apps/shell/turbo.json` 的 `build.env` 中参与哈希。

替代方案是给每个应用写 `passThroughEnv`，作用域更窄，但会为同一类运行时变量维护四份配置，且对非密钥端口变量收益有限；也考虑过完全依赖 Next 的 `NEXT_PUBLIC_*` 框架推断，但仓库规则要求缓存正确性以显式声明为准，因此不采用。该决定同步 `.claude/rules/env.md` 与 `docs/toolchain.md`。

### 3. 根目录 lint 用独立命令，不新建 turbo 任务

在 `pnpm lint` 链尾增加 `oxlint --config .oxlintrc.staged.json scripts knip.config.ts commitlint.config.mjs`。`.oxlintrc.staged.json` 继承主规则并关闭 typeAware，适合不在任何包 tsconfig 内的根脚本。替代方案是注册 `//#lint:root` Turbo 任务并用 `$TURBO_ROOT$` 声明输入，可获得缓存，但根文件很少、检查很快，增加任务图复杂度不划算。

### 4. shell lint 先执行 `next typegen`

shell 的 type-aware lint 读取 `tsconfig.json` 中的 `.next/types/**` 与 `next-env.d.ts`，这些文件被 gitignore、不会进入默认 inputs。让 shell 的 lint 脚本先执行 `next typegen`，使生成类型在 lint 前确定存在；typegen 由源码与 tsconfig 决定，lint 的 hash 仍以已跟踪输入为准。替代方案是让 `shell#lint` 依赖 `build`，会强制完整 Next 构建，代价过高；直接把 `.next/**` 加入 lint inputs 则可能引用不存在的文件，且把构建产物当输入。

### 5. 测试依赖 `^build`，canvas 通过包级配置保留本包构建

根 `test`/`test:coverage` 改为 `dependsOn: ["^build"]`。除 canvas 的 MF manifest 测试外，所有测试直接 import `src`，依赖包仍由 `^build` 构建。新增 `apps/canvas/turbo.json`：

```json
{
  "extends": ["//"],
  "tasks": {
    "test": { "dependsOn": ["build"] },
    "test:coverage": { "dependsOn": ["build"] }
  }
}
```

包级数组字段会替换根配置，但 canvas 的 `build` 自带 `^build`，依赖包仍会先构建。替代方案是维持现状，让每个包的测试都触发本包构建；这会保留“测试覆盖构建产物”的强约束，但让 `pnpm test` 在骨架阶段就执行 Next、Rspack 与 Nest 的全量构建，反馈成本过高。构建产物契约仍由 `pnpm build`、CI build job 与 canvas 的 MF manifest 测试覆盖。

### 6. build 与 typecheck 使用不同增量状态

BFF/Gateway 的 typecheck 脚本通过 CLI 覆盖增量文件路径：

```bash
tsc -p tsconfig.json --noEmit --tsBuildInfoFile .turbo/tsconfig.typecheck.tsbuildinfo
```

`tsconfig.json` 保留 build 使用的 `.turbo/tsconfig.tsbuildinfo`；`tsconfig.build.json` 显式设置 `"incremental": false`。这样 Nest 的 `deleteOutDir` 只会删除 build 侧的路径，typecheck 的增量状态不受影响，build 也不再维护一个每次都会被清理的无效 tsbuildinfo。替代方案是关闭 Nest 的 `deleteOutDir`，但会在 `dist` 中留下上次构建的陈旧文件，风险更高。shell 的 tsbuildinfo 仍由 Next 管理（`.next/cache/tsconfig.tsbuildinfo`），不需要改动。

### 7. CI 用 per-job 的 `actions/cache` 持久化 `.turbo/cache`

三个 reusable workflow 各加一个 `actions/cache` step，缓存键包含 runner OS、job 名、`pnpm-lock.yaml` 与 `turbo.json` 的内容哈希，`restore-keys` 使用 `OS-turbo-<job>-` 前缀。per-job 键避免三个并行 job 用同一个键互相覆盖“先保存者胜出”的问题；跨 run 复用即可覆盖大多数重复构建。同一 run 内跨 job 的实时复用需要 Remote Cache，留作后续独立变更。缓存 step 失败不阻断 job（使用 `continue-on-error` 或在 turbo 失败时才暴露真实错误），保证缓存不可用时仍能全量构建。

同时在三个 workflow 的 `env` 中补 `TURBO_UI: 'false'`，避免非 TTY 环境下尝试 TUI；`ci-build.yml` 补 `CI: 'true'` 与其他两个 workflow 保持一致（GitHub Actions 本身也会设置）。

### 8. dev 脚本按包的角色收敛

只有被应用通过 `dist` 消费、且开发期需要持续重建的库提供 `dev`（当前为 config、ui）。纯类型包 contracts 与 dev-only 预设包 vitest-config 不提供 `dev`，避免 `pnpm dev` 的 TUI 面板出现无实际收益的常驻任务。根 `package.json` 的 `dev` 只过滤 `./apps/*`，另设 `dev:packages` 运行库包 watch；依赖构建仍由 `dev.dependsOn: ["^build"]` 保证。替代方案是保留所有库包的 `dev` 并由根 `dev` 一并启动，面板更嘈杂；等 contracts 有消费者且需要热更新时再加回。

### 9. 文档与规则对齐

- `.env.example` 删除“测试加载 `.env.test`”的说明，保留 dev/build 链。
- `.claude/rules/env.md` 把测试条目改为“测试不加载 `.env`，配置由 stub 提供”，并在变量归属中加入 `globalPassThroughEnv`。
- `docs/toolchain.md` 的 verify 链改为 `test:coverage`，并同步 `globalEnv`/`globalPassThroughEnv` 的说明。
- `docs/testing.md` 把“test 在 build 之后运行”改为“依赖包先构建；只有读取本包产物的测试才构建本包”。
- `turbo.json` 的 `typecheck.description` 不再声称“不产出文件”，改为说明会写增量状态与 Next 生成类型。

## Risks / Trade-offs

- [缓存键变化导致首次 CI 全量构建] → 这是预期的一次性成本；per-job 缓存从第二次 run 开始生效。
- [运行时变量移出哈希后，某个构建意外消费它] → 已审计现有消费点；`build`/`typecheck` 仍保留 `$TURBO_ROOT$/.env*` 输入，文件变化不会漏失效。
- [`next typegen` 增加 shell lint 时间，并可能改写 tsconfig] → typegen 只在 lint 前执行一次；任务中检查 `git diff apps/shell/tsconfig.json`，若发生改写则把差异纳入提交或调整 Next 配置。
- [测试不再构建非 canvas 应用，可能漏掉构建产物问题] → `pnpm build`、CI build job 与 canvas MF manifest 测试仍覆盖构建产物；后续若新增读取 dist 的测试，需按包级配置声明本包 build。
- [actions/cache 使用相同键的并行保存冲突] → 使用 per-job 键；跨 job 复用明确留给 Remote Cache。
- [tsbuildinfo 拆分为两个文件增加少量磁盘占用] → 可忽略；换取 typecheck 增量状态不被删除。

## Migration Plan

1. 修改 `turbo.json`、根 `package.json`、新增 `apps/canvas/turbo.json`、`apps/shell/package.json`、BFF/Gateway 的 tsconfig。
2. 修改三个 CI workflow 的缓存与 env。
3. 同步 `.env.example`、`.claude/rules/env.md`、`docs/toolchain.md`、`docs/testing.md`、`docs/ci-cd.md` 与 task description。
4. 运行 `pnpm install`、`pnpm lint`、`pnpm typecheck`、`pnpm test`、`pnpm test:coverage`、`pnpm build`、`pnpm verify`；用 `turbo run build --dry=json` 确认 outputs 不含 `.next/dev`，用 `turbo run test:coverage --dry=json` 确认只有 canvas 依赖本包 build。
5. 回滚：还原上述配置与 workflow 文件即可；不涉及数据或外部服务迁移，旧缓存条目会自然淘汰。
