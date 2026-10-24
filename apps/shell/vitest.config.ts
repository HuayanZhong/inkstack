import { defineConfig, mergeConfig } from 'vitest/config'

import { reactConfig } from '@inkstack/vitest-config'

export default mergeConfig(
  reactConfig,
  defineConfig({
    test: {
      setupFiles: ['test/setup.ts'],
      coverage: {
        include: ['src/**/*.tsx'],
        // 根布局是文档级外壳，没有可独立断言的行为；其余页面与状态页均有测试。
        exclude: ['src/app/layout.tsx'],
      },
    },
  }),
)
