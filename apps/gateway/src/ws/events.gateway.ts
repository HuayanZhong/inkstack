import { SubscribeMessage, WebSocketGateway } from '@nestjs/websockets'
import { config } from '../config/index.js'

@WebSocketGateway({ path: config.ws.path })
export class EventsGateway {
  @SubscribeMessage('ping')
  handlePing(): string {
    return 'pong'
  }
}
