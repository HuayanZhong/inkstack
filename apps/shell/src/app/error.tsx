'use client'

import Link from 'next/link'

import { Button, buttonVariants } from '@inkstack/ui'

export default function Error({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center gap-4 px-6 py-16">
      <p className="font-mono text-xs tracking-[0.24em] text-muted-foreground uppercase">Error</p>
      <h1 className="text-2xl font-semibold tracking-tight">页面渲染失败</h1>
      <p className="text-sm leading-7 text-muted-foreground">
        渲染时遇到了意外错误。可以重试；如果问题持续出现，请稍后再试。
      </p>
      <div className="flex flex-wrap gap-3">
        <Button onClick={() => reset()}>重试</Button>
        <Link href="/" className={buttonVariants({ variant: 'outline' })}>
          返回首页
        </Link>
      </div>
    </main>
  )
}
