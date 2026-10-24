'use client'

import Link from 'next/link'

import { Button, buttonVariants } from '@inkstack/ui'

export default function Error({ retry }: { error: unknown; retry: () => void }) {
  return (
    <main className="grid min-h-dvh place-items-center px-6">
      <div className="w-full max-w-md space-y-5 rounded-xl border border-border bg-card p-6">
        <p className="text-xs font-medium tracking-[0.24em] text-muted-foreground uppercase">
          出错了
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">页面出错了</h1>
        <p className="text-sm leading-6 text-muted-foreground">
          渲染过程中发生了意外错误。可以重试；如果问题持续出现，请稍后再试。
        </p>
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => retry()}>重试</Button>
          <Link href="/" className={buttonVariants({ variant: 'outline' })}>
            返回首页
          </Link>
        </div>
      </div>
    </main>
  )
}
