# AGENTS.md

补充根文件的规则。本包是 shell 与 canvas 共用的 UI 基础，组件以源码形式进入 Git。

## 职责

- 提供 shadcn 生成的组件、`cn` 工具与 Tailwind 主题样式。
- `styles/globals.css` 是唯一 Tailwind 入口，负责扫描两个应用与自身产物。
- 不包含业务组件、页面级组合或数据请求。

## 生成组件

在仓库根执行：

```bash
pnpm dlx shadcn@latest add <name> -c apps/shell
```

UI 组件会写入 `src/components`；`components.json` 的别名必须与应用侧保持一致。

## 约束

- 组件只通过语义令牌取色，不写死色值。
- 暗色只跟随系统偏好，不引入 `.dark` 类策略。
- 新增文件后执行 `pnpm --filter @inkstack/ui build`，应用通过 `dist` 消费。
- `exports` 的 `source` 条件必须排在子路径首位，供 shadcn CLI 写入 `src`；运行时解析 `default` 的 `dist`，不要删掉它。
- 公开导出使用 TSDoc；行为改动在同一变更内补 `test/` 下的测试。
- 增删组件或改组件写法前先读 `.agents/skills/shadcn/SKILL.md`；仓库的 monorepo、catalog 与暗色规则优先于技能默认建议。
