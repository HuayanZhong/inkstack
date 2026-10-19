import { defineConfig, mergeConfig } from 'vitest/config'

import { nodeConfig } from '@inkstack/vitest-config'

export default mergeConfig(
  nodeConfig,
  defineConfig({
    test: {
      coverage: {
        include: ['src/**/*.ts', 'src/**/*.tsx'],
        // 启动入口与 tldraw 渲染需要真实浏览器，留给后续 E2E。
        exclude: ['src/App.tsx', 'src/index.ts', 'src/Canvas.tsx'],
      },
    },
  }),
)
