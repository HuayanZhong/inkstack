# Design

## Context

- 仓库是 pnpm + Turborepo 的 ESM monorepo，TypeScript `6.0.3`、Node `>=26.12.1`，依赖只允许通过 catalog 引用，见 [docs/package-metadata.md](../../../docs/package-metadata.md)。
- 现有 `packages/config` 已提供包级 `src/` + `test/` 的模板：`library.json` 预设、`tsconfig.build.json`、包级 `vitest.config.ts`、README 与 AGENTS/CLAUDE 三件套。
- 前端有两个消费方：`apps/shell`（Next.js App Router，服务端 + 浏览器）与 `apps/canvas`（Rspack，纯浏览器，通过 Module Federation 挂载）。
- 架构约定 REST/SSE 走 BFF，实时 WS 直连 Gateway，见 [DESIGN-RECORD](../../../docs/architecture/DESIGN-RECORD.md)。
- `library.json` 继承 `node.json`，只有 `ES2024` lib 与 `@types/node`：`fetch`、`Request`、`Response`、`Headers`、`RequestInit` 是全局的，但 `HeadersInit`、`RequestCredentials` 不是全局类型，包内需要自定义别名。
- 仓库当前没有任何 HTTP 客户端或源码级 `fetch()` 调用，也没有 BFF 端点。

## Goals / Non-Goals

**Goals:**

- 用一层薄客户端统一两个前端的 baseUrl、凭据、请求头、超时、重试与错误语义。
- 让 REST 与 SSE 共用同一套配置和错误模型，但不让 SSE 的生命周期污染一次性请求。
- 保持包可被 Next 服务端、Next 浏览器端与非 Next 的 canvas 同时消费。
- 让测试不依赖真实网络，请求与流都可被注入的 `fetch` 替身驱动。

**Non-Goals:**

- 不按 BFF 端点封装 `getSession()`、`sendChat()` 这类业务函数。
- 不做缓存、去重、mutation 状态或 React hooks；这些属于 TanStack Query / RSC 或调用方。
- 不封装 WebSocket、上传、下载、文件分片或 OpenAPI 代码生成。
- 不在本包实现 BFF 的鉴权、CORS 或错误信封；包只消费并归一化。
- 不提供模块级单例、不从 `process.env` 或 `.env` 读取任何值。

## Decisions

### 1. 包名与职责边界

包名用 `@inkstack/api-client`，不用 `request`。`request` 与 npm 上已废弃的同名包冲突，也不说明层次；`api-client` 能覆盖 REST 与 SSE，且为后续端点封装留出命名空间。

职责边界是**传输与协议适配**：配置、URL、请求头、超时、重试、错误归一化、SSE 分帧。业务语义留在应用层。

### 2. 依赖选型

选择 `ky@^2.2.0` 与 `eventsource-parser@^4.1.2`，都进入 `runtime` catalog。

- **ky**：fetch 原生、ESM、零运行时依赖、`sideEffects: false`，未识别选项会原样透传给 `fetch()`，因此 Next 的 `next: { revalidate, tags }` 与 `cache` 可以直接使用；`fetch` 选项可注入 SSR 包装或测试替身。相比 axios，它不会在浏览器改用 XHR，也不会绕开 Next 的 fetch 插桩。
- **eventsource-parser**：`4.1.2` 成熟、无依赖、浏览器与 Node 通用，`createParser({ onEvent })` 直接产出 `{ event?, data, id? }`。ky README 推荐的 `parse-sse` 仍是 `0.1.0`，版本太新；解析逻辑隔离在 `src/sse.ts`，未来替换不影响公开 API。
- 备选 **原生 fetch**：零依赖，但要自己实现超时、重试、JSON 解析、错误分类与 SSE 建连，等于重写 ky 已解决的边界。
- 备选 **ofetch / wretch**：能力接近 ky，但在 React/Next 栈没有额外收益，且换不来更小的维护面。
- 备选 **openapi-fetch**：要求 BFF 先产出 OpenAPI schema，与仓库的 contracts-first 方向冲突，暂不采用。

### 3. 单一入口与公开 API

只暴露一个入口 `@inkstack/api-client`，不拆 `./sse` 子路径。SSE 解析器体积很小，拆分子路径会让调用方为了共享配置创建两个客户端；等实测 canvas 包体确实受影响时，再加子路径是纯增量、不破坏现有 API。

