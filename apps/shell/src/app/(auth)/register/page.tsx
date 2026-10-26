import type { Metadata } from 'next'
import Link from 'next/link'

import { Button, Input, Label } from '@inkstack/ui'

export const metadata: Metadata = {
  title: '注册',
  description: '用邮箱和密码创建墨栈 Inkstack 账号。',
}

export default function RegisterPage() {
  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <p className="mb-1 font-mono text-xs tracking-[0.24em] text-muted-foreground uppercase">
          Auth / Signup
        </p>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">创建账号</h1>
        <p className="text-sm leading-7 text-muted-foreground">用邮箱和密码创建墨栈账号。</p>
      </div>

      <form aria-describedby="register-stage" className="flex flex-col gap-5">
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
            autoComplete="new-password"
            required
          />
        </div>

        <div className="flex flex-col gap-3">
          <Button type="submit" disabled className="w-full">
            创建账号
          </Button>
          <p id="register-stage" className="text-xs leading-6 text-muted-foreground">
            注册尚未接入，当前仅展示样式与布局。
          </p>
        </div>
      </form>

      <p className="text-sm leading-6 text-muted-foreground">
        已有账号？{' '}
        <Link
          href="/login"
          className="text-foreground underline underline-offset-4 hover:text-primary"
        >
          登录
        </Link>
      </p>
    </section>
  )
}
