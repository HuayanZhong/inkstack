export default function Loading() {
  return (
    <main className="grid min-h-dvh place-items-center px-6">
      <div role="status" className="flex items-center gap-3 text-sm text-muted-foreground">
        <span
          aria-hidden="true"
          className="size-4 animate-spin rounded-full border-2 border-muted border-t-foreground"
        />
        正在加载
      </div>
    </main>
  )
}
