import type { Metadata } from 'next'
import Link from 'next/link'

import { Button, Input, Label } from '@inkstack/ui'

export const metadata: Metadata = {
  title: '登录',
  description: '使用邮箱和密码登录墨栈 Inkstack。',
}

export default function LoginPage() {
  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <p className="mb-1 font-mono text-xs tracking-[0.24em] text-muted-foreground uppercase">
          Auth / Login
        </p>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">回到墨栈</h1>
        <p className="text-sm leading-7 text-muted-foreground">使用邮箱和密码进入你的画布。</p>
      </div>

      <form aria-describedby="login-stage" className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">邮箱</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="password">密码</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </div>

        <div className="flex flex-col gap-3">
          <Button type="submit" disabled className="w-full">
            登录
          </Button>
          <p id="login-stage" className="text-xs leading-6 text-muted-foreground">
            登录尚未接入，当前仅展示样式与布局。
          </p>
        </div>
      </form>

      <p className="text-sm leading-6 text-muted-foreground">
        还没有账号？{' '}
        <Link
          href="/register"
          className="text-foreground underline underline-offset-4 hover:text-primary"
        >
          创建账号
        </Link>
      </p>
    </section>
  )
}
