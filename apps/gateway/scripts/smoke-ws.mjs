import { io } from 'socket.io-client'

const port = process.env.GATEWAY_PORT
const path = process.env.GATEWAY_WS_PATH
if (!port || !path) throw new Error('GATEWAY_PORT / GATEWAY_WS_PATH are required')

const socket = io(`http://localhost:${port}`, {
  path,
  transports: ['websocket'],
})

const timeout = setTimeout(() => {
  console.error('WS smoke timed out')
  socket.close()
  process.exit(1)
}, 5000)

socket.on('connect_error', (error) => {
  clearTimeout(timeout)
  console.error('WS smoke connection failed:', error.message)
  process.exit(1)
})

socket.emit('ping', {}, (response) => {
  clearTimeout(timeout)
  if (response !== 'pong') {
    console.error('WS smoke unexpected response:', response)
    process.exit(1)
  }
  console.log(response)
  socket.close()
  process.exit(0)
})
