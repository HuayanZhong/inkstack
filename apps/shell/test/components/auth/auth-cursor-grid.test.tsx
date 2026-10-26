import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { AuthCursorGrid } from '../../../src/components/auth/auth-cursor-grid'

afterEach(() => {
  document.documentElement.classList.remove('dark', 'light')
  vi.restoreAllMocks()
})

describe('AuthCursorGrid', () => {
  it('renders children above the decorative grid canvas', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => null as never)

    const { container } = render(
      <AuthCursorGrid>
        <p>表单内容</p>
      </AuthCursorGrid>,
    )

    expect(screen.getByText('表单内容')).toBeInTheDocument()

    const canvas = container.querySelector('canvas')
    expect(canvas).not.toBeNull()
    expect(canvas?.getAttribute('aria-hidden')).toBe('true')
    expect(canvas?.className).toContain('cursor-grid__canvas')
  })

  it('passes the project palette tokens when they are available', () => {
    document.documentElement.classList.add('dark')
    vi.spyOn(window, 'getComputedStyle').mockReturnValue({
      getPropertyValue: (property: string) => (property === '--seal' ? '#a83226' : '#5d655d'),
    } as CSSStyleDeclaration)
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => null as never)

    const { container } = render(
      <AuthCursorGrid>
        <p>表单内容</p>
      </AuthCursorGrid>,
    )

    expect(screen.getByText('表单内容')).toBeInTheDocument()
    expect(container.querySelector('canvas')).not.toBeNull()
  })
})
