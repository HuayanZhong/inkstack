'use client'

import { useEffect, useState, type ComponentType, type CSSProperties } from 'react'
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import * as ReactDOMClient from 'react-dom/client'

const CANVAS_ENTRY =
  process.env.NEXT_PUBLIC_CANVAS_MF_ENTRY ?? 'http://localhost:4002/mf-manifest.json'

interface CanvasModule {
  Canvas: ComponentType
}

type CanvasState =
  | { status: 'loading' }
  | { status: 'ready'; Canvas: ComponentType }
  | { status: 'error'; message: string }

// createInstance 每次调用都会新增实例；缓存 Promise，避免重复挂载时重复注册。
let canvasPromise: Promise<CanvasModule> | null = null

function loadCanvas(): Promise<CanvasModule> {
  canvasPromise ??= import('@module-federation/enhanced/runtime')
    .then(async ({ createInstance }) => {
      const instance = createInstance({
        name: 'shell',
        remotes: [{ name: 'canvas', entry: CANVAS_ENTRY }],
        // Next App Router 运行内置 React canary，与 remote 声明的稳定版范围不兼容；
        // 不做版本检查，优先复用已加载的 host 实例。
        shareStrategy: 'loaded-first',
        shared: {
          react: {
            version: React.version,
            lib: () => React,
            shareConfig: { singleton: true, requiredVersion: false },
          },
          'react-dom': {
            version: ReactDOM.version,
            lib: () => ReactDOM,
            shareConfig: { singleton: true, requiredVersion: false },
          },
          'react-dom/client': {
            // @types/react-dom/client 未声明 version，发布物与 react-dom 同版本。
            version: ReactDOM.version,
            lib: () => ReactDOMClient,
            shareConfig: { singleton: true, requiredVersion: false },
          },
        },
      })

      const canvasModule = await instance.loadRemote<CanvasModule>('canvas/Canvas')
      if (!canvasModule?.Canvas) {
        throw new Error('远程模块 canvas/Canvas 未导出 Canvas')
      }
      return canvasModule
    })
    .catch((error: unknown) => {
      // 失败后清空缓存，重新挂载时允许重试。
      canvasPromise = null
      throw error
    })

  return canvasPromise
}

export function CanvasHost() {
  const [state, setState] = useState<CanvasState>({ status: 'loading' })

  useEffect(() => {
    let active = true

    loadCanvas()
      .then((canvasModule) => {
        if (active) {
          setState({ status: 'ready', Canvas: canvasModule.Canvas })
        }
      })
      .catch((error: unknown) => {
        console.error('[canvas-host] 加载远程画布失败', error)
        if (active) {
          setState({
            status: 'error',
            message: error instanceof Error ? error.message : String(error),
          })
        }
      })

    return () => {
      active = false
    }
  }, [])

  if (state.status === 'loading') {
    return <div style={statusStyle}>画布加载中…</div>
  }

  if (state.status === 'error') {
    return (
      <div role="alert" style={statusStyle}>
        画布加载失败：{state.message}
      </div>
    )
  }

  const { Canvas } = state
  return <Canvas />
}

const statusStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  padding: 24,
  color: '#666',
  fontSize: 14,
  textAlign: 'center',
}
