import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Server } from 'node:http';
import { Socket } from 'node:net';
import {
  Counter,
  Gauge,
  Histogram,
  Registry,
  collectDefaultMetrics,
} from 'prom-client';
import { RedisProvider, STREAMS, CONSUMER_GROUP } from '../events';
import { PrismaService } from '../common/services/prisma.service';
import type { HttpMetricLabelValues } from './metrics.types';

const HTTP_BUCKETS = [0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10];
const APPROVAL_STATUSES = ['pending', 'approved', 'rejected', 'auto_approved'];

@Injectable()
export class MetricsService implements OnModuleDestroy {
  private readonly logger = new Logger(MetricsService.name);
  private readonly register = new Registry();

  private readonly httpRequestsTotal: Counter;
  private readonly httpRequestDuration: Histogram;
  private readonly eventBusThroughput: Counter;
  private readonly eventBusLag: Gauge;
  private readonly eventBusDlqSize: Gauge;
  private readonly approvalQueueDepth: Gauge;
  private readonly aiProviderHealth: Gauge;
  private readonly activeConnections: Gauge;

  private httpServer?: Server;
  private connectionListener?: (socket: Socket) => void;
  private lastEventCount = 0;

  constructor(
    private readonly redisProvider: RedisProvider,
    private readonly prisma: PrismaService,
  ) {
    collectDefaultMetrics({
      register: this.register,
      prefix: 'hyvve_',
    });

    this.httpRequestsTotal = new Counter({
      name: 'http_requests_total',
      help: 'Total HTTP requests processed',
      labelNames: ['method', 'route', 'status'],
      registers: [this.register],
    });

    this.httpRequestDuration = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'HTTP request latency in seconds',
      labelNames: ['method', 'route', 'status'],
      buckets: HTTP_BUCKETS,
      registers: [this.register],
    });

    this.eventBusThroughput = new Counter({
      name: 'event_bus_throughput_total',
      help: 'Total events published to the main stream',
      labelNames: ['stream'],
      registers: [this.register],
    });

    this.eventBusLag = new Gauge({
      name: 'event_bus_consumer_lag',
      help: 'Consumer lag for the main stream',
      labelNames: ['consumer_group'],
      registers: [this.register],
    });

    this.eventBusDlqSize = new Gauge({
      name: 'event_bus_dlq_size',
      help: 'Messages currently in the DLQ stream',
      registers: [this.register],
    });

    this.approvalQueueDepth = new Gauge({
      name: 'approval_queue_depth',
      help: 'Approval queue depth grouped by status',
      labelNames: ['status'],
      registers: [this.register],
    });

    this.aiProviderHealth = new Gauge({
      name: 'ai_provider_health',
      help: 'AI provider health status (1 healthy, 0 unhealthy)',
      labelNames: ['provider', 'workspace', 'provider_id'],
      registers: [this.register],
    });

    this.activeConnections = new Gauge({
      name: 'active_http_connections',
      help: 'Active HTTP keep-alive connections',
      registers: [this.register],
    });
  }

  get contentType(): string {
    return this.register.contentType;
  }

  async collectAllMetrics(): Promise<void> {
    await Promise.all([
      this.collectEventBusMetrics(),
      this.collectApprovalMetrics(),
      this.collectProviderMetrics(),
    ]);
  }

  async getMetrics(): Promise<string> {
    return this.register.metrics();
  }

  observeHttpRequest(
    method: string,
    route: string,
    statusCode: number,
    durationSeconds: number,
  ): void {
    const labels: HttpMetricLabelValues = {
      method: method.toUpperCase(),
      route: route || 'unknown',
      status: String(statusCode),
    };

    this.httpRequestsTotal.inc(labels);
    this.httpRequestDuration.observe(labels, durationSeconds);
  }

  trackHttpServer(server: Server): void {
    if (this.httpServer) {
      return;
    }

    this.httpServer = server;
    this.connectionListener = (socket: Socket) => {
      this.activeConnections.inc();
      const decrement = () => this.activeConnections.dec();
      socket.on('close', decrement);
      socket.on('end', decrement);
      socket.on('error', decrement);
    };

    server.on('connection', this.connectionListener);
  }

  async collectEventBusMetrics(): Promise<void> {
    const redis = this.redisProvider.getClient();
    const mainExists = await redis.exists(STREAMS.MAIN);

    if (mainExists) {
      const streamInfo = await redis.xinfo('STREAM', STREAMS.MAIN);
      const info: Record<string, unknown> = {};
      for (let i = 0; i < streamInfo.length; i += 2) {
        const key = String(streamInfo[i]);
        info[key] = streamInfo[i + 1];
      }

      const lengthValue = info.length;
      const streamLength = (
        typeof lengthValue === 'number' ? lengthValue : Number(lengthValue ?? 0)
      );
      if (!Number.isNaN(streamLength) && streamLength > this.lastEventCount) {
        this.eventBusThroughput.inc({ stream: 'main' }, streamLength - this.lastEventCount);
        this.lastEventCount = streamLength;
      }

      try {
        const groups = await redis.xinfo('GROUPS', STREAMS.MAIN);
        for (const group of groups) {
          const groupInfo: Record<string, unknown> = {};
          for (let i = 0; i < group.length; i += 2) {
            const key = String(group[i]);
            groupInfo[key] = group[i + 1];
          }
          if (groupInfo.name === CONSUMER_GROUP) {
            this.eventBusLag.set(
              { consumer_group: CONSUMER_GROUP },
              Number(groupInfo.lag) || 0,
            );
            break;
          }
        }
      } catch (error) {
        this.logger.verbose(`Unable to read consumer lag: ${String(error)}`);
      }
    } else {
      this.eventBusLag.set({ consumer_group: CONSUMER_GROUP }, 0);
    }

    const dlqExists = await redis.exists(STREAMS.DLQ);
    if (dlqExists) {
      const length = await redis.xlen(STREAMS.DLQ);
      this.eventBusDlqSize.set(length);
    } else {
      this.eventBusDlqSize.set(0);
    }
  }

  async collectApprovalMetrics(): Promise<void> {
    const grouped = await this.prisma.approvalItem.groupBy({
      by: ['status'],
      _count: { status: true },
    });

    const counts = new Map<string, number>();
    for (const row of grouped) {
      counts.set(row.status as string, row._count.status);
    }

    for (const status of APPROVAL_STATUSES) {
      const value = counts.get(status) ?? 0;
      this.approvalQueueDepth.set({ status }, value);
    }
  }

  async collectProviderMetrics(): Promise<void> {
    const providers = await this.prisma.aIProviderConfig.findMany({
      select: {
        id: true,
        provider: true,
        workspaceId: true,
        isValid: true,
      },
    });

    for (const provider of providers) {
      this.aiProviderHealth.set(
        {
          provider: provider.provider,
          workspace: provider.workspaceId,
          provider_id: provider.id,
        },
        provider.isValid ? 1 : 0,
      );
    }
  }

  onModuleDestroy(): void {
    if (this.httpServer && this.connectionListener) {
      this.httpServer.off('connection', this.connectionListener);
    }
  }
}
