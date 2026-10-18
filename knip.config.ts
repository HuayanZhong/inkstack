import { defineConfig } from 'knip/config'

export default defineConfig({
  workspaces: {
    '.': {
      entry: ['scripts/**/*.mjs'],
      ignore: ['.agents/**', '.claude/**'],
      ignoreDependencies: [
        // OpenSpec CLI 由 .agents/skills 中的工作流调用，源码不会 import。
        '@fission-ai/openspec',
      ],
    },
    // 包以 dist 为入口；显式指向源码，避免 knip 结果依赖是否已构建。
    'packages/config': {
      entry: ['src/index.ts'],
    },
    'packages/contracts': {
      entry: ['src/index.ts'],
    },
    'apps/canvas': {
      entry: ['rspack.config.ts', 'module-federation.config.ts', 'src/index.ts'],
    },
  },
})
