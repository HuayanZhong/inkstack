import type { ReactNode } from 'react'

import { ModeToggle } from '@inkstack/ui'

import { AuthCursorGrid } from '../../components/auth/auth-cursor-grid'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <AuthCursorGrid>
      <div className="relative grid min-h-dvh grid-rows-[auto_1fr] text-foreground lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:grid-rows-1">
        <div className="absolute top-5 right-5 z-20">
          <ModeToggle />
        </div>

        <aside className="relative flex flex-col justify-between gap-6 overflow-hidden border-b border-border bg-card/90 px-6 py-8 backdrop-blur-sm lg:gap-8 lg:border-r lg:border-b-0 lg:bg-[linear-gradient(90deg,var(--card)_0%,color-mix(in_oklab,var(--card)_72%,transparent)_58%,transparent_100%)] lg:px-12 lg:py-12 lg:backdrop-blur-0">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_45%,color-mix(in_oklab,var(--foreground)_6%,transparent),transparent_62%)]"
          />

          <p className="relative font-mono text-xs tracking-[0.24em] text-muted-foreground uppercase">
            Inkstack
          </p>

          <div className="relative flex items-center justify-center gap-8 lg:flex-1 lg:py-8">
            <span aria-hidden="true" className="hidden h-32 w-px bg-border lg:block" />
            <p className="font-heading text-5xl leading-none font-semibold tracking-tight lg:bg-linear-to-b lg:from-foreground lg:via-foreground lg:to-muted-foreground lg:bg-clip-text lg:text-[clamp(4rem,7vw,7rem)] lg:tracking-[0.18em] lg:text-transparent lg:[text-orientation:upright] lg:[writing-mode:vertical-rl]">
              墨栈
            </p>
          </div>

          <p className="relative max-w-48 text-sm leading-7 text-muted-foreground">
            让 AI 落笔，让代码落地。
          </p>
        </aside>

        <main className="relative z-10 flex items-center justify-center px-6 py-10 lg:px-16 lg:py-12">
          <div className="relative w-full max-w-sm overflow-hidden rounded-[1.5rem] border border-border/80 bg-card/95 p-7 shadow-2xl ring-1 ring-foreground/10 backdrop-blur-xl sm:p-9">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-10 top-0 h-px bg-linear-to-r from-transparent via-foreground/25 to-transparent"
            />
            {children}
          </div>
        </main>
      </div>
    </AuthCursorGrid>
  )
}
