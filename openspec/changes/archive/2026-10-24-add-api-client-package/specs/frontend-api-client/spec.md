# Spec Delta

## Purpose

为墨栈前端应用提供统一的 HTTP 与 SSE 请求能力，把传输配置、错误语义和流式生命周期收敛到一层可测试的共享客户端。

## ADDED Requirements

### Requirement: 客户端工厂与配置注入

包 SHALL 导出 `createApiClient(config)` 工厂；`config.baseUrl` MUST 必填，`credentials`、静态或动态 `headers`、`timeout`、`retry` 与自定义 `fetch` MAY 配置。每次调用工厂 MUST 返回相互独立的客户端，包内 MUST NOT 读取环境变量或持有模块级单例。

#### Scenario: 创建两个客户端

- **WHEN** 调用方用不同的 `baseUrl` 与 headers 调用两次 `createApiClient`
- **THEN** 两个客户端各自使用自己的配置，互不影响

#### Scenario: 缺少 baseUrl

- **WHEN** 调用方未提供 `baseUrl`
- **THEN** 工厂立即抛出不带网络请求的配置错误

#### Scenario: 动态 headers

- **WHEN** `headers` 配置为异步函数
- **THEN** 客户端在每次请求前解析该函数，并把结果合并进请求头

### Requirement: 统一请求 API

客户端 SHALL 提供 `request`、`get`、`post`、`put`、`patch`、`delete` 与 `requestRaw`。请求 MAY 携带 JSON 请求体与查询参数，MUST 支持 `AbortSignal`；响应为 JSON 时 SHALL 解析为对象，空响应体 SHALL 返回 `undefined`，`requestRaw` SHALL 返回原始 `Response`。

#### Scenario: JSON 请求与响应

- **WHEN** 调用方用 `post` 发送 JSON 并收到 `application/json` 响应
- **THEN** 请求体被序列化并设置 JSON Content-Type，响应被解析为对象

#### Scenario: 空响应体

- **WHEN** 服务端返回 204 或没有响应体
- **THEN** 客户端返回 `undefined`，不抛解析错误

#### Scenario: 查询参数

- **WHEN** 调用方传入查询参数对象
- **THEN** 参数被编码进 URL，`undefined` 值被忽略

#### Scenario: 主动取消

- **WHEN** 调用方通过 `AbortSignal` 取消请求
- **THEN** 请求终止并保留原始 abort 错误

### Requirement: 错误归一化

除调用方主动 abort 外，HTTP 非 2xx、超时与网络失败 MUST 统一为 `ApiError`，并携带 `status`、`code`、`requestId`、`data` 与原始 `cause`。abort MUST 保留原始错误，不得包装。

#### Scenario: HTTP 错误

- **WHEN** 服务端返回非 2xx 且响应体包含 `code` 与 `requestId`
- **THEN** 抛出的 `ApiError` 带上状态码、业务码、请求 ID 与解析后的响应体

#### Scenario: 超时

- **WHEN** 请求超过配置的 `timeout`
- **THEN** 抛出 `ApiError`，其 `status` 为 `null`、`code` 为超时标识，并保留原始错误

#### Scenario: 网络失败

- **WHEN** fetch 因断网或连接失败而拒绝
- **THEN** 抛出 `ApiError`，其 `status` 为 `null`、`code` 为网络错误标识

#### Scenario: 主动 abort

- **WHEN** 调用方通过 `AbortSignal` 取消请求
- **THEN** 抛出的仍是原始 abort 错误，而不是 `ApiError`

### Requirement: 默认不自动重试

客户端 MUST 默认关闭自动重试（`retry.limit` 为 0），只有调用方显式配置时才 SHALL 重试；重试 MUST 只作用于幂等方法或调用方明确允许的请求。

#### Scenario: 默认只发送一次

- **WHEN** 服务端返回 503 且调用方没有配置重试
- **THEN** 客户端只发送一次请求，并立即抛出 `ApiError`

#### Scenario: 显式开启重试

- **WHEN** 调用方配置了重试次数且请求是幂等方法
- **THEN** 客户端按配置重试，并在成功后返回结果

#### Scenario: 非幂等请求

- **WHEN** 客户端配置了重试但请求是 POST
- **THEN** 除非调用方明确允许，否则不自动重试

### Requirement: SSE 流式消费

客户端 SHALL 提供 `stream(path, options)`，返回可异步迭代的 SSE 事件流，支持 GET 与 POST、自定义 headers 与 `AbortSignal`，并把 `event`、`data`、`id` 解析为事件对象；首个响应非 2xx 时 MUST 抛出 `ApiError`。

#### Scenario: 逐事件消费

- **WHEN** 调用方用 `for await` 消费 `stream()`
- **THEN** 每个 SSE 事件按到达顺序产出，包含事件名、数据与可选 id

#### Scenario: POST 流

- **WHEN** 调用方用 POST 发送 JSON 后服务端返回事件流
- **THEN** 客户端保持该请求体完成建连，并持续产出事件

#### Scenario: 建连失败

- **WHEN** 服务端在流开始前返回 401
- **THEN** `stream()` 的迭代抛出带状态码的 `ApiError`

#### Scenario: 主动结束

- **WHEN** 调用方 abort 或关闭事件流
- **THEN** 迭代正常结束，不继续消费，也不抛出新的网络错误

### Requirement: 可选断线重连

SSE 重连 MUST 默认关闭；调用方显式开启后，客户端 SHALL 按退避策略重连，并在重连请求中携带最近一次事件的 `Last-Event-ID`；超过最大尝试次数后 MUST 抛出 `ApiError`。

#### Scenario: 默认不重连

- **WHEN** 事件流中途断开且调用方没有开启重连
- **THEN** 迭代以 `ApiError` 结束，不自动发起新请求

#### Scenario: 开启后携带 Last-Event-ID

- **WHEN** 调用方开启重连且已收到带 id 的事件
- **THEN** 重连请求携带该 id，服务端可据此续传

#### Scenario: 重连次数耗尽

- **WHEN** 连续失败达到配置的最大尝试次数
- **THEN** 迭代抛出 `ApiError`，不再继续重连

### Requirement: 框架与运行时中立

包 MUST 保持框架与运行时中立：MUST NOT 导入 React 或 Next.js，MUST NOT 依赖 Node 内置模块，SHALL 可在浏览器与服务端 ESM 环境运行，baseUrl 与凭据 MUST 由调用方注入。

#### Scenario: 非 Next 消费者

- **WHEN** canvas 这类非 Next 应用导入并创建客户端
- **THEN** 包不要求 React、Next 或 Node 内置模块，构建与运行正常

#### Scenario: 服务端消费

- **WHEN** Next 服务端代码创建客户端
- **THEN** 客户端使用注入的 `fetch` 与 `baseUrl`，不读取服务端环境变量

#### Scenario: 浏览器消费

- **WHEN** 浏览器代码创建客户端
- **THEN** 客户端只使用 Fetch API 与标准 Web 类型，不访问 Node 全局
