import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AppService, HealthCheckResponse } from './app.service';

@ApiTags('health')
@Controller()
export class AppController {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars
  constructor(private readonly appService: AppService) {}

  @Get('health')
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({
    status: 200,
    description: 'Service is healthy',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        timestamp: { type: 'string', example: '2025-12-01T12:00:00.000Z' },
      },
    },
  })
  getHealth(): HealthCheckResponse {
    return this.appService.getHealth();
  }
}
