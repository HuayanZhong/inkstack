# Design

## Context

动机见 [proposal.md](proposal.md)。核对到的现状与事实：

- 四个应用都没有测试脚本或测试依赖；`pnpm test` 目前只跑到 `packages/config`。
- gateway 已有 `scripts/smoke-ws.mjs`，是手工脚本，不是可断言的测试。
- shell 的 `CanvasHost` 是唯一有分支的客户端组件：loading / ready / error，模块级缓存 `canvasPromise`。
- canvas 的 MF 配置在 `module-federation.config.ts`，构建产物为 `dist/remoteEntry.js` 与 `dist/mf-manifest.json`。
- bff / gateway 的 `tsconfig.build.json` 已 `include: ["src"]`；`tsconfig.json` 的 `rootDir` 为 `.`，但 typecheck 目前使用 build 配置，`test/` 不会参与检查。
- Vitest 5 官方文档：`test.projects` 取代 `workspace`；以文件或目录引用的 project **不会自动继承**根配置，官方给出的共享方式是 `mergeConfig(configShared, defineProject({...}))`。本仓库每个包独立运行 Vitest，包级配置本身是 root，因此使用 `defineConfig`；`defineProject` 不允许 `coverage` 等 root-only 选项。
- Nest 12 官方文档：新项目默认使用 Vitest，推荐 `@nestjs/testing` + Supertest，测试文件用 `.spec` 或 `.test` 后缀。
- Vite 8 的 oxc 转换原生发出 `design:paramtypes`；已用临时工程实测，`Reflect.getMetadata` 能取到构造器依赖，不需要 `unplugin-swc`。
- 依赖版本（registry，2026-10-20）：`@nestjs/testing` 12.1.3、`supertest` 7.3.1、`@types/supertest` 7.2.1、`jsdom` 30.1.3、`@testing-library/react` 16.3.3、`@testing-library/dom` 10.4.2、`@testing-library/jest-dom` 7.0.1。

## Goals / Non-Goals

**Goals:**

- 为四个应用建立可运行的 Vitest 基线，覆盖当前真实存在的分支与边界。
- 用共享预设消除重复配置，并按 `defineConfig` + `mergeConfig` 组合。
- Gateway 的 WS 集成测试成为后续 action 协议、seq 与广播的复用骨架。

**Non-Goals:**

- 不做 E2E、Playwright、Vitest browser mode。
- 不用 jsdom 硬测 tldraw 渲染；canvas 只做配置与构建契约。
- 不把未测试的渲染与启动文件计入覆盖率分母来制造高数字；排除项必须写明理由。
- 不为应用的每个函数补测试；只覆盖当前存在的行为。
- 不改运行时实现，除非测试暴露必须的可测性缝隙。

## Decisions

### 1. 按包配置 + `mergeConfig`，不用根 `test.projects`

仓库的测试入口是 Turbo 的按包 `test`，不是单个根 Vitest 进程。改用根 `projects` 会绕开 Turbo 的按包缓存，也让应用之间的依赖关系变隐式。

`packages/vitest-config` 导出三个普通配置对象：

```ts
import type { ViteUserConfig } from 'vitest/config'

const base = {
  test: {
    environment: 'node' as const,
    include: ['test/**/*.test.ts', 'test/**/*.test.tsx'],
    exclude: ['dist/**', 'node_modules/**'],
    coverage: {
      provider: 'v8' as const,
      enabled: false,
      reporter: ['text', 'html'],
      reportsDirectory: 'coverage',
      thresholds: { statements: 80, branches: 70, functions: 70, lines: 80 },
    },
  },
} satisfies ViteUserConfig

export const nodeConfig = base
export const nestConfig = base
export const reactConfig = {
  ...base,
  test: { ...base.test, environment: 'jsdom' as const },
} satisfies ViteUserConfig
```

每个应用：

```ts
import { defineConfig, mergeConfig } from 'vitest/config'
import { reactConfig } from '@inkstack/vitest-config'

export default mergeConfig(
  reactConfig,
  defineConfig({
    test: { setupFiles: ['test/setup.ts'] },
  }),
)
```

包级配置是独立运行的 root；`defineProject` 只适用于被根 `test.projects` 引用的子配置。预设包本身按仓库约定构建到 `dist`，因此 Turbo 的 `test` 需要先构建依赖包。

### 2. 测试目录按 `src/` 平级映射

