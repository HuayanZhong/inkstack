# 测试

测试是包的一部分，不是后续补的选项：新增运行时代码时，同一个变更里必须有对应测试。

## 边界

- `apps/*` 与 `packages/*` 中，任何导出运行时行为的包 MUST 提供 Vitest 测试；纯类型包除外。
- `packages/*` 由 `pnpm check:manifests` 强制：必须有 `test` script、`vitest: catalog:dev` 与至少一个 `test/**/*.test.ts`。
- 纯类型包加入 `scripts/check-manifests.mjs` 的 `testExemptions` 并写明理由；运行时代码包不得加入。
- `apps/*` 暂不做静态强制，但规则同样适用；在应用里新增可测逻辑时，同一变更补测试。
- 不为了通过检查写空测试；没有可断言行为时，先确认模块是否真的属于纯类型。

## 文件与配置

- 测试放在包级 `test/` 目录，按 `src/` 的相对路径平级映射：`src/env.ts` ↔ `test/env.test.ts`。
- 没有单一源码对应的测试放 `test/integration/`（HTTP、WS、DI）或 `test/build/`（构建产物契约）；`test/setup.ts` 只做环境初始化。
- 每个测试包有 `vitest.config.ts`，用 `@inkstack/vitest-config` 的 `node` / `nest` / `react` 预设与 `defineConfig` + `mergeConfig` 组合；Vitest 默认不排除 `dist`，且配置不会从包目录向上查找。
- 每个测试包同时提供 `test` 与 `test:coverage`；`pnpm verify` 执行 `test:coverage`，门槛为 statements / lines 80%、branches / functions 70%。
- `coverage.include` 排除启动入口、纯展示组件、框架适配控制器或浏览器渲染文件时，必须在配置中写明理由；不得用宽泛排除抬高数字。
- `tsconfig.json` 与 `test/` 一起做类型检查；`tsconfig.build.json` 只 include `src` 并排除 `test`，`build` 与 `dev` 使用构建配置。
- 使用显式 `import { describe, expect, it } from 'vitest'`，不开启 globals。

## 写法

- 测试只断言外部可观察行为，不复述实现。
- 不依赖真实网络、当前时间、时区、用户目录或环境变量；需要配置时把对象直接传给被测函数。
- 不使用 `.env` 文件；测试不应要求 dotenv 加载。
- 表驱动用于边界组合；失败信息要能指出输入与期望。
- 一个测试文件对应一个源码模块。

## 接入步骤

依赖、配置、脚本与验证清单见 [`docs/testing.md`](../../docs/testing.md)。
