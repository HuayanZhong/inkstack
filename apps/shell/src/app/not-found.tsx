import Link from 'next/link'

import { buttonVariants } from '@inkstack/ui'

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center px-6">
      <div className="w-full max-w-md space-y-5 rounded-xl border border-border bg-card p-6 text-center">
        <p className="text-xs font-medium tracking-[0.24em] text-muted-foreground uppercase">404</p>
        <h1 className="text-2xl font-semibold tracking-tight">页面不存在</h1>
        <p className="text-sm leading-6 text-muted-foreground">
          你访问的地址没有对应页面，或者它已经被移除。
        </p>
        <Link href="/" className={buttonVariants({ variant: 'outline' })}>
          返回首页
        </Link>
      </div>
    </main>
  )
}
