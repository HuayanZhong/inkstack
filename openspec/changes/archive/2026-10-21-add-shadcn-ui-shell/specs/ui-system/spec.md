# Spec Delta

## Purpose

为 shell 与 canvas 提供共享的 UI 组件与主题基础，使两个应用使用同一套语义化颜色、圆角、字体与暗色行为，而不是各自维护重复实现。

## ADDED Requirements

### Requirement: 共享 UI 包是唯一组件来源

shell 与 canvas SHALL 从 `@inkstack/ui` 导入 UI 组件；应用自身 MUST NOT 保留同名的组件副本。

#### Scenario: 两个应用消费同一组件

- **WHEN** shell 或 canvas 渲染按钮等 UI 组件
- **THEN** 组件来自 `@inkstack/ui`
- **AND** 应用目录中不存在同名的 UI 组件文件

#### Scenario: 组件更新同时生效

- **WHEN** 修改 `@inkstack/ui` 中的组件实现
- **THEN** 两个应用在重新构建后都使用新实现
- **AND** 不需要修改应用内的组件副本

### Requirement: 统一的主题令牌

两个应用的 UI 组件 SHALL 通过语义化 CSS 变量渲染颜色、圆角与字体；组件自身 MUST NOT 硬编码具体色值。

#### Scenario: 组件使用主题令牌

- **WHEN** 在任一应用中渲染共享组件
- **THEN** 其背景、前景、边框与状态色来自全局主题变量
- **AND** 组件文件中不存在硬编码的十六进制或 `rgb()` 色值

#### Scenario: 调整主题

- **WHEN** 修改共享样式中的主色
- **THEN** shell 与 canvas 的组件同步变化
- **AND** 不需要逐个修改应用或组件

### Requirement: 暗色跟随系统偏好

两个应用 SHALL 仅依据 `prefers-color-scheme` 切换暗色主题；同一时刻 MUST 只有一种暗色判定机制生效。

#### Scenario: 系统处于暗色

- **WHEN** 操作系统偏好为暗色
- **THEN** 两个应用的背景、前景与边框切换到暗色令牌
- **AND** 组件上的 `dark:` 样式生效
- **AND** 不需要额外设置类名

#### Scenario: 系统处于亮色

- **WHEN** 操作系统偏好为亮色
- **THEN** 两个应用使用亮色令牌
- **AND** 组件上的 `dark:` 样式不生效

#### Scenario: 不存在并存的暗色机制

- **WHEN** 检查共享与应用样式
- **THEN** 暗色令牌只在一处按系统偏好声明
- **AND** 不存在要求挂载 `.dark` 类才生效的暗色路径

### Requirement: 组件源码由仓库维护

共享组件 SHALL 以源码形式存放在 `packages/ui` 并进入 Git；运行与构建 MUST NOT 依赖远程组件注册表。

#### Scenario: 在 monorepo 中生成组件

- **WHEN** 从 shell 执行组件添加命令
- **THEN** UI 组件写入 `packages/ui` 的组件目录
- **AND** 应用侧只保留页面级组合组件

#### Scenario: 构建不访问远程注册表

- **WHEN** 执行任一应用的 production 构建
- **THEN** 构建只使用已安装的本地依赖
- **AND** 不请求任何组件注册表地址

### Requirement: 依赖通过 catalog 管理

本次引入的样式与 UI 依赖 SHALL 在 `pnpm-workspace.yaml` 中声明，并由各 `package.json` 以 `catalog:*` 引用；存在裸 semver 时 `pnpm check:manifests` MUST 失败。

#### Scenario: catalog 引用

- **WHEN** 检查共享包与两个应用的新增依赖
- **THEN** 每一项都是 `catalog:<name>`
- **AND** 对应条目存在于 `pnpm-workspace.yaml`

#### Scenario: 裸 semver 被拒绝

- **WHEN** 任一清单中出现 `^x.y.z` 形式的样式或 UI 依赖
- **THEN** `pnpm check:manifests` 失败并指出该依赖

### Requirement: 两个应用都接入样式管线

shell 与 canvas SHALL 各自通过其构建链处理 Tailwind CSS v4；两个应用 MUST 从同一份共享样式入口获得主题与工具类。

#### Scenario: shell 渲染共享组件

- **WHEN** 启动 shell 并渲染共享组件
- **THEN** 组件样式由 Next 的 PostCSS 管线产出
- **AND** 主题令牌来自共享样式入口

#### Scenario: canvas 渲染共享组件

- **WHEN** 构建或启动 canvas
- **THEN** Rspack 的 `postcss-loader` 处理 Tailwind 与共享样式
- **AND** 画布页面能渲染共享组件

### Requirement: 构建与检查保持通过

引入共享包与样式管线后，仓库 SHALL 继续通过 `pnpm typecheck`、`pnpm build`、`pnpm test` 与 `pnpm check:manifests`。

#### Scenario: 生产构建产出样式

- **WHEN** 执行 shell 或 canvas 的 production 构建
- **THEN** 构建成功
- **AND** 产物包含共享组件使用的样式

#### Scenario: 共享包测试

- **WHEN** 执行 `pnpm --filter @inkstack/ui test`
- **THEN** 组件行为测试通过
- **AND** 覆盖率不低于仓库门槛
