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
      thresholds: {
        statements: 80,
        branches: 70,
        functions: 70,
        lines: 80,
      },
    },
  },
} satisfies ViteUserConfig

/** Node 平面：服务端应用与共享库。 */
export const nodeConfig = base

/** Nest 平面：装饰器元数据由 Vite 8 的 oxc 读取 tsconfig 发出。 */
export const nestConfig = base

/** React 平面：jsdom 环境，供组件测试使用。 */
export const reactConfig = {
  ...base,
  test: { ...base.test, environment: 'jsdom' as const },
} satisfies ViteUserConfig
