import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import Home from '../../src/app/page'

describe('Home', () => {
  it('renders the product name and stage notice', () => {
    render(<Home />)

    expect(screen.getByRole('heading', { level: 1, name: '墨栈' })).toBeInTheDocument()
    expect(screen.getByText('Inkstack')).toBeInTheDocument()
    expect(screen.getByText(/尚未接入页面/)).toBeInTheDocument()
  })

  it('does not link to routes that are not implemented', () => {
    const { container } = render(<Home />)

    expect(container.querySelector('a')).toBeNull()
  })
})
