# Design

## Context

动机见 [proposal.md](proposal.md)。当前实现与约束：

- canvas 使用 Rspack `2.2.9` 与 `@module-federation/enhanced` `2.9.2`，dev server 在 `4002`，已暴露 `./Canvas` 并共享 React 单例。
- canvas 未开启 `experiments.asyncStartup`，`src/index.ts` 仍用 `void import('./App')` 手工建立异步边界。
- `output.publicPath` 在所有模式下写死 `http://localhost:4002/`。
- shell 是 Next.js 16 App Router，`next.config.ts` 启用了 `cacheComponents` 与 `partialPrefetching`，目前没有任何 MF 配置。
- 官方文档明确 `@module-federation/nextjs-mf` 不支持 App Router，且项目已 deprecated；`@module-federation/enhanced/runtime` 支持无构建插件的纯 runtime consumer。
- `@module-federation/enhanced` 目前只出现在 `dev` catalog。

## Goals / Non-Goals

**Goals:**

- 让 canvas 的 provider 配置符合 MF 2.0 的标准产物与启动方式。
- 让 shell 在 App Router 下以官方支持的 runtime consumer 路径加载画布。
- 保持 monorepo 的依赖、类型与文档约定一致。

**Non-Goals:**

- 不做远程组件的服务端渲染或数据预取。
- 不引入 Bridge、Multi-Zones 或 iframe 作为并行方案。
- 不为 canvas 新增业务能力（action、Agent、持久化）。

## Decisions

### 1. provider 使用 `createModuleFederationConfig`

`module-federation.config.ts` 改为从 `@module-federation/enhanced/rspack` 导入 `createModuleFederationConfig`，配置包含：

- `name: 'canvas'`、`filename: 'remoteEntry.js'`
- `manifest: true`、`dts: true`
- `shareStrategy: 'loaded-first'`
- `exposes: { './Canvas': './src/Canvas.tsx' }`
- `shared: { react: { singleton: true }, 'react-dom': { singleton: true } }`

选 `createModuleFederationConfig` 而不是裸对象，是为了让配置在编辑期获得类型约束；两者在 `ModuleFederationPlugin` 中行为一致。`shareStrategy` 选 `loaded-first`：host 与 remote 在同一个仓库、版本一致，优先复用已加载依赖比强制版本协商更省请求。

### 2. 用 `asyncStartup` 取代手工异步边界

`module-federation.config.ts` 的 `experiments.asyncStartup` 设为 `true`（该选项由 MF 插件读取，不是 Rspack 构建器的 `experiments`），`src/index.ts` 改为直接 `import './App'`。Rspack `2.2.9` 满足该选项要求的 `> 1.7.4`。

官方文档说明异步启动后入口自动异步初始化，动态导入不再需要；保留手工边界会形成两套机制，且入口导出的 Promise 语义容易被误解。

### 3. publicPath 只在 dev 写死

`output.publicPath` 改为：

- dev：`http://localhost:4002/`
- production：`auto`

`auto` 由运行时按脚本地址解析，避免生产清单里残留 localhost。若未来部署到需要显式 CDN 前缀的环境，再改用 `getPublicPath`，不在本次引入。

同时显式设置 `output.path` 并开启 `output.clean`：MF 的 DTS 插件在 apply 阶段依赖 `output.path` 计算类型产物位置，缺失时会把 `@mf-types.zip` 发到 `dist/dist/`。dev server 还需返回 `Access-Control-Allow-Origin`，manifest 通过 fetch 跨端口读取。

### 4. shell 采用纯 runtime consumer

不使用 `next.config` 插件。`apps/shell/src/app/canvas-host.tsx` 作为客户端组件：

1. 在 `useEffect` 内动态导入 `@module-federation/enhanced/runtime`，确保服务端求值阶段不触碰 MF runtime。
2. 用模块级缓存的 `createInstance` 创建 host 实例，`remotes` 指向环境变量或默认 manifest。
3. 在 `shared` 中注册 `react` 与 `react-dom`，携带各自 `version` 与 `lib` 工厂。
4. 调用 `loadRemote<CanvasModule>('canvas/Canvas')`，把模块对象里的 `Canvas` 存入状态后渲染。
5. `shareStrategy` 设为 `loaded-first`，React 共享不设 `requiredVersion`，并同时注册 `react-dom/client`。Next App Router 运行时使用内置 React canary，与 remote 声明的稳定版范围不兼容；tldraw 直接导入 `react-dom/client`，不共享子路径会加载 remote 自带的 19.3.1 并触发版本不一致错误。

