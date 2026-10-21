# @inkstack/ui

墨栈共享 UI 包，提供 shadcn 组件、`cn` 工具与 Tailwind 主题样式，供 shell 与 canvas 消费。

## 公开导出

| 导出                        | 说明                    |
| --------------------------- | ----------------------- |
| `@inkstack/ui`              | 组件与工具的汇总入口    |
| `@inkstack/ui/components/*` | 单个 UI 组件            |
| `@inkstack/ui/lib/*`        | 工具函数                |
| `@inkstack/ui/globals.css`  | Tailwind 入口与主题令牌 |

## 命令

```bash
pnpm --filter @inkstack/ui build
pnpm --filter @inkstack/ui typecheck
pnpm --filter @inkstack/ui test
pnpm --filter @inkstack/ui publint
```

## 消费方式

应用声明 `"@inkstack/ui": "workspace:*"`，从包名导入组件，并在全局样式中导入：

```css
@import '@inkstack/ui/globals.css';
```

应用的 `postcss.config.mjs` 必须把 `@tailwindcss/postcss` 的 `base` 指向仓库根，否则共享组件的类名不会进入产物。

新增组件使用仓库根的 shadcn CLI，从 `apps/shell` 目录执行，组件会落到本包的 `src/components`。
