# @inkstack/vitest-config

墨栈共享 Vitest 配置预设，供各应用在包级 `vitest.config.ts` 中复用测试收集范围与环境。

## 公开导出

- `nodeConfig`：Node 环境，用于 BFF、Gateway 与共享库。
- `nestConfig`：与 `nodeConfig` 相同；Nest 的装饰器元数据由 Vite 8 读取 tsconfig 发出。
- `reactConfig`：在基础配置上使用 `jsdom`，用于 React 组件测试。

三个预设都只收集 `test/**/*.test.ts` 与 `test/**/*.test.tsx`，排除 `dist` 与 `node_modules`，并配置 v8 覆盖率与 80/70/70/80 门槛。

## 使用

```ts
import { defineConfig, mergeConfig } from 'vitest/config'
import { nestConfig } from '@inkstack/vitest-config'

export default mergeConfig(nestConfig, defineConfig({}))
```

## 命令

```bash
pnpm --filter @inkstack/vitest-config build
pnpm --filter @inkstack/vitest-config test
```