公开面：

```ts
export function createApiClient(config: ApiClientConfig): ApiClient

interface ApiClient {
  request<T>(path: string, options?: RequestOptions): Promise<T>
  get<T>(path: string, options?: RequestOptions): Promise<T>
  post<T>(path: string, options?: RequestOptions): Promise<T>
  put<T>(path: string, options?: RequestOptions): Promise<T>
  patch<T>(path: string, options?: RequestOptions): Promise<T>
  delete<T>(path: string, options?: RequestOptions): Promise<T>
  requestRaw(path: string, options?: RequestOptions): Promise<Response>
  stream<T = string>(path: string, options?: StreamOptions<T>): EventStream<ServerEvent<T>>
}

interface EventStream<T> extends AsyncIterable<T> {
  close(): void
}
```

`stream()` 是懒启动的：第一次 `next()` 才发起连接。这样调用方在消费前 abort 不会产生未处理的 Promise 拒绝，也避免 `stream()` 只是创建对象就占用连接。

### 4. 配置与 URL 规则

```ts
interface ApiClientConfig {
  baseUrl: string
  credentials?: 'omit' | 'same-origin' | 'include'
  headers?: HeadersInput | (() => HeadersInput | Promise<HeadersInput>)
  timeout?: number | false
  retry?: RetryOptions | number
  fetch?: typeof fetch
  requestIdHeader?: string
}
```

- `baseUrl` 必填且必须是绝对 `http`/`https` URL。相对地址在浏览器依赖 `document.baseURI`、在 Node 没有等价物，会造成同一配置两种行为；显式绝对地址与仓库「跨应用地址显式配置」的 env 规则一致。
- 包内不设默认 baseUrl，也不从 `process.env`、`NEXT_PUBLIC_*` 或 `import.meta.env` 读取。
- `baseUrl` 统一去掉末尾 `/`；`path` 去掉开头 `/`，拒绝绝对 URL 与包含 `..` 的路径，再用 `new URL(path, baseUrl + '/')` 拼接。这样不会重演 ky 2 的 `baseUrl` 语义：`baseUrl: '/api/'` 配 `'/users'` 会绕过 `/api`。
- `credentials` 默认 `'include'`，因为目标就是 BFF 的 cookie 会话；需要匿名或 bearer 的调用方显式覆盖。
- `headers` 支持静态对象或每请求解析的函数。ky 的 `headers` 只接受 `Headers` 或普通对象，所以动态头由本包在每次请求前解析，再与请求级 headers 合并，请求级优先。
- `timeout` 默认 `10_000`；`false` 表示不设超时。SSE 默认 `timeout: false`，否则模型思考超过 10 秒就会在建连阶段被掐断。
- `retry` 默认 `{ limit: 0 }`。
- `requestIdHeader` 默认 `'x-request-id'`，仅在响应体没有 `requestId` 时作为兜底；跨域响应需要 BFF 显式暴露该头。

自定义 `HeadersInput` 与凭据联合类型，是为了避开 `HeadersInit` / `RequestCredentials` 在 Node 类型下不是全局类型的问题。

### 5. 请求与响应语义

- `request<T>` 接受 `json`、`searchParams`、`headers`、`signal`、`timeout`、`retry`，其余选项来自 `Omit<RequestInit, 'body'>` 并原样透传。Next 应用增强过 `RequestInit` 后，`next` 选项会自动出现在该类型里，包本身不导入 Next。
- JSON 响应：`Content-Type` 包含 `application/json` 时解析为对象；204、205、304 或空响应体返回 `undefined`。
- 非 JSON 响应：`request<T>` 返回文本；需要原始流或下载时使用 `requestRaw`。
- 请求级 `headers` 与配置头合并，前者覆盖后者；`credentials` 可在请求级覆盖。
- `AbortSignal` 直接传给 fetch；取消时原样抛出 abort 错误，不包装成 `ApiError`。

### 6. 错误模型

```ts
class ApiError extends Error {
  readonly status: number | null
  readonly code: string
  readonly requestId: string | null
  readonly data: unknown
  override readonly cause: unknown
}
```

映射规则：

