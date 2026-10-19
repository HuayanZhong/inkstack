import { defineConfig } from 'vitest/config'

// 预设包不能消费自己，测试配置直接声明，避免循环。
export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    exclude: ['dist/**', 'node_modules/**'],
    coverage: {
      include: ['src/**/*.ts'],
      thresholds: {
        statements: 80,
        branches: 70,
        functions: 70,
        lines: 80,
      },
    },
  },
})
