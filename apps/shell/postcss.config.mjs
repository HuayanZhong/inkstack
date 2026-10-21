import path from 'node:path'
import { fileURLToPath } from 'node:url'

// 共享组件的类名不在应用目录内，扫描根设到仓库根；node_modules 与产物目录由 .gitignore 排除。
const base = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

export default {
  plugins: {
    '@tailwindcss/postcss': { base },
  },
}
