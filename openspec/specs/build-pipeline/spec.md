# build-pipeline Specification

## Purpose

定义 Turborepo 任务图、缓存边界、环境变量哈希分类与 CI 缓存复用的系统行为，使本地与 CI 使用相同输入得到相同结果，并避免无关变化放大缓存或触发重复构建。

## Requirements

### Requirement: 构建缓存只包含构建产物

`build` 任务的 `outputs` SHALL 只包含构建产物；Next 的 `.next/cache/**` 与 `.next/dev/**` MUST 被排除。缓存命中时 MUST NOT 把 dev server 状态恢复到工作区。

#### Scenario: dev 后构建

- **WHEN** 先运行 shell 的 dev server，再运行 `pnpm build`
- **THEN** `shell#build` 的缓存清单不包含 `.next/dev` 下的任何文件

#### Scenario: 干净检出恢复缓存

- **WHEN** 在干净检出中命中 `shell#build` 缓存
- **THEN** 工作区只恢复 `.next` 构建产物，不包含 HMR、turbopack 或其他 dev 状态文件

#### Scenario: 缓存体积稳定

- **WHEN** 同一提交在不同时间重复执行构建
- **THEN** 构建缓存体积不随 dev server 历史增长

### Requirement: 环境变量按缓存影响分类

影响构建产物的环境变量 SHALL 声明在 `env` 或 `globalEnv` 并参与任务哈希；只影响运行时或 dev server 的变量 MUST 声明在 `passThroughEnv`，MUST NOT 参与哈希。`NEXT_TELEMETRY_DISABLED` MUST 透传给 Next 构建。

#### Scenario: 修改运行时端口

- **WHEN** 修改 `BFF_PORT`、`GATEWAY_PORT` 或 `CANVAS_PORT` 等运行时变量
- **THEN** `build`、`typecheck` 与 `lint` 的缓存键保持不变

#### Scenario: 修改构建期公开变量

- **WHEN** 修改 `NEXT_PUBLIC_CANVAS_MF_ENTRY`
- **THEN** shell 的 `build` 缓存失效，不消费该变量的包不因它失效

#### Scenario: CI 透传 telemetry 开关

- **WHEN** CI 设置 `NEXT_TELEMETRY_DISABLED=1` 并执行 `next build`
- **THEN** 构建进程能读取该变量，Next telemetry 被关闭

#### Scenario: env 文件变化

- **WHEN** 修改根目录任一 `.env*` 文件
- **THEN** `build` 与 `typecheck` 的缓存失效

### Requirement: 测试任务只构建必需产物

`test` 与 `test:coverage` SHALL 依赖 `^build` 以构建依赖包；只有测试直接读取本包构建产物时，该包 MUST 通过包级配置额外依赖本包 `build`。测试 MUST NOT 为未读取的产物触发构建。

#### Scenario: 普通包测试不构建本包

- **WHEN** 执行 `pnpm test`
- **THEN** shell、bff、gateway 与非 canvas 的包不因测试而执行本包 `build`

#### Scenario: canvas 读取 MF 产物

- **WHEN** canvas 的 MF manifest 测试读取 `dist/mf-manifest.json`
- **THEN** canvas 的 `test` 与 `test:coverage` 先构建 canvas 自身

#### Scenario: 依赖包已构建

- **WHEN** 测试通过 `@inkstack/*` 导入工作区包
- **THEN** 这些依赖包的 `build` 在测试前完成

#### Scenario: 读取未声明的产物

- **WHEN** 测试读取本包 `dist` 但该包未声明测试依赖本包构建
- **THEN** 测试因产物缺失而失败，而不是静默跳过

### Requirement: 类型感知 lint 使用确定输入

使用 `--type-aware` 的 lint SHALL 在其读取的生成类型存在且已纳入缓存输入后运行；生成类型 MUST 由 lint 前的确定性步骤生成，或由任务依赖保证其存在。

#### Scenario: 干净检出执行 shell lint

- **WHEN** 干净检出中没有 `.next/types` 与 `next-env.d.ts`，执行 shell 的 lint
- **THEN** lint 先运行 `next typegen`，再执行 type-aware 检查

#### Scenario: 生成类型变化

- **WHEN** 路由或页面结构变化导致 `.next/types` 内容变化
- **THEN** shell 的 lint 缓存失效并重新执行

#### Scenario: 非 Next 包

- **WHEN** 对没有生成类型的包执行 type-aware lint
- **THEN** 其 lint 输入与缓存行为不受上述步骤影响

### Requirement: 增量编译状态按任务隔离

`build` 与 `typecheck` MUST 使用不同的 `tsBuildInfoFile`；清理 `outDir` 的工具 MUST NOT 删除 `typecheck` 的增量状态。

#### Scenario: build 后 typecheck

- **WHEN** 同一包先执行 `build` 再执行 `typecheck`
- **THEN** 两者不因 `rootDir` 或 `include` 不同而互相作废增量状态

#### Scenario: Nest 清理 outDir

- **WHEN** Nest 使用 `deleteOutDir: true` 执行 `build`
- **THEN** `typecheck` 使用的 `tsBuildInfoFile` 仍存在且可复用

#### Scenario: 无增量状态

- **WHEN** 干净检出中不存在任何 `tsBuildInfoFile`
- **THEN** build 与 typecheck 都执行完整编译并成功产出

### Requirement: CI 复用 Turborepo 缓存

CI SHALL 持久化 `.turbo/cache` 并在后续 run 复用；缓存键 MUST 包含 lockfile、`turbo.json` 与 runner OS。未配置 Remote Cache 时，CI MUST 使用本地缓存持久化；配置 Remote Cache 时 MAY 用它实现跨 job 复用。

#### Scenario: 第二次 run 命中缓存

- **WHEN** lockfile 与 `turbo.json` 未变化，重复执行 CI
- **THEN** 未变化的任务从缓存恢复，不重新执行

#### Scenario: lockfile 变化

- **WHEN** 依赖版本变化导致 lockfile 变化
- **THEN** 缓存键变化，相关任务重新执行

#### Scenario: 缓存不可用

- **WHEN** 缓存服务或缓存 step 失败
- **THEN** CI 仍能全量构建并通过，不因缓存不可用而失败

#### Scenario: 多个 CI job

- **WHEN** static、test、build 在同一 run 中并行执行
- **THEN** 各 job 能复用上一 run 的缓存；同一 run 内的跨 job 复用由 Remote Cache 提供，未配置时不作强制要求
