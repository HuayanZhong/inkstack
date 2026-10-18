# Tasks

## 1. Catalog

- [x] 1.1 在 `pnpm-workspace.yaml` 的 `runtime` catalog 增加 `tldraw`，在 `dev` catalog 增加 `@rspack/cli`、`@rspack/core`、`@rspack/plugin-react-refresh`、`@module-federation/enhanced`、`react-refresh`、`css-loader`、`postcss`、`postcss-loader`、`autoprefixer`、`ts-node`；验证：`pnpm check:manifests` 输出 0 errors，且条目都能从 `pnpm-workspace.yaml` 读到。

## 2. 脚手架并入

- [x] 2.1 在临时目录用 `create-mf-app` 的 `buildProject({ type: 'Application', name: 'canvas', port: '4002', framework: 'react-19', css: 'CSS' })` 生成骨架，并入 `apps/canvas`；删除 `.babelrc`、`.gitignore`、模板 `README.md`；验证：`find apps/canvas -maxdepth 2 -type f` 只剩 `index.html`、`module-federation.config.ts`、`package.json`、`rspack.config.ts`、`tsconfig.json` 与 `src/` 下的文件。
- [x] 2.2 改写 `apps/canvas/package.json`：名称 `@inkstack/canvas`、版本 `0.0.0`、`private`、`license: ISC`、40–120 字符中文描述；依赖全部换成 catalog 引用；scripts 改为 `dev` / `build` / `lint` / `typecheck`；删除 `packageManager` 字段；验证：`pnpm install` 成功，`pnpm check:manifests` 输出 0 errors，`pnpm --filter @inkstack/canvas exec rspack --version` 输出版本。
- [x] 2.3 在 `apps/canvas/tsconfig.json` 增加 `"extends": "@inkstack/tsconfig/react.json"`，保留 `paths` 与 `allowImportingTsExtensions`；验证：`pnpm --filter @inkstack/canvas typecheck` 通过。

## 3. 画布组件

- [x] 3.1 新增 `src/Canvas.tsx`：导入 `tldraw/tldraw.css`，在撑满视口的容器里渲染 `<Tldraw />`；`src/App.tsx` 改为渲染 `<Canvas />`；验证：`pnpm --filter @inkstack/canvas build` 通过，`dist` 中有 JS 与 CSS 产物。
- [x] 3.2 启动 `pnpm --filter @inkstack/canvas dev`，访问 `http://localhost:4002`；验证：页面显示 tldraw 工具栏与白色画布，控制台无报错。

## 4. Module Federation 配置

- [x] 4.1 把 `module-federation.config.ts` 配置为 `name: 'canvas'`、`filename: 'remoteEntry.js'`、`exposes: { './Canvas': './src/Canvas.tsx' }`、`shared` 中 `react` / `react-dom` 为 `singleton: true`；确认 `rspack.config.ts` 已注册 `ModuleFederationPlugin`；验证：`pnpm --filter @inkstack/canvas build` 后 `apps/canvas/dist/remoteEntry.js` 存在。

## 5. 文档

- [x] 5.1 新增 `apps/canvas/AGENTS.md`（职责、目录、命令、约束，以「补充根文件的规则」开头）与只写 `@AGENTS.md` 的 `CLAUDE.md`；验证：手写区 ≤25 行且 ≤1,000 非空白字符。
- [x] 5.2 新增 `apps/canvas/README.md`（职责、运行命令、MF 暴露说明）；更新根 `README.md` 说明 canvas 已能启动；验证：`pnpm format:check` 通过，根 README 不再声称 canvas 只有 `package.json`。

## 6. 集成验证

- [x] 6.1 在仓库根依次执行 `pnpm install`、`pnpm typecheck`、`pnpm lint`、`pnpm build`；验证：四条命令全部成功，`apps/canvas/dist/remoteEntry.js` 存在。
- [x] 6.2 在仓库根执行 `pnpm dev`，确认 shell `:3000`、bff `:4003`、canvas `:4002` 同时可用；验证：`curl -s -o /dev/null -w "%{http_code}" http://localhost:4002` 返回 `200`，页面可交互。
- [x] 6.3 检查 `git status`：验证：改动都在 `apps/canvas/`、`pnpm-workspace.yaml`、`pnpm-lock.yaml`、根 `README.md` 与本次 change 目录内；`dist/` 未被跟踪。

## Workflow follow-up

- 评审通过后归档本次 change。
