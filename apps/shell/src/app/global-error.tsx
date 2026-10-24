'use client'

import './globals.css'

import { Button } from '@inkstack/ui'

import { Artboard, CanvasShell } from './_components/canvas-shell'

export default function GlobalError({ retry }: { error: unknown; retry: () => void }) {
  return (
    <html lang="zh-CN">
      <body className="min-h-dvh bg-background text-foreground antialiased">
        <title>应用出错了 · 墨栈 Inkstack</title>
        <CanvasShell
          route="画布 / 全局错误"
          statusLeft="root layout error · 1 error"
          statusRight="x 0000 y 0000 · —"
        >
          <Artboard label="global error" meta="root layout" tone="error" annotation="笔触中断">
            <div className="max-w-xl space-y-6">
              <p className="font-mono text-[10px] tracking-[0.24em] text-destructive uppercase">
                Root layout error
              </p>
              <h1 className="font-heading text-4xl leading-[1.12] font-semibold tracking-tight sm:text-5xl">
                <span className="ink-in inline-block">应用无法继续渲染。</span>
              </h1>
              <p className="text-sm leading-7 text-muted-foreground">
                根布局遇到了意外错误。可以重试；如果问题持续出现，请稍后再试。
              </p>
              <Button size="lg" onClick={() => retry()}>
                重试
              </Button>
            </div>
          </Artboard>
        </CanvasShell>
      </body>
    </html>
  )
}
