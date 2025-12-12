import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { RealtimeModule } from './realtime.module';
import { RealtimeGateway } from './realtime.gateway';
import { RealtimeEventHandler } from './realtime-event.handler';

// Mock the EventsModule to avoid Redis dependency in tests
jest.mock('../events/events.module', () => ({
  EventsModule: class MockEventsModule {},
}));

describe('RealtimeModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          ignoreEnvFile: true,
        }),
        RealtimeModule,
      ],
    })
      .overrideProvider(RealtimeGateway)
      .useValue({
        broadcastApprovalCreated: jest.fn(),
        broadcastApprovalUpdated: jest.fn(),
        broadcastAgentStatusChanged: jest.fn(),
        broadcastNotification: jest.fn(),
      })
      .compile();
  });

  afterEach(async () => {
    if (module) {
      await module.close();
    }
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it('should provide RealtimeGateway', () => {
    const gateway = module.get<RealtimeGateway>(RealtimeGateway);
    expect(gateway).toBeDefined();
  });

  it('should provide RealtimeEventHandler', () => {
    const handler = module.get<RealtimeEventHandler>(RealtimeEventHandler);
    expect(handler).toBeDefined();
  });

  it('should export RealtimeGateway', () => {
    // Verify the gateway is exported and can be used by other modules
    const gateway = module.get<RealtimeGateway>(RealtimeGateway);
    expect(gateway.broadcastApprovalCreated).toBeDefined();
    expect(gateway.broadcastApprovalUpdated).toBeDefined();
    expect(gateway.broadcastAgentStatusChanged).toBeDefined();
    expect(gateway.broadcastNotification).toBeDefined();
  });
});

describe('RealtimeModule Integration', () => {
  // Integration tests would require a running Redis instance
  // These are placeholder tests for when Redis is available

  it.todo('should connect to WebSocket and receive events');
  it.todo('should broadcast events to connected clients');
  it.todo('should handle reconnection gracefully');
  it.todo('should maintain workspace room isolation');
});
