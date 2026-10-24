import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import Loading from '../../src/app/loading'

describe('Loading', () => {
  it('exposes an accessible loading status', () => {
    render(<Loading />)

    expect(screen.getByRole('status')).toHaveTextContent('正在加载画布')
  })
})
