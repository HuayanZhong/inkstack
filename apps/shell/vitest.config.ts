import { defineConfig, mergeConfig } from 'vitest/config'

import { reactConfig } from '@inkstack/vitest-config'

export default mergeConfig(
  reactConfig,
  defineConfig({
    test: {
      setupFiles: ['test/setup.ts'],
      coverage: {
        include: ['src/**/*.tsx'],
        // 纯展示文件没有行为分支；行为测试集中在 CanvasHost。
        exclude: ['src/app/layout.tsx', 'src/app/page.tsx'],
      },
    },
  }),
)