| 来源           | `status`   | `code`                                  | `data`                     |
| -------------- | ---------- | --------------------------------------- | -------------------------- |
| `HTTPError`    | 响应状态码 | 响应体 `code` 字符串，否则 `HTTP_ERROR` | ky 预解析的 `error.data`   |
| `TimeoutError` | `null`     | `TIMEOUT`                               | `undefined`                |
| `NetworkError` | `null`     | `NETWORK_ERROR`                         | `undefined`                |
| 其他异常       | —          | —                                       | 原样抛出，不伪装成传输错误 |

`requestId` 依次从响应体 `requestId`、响应头 `requestIdHeader` 读取。响应体不是对象或字段不是字符串时忽略，不做猜测。

### 7. 重试与超时

- 默认不重试。隐藏重试会让 canvas 的写操作、SSE 建连和上层数据层（未来的 TanStack Query）叠加出最多 N 次请求，调试时也很难区分是谁重发的。
- 显式开启后，默认只允许幂等方法（`GET`、`PUT`、`HEAD`、`DELETE`、`OPTIONS`、`TRACE`）；调用方可以在 `RetryOptions.methods` 中显式加入 `POST`。
- 默认状态码沿用 ky 的 `408/413/429/500/502/503/504`，延迟用 ky 的指数退避；不额外实现第二套退避。
- 超时是每次尝试的建连超时，不是整个业务的截止时间；SSE 不设超时。

### 8. SSE 生命周期

数据流：

```
stream() --lazy--> fetch(absoluteUrl, { headers, body, signal })
                        |
                        v
              response.body (ReadableStream)
                        |
                 TextDecoder + createParser
                        |
                        v
              ServerEvent<T> { event?, data, id? } --async queue--> for await
```

- `data` 默认是字符串；调用方传 `parse` 时映射为 `T`。不做「自动 JSON.parse 失败回退字符串」这种隐式行为。
- 非 2xx 在建连阶段就抛 `ApiError`，不进入事件循环。
- `response.body` 为空时抛 `ApiError`，`code` 为 `EMPTY_STREAM`。
- 中途 EOF 视为正常结束；网络错误在未开启重连时抛 `ApiError`。
- `signal` abort 或 `close()` 时正常结束迭代，不抛网络错误；调用方主动结束不是失败。
- 重连默认关闭。开启后按 `initialDelayMs`（默认 500）、`maxDelayMs`（默认 5000）指数退避，带 full jitter，`maxAttempts` 默认 3。
- 重连请求携带最近一次事件的 `Last-Event-ID`；没有 id 时不带。429/503 优先使用 `Retry-After`，并受 `maxDelayMs` 限制。
- 只对网络错误与 `408/429/502/503/504` 重连；401/403 等鉴权失败立即抛错，避免无效重试。
- 服务端可能重放最后一个事件；若新事件 id 与刚产出的事件 id 相同，跳过该事件。id 重复视为服务端行为，不做更复杂的去重。
- 服务端 `retry:` 字段通过 `createParser` 的 `onRetry` 读取，作为下一次重连的初始延迟参考。

### 9. 框架中立与 Next 集成

- 不导入 React、Next、Node 内置模块；只使用全局 Fetch API、`TextDecoder`、`ReadableStream`、`AbortSignal`。
- `RequestOptions` 基于 `Omit<RequestInit, 'body'>`，Next 应用对 `RequestInit` 的 `next` 扩展会自然流入；包内类型检查不依赖 Next 类型。
- 服务端与浏览器必须各自创建客户端：服务端的 baseUrl 可以是内网地址，浏览器必须是公开地址。包不提供单例，也不缓存客户端。
- Next 的缓存是显式行为：调用方在请求级传 `cache` 或 `next`，客户端不猜测。`cacheComponents: true` 下尤其不能依赖框架默认缓存。
- 与未来数据层的重试分工：客户端默认 0 次，由调用方决定是客户端重试还是 TanStack Query 重试，避免两层叠加。

### 10. 包结构与测试策略

```
packages/api-client/
  src/index.ts        公开导出
  src/client.ts       工厂、请求方法、URL 拼接
  src/url.ts          baseUrl 校验与路径拼接
  src/error.ts        ApiError 与传输错误映射
  src/sse.ts          SSE 解析、异步队列、重连
  src/types.ts        配置、请求、事件类型
  test/client.test.ts
  test/url.test.ts
  test/error.test.ts
  test/sse.test.ts
  vitest.config.ts
  tsconfig.json
  tsconfig.build.json
  README.md
  AGENTS.md
  CLAUDE.md
```

