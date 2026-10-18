# Spec Delta

## Purpose

定义 shell 在 Next.js App Router 下以 Module Federation runtime consumer 身份加载 canvas 的行为，包括配置来源、共享依赖、客户端限定与失败处理。

## ADDED Requirements

### Requirement: 仅在客户端加载远程画布

shell SHALL 在浏览器中通过 Module Federation runtime API 加载 `canvas/Canvas`；MUST NOT 使用 Next.js MF 构建插件，MUST NOT 在服务端渲染阶段请求远程模块。

#### Scenario: 服务端构建不加载远程

- **WHEN** 执行 shell 的 production 构建
- **THEN** 构建成功且不在服务端执行远程模块加载
- **AND** 服务端产出的 HTML 不包含远程画布内容

#### Scenario: 浏览器完成远程加载

- **WHEN** 用户打开包含画布的页面
- **THEN** 远程模块在客户端加载完成后渲染
- **AND** 页面其余内容在远程加载期间仍可用

### Requirement: 远程入口可配置

shell SHALL 从 `NEXT_PUBLIC_CANVAS_MF_ENTRY` 读取 canvas 的远程入口；未设置时 MUST 回退到 `http://localhost:4002/mf-manifest.json`。

#### Scenario: 使用环境变量

- **WHEN** `NEXT_PUBLIC_CANVAS_MF_ENTRY` 指向有效的 manifest 地址
- **THEN** shell 从该地址加载 canvas

#### Scenario: 未配置时使用本地默认值

- **WHEN** 未设置 `NEXT_PUBLIC_CANVAS_MF_ENTRY`
- **THEN** shell 使用 `http://localhost:4002/mf-manifest.json`

### Requirement: 复用 host 的 React 实例

shell SHALL 在 runtime 中注册 `react` 与 `react-dom` 单例，并携带自身版本，使远程画布复用同一份 React。

#### Scenario: 远程复用 host React

- **WHEN** shell 加载 canvas 并渲染画布
- **THEN** canvas 使用 shell 已注册的 React 与 ReactDOM
- **AND** 页面不出现重复 React 实例导致的 hook 错误

### Requirement: 加载与失败状态可见

shell SHALL 在远程模块加载期间显示加载状态；加载失败时 SHALL 显示可见错误提示，且不得导致整个页面崩溃。

#### Scenario: canvas 服务不可用

- **WHEN** 远程入口无法访问或模块加载失败
- **THEN** 页面显示明确的画布加载失败提示
- **AND** shell 的其他页面内容保持可用
- **AND** 错误不会以未捕获异常终止页面

### Requirement: 类型契约不依赖生成目录

shell SHALL 为 `loadRemote` 的结果声明显式类型；typecheck MUST NOT 依赖 `@mf-types` 生成目录存在。

#### Scenario: 干净检出后通过类型检查

- **WHEN** 在未运行任何远程类型生成的情况下执行 shell 的 typecheck
- **THEN** 类型检查通过
- **AND** 画布组件的使用点仍具备显式类型
