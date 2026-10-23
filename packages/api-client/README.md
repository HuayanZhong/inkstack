# @inkstack/api-client

墨栈前端共享请求客户端。统一 baseUrl、凭据、请求头、超时、重试与错误语义，并提供 SSE 流式消费。

## 职责

- 提供 `createApiClient` 工厂与一元请求方法。
- 把所有传输失败归一化为 `ApiError`，主动 abort 保留原始错误。
- 提供可异步迭代的 SSE 事件流，重连默认关闭。

不包含业务端点封装、缓存、React hooks 与 WebSocket。

## 导出

- `createApiClient(config)`：创建独立客户端。
- `request` / `get` / `post` / `put` / `patch` / `delete`：解析 JSON 或文本响应。
- `requestRaw`：返回原始 `Response`。
- `stream(path, options)`：返回 SSE 事件流。
- `ApiError` / `isApiError`：统一错误类型与类型守卫。
- 配置与事件类型：`ApiClientConfig`、`RequestOptions`、`StreamOptions`、`ServerEvent` 等。

## 创建客户端

`baseUrl` 必填，且必须是绝对 `http`/`https` URL。包内不读取环境变量，也不提供单例；服务端与浏览器应分别创建。

```ts
import { createApiClient } from '@inkstack/api-client'

const api = createApiClient({
  baseUrl: 'https://api.inkstack.example/bff',
  headers: async () => ({ authorization: `Bearer ${await getToken()}` }),
})
```

| 字段              | 默认值             | 说明                                                |
| ----------------- | ------------------ | --------------------------------------------------- |
| `baseUrl`         | 无，必填           | 绝对 `http`/`https` URL；相对路径会拼接到它的路径下 |
| `credentials`     | `'include'`        | 面向 BFF 的 cookie 会话                             |
| `headers`         | 无                 | 静态对象或每次请求前解析的函数                      |
| `timeout`         | `10_000`           | 一元请求建连超时；`false` 关闭                      |
| `retry`           | `{ limit: 0 }`     | 默认不重试                                          |
| `fetch`           | `globalThis.fetch` | 注入 SSR 包装或测试替身                             |
| `requestIdHeader` | `'x-request-id'`   | 响应体没有 `requestId` 时从该响应头读取             |

不同运行环境使用不同地址：

```ts
const serverApi = createApiClient({ baseUrl: process.env.BFF_INTERNAL_URL! })
const browserApi = createApiClient({ baseUrl: process.env.NEXT_PUBLIC_BFF_URL! })
```

## 请求与错误

```ts
const session = await api.get<Session>('session')
await api.post('actions', { json: { type: 'create' } })

const response = await api.requestRaw('files/1')
```

- JSON 响应按 `Content-Type` 解析；204、205、304 或空响应体返回 `undefined`。
- 请求级 `headers` 覆盖配置头。
- `AbortSignal` 原样传给 fetch；主动 abort 不会被包装成 `ApiError`。

```ts
import { isApiError } from '@inkstack/api-client'

try {
  await api.get('session')
} catch (error) {
  if (isApiError(error)) {
    console.error(error.status, error.code, error.requestId)
  } else {
    throw error
  }
}
```

| `code`            | 来源                         |
| ----------------- | ---------------------------- |
| 响应体中的 `code` | HTTP 非 2xx 且响应体带业务码 |
| `HTTP_ERROR`      | HTTP 非 2xx 且没有业务码     |
| `TIMEOUT`         | 请求超时                     |
| `NETWORK_ERROR`   | 断网、连接失败或流中断       |
| `SSE_PARSE_ERROR` | SSE 分帧或事件解析失败       |
| `EMPTY_STREAM`    | SSE 响应没有 body            |

默认不重试。需要时显式配置，且默认只作用于幂等方法：

```ts
const api = createApiClient({
  baseUrl: 'https://api.inkstack.example/bff',
  retry: { limit: 2, delay: () => 500 },
})
```

## SSE

`stream()` 懒启动：第一次迭代才发起连接。没有 `json` 时默认 GET，有 `json` 时默认 POST。

```ts
for await (const event of api.stream<ChatEvent>('chat', {
  json: { message: '画一个登录页' },
  parse: (data) => JSON.parse(data) as ChatEvent,
})) {
  render(event.data)
}
```

- 事件对象包含 `event`、`data`、`id`；`data` 默认是字符串。
- 非 2xx 在建连阶段抛出 `ApiError`。
- 服务端正常关闭流时迭代结束；`AbortSignal` 或 `close()` 结束迭代且不抛网络错误。
- 重连默认关闭。开启后使用指数退避与 full jitter，并在重连请求中携带 `Last-Event-ID`：

```ts
api.stream('chat', {
  json: { message: '继续' },
  reconnect: { maxAttempts: 3, initialDelayMs: 500, maxDelayMs: 5000 },
})
```

POST 流通常是非幂等的。开启重连前，服务端必须能按 `Last-Event-ID` 续传，否则可能重复生成或重复计费。

## Next 集成

- 包不导入 Next 或 React。Next 应用增强 `RequestInit` 后，`next` 选项会自然传入：

```ts
await api.get('session', { next: { revalidate: 60, tags: ['session'] } })
```

- `cacheComponents` 下缓存是显式行为，客户端不设置默认 `cache`。
- 客户端默认不重试；若上层使用 TanStack Query，只让一层负责重试。

## 命令

在仓库根执行：`pnpm --filter @inkstack/api-client build|typecheck|lint|test|test:coverage`。

## 约束

- baseUrl 必须是绝对 `http`/`https` URL，由调用方注入。
- 包内不读取环境变量，也不提供模块级单例。
- 默认不重试；SSE 默认不重连。
