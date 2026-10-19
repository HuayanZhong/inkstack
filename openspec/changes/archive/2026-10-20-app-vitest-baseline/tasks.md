# Tasks

## 1. 共享预设包

- [x] 1.1 用 `pnpm create` 之外的方式按现有包结构新增 `packages/vitest-config`（`package.json`、`tsconfig.json`、`tsconfig.build.json`、`src/index.ts`、`test/index.test.ts`、`AGENTS.md`、`CLAUDE.md`、`README.md`）；验证：`pnpm check:manifests` 输出 0 errors，三件套齐全。
- [x] 1.2 在 `packages/vitest-config/src/index.ts` 导出 `nodeConfig`、`reactConfig`、`nestConfig`：统一 `include: ["test/**/*.test.ts", "test/**/*.test.tsx"]`、`exclude: ["dist/**", "node_modules/**"]`，`reactConfig` 使用 `environment: "jsdom"`；验证：`pnpm --filter @inkstack/vitest-config build` 成功，`node -e "import('@inkstack/vitest-config').then(m=>console.log(Object.keys(m)))"` 能解析三个导出。
- [x] 1.3 为预设包配置 `test` script 与 `test/index.test.ts`，断言三个预设的 `include` / `exclude` / `environment`；验证：`pnpm --filter @inkstack/vitest-config test` 通过。
- [x] 1.4 在 `dev` catalog 增加 `@nestjs/testing`、`supertest`、`@types/supertest`、`jsdom`、`@testing-library/react`、`@testing-library/dom`、`@testing-library/jest-dom`；验证：`pnpm install` 成功，`pnpm check:manifests` 输出 0 errors。

## 2. Gateway 测试

- [x] 2.1 给 gateway 增加 `vitest`、`vite`、`@inkstack/vitest-config`（`workspace:*`）与 `@nestjs/testing`、`supertest`、`@types/supertest`，新增 `test` script、`vitest.config.ts`（`nestConfig`）与 `test/setup.ts`；验证：`pnpm --filter @inkstack/gateway test -- --passWithNoTests` 退出码为 0。
- [x] 2.2 新增 `test/ws/events.gateway.test.ts`，断言 `handlePing()` 返回 `pong`；验证：`pnpm --filter @inkstack/gateway test` 通过。
- [x] 2.3 新增 `test/integration/health.test.ts`，用 Nest Testing + Supertest 断言 `GET /health` 返回 `{ status: "ok", service: "gateway" }`；验证：测试通过，`afterAll` 关闭 app。
- [x] 2.4 新增 `test/integration/ws.test.ts`：创建 Nest app、安装 `IoAdapter`、`app.listen(0)`，用 `socket.io-client` 以 `path: "/ws"` 连接，断言 `ping` 的 ack 为 `pong`；验证：测试通过且没有残留 socket（`afterAll` 关闭）。
- [x] 2.5 把 gateway 的 `typecheck` 改为 `tsc -p tsconfig.json --noEmit`，确认 `test/` 参与类型检查而 `tsconfig.build.json` 仍只收 `src`；验证：`pnpm --filter @inkstack/gateway typecheck` 通过，`pnpm --filter @inkstack/gateway build` 后 `dist` 中无 `*.test.*`。

## 3. BFF 测试

- [x] 3.1 给 bff 增加 `vitest`、`vite`、`@inkstack/vitest-config`、`@nestjs/testing`、`supertest`、`@types/supertest`，新增 `test` script、`vitest.config.ts` 与 `test/setup.ts`；验证：`pnpm --filter @inkstack/bff test -- --passWithNoTests` 退出码为 0。
- [x] 3.2 新增 `test/integration/health.test.ts`，断言 `GET /health` 返回 `{ status: "ok", service: "bff" }`；验证：测试通过，`afterAll` 关闭 app。
- [x] 3.3 把 bff 的 `typecheck` 改为 `tsc -p tsconfig.json --noEmit`；验证：`pnpm --filter @inkstack/bff typecheck` 通过，构建后 `dist` 中无 `*.test.*`。

## 4. Shell 测试

