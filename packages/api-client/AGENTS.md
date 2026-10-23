# AGENTS.md

补充根文件的规则。本目录是 shell 与 canvas 共用的前端请求层。

## 职责

- 提供 `createApiClient`、统一请求方法、`ApiError` 与 SSE 流式消费。
- 只做传输与协议适配；业务端点封装、缓存、React hooks、WebSocket 不在本包。

## 约束

- baseUrl、凭据、headers、timeout、retry、fetch 全部由调用方注入；不读 env，不设单例。
- 不导入 React、Next 或 Node 内置模块；只使用 Fetch API 与标准 Web 类型。
- 默认不重试；SSE 默认不重连，开启后必须携带 `Last-Event-ID`。
- 运行时依赖只通过 catalog 引入；新增公开导出同步 README。
