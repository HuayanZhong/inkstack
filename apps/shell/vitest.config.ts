import { defineConfig, mergeConfig } from 'vitest/config'

import { reactConfig } from '@inkstack/vitest-config'

export default mergeConfig(
  reactConfig,
  defineConfig({
    test: {
      setupFiles: ['test/setup.ts'],
      // 当前只有骨架页面，没有可断言行为；新增可测逻辑时必须补测试并移除该开关。
      passWithNoTests: true,
      coverage: {
        include: ['src/**/*.tsx'],
        // 纯展示文件没有行为分支。
        exclude: ['src/app/layout.tsx', 'src/app/page.tsx'],
      },
    },
  }),
)
