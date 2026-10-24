'use client'

import './globals.css'

import { Button } from '@inkstack/ui'

export default function GlobalError({ retry }: { error: unknown; retry: () => void }) {
  return (
    <html lang="zh-CN">
      <body className="min-h-dvh bg-background text-foreground antialiased">
        <title>应用出错了 · 墨栈 Inkstack</title>
        <main className="grid min-h-dvh place-items-center px-6">
          <div className="w-full max-w-md space-y-5 rounded-xl border border-border bg-card p-6">
            <p className="text-xs font-medium tracking-[0.24em] text-muted-foreground uppercase">
              应用出错了
            </p>
            <h1 className="text-2xl font-semibold tracking-tight">应用无法继续渲染</h1>
            <p className="text-sm leading-6 text-muted-foreground">
              根布局遇到了意外错误。可以重试；如果问题持续出现，请稍后再试。
            </p>
            <Button onClick={() => retry()}>重试</Button>
          </div>
        </main>
      </body>
    </html>
  )
}
