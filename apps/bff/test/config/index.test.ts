import { afterEach, describe, expect, it, vi } from 'vitest'

async function loadConfig() {
  vi.resetModules()
  return import('../../src/config/index.js')
}

describe('bff config', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('uses development defaults', async () => {
    vi.stubEnv('NODE_ENV', 'development')

    const { config } = await loadConfig()

    expect(config.server.port).toBe(4003)
    expect(config.runtime).toEqual({ nodeEnv: 'development', isDev: true })
  })

  it('reads port and production mode from the environment', async () => {
    vi.stubEnv('BFF_PORT', '4100')
    vi.stubEnv('NODE_ENV', 'production')

    const { config } = await loadConfig()

    expect(config.server.port).toBe(4100)
    expect(config.runtime).toEqual({ nodeEnv: 'production', isDev: false })
  })

  it('falls back to development when NODE_ENV is unset', async () => {
    const original = process.env.NODE_ENV
    delete process.env.NODE_ENV

    try {
      const { config } = await loadConfig()
      expect(config.runtime.nodeEnv).toBe('development')
    } finally {
      if (original === undefined) delete process.env.NODE_ENV
      else process.env.NODE_ENV = original
    }
  })
})
