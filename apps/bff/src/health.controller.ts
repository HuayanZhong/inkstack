import { Controller, Get } from '@nestjs/common'
import { HealthService } from './health.service.js'
import type { HealthResponse } from './health.service.js'

@Controller()
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get('health')
  getHealth(): HealthResponse {
    return this.healthService.getHealth()
  }
}
