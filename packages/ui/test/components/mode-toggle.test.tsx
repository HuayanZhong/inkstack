import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ModeToggle } from '@inkstack/ui'

const { setTheme } = vi.hoisted(() => ({ setTheme: vi.fn() }))

vi.mock('next-themes', () => ({
  useTheme: () => ({ setTheme }),
}))

afterEach(cleanup)

describe('ModeToggle', () => {
  beforeEach(() => {
    setTheme.mockClear()
  })

  it('renders the theme trigger', () => {
    render(<ModeToggle />)
    expect(screen.getByRole('button', { name: '切换主题' }).tagName).toBe('BUTTON')
  })

  it.each([
    ['亮色', 'light'],
    ['暗色', 'dark'],
    ['跟随系统', 'system'],
  ])('applies %s', async (label, theme) => {
    render(<ModeToggle />)
    fireEvent.click(screen.getByRole('button', { name: '切换主题' }))
    fireEvent.click(await screen.findByRole('menuitem', { name: label }))
    expect(setTheme).toHaveBeenCalledWith(theme)
  })
})