- [x] 4.1 给 shell 增加 `vitest`、`vite`、`jsdom`、`@inkstack/vitest-config`、`@testing-library/react`、`@testing-library/dom`、`@testing-library/jest-dom`，新增 `test` script、`vitest.config.ts`（`reactConfig`）与 `test/setup.ts`（jest-dom + cleanup）；验证：`pnpm --filter @inkstack/shell test -- --passWithNoTests` 退出码为 0。
- [x] 4.2 新增 `test/app/canvas-host.test.tsx`，用 `vi.mock` 替换 `@module-federation/enhanced/runtime`，覆盖 loading、ready、`loadRemote` 失败与缺失 `NEXT_PUBLIC_CANVAS_MF_ENTRY`；验证：每个用例独立通过，`vi.resetModules()` 消除模块级缓存串扰。
- [x] 4.3 确认 shell 的 `tsconfig.json` 已覆盖 `test/`，且 `pnpm --filter @inkstack/shell typecheck` 与 `pnpm --filter @inkstack/shell build` 均通过；验证：Next 构建不对测试文件报错。

## 5. Canvas 测试

- [x] 5.1 给 canvas 增加 `vitest`、`vite`、`@inkstack/vitest-config`，新增 `test` script、`vitest.config.ts`（`nodeConfig`），并在 `tsconfig.json` 的 `include` 增加 `test`；验证：`pnpm --filter @inkstack/canvas typecheck` 通过，`pnpm --filter @inkstack/canvas test -- --passWithNoTests` 退出码为 0。
- [x] 5.2 新增 `test/config/env.test.ts`，覆盖 `CANVAS_HOST` / `CANVAS_PORT` / `CANVAS_DEV_CORS_ORIGIN` 的默认值与非法值；验证：测试通过。
- [x] 5.3 新增 `test/build/mf-manifest.test.ts`，读取 `dist/mf-manifest.json`，断言 `exposes` 含 `./Canvas` 且远程地址不含 `localhost`；验证：先运行 `pnpm --filter @inkstack/canvas build`，再运行测试通过。

## 6. 工具链与文档

- [x] 6.1 把 `turbo.json` 的 `test` 改为 `dependsOn: ["build"]`，更新 description；验证：干净删除某个应用 `dist` 后运行 `pnpm test`，测试仍能读取构建产物并成功。
- [x] 6.2 更新 `docs/testing.md`：当前范围改为四个应用，补充 `test/integration/` 与 `test/build/` 约定、`@inkstack/vitest-config` 预设与 `defineProject` + `mergeConfig` 用法，并写明 E2E 尚未接入；验证：`pnpm format:check` 通过，链接有效。
- [x] 6.3 更新 `.claude/rules/testing.md`（集成/构建测试子目录、共享预设）与 `packages/AGENTS.md` 的目录列表（增加 `vitest-config/`）；验证：`pnpm check:manifests` 与 `pnpm format:check` 通过。

## 7. 集成验证

- [x] 7.1 运行 `pnpm verify`；验证：退出码为 0，输出包含四个应用的 test 任务，format / hygiene / publint 均通过。
- [x] 7.2 检查 `git status` 与 `git diff --stat`：改动只落在 catalog、`packages/vitest-config`、四个应用的 `package.json` / `tsconfig.json` / `vitest.config.ts` / `test/`、`turbo.json`、文档与本次 change 目录；验证：没有运行时源码改动，lockfile 只反映新增测试依赖。

## 8. 覆盖率

- [x] 8.1 在 `dev` catalog 与根 devDependencies 增加 `@vitest/coverage-v8@5.0.5`，每个包增加 `test:coverage` script，`turbo.json` 增加 `test:coverage` 任务，根增加 `pnpm test:coverage`；验证：`pnpm test:coverage` 成功并输出每个包的覆盖率表。
- [x] 8.2 在共享预设统一 v8 provider、reporter 与门槛（statements / lines 80%、branches / functions 70%），每个包声明 `coverage.include` 与有理由的排除；验证：各包覆盖率均达到门槛。
- [x] 8.3 补 BFF 与 Gateway 的 `test/config/index.test.ts`，覆盖 `NODE_ENV` 未设置与 production 分支；验证：两个包 branches 达到 100%。
- [x] 8.4 把 `pnpm verify` 的 `test` 换成 `test:coverage`，并在 `docs/testing.md`、`.claude/rules/testing.md` 记录命令、门槛、排除范围与基线；验证：`pnpm verify` 通过。

## Workflow follow-up

- 评审通过后归档本次 change。
- E2E 与 Playwright 留到 action 协议落地、出现跨应用流程后再单独提案。
