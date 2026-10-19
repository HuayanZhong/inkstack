import { describe, expect, it } from 'vitest'

import { nestConfig, nodeConfig, reactConfig } from '../src/index.js'

describe('vitest presets', () => {
  it('collects tests from test/ and excludes build output', () => {
    for (const config of [nodeConfig, nestConfig, reactConfig]) {
      expect(config.test?.include).toContain('test/**/*.test.ts')
      expect(config.test?.include).toContain('test/**/*.test.tsx')
      expect(config.test?.exclude).toContain('dist/**')
    }
  })

  it('uses node except for React', () => {
    expect(nodeConfig.test?.environment).toBe('node')
    expect(nestConfig.test?.environment).toBe('node')
    expect(reactConfig.test.environment).toBe('jsdom')
  })

  it('configures v8 coverage without enabling it by default', () => {
    expect(nodeConfig.test?.coverage?.provider).toBe('v8')
    expect(nodeConfig.test?.coverage?.enabled).toBe(false)
  })
})
