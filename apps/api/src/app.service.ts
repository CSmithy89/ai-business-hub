import { Injectable } from '@nestjs/common';

export interface HealthCheckResponse {
  status: string;
  timestamp: string;
}

@Injectable()
export class AppService {
  getHealth(): HealthCheckResponse {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