- 有源码对应：`test/<与 src 相同的相对路径>.test.ts(x)`。
- 无单一源码对应：`test/integration/`（HTTP、WS、DI）与 `test/build/`（构建产物契约）。
- 环境初始化：`test/setup.ts`，不匹配 `*.test.ts`。

不采用 colocated：这是用户明确选择的仓库约定，参考 unjs/ufo、pathe、consola、h3 的包级 `src/` + `test/`。Nest 官方推荐就近放，本仓库有意偏离。

### 3. Gateway：真实 HTTP 与 WS，不 mock 框架

- `/health` 用 `Test.createTestingModule({ imports: [AppModule] })` + `createNestApplication()` + `app.init()` + Supertest。
- WS 用 `IoAdapter`、`app.listen(0)` 取临时端口，`socket.io-client` 以 `path: '/ws'` 连接，断言 `ping` 的 ack 为 `pong`。
- `handlePing` 保留一个纯单元测试，防止在无框架时也能定位问题。
- 连接使用 `forceNew: true`，每个测试独立 socket；`afterAll` 关闭 socket 与 app，超时设为 5 秒，避免挂起。

Env 在模块加载时校验，默认值已经覆盖测试所需（`GATEWAY_WS_PATH=/ws`）；测试不依赖外部 `.env`。后续协议测试需要多组配置时，再考虑把 `config` 改成工厂。

### 4. BFF：同一套 Nest 模板的最小实例

`/health` 集成测试与 Gateway 相同，作为会话、SSE 接口的复制模板。控制器与 service 很薄，不额外写 mock 单测。

### 5. Shell：组件状态机，mock MF runtime

`CanvasHost` 的三个状态分别测试：

- 远程模块解析成功 → 渲染 mock `Canvas`；
- `loadRemote` reject → `role="alert"` 与错误文案；
- 缺 `NEXT_PUBLIC_CANVAS_MF_ENTRY` → 可见错误。

`canvasPromise` 是模块级缓存，测试用 `vi.resetModules()` + 动态 `import()` 每个用例重新加载组件，避免状态串扰；`vi.stubEnv` 控制入口变量。

不引入 `@vitejs/plugin-react`：Vite 8 的 oxc 读取 `tsconfig.json` 的 `jsx: react-jsx`，足以转换 TSX；如果实施时发现转换或 Fast Refresh 相关失败，再单独加插件并记录理由。

### 6. Canvas：配置 + 构建契约

- `test/config/env.test.ts` 覆盖 `CANVAS_HOST` / `CANVAS_PORT` / `CANVAS_DEV_CORS_ORIGIN` 的默认值与非法值。
- `test/build/mf-manifest.test.ts` 读取 `dist/mf-manifest.json`，断言 `exposes` 含 `./Canvas`，且清单中的远程地址不含 `localhost`。
- 不写 `Canvas.test.tsx`：tldraw 需要真实布局与指针事件，jsdom 下只能靠大量 polyfill，收益低于成本；真实渲染留给未来的 E2E。

### 7. Turbo `test` 在构建之后执行

`turbo.json` 的 `test` 改为：

```json
"test": {
  "description": "按包执行 Vitest 单元与集成测试；先构建本包与依赖包，覆盖构建产物契约。",
  "dependsOn": ["build"],
  "inputs": ["$TURBO_DEFAULT$"],
  "outputs": []
}
```

`build` 已经 `dependsOn: ["^build"]`，所以依赖包也会先构建。这样 canvas 的 manifest 测试在干净检出中也能读取 `dist`，不需要在测试内部再调构建。代价是单独运行 `pnpm test` 会先构建全部应用；在 `pnpm verify` 中构建随后命中缓存。

### 8. tsconfig 的检查范围

| 应用          | 调整                                                                                           |
| ------------- | ---------------------------------------------------------------------------------------------- |
| shell         | 现有 `include` 已覆盖 `test/`，不改                                                            |
| canvas        | 主 tsconfig 保持 `src`；新增 `tsconfig.test.json`（`types: ["node"]`，include `src` + `test`） |
| bff / gateway | `typecheck` 改为 `tsc -p tsconfig.json --noEmit`；`rootDir: "."` 已覆盖 `test/`，构建配置不变  |

canvas 的契约测试使用 `node:fs`，浏览器 tsconfig 不含 Node 类型；拆测试配置避免 Node 全局泄漏到客户端代码。

### 9. 依赖与 catalog

