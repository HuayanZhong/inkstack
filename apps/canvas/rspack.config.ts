import * as path from 'node:path'
import { defineConfig } from '@rspack/cli'
import { rspack } from '@rspack/core'
import { ReactRefreshRspackPlugin } from '@rspack/plugin-react-refresh'
import { ModuleFederationPlugin } from '@module-federation/enhanced/rspack'

import { mfConfig } from './module-federation.config'
import { env } from './src/config/env'

// 目标浏览器列表，见 https://github.com/browserslist/browserslist
const targets = ['chrome >= 87', 'edge >= 88', 'firefox >= 78', 'safari >= 14']

// 用 argv.mode 判断环境：--mode 不会写入 process.env.NODE_ENV，读环境变量会拿到 undefined。
export default defineConfig((_env, argv) => {
  const isDev = argv.mode === 'development'

  return {
    context: __dirname,
    entry: {
      main: './src/index.ts',
    },
    resolve: {
      extensions: ['...', '.ts', '.tsx', '.jsx'],
    },

    devServer: {
      port: env.CANVAS_PORT,
      historyApiFallback: true,
      // 画布用整页刷新：Canvas 经 MF 暴露后运行在 host 的 React 树里，模块级热更新能应用但不会重渲染；
      // 显式关闭 HMR，避免「模块已更新、界面不动」。编译器自身按模块图监视源文件，不需要 watchFiles。
      hot: false,
      // manifest 通过 fetch 跨端口读取，需要 CORS；生产由静态托管配置同等响应头。
      headers: {
        'Access-Control-Allow-Origin': env.CANVAS_DEV_CORS_ORIGIN,
      },
    },
    output: {
      uniqueName: 'canvas',
      // 显式声明输出目录：MF 的 DTS 插件在 apply 阶段依赖 output.path 计算类型产物位置。
      path: path.resolve(__dirname, 'dist'),
      // 生产用 auto，按部署后的脚本地址解析资源，避免清单与产物带上 localhost。
      publicPath: isDev ? `http://${env.CANVAS_HOST}:${env.CANVAS_PORT}/` : 'auto',
      // 远程产物按整目录发布，残留旧 expose 文件会污染 manifest 与类型包。
      clean: true,
    },

    experiments: {
      css: true,
    },

    module: {
      rules: [
        {
          test: /\.svg$/,
          type: 'asset',
        },
        {
          test: /\.css$/,
          use: ['postcss-loader'],
          type: 'css',
        },
        {
          test: /\.(jsx?|tsx?)$/,
          use: [
            {
              loader: 'builtin:swc-loader',
              options: {
                jsc: {
                  parser: {
                    syntax: 'typescript',
                    tsx: true,
                  },
                  transform: {
                    react: {
                      runtime: 'automatic',
                      development: isDev,
                      refresh: isDev,
                    },
                  },
                },
                env: { targets },
              },
            },
          ],
        },
      ],
    },
    plugins: [
      new rspack.HtmlRspackPlugin({
        template: './index.html',
      }),
      new ModuleFederationPlugin(mfConfig),
      isDev ? new ReactRefreshRspackPlugin() : null,
    ].filter(Boolean),
    optimization: {
      minimizer: [
        new rspack.SwcJsMinimizerRspackPlugin(),
        new rspack.LightningCssMinimizerRspackPlugin({
          minimizerOptions: { targets },
        }),
      ],
    },
  }
})
