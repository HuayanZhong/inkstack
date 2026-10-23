import { createModuleFederationConfig } from '@module-federation/enhanced/rspack'

export const mfConfig = createModuleFederationConfig({
  name: 'canvas',
  filename: 'remoteEntry.js',
  manifest: true,
  dts: true,
  dev: {
    // 类型提示插件的 websocket 固定连 ws://127.0.0.1，非本机访问必然失败，
    // 而它用 console.error 报告，会触发 host 的 Next 错误浮层；本仓库不消费远端类型，直接关闭。
    disableDynamicRemoteTypeHints: true,
  },
  // 由 MF 插件在入口执行前完成共享模块初始化，替代手写异步边界。
  experiments: {
    asyncStartup: true,
  },
  // host 与 remote 同仓库同版本，复用已加载依赖比强制版本协商更省请求。
  shareStrategy: 'loaded-first',
  exposes: {
    './Canvas': './src/Canvas.tsx',
  },
  // Next App Router 的 host 使用内置 React canary，remote 不应按自身稳定版检查版本；
  // loaded-first 下直接复用 host 已加载的实例。
  shared: {
    react: { singleton: true, requiredVersion: false },
    'react-dom': { singleton: true, requiredVersion: false },
    // tldraw 直接导入 react-dom/client；前缀形式让子路径也走共享，避免加载自带副本。
    'react-dom/': {
      request: 'react-dom/',
      shareKey: 'react-dom/',
      singleton: true,
      requiredVersion: false,
    },
  },
})
