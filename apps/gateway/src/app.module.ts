import { Module } from '@nestjs/common'
import { HealthController } from './health.controller.js'
import { HealthService } from './health.service.js'
import { EventsGateway } from './ws/events.gateway.js'

@Module({
  imports: [],
  controllers: [HealthController],
  providers: [HealthService, EventsGateway],
})
export class AppModule {}
