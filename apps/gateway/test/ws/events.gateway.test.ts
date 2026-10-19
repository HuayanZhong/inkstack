import { describe, expect, it } from 'vitest'

import { EventsGateway } from '../../src/ws/events.gateway.js'

describe('EventsGateway', () => {
  it('answers ping with pong', () => {
    expect(new EventsGateway().handlePing()).toBe('pong')
  })
})
