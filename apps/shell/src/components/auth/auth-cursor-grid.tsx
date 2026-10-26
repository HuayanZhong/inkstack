'use client'

import { useEffect, useState } from 'react'

import type { ReactNode } from 'react'

import CursorGrid from '../react-bits/cursor-grid/cursor-grid'

type Palette = {
  grid: string
  lit: string
}

export function AuthCursorGrid({ children }: { children: ReactNode }) {
  const [dark, setDark] = useState(true)
  const [palette, setPalette] = useState<Palette>({ grid: '', lit: '' })

  useEffect(() => {
    const read = () => {
      const root = document.documentElement
      const styles = getComputedStyle(root)
      setPalette({
        grid: styles.getPropertyValue('--muted-foreground').trim(),
        lit: styles.getPropertyValue('--seal').trim(),
      })
      setDark(root.classList.contains('dark'))
    }

    read()
    const observer = new MutationObserver(read)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  const colors = {
    ...(palette.grid ? { gridColor: palette.grid } : {}),
    ...(palette.lit ? { color: palette.lit } : {}),
  }

  return (
    <CursorGrid
      {...colors}
      lightMode={!dark}
      gridStyle="dashed"
      cellSize={56}
      radius={170}
      gridOpacity={0.07}
      fillOpacity={0.03}
      maxOpacity={0.5}
      spotlight={0.55}
      ambient={0.008}
      holdTime={500}
      fadeDuration={1000}
      edgeFade={0.25}
      style={{ height: 'auto', minHeight: '100dvh', background: 'var(--background)' }}
    >
      {children}
    </CursorGrid>
  )
}
