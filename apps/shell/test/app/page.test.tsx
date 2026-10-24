import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import Home from '../../src/app/page'

describe('Home', () => {
  it('renders the product entry content', () => {
    render(<Home />)

    expect(
      screen.getByRole('heading', { level: 1, name: '让 AI 落笔，让代码落地' }),
    ).toBeInTheDocument()
    expect(screen.getByText('墨栈 Inkstack')).toBeInTheDocument()
    expect(screen.getByText('登录与画布入口正在搭建中。')).toBeInTheDocument()
  })

  it('does not link to routes that are not implemented', () => {
    const { container } = render(<Home />)

    expect(container.querySelector('a')).toBeNull()
    expect(container.innerHTML).not.toContain('href="/login"')
    expect(container.innerHTML).not.toContain('href="/canvas"')
  })
})
