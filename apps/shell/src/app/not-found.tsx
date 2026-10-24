import type { Metadata } from 'next'
import Link from 'next/link'

import { buttonVariants } from '@inkstack/ui'

import { Artboard, BrushStroke, CanvasShell, SidePanel } from './_components/canvas-shell'

export const metadata: Metadata = {
  title: '页面不存在 · 墨栈 Inkstack',
}

export default function NotFound() {
  return (
    <CanvasShell
      route="画布 / 404"
      statusLeft="空画板 · 0 个对象"
      statusRight="x 0404 y 0000 · 100%"
      aside={
        <SidePanel title="Layers" count="00" footer="这个地址没有留下任何对象。">
          <li className="border border-dashed border-border px-3 py-6 text-center">
            <p className="font-mono text-[10px] tracking-[0.16em] text-muted-foreground uppercase">
              No layers
            </p>
          </li>
        </SidePanel>
      }
    >
      <Artboard label="empty artboard" meta="empty" annotation="此页未落笔">
        <div className="max-w-xl space-y-6">
          <p className="font-mono text-[10px] tracking-[0.24em] text-seal uppercase">
            404 / not found
          </p>
          <h1 className="font-heading text-4xl leading-[1.12] font-semibold tracking-tight sm:text-6xl">
            <span className="ink-in inline-block" style={{ animationDelay: '120ms' }}>
              这块画布上
            </span>
            <br />
            <span className="ink-in inline-block" style={{ animationDelay: '230ms' }}>
              没有
              <span className="relative inline-block">
                这个页面
                <BrushStroke className="top-1/2 left-0 -translate-y-1/2" />
              </span>
              。
            </span>
          </h1>
          <p className="text-sm leading-7 text-muted-foreground">
            你访问的地址没有对应页面，或者它已经被移除。
          </p>
          <Link href="/" className={buttonVariants({ size: 'lg' })}>
            返回首页
          </Link>
        </div>
      </Artboard>
    </CanvasShell>
  )
}
