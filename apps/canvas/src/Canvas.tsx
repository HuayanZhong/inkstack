import { Tldraw } from 'tldraw'
import 'tldraw/tldraw.css'

/**
 * 画布组件：独立页面与 MF remote 共用同一实现。
 * 用 absolute 填满最近的定位容器：独立页面下即视口，嵌入 host 时由 host 决定尺寸。
 */
export function Canvas() {
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <Tldraw />
    </div>
  )
}
