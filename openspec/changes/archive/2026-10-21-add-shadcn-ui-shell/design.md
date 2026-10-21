# Design

## Context

- shell 是 Next.js 16 App Router 应用；canvas 是 Rspack + React 的 Module Federation remote，二者当前都没有 Tailwind 或共享组件。
- canvas 通过 MF 在 shell 的同一文档中渲染 tldraw，两个应用都会各自打包共享 UI 包。
- shadcn 4.22.1 对现有 monorepo 的要求是：应用与 `packages/ui` 各自持有 `components.json`，风格与别名一致；从应用目录执行 `add` 时 CLI 跨 workspace 路由文件。`init --monorepo` 只用于新建项目。
- 仓库约定：有 `src/` 的包构建到 `dist`，应用通过 `@inkstack/*` + `workspace:*` 消费；依赖走 catalog；有运行时代码的包必须有 Vitest 测试。
- 共享包使用 `@inkstack/tsconfig/node.json`（NodeNext）并开启 `react-jsx` 与 DOM libs；`@inkstack/vitest-config` 提供 `react` 预设。

## Goals / Non-Goals

**Goals:**

- 建立 `@inkstack/ui` 共享包，shell 与 canvas 消费同一套组件与主题。
- 两个应用分别通过 Next PostCSS 与 Rspack `postcss-loader` 处理 Tailwind v4。
- 共享包符合仓库的构建、测试、导出与文档规则。

**Non-Goals:**

- 不迁移现有 `page.module.css`、`canvas-host.tsx` 内联样式与 tldraw 自身样式。
- 不实现主题切换 UI，不引入 `next-themes`。
- 不通过 MF 把 UI 包做成共享运行时依赖；两个应用各自打包。
- 不为应用页面新增业务组件。

## Decisions

### 1. 采用现有 monorepo 模式，不运行 `init --monorepo`

新建 `packages/ui`（`@inkstack/ui`），同时提供：

- `packages/ui/components.json`：`aliases.ui` / `utils` 指向 `@inkstack/ui/*`
- `apps/shell/components.json`：`aliases.ui` / `utils` 指向 `@inkstack/ui/*`，`components` 留在应用内
- 两份配置使用相同的 `style`、`iconLibrary`、`baseColor`

从 shell 目录执行 `shadcn add`，UI 组件落到 `packages/ui/src/components`。备选 `init --monorepo` 会生成新的 `apps/web` 结构，与现仓库冲突。

### 2. 共享样式入口放在 `packages/ui/styles/globals.css`

该文件是唯一的 Tailwind 入口，包含：

```css
@import 'tailwindcss';
@import 'tw-animate-css';
@import 'shadcn/tailwind.css';
```

随后是亮色令牌、系统暗色令牌、`@theme inline` 与 `@layer base`。shell 与 canvas 只通过 `@import "@inkstack/ui/globals.css";` 引入。

扫描范围由两个应用的 `postcss.config.mjs` 控制：`@tailwindcss/postcss` 的 `base` 指向仓库根，自动覆盖 `apps/*/src` 与 `packages/ui/src`，因此 CSS 中不需要 `@source`。

理由：主题与扫描范围只有一处；`base` 是构建配置，不会在 CSS 里产生新的 at-rule，避免编辑器对 `@source` 的误报。备选"每个应用各写一份主题"会产生两份需要同步的变量。

### 3. 共享包构建到 `dist`，CSS 作为静态资源导出

- `tsc -p tsconfig.build.json` 产出 `dist/**`，含 `.d.ts` 与 sourcemap。
- `exports` 提供 `"."`、`"./components/*"`、`"./lib/*"`、`"./globals.css"`。
- `"./components/*"` 与 `"./lib/*"` 的首个条件是 `"source"`，指向 `src`；运行时使用 `default` 的 `dist`。`files` 同时包含 `src`，否则 `publint` 会认为条件目标未发布。
- `styles/` 不参与编译，直接随包发布。

理由：符合仓库"包构建到 dist、应用不跨包引用源码"的规则。shadcn CLI 解析别名时取导出对象的第一个目标，`source` 条件让 `add` 写入 `src` 而不是 `dist`，同时不影响应用运行时解析 `dist`。

### 4. 组件内部使用包名别名，构建时由 tsconfig paths 解析

shadcn 生成的组件可能引用 `@inkstack/ui/lib/utils`。在 `packages/ui/tsconfig.json` 中配置：

```json
"paths": { "@inkstack/ui/*": ["./src/*"] }
```

Vitest 通过 `resolve.alias` 做同样映射。构建产物保留别名，由 Next / Rspack 依据 `exports` 解析到 `dist`。构建使用 NodeNext，相对导入必须带 `.js` 扩展名，保证 `dist` 可被 Node ESM 直接导入。`baseUrl` 在 TypeScript 6 已弃用，不要加回。

