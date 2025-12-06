import { Controller, Get, Header, Res } from '@nestjs/common';
import type { Response } from 'express';
import { MetricsService } from './metrics-service';

@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get()
  @Header('Cache-Control', 'no-store')
  async getMetrics(@Res({ passthrough: true }) res: Response): Promise<string> {
    await this.metricsService.collectAllMetrics();
    res.setHeader('Content-Type', this.metricsService.contentType);
    return this.metricsService.getMetrics();
  }
}