`dev` catalog 增加 `@nestjs/testing`、`supertest`、`@types/supertest`、`jsdom`、`@testing-library/react`、`@testing-library/dom`、`@testing-library/jest-dom`、`@vitest/coverage-v8`；`vitest` / `vite` 已有。

`@testing-library/dom` 必须显式声明：`autoInstallPeers: false` 下 `@testing-library/react` 的 peer 不会自动安装。`@vitest/coverage-v8` 放在根 devDependencies，包级 Vitest 通过 Node 的祖先目录解析找到它。

### 10. 覆盖率按包声明，门槛统一

`@vitest/coverage-v8` 固定 5.0.5，与 Vitest 5 的 peer 一致。共享预设统一 provider、reporter、输出目录与门槛：

```ts
coverage: {
  provider: 'v8',
  enabled: false,
  reporter: ['text', 'html'],
  reportsDirectory: 'coverage',
  thresholds: { statements: 80, branches: 70, functions: 70, lines: 80 },
}
```

每个包只声明 `coverage.include` 与有理由的排除：

| 包                          | include                          | 排除                                    |
| --------------------------- | -------------------------------- | --------------------------------------- |
| `packages/config`           | `src/env.ts`、`src/normalize.ts` | 再导出入口                              |
| `packages/vitest-config`    | `src/**/*.ts`                    | —                                       |
| `apps/bff` / `apps/gateway` | `src/**/*.ts`                    | `src/main.ts`、`src/**/*.controller.ts` |
| `apps/shell`                | `src/**/*.tsx`                   | `layout.tsx`、`page.tsx`                |
| `apps/canvas`               | `src/**/*.ts`、`src/**/*.tsx`    | `App.tsx`、`index.ts`、`Canvas.tsx`     |

排除理由分别写在各自配置里：启动入口、纯展示组件、框架适配控制器、需要真实浏览器的渲染。BFF 与 Gateway 补了 config 测试，覆盖 `NODE_ENV` 的未设置与 production 分支，使分支覆盖率可达到 100%。

`pnpm verify` 用 `test:coverage` 取代 `test`，覆盖率不达标直接阻止推送。

## Risks / Trade-offs

- **oxc 的 JSX 转换不满足 RTL 测试** → 先用最小 `tsx` 测试验证；失败再加 `@vitejs/plugin-react`，不提前引入。
- **Next build 会类型检查 `test/`** → 测试依赖都是 devDependencies，类型可解析；如果 Next 对测试文件报错，再给 shell 拆 `tsconfig.test.json`。
- **WS 集成测试抖动** → 使用 `listen(0)` 临时端口、独立 socket、显式超时与 `afterAll` 清理；不使用固定 4001。
- **knip 把 `jsdom` 判为未使用** → `jsdom` 只出现在 Vitest 配置的字符串里；如果 knip 不识别，按依赖写明理由后加入 ignore，不用宽泛忽略。
- **`pnpm test` 因 `dependsOn: ["build"]` 变慢** → Turbo 缓存会命中；如果单独跑测试的反馈太慢，再拆 `test:unit` 与 `test:integration`。
- **共享预设包自身需要测试** → 它导出运行时代码，按仓库边界必须有 `test` script 与测试文件；测试只断言 `include` / `exclude` / `environment` / coverage 默认值，不反向依赖预设。
- **覆盖率排除项掩盖真实缺口** → 每个排除都写明理由；canvas 渲染与 shell 展示组件的缺口记录在 `docs/testing.md`，由后续 E2E 补。
- **门槛随基线漂移** → 门槛固定在预设，基线数字写进文档；新增代码拉低覆盖率时必须补测试或显式调整门槛并说明理由。

## Migration Plan

1. 新增 `packages/vitest-config` 并构建，验证三个预设可被 Node ESM 导入。
2. 先接 Gateway：配置、脚本、单元与 HTTP 集成，再接 WS 集成。
3. 接 BFF，复用 Nest 模板。
4. 接 shell：jsdom、setup、状态机测试。
5. 接 canvas：配置与构建契约，调整 Turbo `test` 依赖。
6. 接入 `@vitest/coverage-v8`、`test:coverage` 与门槛，补 BFF / Gateway config 测试，把 `verify` 切到覆盖率。
7. 最后回正 `docs/testing.md`、`.claude/rules/testing.md`、`packages/AGENTS.md`，运行 `pnpm verify`。
8. 回滚：删除应用 `test/` 与配置、移除共享预设包、恢复 Turbo 与依赖；不涉及运行时状态。

## Open Questions

无。
