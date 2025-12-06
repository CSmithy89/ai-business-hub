import { Controller, Get, Header } from '@nestjs/common';
import { MetricsService } from './metrics.service';

@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get()
  @Header('Cache-Control', 'no-store')
  @Header('Content-Type', 'text/plain; version=0.0.4')
  async getMetrics(): Promise<string> {
    await this.metricsService.collectAllMetrics();
    return this.metricsService.getMetrics();
  }
}
