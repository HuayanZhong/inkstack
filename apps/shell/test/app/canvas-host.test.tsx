import { render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { createInstance } = vi.hoisted(() => ({ createInstance: vi.fn() }))

vi.mock('@module-federation/enhanced/runtime', () => ({ createInstance }))

const entry = 'http://localhost:4002/mf-manifest.json'

async function renderCanvasHost() {
  const { CanvasHost } = await import('../../src/app/canvas-host')
  render(<CanvasHost />)
}

describe('CanvasHost', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_CANVAS_MF_ENTRY', entry)
    createInstance.mockReset()
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
    vi.resetModules()
  })

  it('shows loading and then renders the remote Canvas', async () => {
    const Canvas = () => <div>remote canvas</div>
    createInstance.mockReturnValue({
      loadRemote: vi.fn().mockResolvedValue({ Canvas }),
    })

    await renderCanvasHost()

    expect(screen.getByText('画布加载中…')).toBeInTheDocument()
    expect(await screen.findByText('remote canvas')).toBeInTheDocument()
  })

  it('shows a visible error when loadRemote fails', async () => {
    createInstance.mockReturnValue({
      loadRemote: vi.fn().mockRejectedValue(new Error('remote unavailable')),
    })

    await renderCanvasHost()

    expect(await screen.findByRole('alert')).toHaveTextContent('画布加载失败：remote unavailable')
  })

  it('fails visibly when the MF entry is missing', async () => {
    vi.stubEnv('NEXT_PUBLIC_CANVAS_MF_ENTRY', '')

    await renderCanvasHost()

    expect(await screen.findByRole('alert')).toHaveTextContent(
      '画布加载失败：缺少 NEXT_PUBLIC_CANVAS_MF_ENTRY',
    )
    expect(createInstance).not.toHaveBeenCalled()
  })

  it('fails visibly when the remote module has no Canvas export', async () => {
    createInstance.mockReturnValue({
      loadRemote: vi.fn().mockResolvedValue({}),
    })

    await renderCanvasHost()

    expect(await screen.findByRole('alert')).toHaveTextContent(
      '画布加载失败：远程模块 canvas/Canvas 未导出 Canvas',
    )
  })
})
