import { defineConfig } from 'knip/config'

export default defineConfig({
  workspaces: {
    '.': {
      entry: ['scripts/**/*.mjs'],
      // vendored 技能与视图来自上游，不属于仓库源码。
      ignore: ['.agents/**'],
      ignoreDependencies: [
        // OpenSpec CLI 由 .agents/skills 中的工作流调用，源码不会 import。
        '@fission-ai/openspec',
      ],
    },
    'apps/gateway': {
      entry: ['src/main.ts', 'scripts/**/*.mjs'],
    },
    'apps/canvas': {
      entry: ['module-federation.config.ts'],
    },
  },
})
