/* eslint-disable no-undef */
import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('getHealth', () => {
    it('should return health check response with status "ok"', () => {
      const result = appController.getHealth();
      expect(result.status).toBe('ok');
    });

    it('should return health check response with ISO timestamp', () => {
      const result = appController.getHealth();
      expect(result.timestamp).toBeDefined();
      // Verify it's a valid ISO 8601 date string
      const date = new Date(result.timestamp);
      expect(date.toISOString()).toBe(result.timestamp);
    });
  });
});
