import { fileURLToPath } from 'node:url'
import { defineConfig, mergeConfig } from 'vitest/config'

import { reactConfig } from '@inkstack/vitest-config'

// 包内自引用在 dist 尚未生成时也要能解析，测试与类型检查统一指向 src。
const srcDir = fileURLToPath(new URL('./src/', import.meta.url))
const srcIndex = fileURLToPath(new URL('./src/index.ts', import.meta.url))

export default mergeConfig(
  reactConfig,
  defineConfig({
    resolve: {
      alias: [
        { find: /^@inkstack\/ui$/, replacement: srcIndex },
        { find: /^@inkstack\/ui\//, replacement: srcDir },
      ],
    },
    test: {
      coverage: {
        include: ['src/components/**/*.tsx', 'src/lib/**/*.ts'],
      },
    },
  }),
)
