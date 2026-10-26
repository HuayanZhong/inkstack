# Spec Delta

## MODIFIED Requirements

### Requirement: 根入口页可见且自洽

Shell SHALL 在 `/` 渲染一个可识别的入口页，包含产品名、口号、当前阶段说明与已实现认证页的入口；页面 MUST NOT 链接到尚未实现的路由。

#### Scenario: 打开首页

- **WHEN** 用户访问 `/`
- **THEN** 页面显示“墨栈 Inkstack”、产品口号与“登录页已就绪，认证与画布尚未接入”的阶段说明
- **AND** 页面包含指向 `/login` 与 `/register` 的链接
- **AND** 页面中不存在指向其他未实现路由的链接

#### Scenario: 外部服务不可用

- **WHEN** BFF、Gateway 与 canvas 均未启动
- **THEN** `/` 仍完成渲染
- **AND** 不出现错误页、空白页或未捕获异常

### Requirement: 根布局统一接入共享主题

Shell 的所有页面 SHALL 通过根布局获得共享样式与语义化主题令牌；页面与状态页 MUST NOT 硬编码具体色值。主题 SHALL 默认跟随系统，并允许用户显式选择亮色或暗色。

#### Scenario: 任意路由使用主题令牌

- **WHEN** 用户访问 shell 的首页、404 页或错误页
- **THEN** 背景、前景、边框与圆角来自共享主题变量
- **AND** 页面文件中不存在硬编码的十六进制或 `rgb()` 色值

#### Scenario: 系统暗色

- **WHEN** 操作系统偏好为暗色且用户未显式选择主题
- **THEN** 上述页面切换到暗色令牌
- **AND** 由根布局的主题提供者自动应用，不需要用户操作

#### Scenario: 用户显式切换

- **WHEN** 用户选择亮色或暗色
- **THEN** 根元素应用对应主题类并切换令牌
- **AND** 导航到其他页面后保持该选择

### Requirement: 根布局提供文档级元信息

Shell SHALL 在根布局中声明简体中文文档语言与产品级标题、描述，并 SHALL 使用标题模板让路由页面追加自身标题。

#### Scenario: 页面文档信息

- **WHEN** 浏览器加载任一 shell 页面
- **THEN** 文档的 `lang` 为 `zh-CN`
- **AND** 页面标题包含“墨栈 Inkstack”

#### Scenario: 子页面标题

- **WHEN** 子页面声明标题“登录”或“注册”
- **THEN** 文档标题分别为“登录 · 墨栈 Inkstack”与“注册 · 墨栈 Inkstack”
- **AND** 404 页标题不重复出现“墨栈 Inkstack”

### Requirement: Shell 页面复用共享 UI 组件

Shell 的根页面、状态页与认证页 SHALL 从共享 UI 包导入按钮、输入与字段等交互组件；应用内 MUST NOT 保留同名组件副本。

#### Scenario: 错误页与 404 页的操作

- **WHEN** 错误页渲染“重试”或 404 页渲染“返回首页”
- **THEN** 控件来自共享 UI 包
- **AND** 应用目录中不存在同名按钮组件的副本

#### Scenario: 认证页表单控件

- **WHEN** 登录页或注册页渲染
- **THEN** 输入、标签与提交控件来自共享 UI 包
- **AND** 应用目录中不存在这些组件的同名副本

#### Scenario: 调整共享主题

- **WHEN** 修改共享主题令牌或共享按钮样式
- **THEN** shell 页面在重新构建后同步变化
- **AND** 不需要逐个修改应用页面
