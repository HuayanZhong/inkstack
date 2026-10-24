import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import GlobalError from '../../src/app/global-error'

describe('GlobalError', () => {
  it('renders the global error message and retries', () => {
    const retry = vi.fn()
    render(<GlobalError error={new Error('boom')} retry={retry} />)

    expect(
      screen.getByRole('heading', { level: 1, name: '应用无法继续渲染。' }),
    ).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '重试' }))
    expect(retry).toHaveBeenCalledTimes(1)
  })

  it('does not expose the raw error message', () => {
    render(<GlobalError error={new Error('secret-detail')} retry={vi.fn()} />)

    expect(screen.queryByText(/secret-detail/)).toBeNull()
  })
})
