# Tasks

## 1. 包骨架与依赖

- [x] 1.1 创建 `packages/api-client` 的 `package.json`、`tsconfig.json`、`tsconfig.build.json`、`vitest.config.ts`、`README.md`、`AGENTS.md` 与 `CLAUDE.md`，元数据按 `docs/package-metadata.md` 填写；验证：`pnpm install` 能识别新包，三件套存在且 `CLAUDE.md` 只写 `@AGENTS.md`，`pnpm check:docs` 通过
- [x] 1.2 用 `pnpm add --filter @inkstack/api-client --save-catalog-name runtime ky eventsource-parser` 写入运行时依赖，用 pnpm 分别把 `vitest` / `vite` / `publint` 写入 `dev` catalog、把 `typescript` 写入 `toolchain` catalog，并用 `--workspace` 加入 `@inkstack/tsconfig` 与 `@inkstack/vitest-config`；验证：`pnpm-workspace.yaml` 的 `runtime` catalog 出现 `ky` 与 `eventsource-parser`，`pnpm-lock.yaml` 更新，`pnpm install` 成功
- [x] 1.3 在 `docs/typescript.md` 的包与预设表加入 `packages/api-client` → `library.json`；验证：`pnpm check:docs` 通过

## 2. URL 与客户端工厂

- [x] 2.1 实现 `src/url.ts`：校验绝对 `http`/`https` baseUrl、去两端斜杠、拒绝绝对路径与 `..` 段；新增 `test/url.test.ts` 覆盖正常拼接、绝对 URL、`..`、多余斜杠；验证：`pnpm --filter @inkstack/api-client test` 通过
- [x] 2.2 实现 `src/types.ts` 与 `src/client.ts` 的 `createApiClient`：baseUrl 必填、credentials 默认 `include`、静态与异步 headers、fetch 注入、每次调用返回独立实例；新增 `test/client.test.ts` 覆盖实例隔离、缺少 baseUrl、异步 headers 合并；验证：上述测试通过
- [x] 2.3 在 `README.md` 写明工厂、配置字段与两个不同 baseUrl 的创建方式；验证：示例与 `src` 导出一致，`pnpm check:docs` 通过

## 3. 一元请求与错误

- [x] 3.1 实现 `request`、`get`、`post`、`put`、`patch`、`delete` 与 `requestRaw`：JSON 请求体、查询参数、每请求 headers、`AbortSignal`、204 与空响应体；在 `test/client.test.ts` 覆盖 JSON 往返、204、查询参数编码、abort；验证：测试通过
- [x] 3.2 实现 `src/error.ts` 的 `ApiError` 与映射：`HTTPError`、`TimeoutError`、`NetworkError`、abort 透传、`requestId` 从响应体或响应头提取；新增 `test/error.test.ts` 覆盖每类错误与字段回退；验证：测试通过
- [x] 3.3 实现默认 `retry.limit = 0`，显式开启时只对幂等方法重试，支持调用方把 `POST` 加入允许列表；在测试中断言默认只请求一次、显式重试生效、POST 默认不重试；验证：测试通过
- [x] 3.4 在 `README.md` 补请求与错误用法，注明默认不重试与 abort 不包装；验证：`pnpm check:docs` 通过

## 4. SSE 流式消费

- [x] 4.1 实现 `src/sse.ts`：懒启动、`TextDecoder` + `eventsource-parser`、异步事件队列、`ServerEvent`、`parse` 映射、非 2xx 抛 `ApiError`、abort 或 `close()` 正常结束；新增 `test/sse.test.ts` 覆盖逐事件消费、POST 流、建连失败、主动结束；验证：测试通过
- [x] 4.2 实现可选重连：默认关闭、指数退避与 jitter、`Last-Event-ID`、`Retry-After`、紧邻重复 id 跳过、尝试耗尽抛 `ApiError`；测试覆盖默认不重连、重连携带 id、耗尽失败；验证：测试通过
- [x] 4.3 在 `README.md` 补 SSE 用法，明确重连默认关闭与 POST 流的非幂等风险；验证：`pnpm check:docs` 通过

## 5. 导出与门禁

- [x] 5.1 完成 `src/index.ts` 的公开导出，运行 `pnpm --filter @inkstack/api-client build` 与 `pnpm --filter @inkstack/api-client publint`；验证：构建产出 `dist`，publint 无错误
- [x] 5.2 运行 `pnpm --filter @inkstack/api-client test:coverage`，把实际覆盖率补进 `docs/testing.md` 的当前范围与基线表；验证：文档数值与命令输出一致，覆盖率不低于 statements/lines 80%、branches/functions 70%
- [x] 5.3 依次运行 `pnpm check:manifests`、`pnpm typecheck`、`pnpm lint`、`pnpm format`、`pnpm format:check`、`pnpm verify`；验证：全部门禁通过，并在完成说明中附实际输出摘要

## Workflow follow-up

- 实现完成并评审通过后，用 `/opsx:archive` 归档本变更。
