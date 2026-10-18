# Design

## Context

动机见 [proposal.md](proposal.md)。设计相关的现状：

- `apps/canvas` 只有占位 `package.json`，没有源码与构建配置。
- `packages/tsconfig/react.json` 已存在（bundler resolution、DOM、`react-jsx`、`types: []`），尚无消费者。
- `.oxlintrc.json` 已为 `apps/canvas` 配置 browser 环境与 `react` / `jsx-a11y` 插件。
- `runtime` catalog 已有 `react` / `react-dom`（^19.3.0），没有 `tldraw`。

已用 `create-mf-app` 的 programmatic API 在临时目录实跑过：生成的是 **Rspack** 工程，包含 `module-federation.config.ts`、`rspack.config.ts`、`src/index.ts`、`src/App.tsx`、`index.html`、`.babelrc`、`tsconfig.json`。交互式 CLI 需要 TTY，非交互环境只能用 `buildProject()`。

## Goals / Non-Goals

**Goals:**

- `apps/canvas` 能通过仓库根命令 `dev` / `build` / `lint` / `typecheck` 被驱动。
- 独立页面渲染 tldraw；同一组件通过 `./Canvas` 暴露给未来的 host。
- 构建产物包含 `remoteEntry.js`，为 `shell-canvas-mf` 做准备。

**Non-Goals:**

- 不接 shell、不实现 MF 消费、不做 SSR 相关处理。
- 不接 gateway，不产生或执行 action。
- 不引入 tldraw 的自定义 shape、Agent starter kit、持久化。

## Decisions

### 1. 用 `create-mf-app` 的 programmatic API 生成

CLI 交互式提示在非 TTY 环境会抛 `ERR_TTY_INIT_FAILED`，所以用：

```js
const { buildProject } = require('create-mf-app')
buildProject({
  type: 'Application',
  name: 'canvas',
  port: '4002',
  framework: 'react-19',
  css: 'CSS',
})
```

选择 `Application` 而不是 `Library`：remote 是 Application 的角色，不是项目类型；canvas 既要独立启动，又要暴露组件。生成后并入 `apps/canvas`。

### 2. 版本按 registry latest 重写

模板写的是 Rspack `~1.2.0`、`@module-federation/enhanced` `^0.8.9`，明显滞后。按 registry 最新版写入 catalog：

| 包                                                           | 版本                                        |
| ------------------------------------------------------------ | ------------------------------------------- |
| `@rspack/cli` / `@rspack/core`                               | `^2.2.9`                                    |
| `@rspack/plugin-react-refresh`                               | `^2.0.2`                                    |
| `@module-federation/enhanced`                                | `^2.9.2`                                    |
| `react-refresh`                                              | `^0.19.0`                                   |
| `css-loader` / `postcss` / `postcss-loader` / `autoprefixer` | `^7.1.5` / `^8.5.30` / `^8.2.1` / `^10.6.1` |
| `ts-node`                                                    | `^10.9.2`                                   |
| `tldraw`                                                     | `^5.5.2`                                    |

已核对 peer：`plugin-react-refresh@2` 要求 `@rspack/core ^2.0.0`；`tldraw@5.5.2` 接受 React `^19.2.1`；`@module-federation/enhanced` 的 webpack peer 可选。

### 3. scripts 改为跨平台写法

模板的 `NODE_ENV=production rspack build` 在 Windows cmd 下不生效。改为：

| script      | 命令                                                  |
| ----------- | ----------------------------------------------------- |
| `dev`       | `rspack serve --mode development`                     |
| `build`     | `rspack build --mode production`                      |
| `lint`      | `oxlint --config ../../.oxlintrc.json --type-aware .` |
| `typecheck` | `tsc --noEmit`                                        |

不保留模板的 `build:dev` / `build:start`。

### 4. tsconfig 继承 react 预设

`apps/canvas/tsconfig.json` 增加 `"extends": "@inkstack/tsconfig/react.json"`，保留模板的 `paths: { "*": ["./@mf-types/*"] }` 与 `allowImportingTsExtensions`（需要 `noEmit`，模板已设）。`include` 保持 `["src"]`，`rspack.config.ts` / `module-federation.config.ts` 属于构建配置，不纳入类型检查。

### 5. MF 配置与组件复用

```ts
// module-federation.config.ts
export const mfConfig = {
  name: 'canvas',
  filename: 'remoteEntry.js',
  exposes: { './Canvas': './src/Canvas.tsx' },
  shared: {
    react: { singleton: true },
    'react-dom': { singleton: true },
  },
}
```

`src/Canvas.tsx` 是唯一实现：导入 `tldraw/tldraw.css`，渲染 `<Tldraw />` 到一个撑满容器的 div。`src/App.tsx` 直接渲染 `<Canvas />`，所以独立页面与 remote 消费走同一份代码。

### 6. 清理模板产物

删除 `.babelrc`（Rspack 用 `builtin:swc-loader`）、`.gitignore`（根已覆盖）、模板 `README.md`（替换）。

### 7. 依赖归属

`tldraw` 是运行时库 → `runtime` catalog。Rspack、MF 插件、loader、`react-refresh`、`ts-node` 都是构建期依赖 → `dev` catalog。`react` / `react-dom` 复用已有 `runtime` 条目。

## Risks / Trade-offs

- **Rspack 2.x 与模板配置（写于 1.2）不兼容** → 先按原样安装，`pnpm build` 报错时以 Rspack 2 文档为准调整 `rspack.config.ts`，不降级到 1.x。
- **tldraw 的 CSS 与 Rspack `experiments.css` 的交互** → `Canvas.tsx` 顶部导入 `tldraw/tldraw.css`；若样式丢失，检查 CSS 规则与 `experiments.css` 是否冲突。
- **`remoteEntry.js` 未生成** → `ModuleFederationPlugin` 必须接入 `rspack.config.ts` 的 plugins；构建后检查 `dist/remoteEntry.js`。
- **独立页面空白** → tldraw 需要容器有明确高度；`Canvas` 外层使用 `position: fixed; inset: 0`。
- **dev server 端口冲突** → 4002 写死在 `rspack.config.ts` 的 `devServer.port`，启动前确认端口空闲。
