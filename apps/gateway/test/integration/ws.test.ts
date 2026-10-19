import type { AddressInfo } from 'node:net'

import type { INestApplication } from '@nestjs/common'
import { IoAdapter } from '@nestjs/platform-socket.io'
import { Test } from '@nestjs/testing'
import { io, type Socket } from 'socket.io-client'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { AppModule } from '../../src/app.module.js'

describe('Socket.IO gateway', () => {
  let app: INestApplication
  let url: string

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile()
    app = moduleRef.createNestApplication()
    app.useWebSocketAdapter(new IoAdapter(app))
    await app.listen(0)

    const address = app.getHttpServer().address() as AddressInfo
    url = `http://127.0.0.1:${address.port}`
  })

  afterAll(async () => {
    await app.close()
  })

  it('answers ping with an ack carrying pong', async () => {
    const socket: Socket = io(url, {
      path: '/ws',
      transports: ['websocket'],
      forceNew: true,
    })

    try {
      await new Promise<void>((resolve, reject) => {
        socket.once('connect', resolve)
        socket.once('connect_error', reject)
      })

      const response = await new Promise<string>((resolve, reject) => {
        socket.timeout(5000).emit('ping', {}, (error: Error | null, value: string) => {
          if (error) reject(error)
          else resolve(value)
        })
      })

      expect(response).toBe('pong')
    } finally {
      socket.close()
    }
  })
})
