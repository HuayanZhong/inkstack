# AGENTS.md

补充根文件的规则。本目录是 tldraw 画布应用，Rspack 构建，开发端口 `:4002`。

## 职责

- 渲染 tldraw 画布，是所有画布 action 的唯一执行者。
- 通过 MF 暴露 `./Canvas`，供 shell 作为 host 加载。
- 不直接写 design.json，不持有 action 队列。

## 目录

- `src/Canvas.tsx`：画布组件，独立页面与 remote 共用。
- `src/App.tsx`、`src/index.ts`：独立页面入口与 MF 异步边界。
- `module-federation.config.ts`：remote 名称、exposes、shared。
- `rspack.config.ts`：构建配置与 dev server 端口。

## 命令

在仓库根执行：

```bash
pnpm --filter @inkstack/canvas dev   # :4002
pnpm --filter @inkstack/canvas build
pnpm --filter @inkstack/canvas typecheck
pnpm --filter @inkstack/canvas lint
```

## 约束

- 依赖只通过 `catalog:` 引用；运行时库进 `runtime` catalog，构建工具进 `dev`。
- React 必须保持单例：`shared` 中的 `react` / `react-dom` 不要去掉 `singleton`。
- 不改 `src/index.ts` 的异步边界，它负责在应用代码前初始化 shared 模块。
