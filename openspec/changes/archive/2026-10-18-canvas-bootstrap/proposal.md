# Proposal

## Why

`apps/shell`、`apps/bff` 已能启动，`apps/canvas` 仍是空占位。画布是整个产品唯一执行 action 的地方，也是后续 MF 接入、AI 控笔、codegen 的共同前提。先把画布独立跑起来，再谈它如何被 shell 加载。

同时确认构建工具：画布用 **Rspack + `@module-federation/enhanced`**，而不是 Vite。原因是 Next 16 内置的 Module Federation 只消费 webpack 体系的 `script` remote，用 Rspack 可以让 shell 走原生接入，避免额外一层兼容成本。

## What Changes

- 用 `create-mf-app` 生成 `apps/canvas` 骨架（类型 Application、框架 react-19、样式原生 CSS、端口 4002），生成物并入现有占位目录。
- 用 `tldraw` 渲染一屏画布：独立页面与 MF 暴露的 `./Canvas` 共用同一个组件。
- 配置 `module-federation.config.ts`：`name: 'canvas'`、`exposes: { './Canvas': './src/Canvas.tsx' }`、`shared` 中的 React 声明为 singleton。
- 清理模板产物（`.babelrc`、模板 `README.md`、Git 忽略文件），`tsconfig.json` 继承 `@inkstack/tsconfig/react.json`。
- scripts 改成跨平台写法（`rspack build --mode production` / `rspack serve --mode development`），补齐 `dev` / `build` / `lint` / `typecheck`。
- `runtime` catalog 加入 `tldraw`；`dev` catalog 加入 Rspack、Module Federation、PostCSS 相关依赖。
- 新增 `apps/canvas/AGENTS.md`、`CLAUDE.md`、`README.md`；更新根 `README.md`。

**BREAKING**：无。

不在本次范围：shell 加载 canvas、MF 联调、iframe、gateway 连接、tldraw 自定义形状或 Agent starter kit。

## Capabilities

### New Capabilities

无。本次只让应用达到「能启动并渲染画布」，不产生需要长期维护的行为契约；`.openspec.yaml` 已声明 `skip_specs: true`。

### Modified Capabilities

无。

## Impact

- **代码**：`apps/canvas/**` 首次出现源码；根 `README.md` 状态描述更新。
- **依赖**：`tldraw@5.5.2` 进入 `runtime`；Rspack 2、`@module-federation/enhanced` 2、PostCSS 链进入 `dev`。
- **构建**：`turbo run build` 开始产出 `apps/canvas/dist`（含 `remoteEntry.js`）；`pnpm dev` 同时启动 shell、bff、canvas 与 contracts 监听。
- **配置**：`.oxlintrc.json` 中 `apps/canvas` 的 browser / react override 已存在，本次不改。
