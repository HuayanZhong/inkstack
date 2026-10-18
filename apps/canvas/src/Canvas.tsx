import { Tldraw } from 'tldraw'
import 'tldraw/tldraw.css'

/** 画布组件：独立页面与 MF remote 共用同一实现。 */
export function Canvas() {
  return (
    <div style={{ position: 'fixed', inset: 0 }}>
      <Tldraw />
    </div>
  )
}
