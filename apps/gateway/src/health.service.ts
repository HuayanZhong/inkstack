import { Injectable } from '@nestjs/common'

/** 健康检查响应；服务名用于区分同一套探针下的多个应用。 */
export interface HealthResponse {
  status: 'ok'
  service: 'gateway'
}

@Injectable()
export class HealthService {
  getHealth(): HealthResponse {
    return { status: 'ok', service: 'gateway' }
  }
}
