import type { Metadata } from 'next'
import Link from 'next/link'

import { buttonVariants } from '@inkstack/ui'

export const metadata: Metadata = {
  title: '页面不存在 · 墨栈 Inkstack',
}

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center gap-4 px-6 py-16">
      <p className="font-mono text-xs tracking-[0.24em] text-muted-foreground uppercase">404</p>
      <h1 className="text-2xl font-semibold tracking-tight">页面不存在</h1>
      <p className="text-sm leading-7 text-muted-foreground">
        你访问的地址没有对应页面，或者它已经被移除。
      </p>
      <Link href="/" className={buttonVariants({ variant: 'outline' })}>
        返回首页
      </Link>
    </main>
  )
}
