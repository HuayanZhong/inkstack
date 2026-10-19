import { afterEach, describe, expect, it, vi } from 'vitest'

async function loadEnv() {
  vi.resetModules()
  return import('../../src/config/env.js')
}

describe('canvas env', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('uses the local defaults', async () => {
    const { env } = await loadEnv()

    expect(env.CANVAS_HOST).toBe('localhost')
    expect(env.CANVAS_PORT).toBe(4002)
    expect(env.CANVAS_DEV_CORS_ORIGIN).toBe('*')
  })

  it('reads overrides from the environment', async () => {
    vi.stubEnv('CANVAS_HOST', '0.0.0.0')
    vi.stubEnv('CANVAS_PORT', '4100')
    vi.stubEnv('CANVAS_DEV_CORS_ORIGIN', 'https://example.com')

    const { env } = await loadEnv()

    expect(env).toMatchObject({
      CANVAS_HOST: '0.0.0.0',
      CANVAS_PORT: 4100,
      CANVAS_DEV_CORS_ORIGIN: 'https://example.com',
    })
  })

  it('rejects a non-numeric port', async () => {
    vi.stubEnv('CANVAS_PORT', 'abc')

    await expect(loadEnv()).rejects.toThrow(/CANVAS_PORT/)
  })
})