理由：自引用在 `dist` 尚未生成时无法通过类型检查；paths 让源码与测试先解析到 `src`，运行期再走导出映射。

### 5. 暗色统一为系统偏好

删除 CLI 写入的 `@custom-variant dark (&:is(.dark *));`，把 `.dark` 变量块并入 `@media (prefers-color-scheme: dark)`。

理由：两个应用此前都跟随系统；不需要客户端脚本或测试。Tailwind v4 的 `dark:` 默认即媒体查询。

### 6. 依赖归一化到 catalog

- 共享包运行时依赖：`@base-ui/react`、`class-variance-authority`、`cn`，以及 `react` / `react-dom` 的 peer 声明。图标依赖在具体组件需要时再加入。
- 共享包 devDependencies：`tailwindcss`、`tw-animate-css`、`shadcn`、`publint`、`vitest`、`jsdom`、`@testing-library/react`、`@testing-library/dom`、`@types/react`、`@types/react-dom`、`vite`、`typescript`、`@inkstack/tsconfig`、`@inkstack/vitest-config`。
- shell / canvas 只保留构建所需的 `@tailwindcss/postcss` 与 `@inkstack/ui`；`tailwindcss` 由共享包的样式入口解析。

CLI 写入的裸版本一律改为 `catalog:*`，并补齐 `pnpm-workspace.yaml` 条目。

### 7. 共享包提供组件行为测试

在 `test/components/button.test.tsx` 使用 `@testing-library/react` 验证：

- 默认渲染出按钮并展示传入文本
- `variant` / `size` 改变时输出对应类名

覆盖率统计 `src/components/**/*.tsx` 与 `src/lib/**/*.ts`，门槛沿用仓库默认值。

### 8. 应用侧清理单应用初始化产物

删除 `apps/shell/components.json` 的单应用别名、`src/components/ui`、`src/lib/utils.ts`，回退 `layout.tsx` 中的 `next/font/google` 改动。shell 的 `globals.css` 只保留 `@import "@inkstack/ui/globals.css";` 与现有布局规则。

理由：这些是上一轮单应用 init 的产物，继续保留会形成两套组件来源，并违反 `next/font/google` 禁令。

## Risks / Trade-offs

- [canvas 引入 Tailwind preflight 影响 tldraw] → 先按完整 preflight 验证；若工具栏或菜单出现回归，改为只导入 `tailwindcss/theme.css` 与 `tailwindcss/utilities.css`，跳过 preflight，并补最小基础样式。
- [Rspack 对 workspace 包 `exports` 的 CSS 子路径解析差异] → 构建后检查 canvas 产物中是否包含共享样式；必要时在 `rspack.config.ts` 的 `resolve` 中补 `exportsFields`。
- [Tailwind 从共享包扫描源码的路径不生效] → 验证按钮类名进入产物 CSS；失败时在构建期注入 `@source`，或给 PostCSS 插件补更精确的 `base`。
- [`source` 是自定义导出条件] → 只由 shadcn CLI 使用；Next / Rspack 构建已验证仍解析 `default` 的 `dist`，改动 `exports` 顺序后必须重跑 `add --dry-run`。
- [两应用各自打包 UI 包导致重复代码] → 当前组件量小，接受重复；后续组件增多时再评估 MF shared。
- [CLI 写入裸 semver] → 初始化后立即归一化 catalog，再跑 `check:manifests`。
- [Next 服务端组件导入 Base UI 组件] → 需要交互的组件保持客户端边界；共享包先只提供无副作用的展示组件，页面使用时按其是否需要交互决定 `'use client'`。

## Migration Plan

1. 回退 shell 的单应用 init 产物与字体改动。
2. 创建 `packages/ui` 骨架：清单、tsconfig、文档、样式入口。
3. 迁入 `button` 与 `utils`，补测试与导出。
4. 配置 shell 与 canvas 的 `components.json`、PostCSS 与共享样式导入。
5. 归一化 catalog，安装依赖。
6. 运行 `pnpm format`、`pnpm lint`、`pnpm check:manifests`、`pnpm typecheck`、`pnpm test`、`pnpm build`。
7. 同时启动 shell 与 canvas，检查共享组件、暗色与 tldraw 视觉。

回滚：删除 `packages/ui`，恢复两个应用的清单、样式与 `layout.tsx`，移除 catalog 条目后重新安装。

## Open Questions

- 是否需要在后续里程碑引入手动主题切换；那会把暗色策略改为 `.dark` 类并增加客户端脚本。
