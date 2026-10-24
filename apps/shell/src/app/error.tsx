'use client'

import Link from 'next/link'

import { Button, buttonVariants } from '@inkstack/ui'

import { Artboard, CanvasShell, SidePanel } from './_components/canvas-shell'

export default function Error({ retry }: { error: unknown; retry: () => void }) {
  return (
    <CanvasShell
      route="画布 / 错误"
      statusLeft="broken artboard · 1 error"
      statusRight="x 0500 y 0000 · 100%"
      aside={
        <SidePanel title="Layers" count="01" footer="渲染在这里中断。">
          <li className="flex items-center gap-3">
            <span aria-hidden="true" className="size-2 shrink-0 bg-destructive" />
            <span className="min-w-0 flex-1 text-xs text-foreground">render error</span>
            <span className="font-mono text-[9px] tracking-[0.14em] text-destructive uppercase">
              ERR
            </span>
          </li>
        </SidePanel>
      }
    >
      <Artboard label="broken artboard" meta="render error" tone="error" annotation="笔触中断">
        <div className="max-w-xl space-y-6">
          <p className="font-mono text-[10px] tracking-[0.24em] text-destructive uppercase">
            Render error
          </p>
          <h1 className="font-heading text-4xl leading-[1.12] font-semibold tracking-tight sm:text-5xl">
            <span className="ink-in inline-block">这个页面没有画出来。</span>
          </h1>
          <p className="text-sm leading-7 text-muted-foreground">
            渲染时遇到了意外错误。可以重试；如果问题持续出现，请稍后再试。
          </p>
          <div className="flex flex-wrap gap-3">
            <Button size="lg" onClick={() => retry()}>
              重试
            </Button>
            <Link href="/" className={buttonVariants({ variant: 'outline', size: 'lg' })}>
              返回首页
            </Link>
          </div>
        </div>
      </Artboard>
    </CanvasShell>
  )
}
