import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import AuthLayout from '../../../src/app/(auth)/layout'

vi.mock('next-themes', () => ({
  useTheme: () => ({ setTheme: vi.fn() }),
}))

describe('AuthLayout', () => {
  it('renders the brand shell around the page content', () => {
    render(
      <AuthLayout>
        <h1>回到墨栈</h1>
      </AuthLayout>,
    )

    expect(screen.getByText('Inkstack')).toBeInTheDocument()
    expect(screen.getByText('墨栈')).toBeInTheDocument()
    expect(screen.getByText('让 AI 落笔，让代码落地。')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: '回到墨栈' })).toBeInTheDocument()
  })
})
