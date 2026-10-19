import { defineConfig, mergeConfig } from 'vitest/config'

import { nestConfig } from '@inkstack/vitest-config'

export default mergeConfig(
  nestConfig,
  defineConfig({
    test: {
      setupFiles: ['test/setup.ts'],
      testTimeout: 10_000,
      coverage: {
        include: ['src/**/*.ts'],
        // 启动入口与框架适配控制器由集成测试覆盖，V8 会为参数属性记出不可达分支。
        exclude: ['src/main.ts', 'src/**/*.controller.ts'],
      },
    },
  }),
)
