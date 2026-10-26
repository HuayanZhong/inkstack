import { afterEach, describe, expect, it, vi } from 'vitest'

async function loadEnv() {
  vi.resetModules()
  return import('../env.js')
}

describe('shell env', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('accepts the empty ALLOWED_DEV_ORIGINS from .env.example', async () => {
    vi.stubEnv('ALLOWED_DEV_ORIGINS', '')

    const { env } = await loadEnv()

    expect(env.ALLOWED_DEV_ORIGINS).toBe('')
  })

  it('keeps a comma-separated ALLOWED_DEV_ORIGINS', async () => {
    vi.stubEnv('ALLOWED_DEV_ORIGINS', '192.168.1.10, dev.local')

    const { env } = await loadEnv()

    expect(env.ALLOWED_DEV_ORIGINS).toBe('192.168.1.10, dev.local')
  })
})
