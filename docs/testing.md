# 测试

本文是 Vitest 命令、配置与接入流程的唯一 home。包边界规则见 [`.claude/rules/testing.md`](../.claude/rules/testing.md)；仓库门禁见 [`docs/toolchain.md`](toolchain.md)。

## 命令

| 命令                                        | 作用                               |
| ------------------------------------------- | ---------------------------------- |
| `pnpm test`                                 | `turbo run test`，运行所有包的测试 |
| `pnpm test:coverage`                        | 运行测试并生成 v8 覆盖率报告       |
| `pnpm --filter @inkstack/<pkg> test`        | 只运行单个包                       |
| `pnpm verify`                               | 完整门禁，包含 test:coverage       |
| `pnpm --filter @inkstack/<pkg> exec vitest` | 进入 watch 模式，仅用于本地调试    |

脚本使用 `vitest run`，不进入 watch；需要监听时显式执行不带 `run` 的命令。

## 当前范围

- `packages/config`：`parseEnv`、env 工厂与 URL 标准化。
- `apps/gateway`：`ping` 单元、`/health` HTTP 集成、Socket.IO `ping` → `pong` 集成。
- `apps/bff`：`/health` 的 Nest Testing + Supertest 集成。
- `apps/shell`：`CanvasHost` 的 loading / ready / error 状态（jsdom + React Testing Library）。
- `apps/canvas`：env 配置与 `dist/mf-manifest.json` 构建契约。
- 不包含 E2E、Playwright 或 Vitest browser mode。

## 文件与配置

测试放在包级 `test/` 目录，按 `src/` 的相对路径平级映射：`src/env.ts` ↔ `test/env.test.ts`。没有单一源码对应的测试按类型放置：

- `test/integration/`：HTTP、WS、Nest DI 等跨模块或真实边界。
- `test/build/`：构建产物契约。
- `test/setup.ts`：环境初始化，不匹配 `*.test.ts`。

每个测试包需要自己的 `vitest.config.ts`，用共享预设与 `defineConfig` + `mergeConfig` 组合：

```ts
import { defineConfig, mergeConfig } from 'vitest/config'
import { nestConfig } from '@inkstack/vitest-config'

export default mergeConfig(nestConfig, defineConfig({}))
```

包级配置本身就是 Vitest 的 root；`defineProject` 只用于被根 `test.projects` 引用的子配置，且不允许 `coverage` 这类 root-only 选项。

预设包括 `nodeConfig`、`nestConfig` 与 `reactConfig`（jsdom）。Vitest 默认只排除 `node_modules` 与 `.git`，预设已显式排除 `dist`；配置只在执行目录查找，不会从包目录向上读取仓库根配置，因此不能省略包级文件。测试 API 使用显式导入：

结构参考 unjs/ufo、unjs/pathe、unjs/consola 与 h3js/h3：包级 `src/` 与 `test/` 平级，tsconfig 同时 include 两者，构建只收 `src`。

```ts
import { describe, expect, it } from 'vitest'
```

## 新包接入清单

1. 依赖：`pnpm add --filter @inkstack/<pkg> -D vitest vite @inkstack/vitest-config --save-catalog-name dev`。
2. `package.json` 增加 `"test": "vitest run"` 与 `"test:coverage": "vitest run --coverage"`。
3. 新增 `vitest.config.ts`，用 `mergeConfig` 组合预设与自身选项，并声明 `coverage.include` / `exclude`。
4. 类型检查覆盖 `test/`：库包拆 `tsconfig.build.json`；Nest 应用把 `typecheck` 指向 `tsconfig.json`；浏览器应用若测试使用 Node API，另加 `tsconfig.test.json` 并纳入更宽的 `types`。
5. 在 `test/` 中按源码结构新增 `*.test.ts`，无源码对应的放 `test/integration/` 或 `test/build/`。
6. 运行 `pnpm --filter @inkstack/<pkg> test`、`pnpm check:manifests` 与 `pnpm verify`。

纯类型包不满足接入条件时，在 `scripts/check-manifests.mjs` 的 `testExemptions` 登记并写明理由；运行时代码包不得豁免。

## 覆盖率

`pnpm test:coverage` 使用 v8 provider，门槛为 statements / lines 80%、branches / functions 70%，按包分别计算；`pnpm verify` 执行的是 `test:coverage`，不达标会阻止推送。

覆盖范围由每个包的 `coverage.include` 限定，当前排除了：

- 启动入口：`src/main.ts`、`src/App.tsx`、`src/index.ts`。
- 纯展示组件：shell 的 `layout.tsx`、`page.tsx`。
- 框架适配控制器：`src/**/*.controller.ts`，由集成测试覆盖，V8 会把参数属性记成不可达分支。
- `src/Canvas.tsx`：tldraw 渲染需要真实浏览器，留给后续 E2E。

当前基线：

| 包                       | Stmts | Branch | Funcs | Lines |
| ------------------------ | ----- | ------ | ----- | ----- |
| `packages/config`        | 97.22 | 100    | 92.85 | 96.29 |
| `packages/vitest-config` | 100   | 100    | 100   | 100   |
| `apps/bff`               | 100   | 100    | 100   | 100   |
| `apps/gateway`           | 100   | 100    | 100   | 100   |
| `apps/canvas`            | 100   | 100    | 100   | 100   |
| `apps/shell`             | 91.42 | 78.57  | 72.72 | 91.42 |

## 已知缺口

- `normalizePrefix('//')` 未覆盖：当前实现返回空字符串，与函数注释"保证以单个 `/` 开头"不一致。测试不按现状固化该行为，修复时一并补测试。
- `envUrlString` 使用 `z.url()`，会接受 `localhost:4002` 这类自定义 scheme；需要限定 `http` / `https` 时另行变更。
- `src/Canvas.tsx` 与 shell 的展示组件没有行为测试；渲染与跨应用流程依赖后续 E2E。

## 共享预设

`@inkstack/vitest-config` 提供三种预设：

| 预设          | 环境  | 使用方         |
| ------------- | ----- | -------------- |
| `nodeConfig`  | Node  | 共享库、canvas |
| `nestConfig`  | Node  | bff、gateway   |
| `reactConfig` | jsdom | shell          |

预设负责 `include`、`exclude`、`environment` 与 v8 coverage 默认值；应用用 `defineConfig` + `mergeConfig` 追加 `setupFiles`、`testTimeout`、`coverage.include` 等自身选项。`test` 与 `test:coverage` 先构建依赖包（`^build`）；只有直接读取本包产物的测试（当前为 canvas 的 MF manifest）才通过包级 `turbo.json` 依赖本包 `build`。
