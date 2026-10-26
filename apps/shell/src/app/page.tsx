import Link from 'next/link'

import { buttonVariants } from '@inkstack/ui'

export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col justify-center gap-5 px-6 py-16">
      <p className="font-mono text-xs tracking-[0.24em] text-muted-foreground uppercase">
        Inkstack
      </p>
      <h1 className="font-heading text-4xl font-semibold tracking-tight sm:text-5xl">墨栈</h1>
      <p className="max-w-lg text-sm leading-7 text-muted-foreground">
        AI design-to-code 画布。登录页已就绪，认证与画布尚未接入。
      </p>
      <div className="flex flex-wrap gap-3">
        <Link href="/login" className={buttonVariants()}>
          登录
        </Link>
        <Link href="/register" className={buttonVariants({ variant: 'outline' })}>
          创建账号
        </Link>
      </div>
    </main>
  )
}
