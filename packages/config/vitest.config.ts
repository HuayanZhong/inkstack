import { defineConfig } from 'vitest/config'

// Vitest 默认只排除 node_modules 与 .git；构建产物里的同名测试必须显式排除。
export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    exclude: ['dist/**', 'node_modules/**'],
    coverage: {
      include: ['src/env.ts', 'src/normalize.ts'],
      thresholds: {
        statements: 80,
        branches: 70,
        functions: 70,
        lines: 80,
      },
    },
  },
})
