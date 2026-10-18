# Proposal

## Why

当前 canvas 只完成了一半 Module Federation 配置：缺少 `asyncStartup`、`manifest`，publicPath 在 production 也写死 `localhost:4002`，同时 `src/index.ts` 又保留着手工异步边界。shell 侧完全没有消费实现，两份应用的 `AGENTS.md` 还分别写着「MF host」和「iframe 承载」。结果是 provider 不可被标准方式消费，host 也没有可行路径。

官方 Next.js MF 插件明确标注 App Router 不受支持且项目已 deprecated，因此 shell 不能再走 `next.config` 插件方案，只能用 Module Federation 2.0 的 runtime API 在客户端消费。这次变更把 canvas 收敛为规范 provider，并把 shell 接成纯 runtime consumer。

## What Changes

- canvas 开启 `experiments.asyncStartup`，删除 `src/index.ts` 的手写异步边界。
- canvas 开启 `manifest: true`、显式 `dts: true`，并显式声明 `shareStrategy`。
- `output.publicPath` 按环境拆分：dev 使用 `http://localhost:4002/`，production 使用 `auto`。
- canvas 保持 `./Canvas` 为唯一公开边界，React / ReactDOM 继续以 singleton 共享。
- shell 新增纯 runtime consumer：客户端组件中通过 `@module-federation/enhanced/runtime` 的 `createInstance` + `loadRemote` 加载 `canvas/Canvas`，不使用任何 Next MF 插件。
- shell 的 remote 入口来自 `NEXT_PUBLIC_CANVAS_MF_ENTRY`，默认指向 `http://localhost:4002/mf-manifest.json`。
- shell 为加载失败与加载中提供最小可见状态，远程组件禁止 SSR。
- 统一 `apps/shell/AGENTS.md`、`apps/canvas/AGENTS.md` 与 `docs/architecture/DESIGN-RECORD.md` 中关于 MF 的表述，把决策状态从「候选」改为「已定」。
- 删除手建且为空的 `openspec/changes/shell-canvas-mf/` 与 `openspec/changes/canvas-material-loader/`；后续需要时用 `openspec new change` 重建。

## Capabilities

### New Capabilities

- `canvas-remote-provider`: canvas 作为 MF provider 的启动方式、产物（manifest / remoteEntry）、公开模块边界、共享依赖与资源地址规则。
- `shell-canvas-consumer`: shell 作为 Next.js App Router 纯 runtime consumer 的加载、渲染、失败处理与配置来源。

### Modified Capabilities

<!-- 无既有 capability，未修改任何既有规格。 -->

## Impact

- 代码：`apps/canvas/module-federation.config.ts`、`apps/canvas/rspack.config.ts`、`apps/canvas/src/index.ts`；新增 `apps/shell/src/app/canvas-host.tsx`，修改 `apps/shell/src/app/page.tsx`。
- 依赖：shell 新增 `@module-federation/enhanced`。该包已存在但位于 `dev` catalog；因为 shell 会把它打进浏览器产物，需要移到 `runtime` catalog，canvas 的引用随之一并改为 `catalog:runtime`。
- 配置：shell 读取 `NEXT_PUBLIC_CANVAS_MF_ENTRY`；文档补充两个应用的启动顺序（canvas 先于 shell）。
- 文档：两份应用 `AGENTS.md` 与 `docs/architecture/DESIGN-RECORD.md`。
- 非目标：不引入 `@module-federation/nextjs-mf`，不做 SSR 远程渲染，不新增 `@inkstack/contracts` 包，不改动 Gateway / action 队列。
