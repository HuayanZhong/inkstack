import path from 'node:path'
import { fileURLToPath } from 'node:url'

// 扫描根限定在应用包内：共享组件由 CSS 入口的 @source 显式加入。设到仓库根会让构建监视整个仓库，
// 别的应用 dev 时写 .next 等产物就会触发本应用重建，形成无限重建。
const base = path.dirname(fileURLToPath(import.meta.url))

export default {
  plugins: {
    '@tailwindcss/postcss': { base },
  },
}
