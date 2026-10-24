import { Artboard, BrushStroke, CanvasShell, LayerRow, SidePanel } from './_components/canvas-shell'

export default function Home() {
  return (
    <CanvasShell
      route="画布 / 首页"
      statusLeft="空画板 · 0 个对象"
      statusRight="x 0000 y 0000 · 100%"
      aside={
        <SidePanel title="Tools" count="03" footer="3 tools · 0 objects">
          <LayerRow mark="square" label="AI 控笔" meta="PEN" />
          <LayerRow mark="circle" label="人工编辑" meta="EDIT" />
          <LayerRow mark="diamond" label="设计转代码" meta="CODE" />
        </SidePanel>
      }
    >
      <Artboard label="untitled canvas" meta="draft" annotation="画布待落笔">
        <div className="max-w-2xl space-y-7">
          <p className="font-mono text-[10px] tracking-[0.24em] text-seal uppercase">
            AI design-to-code canvas
          </p>
          <h1 className="font-heading text-4xl leading-[1.1] font-semibold tracking-tight sm:text-6xl">
            <span className="ink-in inline-block" style={{ animationDelay: '120ms' }}>
              让 <span className="font-mono text-[0.62em] tracking-[0.04em] text-seal">AI</span>{' '}
              <span className="relative inline-block">
                落笔
                <BrushStroke className="-bottom-3 left-0" />
              </span>
              ，
            </span>
            <br />
            <span className="ink-in inline-block" style={{ animationDelay: '230ms' }}>
              让代码落地。
            </span>
          </h1>
          <p className="max-w-lg text-sm leading-7 text-muted-foreground sm:text-base">
            在画布上与 AI 共同设计，把每一次控件修改沉淀为可运行的代码。
          </p>
          <div className="flex items-center gap-2">
            <span aria-hidden="true" className="size-1.5 bg-seal" />
            <p className="font-mono text-[10px] tracking-[0.14em] text-muted-foreground">
              登录与画布入口正在搭建中
            </p>
          </div>
        </div>
      </Artboard>
    </CanvasShell>
  )
}
