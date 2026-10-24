import { Artboard, CanvasShell } from './_components/canvas-shell'

export default function Loading() {
  return (
    <CanvasShell
      route="画布 / 加载中"
      statusLeft="正在加载画布"
      statusRight="x — y — · —"
      aside={
        <div>
          <div className="flex items-center justify-between border-b border-border pb-2">
            <span className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground uppercase">
              Layers
            </span>
            <span className="font-mono text-[10px] text-muted-foreground">--</span>
          </div>
          <div className="space-y-2 pt-3">
            <span className="block h-2 w-full animate-pulse bg-muted motion-reduce:animate-none" />
            <span className="block h-2 w-3/4 animate-pulse bg-muted motion-reduce:animate-none" />
            <span className="block h-2 w-1/2 animate-pulse bg-muted motion-reduce:animate-none" />
          </div>
        </div>
      }
    >
      <Artboard label="loading" meta="waiting" tone="loading">
        <div role="status" className="flex items-center gap-4 py-10">
          <span
            aria-hidden="true"
            className="flex size-10 items-center justify-center border border-dashed border-muted-foreground/50"
          >
            <span className="size-1.5 animate-pulse bg-seal motion-reduce:animate-none" />
          </span>
          <div className="space-y-1">
            <p className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase">
              Loading canvas
            </p>
            <p className="text-sm text-foreground">正在加载画布</p>
          </div>
        </div>
      </Artboard>
    </CanvasShell>
  )
}