选 runtime API 而不是 `@module-federation/nextjs-mf`：后者不支持 App Router 且已停止维护；选纯 runtime 而不是在 shell 加 Rspack/Webpack 插件：App Router 的构建流程由 Next 管理，插入另一套 MF 插件会与 Turbopack/缓存层冲突。

远程入口默认 `http://localhost:4002/mf-manifest.json`，允许用 `NEXT_PUBLIC_CANVAS_MF_ENTRY` 覆盖。用 manifest 而不是 `remoteEntry.js`，以保留预加载与 Devtools 能力。

### 5. 类型契约由使用点显式声明

纯 runtime consumer 没有构建插件，不会自动下载 `@mf-types`，因此 shell 不配置 `paths` 指向生成目录。`loadRemote` 使用显式泛型：

```ts
interface CanvasModule {
  Canvas: ComponentType
}
```

canvas 仍生成 dts，供未来带插件的 consumer 或外部使用。若之后 shell 引入 MF 构建插件，再切换到 `@mf-types`。

### 6. 依赖归入 runtime catalog

`@module-federation/enhanced` 会被 shell 打进浏览器产物，属于运行时库。将其从 `dev` catalog 移到 `runtime` catalog；canvas 与 shell 都引用 `catalog:runtime`。版本仍只在 `pnpm-workspace.yaml` 维护。

### 7. 页面接入保持最小

`apps/shell/src/app/page.tsx` 替换 Next 模板内容，保留标题并让画布占据主区域。只验证集成链路，不在本次设计产品级布局。

### 8. 清理手建变更目录

`openspec/changes/shell-canvas-mf/` 与 `openspec/changes/canvas-material-loader/` 没有任何规划产物。直接删除；后续需求用 `openspec new change` 重建。

## Risks / Trade-offs

- **Next 打包 `@module-federation/enhanced/runtime` 失败**（Node 条件导出或体积问题）→ 动态导入放在 `useEffect` 内，先跑 `next build`；若失败，改用 `@module-federation/runtime` 或配置 `serverExternalPackages`，不改方案。
- **React 单例协商失败导致重复实例** → host 与 remote 同时声明 singleton 并携带 `version`；验证时检查 `window.__FEDERATION__` 与页面是否存在两份 React。
- **Next 内置 React canary 与 remote 稳定版不一致** → 共享不做版本检查并覆盖 `react-dom/client`；Next 改变内置版本策略时重新核对共享配置。
- **tldraw CSS 随远程加载丢失** → 确认 `mf-manifest.json` 的 assets 包含 CSS，浏览器中检查 `<link>`；必要时检查 Rspack `experiments.css` 产物。
- **production 使用 `auto` 后子路径部署异常** → `auto` 基于脚本地址解析；若实际部署在反向代理改写路径下，改用 `getPublicPath`，在部署阶段处理。
- **canvas 未启动时页面报错** → `canvas-host` 捕获加载失败并显示提示，shell 其余内容不受影响。
- **asyncStartup 改变入口导出语义** → canvas 入口没有被其他代码直接 require，独立页面与远程消费都通过插件包装，风险可控；构建后检查 `remoteEntry.js` 可加载。

## Migration Plan

1. 调整 catalog 归属并执行 `pnpm install`。
2. 修改 canvas provider 配置与入口，构建并检查 `remoteEntry.js`、`mf-manifest.json` 与类型产物。
3. 新增 shell runtime consumer，先启动 canvas，再启动 shell 做手工冒烟。
4. 更新两份 `AGENTS.md` 与 `DESIGN-RECORD.md`，删除空变更目录。
5. 回滚策略：shell 的 `canvas-host` 可独立移除，canvas 配置回退不涉及数据迁移。
