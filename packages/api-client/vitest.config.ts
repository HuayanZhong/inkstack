import { defineConfig, mergeConfig } from 'vitest/config'

import { nodeConfig } from '@inkstack/vitest-config'

export default mergeConfig(
  nodeConfig,
  defineConfig({
    test: {
      coverage: {
        include: ['src/**/*.ts'],
        // 纯再导出入口没有可执行分支。
        exclude: ['src/index.ts'],
      },
    },
  }),
)
