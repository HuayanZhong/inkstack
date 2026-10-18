import * as path from 'node:path'
import { defineConfig } from '@rspack/cli'
import { rspack } from '@rspack/core'
import { ReactRefreshRspackPlugin } from '@rspack/plugin-react-refresh'
import { ModuleFederationPlugin } from '@module-federation/enhanced/rspack'

import { mfConfig } from './module-federation.config'

// Target browsers, see: https://github.com/browserslist/browserslist
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
      port: 4002,
      historyApiFallback: true,
      watchFiles: [path.resolve(__dirname, 'src')],
    },
    output: {
      uniqueName: 'canvas',
      publicPath: 'http://localhost:4002/',
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
