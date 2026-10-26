# Spec Delta

## Purpose

定义 shell 登录页与注册页在真实认证接入前的静态行为，包括路由可达性、凭证字段语义、提交不可用状态、认证页互链、窄视口可用性与页面元信息。

## ADDED Requirements

### Requirement: 认证页可直接访问

Shell SHALL 在 `/login` 与 `/register` 渲染可识别的认证页；在认证尚未接入时，直接访问或刷新 MUST NOT 触发重定向或认证请求。

#### Scenario: 打开登录页

- **WHEN** 用户访问 `/login`
- **THEN** 页面显示登录标题、邮箱与密码字段
- **AND** 页面停留在 `/login`，不跳转

#### Scenario: 打开注册页

- **WHEN** 用户访问 `/register`
- **THEN** 页面显示注册标题、邮箱与密码字段
- **AND** 页面停留在 `/register`，不跳转

### Requirement: 登录页提供可访问的凭证字段

登录页 SHALL 提供带可访问名称的邮箱与密码字段；邮箱字段 MUST 使用 `type="email"` 与 `autocomplete="email"`，密码字段 MUST 使用 `type="password"` 与 `autocomplete="current-password"`。

#### Scenario: 字段语义

- **WHEN** 登录页渲染
- **THEN** 邮箱输入的可访问名称为“邮箱”且类型为 `email`
- **AND** 密码输入的可访问名称为“密码”且类型为 `password`
- **AND** 两个字段分别声明 `autocomplete="email"` 与 `autocomplete="current-password"`

#### Scenario: 键盘操作

- **WHEN** 用户使用 Tab 键在登录页移动焦点
- **THEN** 邮箱与密码按视觉顺序获得焦点，禁用状态的登录操作被跳过
- **AND** 注册链接可获得焦点，且焦点样式可见

### Requirement: 注册页提供可访问的凭证字段

注册页 SHALL 提供带可访问名称的邮箱与密码字段；邮箱 MUST 使用 `type="email"` 与 `autocomplete="email"`，密码 MUST 使用 `type="password"` 与 `autocomplete="new-password"`。

#### Scenario: 字段语义

- **WHEN** 注册页渲染
- **THEN** 邮箱与密码均可通过可访问名称定位
- **AND** 邮箱类型为 `email`，密码类型为 `password`
- **AND** 两个字段分别声明 `autocomplete="email"` 与 `autocomplete="new-password"`

### Requirement: 认证接入前提交操作不可用

在认证尚未接入时，登录页与注册页的提交操作 MUST 处于不可用状态，页面 MUST 显示对应的阶段说明，且 MUST NOT 向 BFF、Supabase 或其他认证服务发起请求。

#### Scenario: 登录操作不可用

- **WHEN** 登录页渲染
- **THEN** 登录操作不可用
- **AND** 页面显示“登录尚未接入”的阶段说明

#### Scenario: 注册操作不可用

- **WHEN** 注册页渲染
- **THEN** 注册操作不可用
- **AND** 页面显示“注册尚未接入”的阶段说明

#### Scenario: 不发起认证请求

- **WHEN** 页面加载或用户尝试提交表单
- **THEN** 不发生认证请求
- **AND** 页面不发生导航

### Requirement: 认证页只链接已实现路由

登录页与注册页 SHALL 只链接到已实现的路由；本次 MUST 仅包含登录页与注册页之间的互链，MUST NOT 出现找回密码、重置密码或其他未实现路由的链接。

#### Scenario: 登录页到注册页

- **WHEN** 用户在登录页激活注册入口
- **THEN** 浏览器导航到 `/register`

#### Scenario: 注册页到登录页

- **WHEN** 用户在注册页激活登录入口
- **THEN** 浏览器导航到 `/login`

#### Scenario: 不出现未实现路由

- **WHEN** 登录页或注册页渲染
- **THEN** 页面中不存在指向 `/forgot-password`、`/reset-password` 或其他未实现路由的链接

### Requirement: 认证页在窄视口保持可用

认证页 SHALL 在 320px 宽的视口下保持可操作：MUST NOT 出现横向滚动，字段与提交操作 MUST 可触达。

#### Scenario: 320px 视口

- **WHEN** 页面在 320px 宽的视口渲染
- **THEN** 页面不出现横向滚动
- **AND** 邮箱、密码、提交操作均可聚焦且可见

### Requirement: 认证页背景尊重减少动态偏好

认证页 MAY 渲染装饰性背景网格；当系统偏好为 `prefers-reduced-motion: reduce` 时，背景 MUST NOT 播放入场或环境动画。背景画布 MUST 对辅助技术隐藏，MUST NOT 拦截指针事件。

#### Scenario: 减少动态

- **WHEN** 系统偏好为 `prefers-reduced-motion: reduce`
- **THEN** 背景不播放入场或环境动画
- **AND** 表单仍可聚焦、输入与导航

#### Scenario: 常规偏好

- **WHEN** 系统未要求减少动态
- **THEN** 背景网格可随指针点亮
- **AND** 不拦截表单交互

### Requirement: 认证页提供主题切换

认证页 SHALL 在右上角提供主题切换入口，至少支持亮色、暗色与跟随系统；选择 MUST 立即应用到当前页面，并在后续导航中保持。

#### Scenario: 右上角入口

- **WHEN** 认证页渲染
- **THEN** 右上角显示主题切换按钮
- **AND** 按钮可通过键盘打开并选择主题

#### Scenario: 切换亮色或暗色

- **WHEN** 用户选择“亮色”或“暗色”
- **THEN** 页面立即切换到对应主题令牌
- **AND** 导航到其他页面后保持该选择

#### Scenario: 跟随系统

- **WHEN** 用户选择“跟随系统”
- **THEN** 页面按操作系统偏好切换主题

### Requirement: 认证页具备独立元信息

登录页与注册页 SHALL 分别声明页面标题，标题 MUST 包含“墨栈 Inkstack”。

#### Scenario: 登录页标题

- **WHEN** 浏览器加载 `/login`
- **THEN** 文档标题为“登录 · 墨栈 Inkstack”

#### Scenario: 注册页标题

- **WHEN** 浏览器加载 `/register`
- **THEN** 文档标题为“注册 · 墨栈 Inkstack”