测试全部通过注入的 `fetch` 驱动：

- 一元请求返回 `new Response(JSON.stringify(...), { status, headers })`。
- SSE 返回带 `ReadableStream` 的 `Response`，按需 enqueue 编码后的 `data:` 行。
- 重连测试用 `vi.useFakeTimers()` 或 `initialDelayMs: 0`，不依赖真实时间。
- 不访问真实网络、`.env` 或系统时间。

`vitest.config.ts` 使用 `@inkstack/vitest-config` 的 `nodeConfig`，`coverage.include` 限定 `src/**/*.ts` 并排除纯再导出的 `src/index.ts`；门槛沿用 80/70。

### 11. 交付与仓库集成

- 依赖用 pnpm CLI 写入 catalog：`ky`、`eventsource-parser` 进 `runtime`；`vitest`、`vite`、`publint` 进 `dev`；`typescript` 进 `toolchain`。
- `package.json` 按元数据规范：`@inkstack/api-client`、`0.0.0`、`private: true`、`ISC`、40–120 字描述、`type: module`、`exports` / `files`、`publint` script 与 `catalog:dev` 依赖。
- 包级三件套：`AGENTS.md` ≤25 行、`CLAUDE.md` 只写 `@AGENTS.md`、`README.md` 写职责/导出/用法/命令/约束。
- 更新 `docs/typescript.md` 的包与预设表；实现完成后更新 `docs/testing.md` 的当前范围与覆盖率基线。
- 完成门禁：`pnpm check:manifests`、`pnpm --filter @inkstack/api-client test`、`pnpm typecheck`、`pnpm lint`、`pnpm build`、`pnpm format:check`，最终 `pnpm verify`。

## Risks / Trade-offs

| 风险                               | 缓解                                                                                                                                |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| canvas 与 BFF 跨源时 cookie 不生效 | `credentials` 默认 `include`；首个真实调用前由 BFF 配置显式 origin + `Access-Control-Allow-Credentials`，并把该配置作为接入前置条件 |
| SSE 重连导致重复 token 或重复计费  | 重连默认关闭；只对可重试错误重连；携带 `Last-Event-ID`；跳过紧邻的重复 id；服务端需支持按 id 续传                                   |
| 与未来 TanStack Query 的重试叠加   | 客户端默认 `retry.limit = 0`，由调用方明确选择一层负责重试                                                                          |
| Next 服务端缓存被误用              | 包不设置默认 `cache`；调用方显式传 `cache` / `next`；服务端与浏览器客户端分开创建                                                   |
| `eventsource-parser` 行为变化      | 解析器隔离在 `sse.ts`；公开 API 只暴露 `ServerEvent`，替换实现不影响调用方                                                          |
| canvas 包体增大                    | ky 零依赖、解析器很小；先测量，确实明显再拆 `./sse` 子路径，拆分是增量改动                                                          |
| Node 与 DOM 类型差异               | 不使用 `HeadersInit` / `RequestCredentials` 等非全局类型；自定义最小别名                                                            |
| 错误信封尚未由 BFF 定义            | 客户端只做宽松提取（`code` / `requestId`），字段缺失时回退到 `HTTP_ERROR` 与 `null`，不反向约束 BFF                                 |

## Migration Plan

这是纯增量变更，没有现有调用方需要迁移。

1. 创建包骨架并补齐三件套与 tsconfig。
2. 用 pnpm 写入 catalog 依赖并安装。
3. 实现 URL、错误、客户端与 SSE，补齐测试。
4. 更新文档与基线，运行完整门禁。
5. 回滚方式：删除 `packages/api-client`、回退 `pnpm-workspace.yaml` 的 catalog 条目与文档行，重新 `pnpm install`。

## Open Questions

- 第一个真实消费方是 shell 的 BFF REST 还是聊天 SSE；这不改变包的 API，只影响接入顺序与 BFF 侧 CORS/错误信封的落地时间。
- 是否需要在后续把按端点的类型化封装加在同一包里；当前保持通用请求 API，等 contracts 里的端点类型稳定后再决定。
- canvas 的 BFF 地址目前是构建期注入；若部署需要同产物多环境，后续再单独设计运行时配置，不在本包内解决。
