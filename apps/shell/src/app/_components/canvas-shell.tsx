import type { ReactNode } from 'react'

import { cn } from '@inkstack/ui'

const corners = [
  '-top-px -left-px -translate-x-1/2 -translate-y-1/2',
  '-top-px -right-px translate-x-1/2 -translate-y-1/2',
  '-bottom-px -left-px -translate-x-1/2 translate-y-1/2',
  '-bottom-px -right-px translate-x-1/2 translate-y-1/2',
]

const tones = {
  default: { outline: 'border-seal/60', handle: 'bg-seal', label: 'text-seal' },
  error: { outline: 'border-destructive/70', handle: 'bg-destructive', label: 'text-destructive' },
  loading: {
    outline: 'border-muted-foreground/40',
    handle: 'bg-muted-foreground',
    label: 'text-muted-foreground',
  },
} as const

type ArtboardTone = keyof typeof tones

type CanvasShellProps = {
  route: string
  statusLeft: string
  statusRight: string
  aside?: ReactNode
  children: ReactNode
}

/**
 * shell 的工作台外壳：顶栏、画布底纹、标尺与底部状态栏。
 * 页面内容放在画板里，aside 在宽屏是一栏工具/图层，窄屏落到画板下方。
 */
export function CanvasShell({ route, statusLeft, statusRight, aside, children }: CanvasShellProps) {
  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <span aria-hidden="true" className="size-2 bg-seal" />
          <span className="font-heading text-lg font-semibold tracking-tight">墨栈</span>
          <span className="font-mono text-[10px] tracking-[0.24em] text-muted-foreground uppercase">
            Inkstack
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="hidden font-mono text-[10px] tracking-[0.16em] text-muted-foreground uppercase sm:inline">
            {route}
          </span>
          <span className="border border-border px-2 py-1 font-mono text-[10px] tracking-[0.16em] text-muted-foreground uppercase">
            骨架阶段
          </span>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <div
          aria-hidden="true"
          className="canvas-ruler-y hidden w-2 shrink-0 border-r border-border sm:block"
        />
        <div className="flex min-w-0 flex-1 flex-col">
          <div
            aria-hidden="true"
            className="canvas-ruler-x hidden h-2 shrink-0 border-b border-border sm:block"
          />
          <div className="canvas-grid flex flex-1 items-center justify-center overflow-auto px-4 py-10 sm:px-8">
            <div className="grid w-full max-w-6xl gap-6 lg:grid-cols-[minmax(0,48rem)_220px] lg:items-center lg:justify-center">
              <div className="min-w-0">{children}</div>
              {aside ? <aside className="min-w-0">{aside}</aside> : null}
            </div>
          </div>
        </div>
      </div>

      <footer className="flex h-9 shrink-0 items-center justify-between border-t border-border px-4 font-mono text-[10px] tracking-[0.12em] text-muted-foreground uppercase sm:px-6">
        <span>{statusLeft}</span>
        <span className="hidden sm:inline">{statusRight}</span>
      </footer>
    </div>
  )
}

type ArtboardProps = {
  label: string
  meta?: string
  tone?: ArtboardTone
  annotation?: string
  className?: string
  children: ReactNode
}

/** 选中态画板：虚线选区、四角手柄、画板名与竖排题注，是 shell 的签名元素。 */
export function Artboard({
  label,
  meta,
  tone = 'default',
  annotation,
  className,
  children,
}: ArtboardProps) {
  const style = tones[tone]

  return (
    <div className={cn('artboard-in relative', className)}>
      <div
        aria-hidden="true"
        className={cn('pointer-events-none absolute -inset-2 border border-dashed', style.outline)}
      >
        {corners.map((corner) => (
          <span
            key={corner}
            className={cn(
              'handle-in absolute size-2 border border-background',
              style.handle,
              corner,
            )}
          />
        ))}
      </div>

      <div className="relative border border-border bg-card shadow-lg">
        <div className="flex items-center justify-between gap-4 border-b border-border px-4 py-2">
          <span
            className={cn(
              'truncate font-mono text-[10px] tracking-[0.16em] uppercase',
              style.label,
            )}
          >
            {label}
          </span>
          {meta ? (
            <span className="shrink-0 font-mono text-[10px] tracking-[0.12em] text-muted-foreground">
              {meta}
            </span>
          ) : null}
        </div>
        <div className={cn('relative p-6 sm:p-10', annotation && 'sm:pr-16')}>
          {annotation ? (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 right-3 hidden -translate-y-1/2 sm:block"
            >
              <span className="block font-heading text-[11px] tracking-[0.42em] text-muted-foreground/70 [writing-mode:vertical-rl]">
                {annotation}
              </span>
              <span className="mx-auto mt-3 block size-1.5 bg-seal" />
            </span>
          ) : null}
          {children}
        </div>
      </div>
    </div>
  )
}

/** 手绘笔触：首页用于强调“落笔”，404 用于划掉“这个页面”。 */
export function BrushStroke({
  className,
  tone = 'seal',
}: {
  className?: string
  tone?: 'seal' | 'destructive'
}) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 240 20"
      fill="none"
      className={cn('pointer-events-none absolute w-full', className)}
    >
      <path
        d="M2 9C45 2 92 3 132 8C172 13 207 7 238 4L238 9C205 13 169 19 129 14C88 9 45 8 2 16Z"
        fill="currentColor"
        className={cn('brush-reveal', tone === 'seal' ? 'text-seal' : 'text-destructive')}
      />
    </svg>
  )
}

type SidePanelProps = {
  title: string
  count: string
  footer?: string
  children: ReactNode
}

export function SidePanel({ title, count, footer, children }: SidePanelProps) {
  return (
    <div>
      <div className="flex items-center justify-between border-b border-border pb-2">
        <span className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground uppercase">
          {title}
        </span>
        <span className="font-mono text-[10px] text-muted-foreground">{count}</span>
      </div>
      <ul className="space-y-3 pt-3">{children}</ul>
      {footer ? (
        <p className="pt-4 font-mono text-[10px] leading-5 text-muted-foreground">{footer}</p>
      ) : null}
    </div>
  )
}

type LayerRowProps = {
  mark: 'square' | 'circle' | 'diamond'
  label: string
  meta: string
}

export function LayerRow({ mark, label, meta }: LayerRowProps) {
  return (
    <li className="flex items-center gap-3">
      <span
        aria-hidden="true"
        className={cn(
          'size-2 shrink-0',
          mark === 'square' && 'bg-seal',
          mark === 'circle' && 'rounded-full border border-foreground',
          mark === 'diamond' && 'rotate-45 border border-muted-foreground',
        )}
      />
      <span className="min-w-0 flex-1 text-xs text-foreground">{label}</span>
      <span className="font-mono text-[9px] tracking-[0.14em] text-muted-foreground uppercase">
        {meta}
      </span>
    </li>
  )
}
