# Tasks

## 1. 依赖与 catalog

- [x] 1.1 把 `@module-federation/enhanced` 从 `pnpm-workspace.yaml` 的 `dev` catalog 移到 `runtime` catalog，验证 `pnpm check:manifests` 通过。
- [x] 1.2 把 canvas 的 `@module-federation/enhanced` 改为 `catalog:runtime`，在 shell 的 dependencies 中加入同一引用，执行 `pnpm install` 并确认 lockfile 更新。

## 2. Canvas provider 规范化

- [x] 2.1 改写 `apps/canvas/module-federation.config.ts`：使用 `createModuleFederationConfig`，加入 `manifest: true`、`dts: true`、`shareStrategy: 'loaded-first'`，保留 `./Canvas` 与 React 单例。验证 `pnpm --filter @inkstack/canvas typecheck` 通过。
- [x] 2.2 在 `apps/canvas/rspack.config.ts` 开启 `experiments.asyncStartup`，把 `output.publicPath` 改为 dev 用 localhost、production 用 `auto`。验证 production 构建产物中不再出现 localhost。
- [x] 2.3 把 `apps/canvas/src/index.ts` 改为直接导入应用入口，删除手写异步边界。验证 dev 页面正常渲染且控制台无 eager consumption 错误。
- [x] 2.4 执行 `pnpm --filter @inkstack/canvas build`，确认输出同时包含 `remoteEntry.js`、`mf-manifest.json` 与远程类型压缩产物，且 manifest 的 `exposes` 含 `./Canvas`。
- [x] 2.5 用已安装的 `/mf config-check` 检查 canvas，确认 `CONFIG-ASYNC-ENTRY` 警告消失。

## 3. Shell runtime consumer

- [x] 3.1 新增 `apps/shell/src/app/canvas-host.tsx`：客户端组件，在 `useEffect` 中动态导入 `@module-federation/enhanced/runtime`，用模块级缓存的 `createInstance` 注册 remote 与 React 单例，`loadRemote` 后渲染 `Canvas`。验证 `pnpm --filter @inkstack/shell typecheck` 通过。
- [x] 3.2 在 `canvas-host` 中实现加载中、加载失败两种可见状态，失败时不影响页面其他内容。验证 canvas 未启动时页面显示失败提示且无未捕获异常。
- [x] 3.3 修改 `apps/shell/src/app/page.tsx`，用最小布局接入 `CanvasHost`，保留标题并让画布占据主区域。验证 `pnpm --filter @inkstack/shell build` 通过。
- [x] 3.4 先启动 canvas 再启动 shell，手工确认画布渲染、tldraw 样式完整、页面中只有一份 React；关闭 canvas 后确认失败提示生效。

## 4. 文档与清理

- [x] 4.1 更新 `apps/canvas/AGENTS.md`：记录 `asyncStartup`、manifest、publicPath 约定与唯一暴露边界。验证文档描述与 `rspack.config.ts`、`module-federation.config.ts` 一致。
- [x] 4.2 更新 `apps/shell/AGENTS.md`：把 iframe 表述改为 runtime consumer，记录 `NEXT_PUBLIC_CANVAS_MF_ENTRY` 与启动顺序。验证文档描述与 `canvas-host.tsx` 一致。
- [x] 4.3 更新 `docs/architecture/DESIGN-RECORD.md`：把 MF 决策状态改为「已定」，记录 App Router 使用 runtime API，并修正表格外的孤立行。验证表格结构完整。
- [x] 4.4 删除空的 `openspec/changes/shell-canvas-mf/` 与 `openspec/changes/canvas-material-loader/`，运行 `pnpm exec openspec list` 确认只剩当前变更。

## 5. 集成验证

- [x] 5.1 在仓库根执行 `pnpm typecheck`，确认全部 workspace 通过。
- [x] 5.2 在仓库根执行 `pnpm build`，确认 shell 与 canvas 均产出成功。
- [x] 5.3 按 `AGENTS.md` 的命令启动两个应用，确认用户访问 shell 时能看到可交互的 tldraw 画布。

## Workflow follow-up

- 评审通过后用 `/opsx:archive` 归档本次变更。
