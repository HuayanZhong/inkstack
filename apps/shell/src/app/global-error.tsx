'use client'

import './globals.css'

import { Button } from '@inkstack/ui'

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="zh-CN">
      <body className="min-h-dvh bg-background text-foreground antialiased">
        <title>应用出错了 · 墨栈 Inkstack</title>
        <main className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center gap-4 px-6 py-16">
          <p className="font-mono text-xs tracking-[0.24em] text-muted-foreground uppercase">
            Error
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">应用无法继续渲染</h1>
          <p className="text-sm leading-7 text-muted-foreground">
            根布局渲染失败。可以重试；如果问题持续出现，请稍后再试。
          </p>
          <Button onClick={() => reset()} className="self-start">
            重试
          </Button>
        </main>
      </body>
    </html>
  )
}
