# AI Business Hub - Containerization Strategy

**Purpose:** Define the containerization architecture for multi-tenant AI agent execution
**Status:** Design Document
**Date:** 2024-11-27

---

## Table of Contents
1. [Overview](#1-overview)
2. [Tiered Container Architecture](#2-tiered-container-architecture)
3. [Container Types](#3-container-types)
4. [Worker Pool Architecture](#4-worker-pool-architecture)
5. [Session Isolation](#5-session-isolation)
6. [Resource Management](#6-resource-management)
7. [Docker Compose Configuration](#7-docker-compose-configuration)
8. [Kubernetes Deployment](#8-kubernetes-deployment)
9. [Security Model](#9-security-model)
10. [Monitoring & Observability](#10-monitoring--observability)

---

## 1. Overview

### Challenge
We need to run AI agents (Claude SDK, Codex, etc.) in isolated environments for multiple users simultaneously while:
- Maintaining session continuity
- Preventing cross-tenant data leakage
- Optimizing resource costs
- Supporting BYOAI (Bring Your Own AI) with user API keys

### Solution: Hybrid Containerization
A tiered approach where isolation level scales with subscription tier:

```
┌─────────────────────────────────────────────────────────────────────┐
│                    CONTAINERIZATION TIERS                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  FREE TIER: Shared Worker Pool                                       │
│  ┌───────────────────────────────────────────────────────────┐      │
│  │  Worker Container Pool (5-10 containers)                   │      │
│  │  ├── Worker 1 [User A job] → [User B job] → [User C job]  │      │
│  │  ├── Worker 2 [User D job] → ...                          │      │
│  │  └── Worker N [Queue processing]                          │      │
│  │  • Time-sliced execution                                   │      │
│  │  • Clean workspace between jobs                            │      │
│  │  • Rate-limited (10 jobs/hour)                             │      │
│  └───────────────────────────────────────────────────────────┘      │
│                                                                      │
│  PRO TIER: Semi-Isolated Containers                                  │
│  ┌───────────────────────────────────────────────────────────┐      │
│  │  Warm Pool (pre-spawned per-user containers)               │      │
│  │  ├── User A Container (reserved, scales 0-1)              │      │
│  │  ├── User B Container (reserved, scales 0-1)              │      │
│  │  └── ...                                                   │      │
│  │  • Persistent workspace per user                           │      │
│  │  • 15-min idle timeout (scales to 0)                       │      │
│  │  • Priority queue access                                   │      │
│  └───────────────────────────────────────────────────────────┘      │
│                                                                      │
│  ENTERPRISE TIER: Dedicated Containers                               │
│  ┌───────────────────────────────────────────────────────────┐      │
│  │  Dedicated Resources (always-on)                           │      │
│  │  ├── Org A: 2 containers (Claude + Codex)                 │      │
│  │  ├── Org B: 4 containers (multi-agent team)               │      │
│  │  └── ...                                                   │      │
│  │  • Guaranteed resources                                    │      │
│  │  • Custom model configurations                             │      │
│  │  • VPC peering option                                      │      │
│  └───────────────────────────────────────────────────────────┘      │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. Tiered Container Architecture

### 2.1 Tier Comparison

| Feature | Free | Pro | Enterprise |
|---------|------|-----|------------|
| Container Type | Shared pool | Per-user warm | Dedicated always-on |
| Max Concurrent Jobs | 1 | 3 | Unlimited |
| Job Queue Priority | Low | Medium | High |
| Workspace Persistence | None | 24 hours | Permanent |
| Session Resume | 1 hour | 7 days | 30 days |
| Custom Models | No | Limited | Full |
| File System Access | /tmp only | User workspace | Full workspace |
| Network Isolation | Shared | Isolated | VPC peering |

### 2.2 Resource Allocation

```yaml
# Resource limits per tier
free_tier:
  cpu: "0.5"
  memory: "512Mi"
  storage: "1Gi"  # ephemeral
  timeout: "5m"

pro_tier:
  cpu: "2"
  memory: "2Gi"
  storage: "10Gi"  # persistent
  timeout: "30m"

enterprise_tier:
  cpu: "4"
  memory: "8Gi"
  storage: "100Gi"  # persistent
  timeout: "unlimited"
```

---

## 3. Container Types

### 3.1 Agent Executor Container

The core container that runs AI SDK operations.

```dockerfile
# Dockerfile.agent-executor
FROM node:20-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    python3 \
    && rm -rf /var/lib/apt/lists/*

# Install Claude CLI and other AI SDKs
RUN npm install -g @anthropic-ai/claude-code

# Install sandbox tools
RUN npm install -g firejail

# Create non-root user for execution
RUN useradd -m -s /bin/bash executor
USER executor

WORKDIR /workspace

# Copy executor service
COPY --chown=executor:executor ./executor /app
WORKDIR /app

# Health check endpoint
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=10s \
  CMD curl -f http://localhost:8080/health || exit 1

ENTRYPOINT ["node", "index.js"]
```

### 3.2 Orchestrator Container

Manages job queue and container lifecycle.

```dockerfile
# Dockerfile.orchestrator
FROM node:20-slim

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY ./orchestrator ./

EXPOSE 3000

CMD ["node", "index.js"]
```

### 3.3 Gateway Container

Handles authentication and request routing.

```dockerfile
# Dockerfile.gateway
FROM node:20-slim

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY ./gateway ./

EXPOSE 8000

CMD ["node", "index.js"]
```

---

## 4. Worker Pool Architecture

### 4.1 Free Tier: Shared Worker Pool

```
┌─────────────────────────────────────────────────────────────────┐
│                     SHARED WORKER POOL                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Job Queue (Redis)                                               │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Priority: LOW                                            │    │
│  │ [Job-1] → [Job-2] → [Job-3] → [Job-4] → ...             │    │
│  └─────────────────────────────────────────────────────────┘    │
│           │              │              │                        │
│           ▼              ▼              ▼                        │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐               │
│  │  Worker 1   │ │  Worker 2   │ │  Worker 3   │               │
│  │  ┌───────┐  │ │  ┌───────┐  │ │  ┌───────┐  │               │
│  │  │Sandbox│  │ │  │Sandbox│  │ │  │Sandbox│  │               │
│  │  └───────┘  │ │  └───────┘  │ │  └───────┘  │               │
│  │  Status:    │ │  Status:    │ │  Status:    │               │
│  │  BUSY       │ │  BUSY       │ │  IDLE       │               │
│  └─────────────┘ └─────────────┘ └─────────────┘               │
│                                                                  │
│  Cleanup: After each job, workspace is wiped                     │
│  Timeout: 5 minutes max per job                                  │
│  Rate Limit: 10 jobs/hour per user                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Pro Tier: Warm Container Pool

```
┌─────────────────────────────────────────────────────────────────┐
│                     PRO USER CONTAINERS                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Warm Pool Manager                                               │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Monitors user activity, spawns/kills containers         │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  User A (Active)           User B (Idle 10m)    User C (Idle 20m)│
│  ┌─────────────────┐       ┌─────────────────┐  ┌─────────────┐ │
│  │  Container A    │       │  Container B    │  │  Scaled to 0│ │
│  │  ┌───────────┐  │       │  ┌───────────┐  │  │  (will spawn│ │
│  │  │ Workspace │  │       │  │ Workspace │  │  │   on next   │ │
│  │  │ /user-a/  │  │       │  │ /user-b/  │  │  │   request)  │ │
│  │  └───────────┘  │       │  └───────────┘  │  └─────────────┘ │
│  │  CPU: 2 cores   │       │  CPU: 0.1 (idle)│                   │
│  │  MEM: 1.5Gi     │       │  MEM: 256Mi     │                   │
│  └─────────────────┘       └─────────────────┘                   │
│                                                                  │
│  Workspace: Persistent volume mounted per user                   │
│  Idle Timeout: 15 minutes → scale to 0                           │
│  Warm Start: ~3 seconds (volume already mounted)                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 4.3 Worker Pool Manager Implementation

```typescript
// src/orchestrator/worker-pool.ts

interface WorkerConfig {
  id: string;
  tier: 'free' | 'pro' | 'enterprise';
  userId?: string;
  status: 'idle' | 'busy' | 'spawning' | 'terminating';
  containerId?: string;
  lastActivity: Date;
}

export class WorkerPoolManager {
  private workers: Map<string, WorkerConfig> = new Map();
  private jobQueue: JobQueue;
  private docker: Docker;

  constructor(config: PoolConfig) {
    this.jobQueue = new JobQueue(config.redis);
    this.docker = new Docker();
  }

  // Initialize shared pool for free tier
  async initializeSharedPool(size: number): Promise<void> {
    for (let i = 0; i < size; i++) {
      const worker = await this.spawnWorker({
        tier: 'free',
        resources: FREE_TIER_LIMITS
      });
      this.workers.set(worker.id, worker);
    }
  }

  // Get or spawn worker for user
  async getWorkerForUser(userId: string, tier: string): Promise<WorkerConfig> {
    if (tier === 'free') {
      return this.assignFromSharedPool();
    } else if (tier === 'pro') {
      return this.getOrSpawnProWorker(userId);
    } else {
      return this.getDedicatedWorker(userId);
    }
  }

  // Shared pool assignment
  private async assignFromSharedPool(): Promise<WorkerConfig> {
    // Find idle worker
    for (const [id, worker] of this.workers) {
      if (worker.tier === 'free' && worker.status === 'idle') {
        worker.status = 'busy';
        return worker;
      }
    }
    // No idle workers - add to queue
    throw new Error('All workers busy, job queued');
  }

  // Pro tier: per-user warm containers
  private async getOrSpawnProWorker(userId: string): Promise<WorkerConfig> {
    const existingWorker = Array.from(this.workers.values())
      .find(w => w.userId === userId && w.tier === 'pro');

    if (existingWorker) {
      if (existingWorker.status === 'idle') {
        existingWorker.status = 'busy';
        return existingWorker;
      }
      // Worker exists but busy - queue the job
      throw new Error('Worker busy, job queued');
    }

    // Spawn new warm container for user
    return this.spawnWorker({
      tier: 'pro',
      userId,
      resources: PRO_TIER_LIMITS,
      workspace: `/workspaces/${userId}`
    });
  }

  // Spawn a new worker container
  private async spawnWorker(options: SpawnOptions): Promise<WorkerConfig> {
    const container = await this.docker.createContainer({
      Image: 'ai-business-hub/agent-executor:latest',
      Env: [
        `TIER=${options.tier}`,
        `USER_ID=${options.userId || 'shared'}`,
      ],
      HostConfig: {
        Memory: options.resources.memory,
        CpuQuota: options.resources.cpuQuota,
        Binds: options.workspace ? [
          `${options.workspace}:/workspace:rw`
        ] : [],
        SecurityOpt: ['no-new-privileges'],
        ReadonlyRootfs: true,
      },
    });

    await container.start();

    const worker: WorkerConfig = {
      id: `worker-${Date.now()}`,
      tier: options.tier,
      userId: options.userId,
      status: 'idle',
      containerId: container.id,
      lastActivity: new Date(),
    };

    this.workers.set(worker.id, worker);
    return worker;
  }

  // Cleanup idle containers
  async cleanupIdleContainers(): Promise<void> {
    const now = Date.now();
    const PRO_IDLE_TIMEOUT = 15 * 60 * 1000; // 15 minutes

    for (const [id, worker] of this.workers) {
      if (worker.tier === 'pro' && worker.status === 'idle') {
        const idleTime = now - worker.lastActivity.getTime();
        if (idleTime > PRO_IDLE_TIMEOUT) {
          await this.terminateWorker(id);
        }
      }
    }
  }

  // Terminate a worker
  private async terminateWorker(workerId: string): Promise<void> {
    const worker = this.workers.get(workerId);
    if (!worker || !worker.containerId) return;

    worker.status = 'terminating';

    const container = this.docker.getContainer(worker.containerId);
    await container.stop({ t: 10 });
    await container.remove();

    this.workers.delete(workerId);
  }
}
```

---

## 5. Session Isolation

### 5.1 Workspace Isolation

```typescript
// src/executor/workspace.ts

export class WorkspaceManager {
  private baseDir: string;

  constructor(tier: string) {
    this.baseDir = tier === 'free' ? '/tmp/workspace' : '/workspace';
  }

  // Initialize workspace for job
  async initializeWorkspace(jobId: string, tier: string): Promise<string> {
    const workspacePath = path.join(this.baseDir, jobId);

    if (tier === 'free') {
      // Free tier: fresh workspace each time
      await fs.mkdir(workspacePath, { recursive: true });
      return workspacePath;
    } else {
      // Pro/Enterprise: persistent workspace
      // Already mounted via Docker volume
      return this.baseDir;
    }
  }

  // Cleanup after job (free tier only)
  async cleanupWorkspace(jobId: string, tier: string): Promise<void> {
    if (tier === 'free') {
      const workspacePath = path.join(this.baseDir, jobId);
      await fs.rm(workspacePath, { recursive: true, force: true });
    }
    // Pro/Enterprise: workspace persists
  }
}
```

### 5.2 API Key Isolation

```typescript
// src/executor/credentials.ts

export class CredentialInjector {
  // Inject user's API keys into environment
  async injectCredentials(
    userId: string,
    providers: string[]
  ): Promise<Record<string, string>> {
    const credentials: Record<string, string> = {};

    for (const provider of providers) {
      const key = await this.keyStorage.getKey(userId, provider);
      if (key) {
        credentials[this.getEnvVarName(provider)] = key;
      }
    }

    return credentials;
  }

  private getEnvVarName(provider: string): string {
    const mapping: Record<string, string> = {
      'claude_oauth': 'CLAUDE_CODE_OAUTH_TOKEN',
      'claude_api': 'CLAUDE_API_KEY',
      'codex': 'CODEX_ACCESS_TOKEN',
      'openai': 'OPENAI_API_KEY',
      'gemini': 'GEMINI_API_KEY',
      'deepseek': 'DEEPSEEK_API_KEY',
    };
    return mapping[provider] || `${provider.toUpperCase()}_API_KEY`;
  }
}
```

### 5.3 Network Isolation

```yaml
# docker-compose.isolation.yml
networks:
  # Shared network for orchestration
  orchestration:
    driver: bridge

  # Isolated network per enterprise tenant
  tenant_org_a:
    driver: bridge
    internal: true

  tenant_org_b:
    driver: bridge
    internal: true

services:
  # Gateway has access to all networks
  gateway:
    networks:
      - orchestration
      - tenant_org_a
      - tenant_org_b

  # Enterprise containers isolated per tenant
  executor_org_a:
    networks:
      - tenant_org_a
```

---

## 6. Resource Management

### 6.1 Job Queue System

```typescript
// src/orchestrator/job-queue.ts

interface Job {
  id: string;
  userId: string;
  tier: 'free' | 'pro' | 'enterprise';
  priority: number;
  prompt: string;
  agentType: string;
  sessionId?: string;
  createdAt: Date;
  status: 'pending' | 'running' | 'completed' | 'failed';
}

export class JobQueue {
  private redis: Redis;

  constructor(redisUrl: string) {
    this.redis = new Redis(redisUrl);
  }

  // Add job to queue with priority
  async enqueue(job: Job): Promise<void> {
    const priority = this.calculatePriority(job);
    await this.redis.zadd(
      'job_queue',
      priority,
      JSON.stringify(job)
    );
  }

  // Calculate priority based on tier
  private calculatePriority(job: Job): number {
    const basePriority: Record<string, number> = {
      'enterprise': 100,
      'pro': 50,
      'free': 10,
    };

    // Higher score = higher priority
    // Subtract timestamp to maintain FIFO within tier
    return basePriority[job.tier] * 1000000 - job.createdAt.getTime();
  }

  // Dequeue next job
  async dequeue(): Promise<Job | null> {
    const result = await this.redis.zpopmax('job_queue');
    if (!result || result.length === 0) return null;
    return JSON.parse(result[0]);
  }

  // Get queue stats
  async getStats(): Promise<QueueStats> {
    const length = await this.redis.zcard('job_queue');
    const jobs = await this.redis.zrange('job_queue', 0, -1);

    const byTier = { free: 0, pro: 0, enterprise: 0 };
    for (const jobStr of jobs) {
      const job = JSON.parse(jobStr);
      byTier[job.tier]++;
    }

    return { total: length, byTier };
  }
}
```

### 6.2 Rate Limiting

```typescript
// src/gateway/rate-limiter.ts

export class RateLimiter {
  private redis: Redis;

  // Tier-based limits
  private limits: Record<string, RateLimit> = {
    free: { requests: 10, window: 3600 },     // 10/hour
    pro: { requests: 100, window: 3600 },     // 100/hour
    enterprise: { requests: 1000, window: 3600 }, // 1000/hour
  };

  async checkLimit(userId: string, tier: string): Promise<boolean> {
    const key = `rate:${userId}`;
    const limit = this.limits[tier];

    const current = await this.redis.incr(key);

    if (current === 1) {
      await this.redis.expire(key, limit.window);
    }

    return current <= limit.requests;
  }

  async getRemainingRequests(userId: string, tier: string): Promise<number> {
    const key = `rate:${userId}`;
    const limit = this.limits[tier];
    const current = parseInt(await this.redis.get(key) || '0');
    return Math.max(0, limit.requests - current);
  }
}
```

### 6.3 Resource Autoscaling

```typescript
// src/orchestrator/autoscaler.ts

export class AutoScaler {
  private poolManager: WorkerPoolManager;
  private metrics: MetricsCollector;

  // Scale shared pool based on queue depth
  async evaluateScaling(): Promise<void> {
    const stats = await this.jobQueue.getStats();
    const freeWorkers = this.poolManager.getIdleCount('free');

    // Scale up: queue depth > 2x idle workers
    if (stats.byTier.free > freeWorkers * 2) {
      const needed = Math.min(
        stats.byTier.free - freeWorkers,
        MAX_FREE_WORKERS - this.poolManager.getCount('free')
      );
      for (let i = 0; i < needed; i++) {
        await this.poolManager.spawnWorker({ tier: 'free', resources: FREE_TIER_LIMITS });
      }
    }

    // Scale down: too many idle workers
    if (freeWorkers > MIN_FREE_WORKERS && stats.byTier.free < freeWorkers / 2) {
      const toRemove = Math.min(
        freeWorkers - MIN_FREE_WORKERS,
        freeWorkers - stats.byTier.free
      );
      await this.poolManager.terminateIdleWorkers('free', toRemove);
    }
  }
}
```

---

## 7. Docker Compose Configuration

### 7.1 Development Setup

```yaml
# docker-compose.dev.yml
version: '3.8'

services:
  # PostgreSQL database
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: aibusinesshub
      POSTGRES_USER: hub
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U hub"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Redis for job queue and caching
  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  # API Gateway
  gateway:
    build:
      context: .
      dockerfile: Dockerfile.gateway
    environment:
      - DATABASE_URL=postgresql://hub:${POSTGRES_PASSWORD}@postgres:5432/aibusinesshub
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=${JWT_SECRET}
      - ENCRYPTION_KEY=${ENCRYPTION_KEY}
    ports:
      - "8000:8000"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy

  # Job Orchestrator
  orchestrator:
    build:
      context: .
      dockerfile: Dockerfile.orchestrator
    environment:
      - DATABASE_URL=postgresql://hub:${POSTGRES_PASSWORD}@postgres:5432/aibusinesshub
      - REDIS_URL=redis://redis:6379
      - DOCKER_HOST=unix:///var/run/docker.sock
      - MIN_FREE_WORKERS=2
      - MAX_FREE_WORKERS=5
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - workspaces:/workspaces
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy

  # Shared worker pool (free tier)
  worker:
    build:
      context: .
      dockerfile: Dockerfile.agent-executor
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
    environment:
      - TIER=free
      - ORCHESTRATOR_URL=http://orchestrator:3000
    volumes:
      - /tmp/workspaces:/tmp/workspace
    depends_on:
      - orchestrator

volumes:
  postgres_data:
  redis_data:
  workspaces:
```

### 7.2 Production Setup with Profiles

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  # Core services (always on)
  postgres:
    image: postgres:16-alpine
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 4G
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - backend

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes --maxmemory 1gb --maxmemory-policy allkeys-lru
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 1G
    networks:
      - backend

  gateway:
    image: ${REGISTRY}/ai-business-hub/gateway:${VERSION}
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: '1'
          memory: 1G
    networks:
      - backend
      - frontend
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.gateway.rule=Host(`api.aibusinesshub.io`)"

  orchestrator:
    image: ${REGISTRY}/ai-business-hub/orchestrator:${VERSION}
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - workspaces:/workspaces
    networks:
      - backend

  # Free tier worker pool
  worker_free:
    image: ${REGISTRY}/ai-business-hub/agent-executor:${VERSION}
    deploy:
      replicas: 5
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
    environment:
      - TIER=free
    networks:
      - backend
      - execution

  # Pro tier template (spawned dynamically)
  # Not started by default - managed by orchestrator
  worker_pro_template:
    image: ${REGISTRY}/ai-business-hub/agent-executor:${VERSION}
    profiles:
      - pro_worker
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
    environment:
      - TIER=pro
    networks:
      - backend
      - execution

networks:
  frontend:
    driver: overlay
  backend:
    driver: overlay
    internal: true
  execution:
    driver: overlay
    internal: true

volumes:
  postgres_data:
  redis_data:
  workspaces:
```

---

## 8. Kubernetes Deployment

### 8.1 Namespace and RBAC

```yaml
# k8s/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: ai-business-hub
  labels:
    app: ai-business-hub
---
# k8s/rbac.yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  namespace: ai-business-hub
  name: orchestrator-role
rules:
- apiGroups: [""]
  resources: ["pods"]
  verbs: ["create", "delete", "get", "list", "watch"]
- apiGroups: [""]
  resources: ["pods/exec"]
  verbs: ["create"]
- apiGroups: [""]
  resources: ["persistentvolumeclaims"]
  verbs: ["create", "delete", "get", "list"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: orchestrator-binding
  namespace: ai-business-hub
subjects:
- kind: ServiceAccount
  name: orchestrator
  namespace: ai-business-hub
roleRef:
  kind: Role
  name: orchestrator-role
  apiGroup: rbac.authorization.k8s.io
```

### 8.2 Worker Pool Deployment

```yaml
# k8s/worker-pool.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: worker-free
  namespace: ai-business-hub
spec:
  replicas: 5
  selector:
    matchLabels:
      app: worker
      tier: free
  template:
    metadata:
      labels:
        app: worker
        tier: free
    spec:
      containers:
      - name: executor
        image: ai-business-hub/agent-executor:latest
        resources:
          limits:
            cpu: "500m"
            memory: "512Mi"
          requests:
            cpu: "250m"
            memory: "256Mi"
        env:
        - name: TIER
          value: "free"
        - name: ORCHESTRATOR_URL
          value: "http://orchestrator:3000"
        volumeMounts:
        - name: workspace
          mountPath: /tmp/workspace
        securityContext:
          runAsNonRoot: true
          readOnlyRootFilesystem: true
          allowPrivilegeEscalation: false
      volumes:
      - name: workspace
        emptyDir:
          sizeLimit: 1Gi
---
# Horizontal Pod Autoscaler
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: worker-free-hpa
  namespace: ai-business-hub
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: worker-free
  minReplicas: 3
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: External
    external:
      metric:
        name: redis_queue_length
        selector:
          matchLabels:
            queue: free_tier
      target:
        type: Value
        value: 10
```

### 8.3 Pro Tier Dynamic Pods

```yaml
# k8s/pro-worker-template.yaml
# This is a template - orchestrator creates pods dynamically
apiVersion: v1
kind: Pod
metadata:
  name: worker-pro-${USER_ID}
  namespace: ai-business-hub
  labels:
    app: worker
    tier: pro
    user: ${USER_ID}
spec:
  containers:
  - name: executor
    image: ai-business-hub/agent-executor:latest
    resources:
      limits:
        cpu: "2"
        memory: "2Gi"
      requests:
        cpu: "1"
        memory: "1Gi"
    env:
    - name: TIER
      value: "pro"
    - name: USER_ID
      value: "${USER_ID}"
    volumeMounts:
    - name: workspace
      mountPath: /workspace
    securityContext:
      runAsNonRoot: true
      readOnlyRootFilesystem: true
  volumes:
  - name: workspace
    persistentVolumeClaim:
      claimName: workspace-${USER_ID}
  terminationGracePeriodSeconds: 30
---
# PVC Template for Pro users
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: workspace-${USER_ID}
  namespace: ai-business-hub
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
  storageClassName: fast-ssd
```

---

## 9. Security Model

### 9.1 Container Security

```yaml
# Security context applied to all executor containers
securityContext:
  # Run as non-root user
  runAsNonRoot: true
  runAsUser: 1000
  runAsGroup: 1000

  # Read-only root filesystem
  readOnlyRootFilesystem: true

  # No privilege escalation
  allowPrivilegeEscalation: false

  # Drop all capabilities
  capabilities:
    drop:
      - ALL
    add:
      - NET_BIND_SERVICE  # Only if needed

  # Seccomp profile
  seccompProfile:
    type: RuntimeDefault
```

### 9.2 Network Policies

```yaml
# k8s/network-policies.yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: worker-isolation
  namespace: ai-business-hub
spec:
  podSelector:
    matchLabels:
      app: worker
  policyTypes:
  - Ingress
  - Egress
  ingress:
  # Only allow traffic from orchestrator
  - from:
    - podSelector:
        matchLabels:
          app: orchestrator
  egress:
  # Allow DNS
  - to:
    - namespaceSelector: {}
      podSelector:
        matchLabels:
          k8s-app: kube-dns
    ports:
    - protocol: UDP
      port: 53
  # Allow HTTPS to AI providers
  - to:
    - ipBlock:
        cidr: 0.0.0.0/0
    ports:
    - protocol: TCP
      port: 443
  # Block everything else
```

### 9.3 Secret Management

```yaml
# k8s/secrets.yaml
apiVersion: v1
kind: Secret
metadata:
  name: encryption-keys
  namespace: ai-business-hub
type: Opaque
data:
  # Base64 encoded
  ENCRYPTION_KEY: ${ENCRYPTION_KEY_B64}
  JWT_SECRET: ${JWT_SECRET_B64}
---
# For user API keys - use external secret manager
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: user-api-keys
  namespace: ai-business-hub
spec:
  refreshInterval: 1h
  secretStoreRef:
    kind: ClusterSecretStore
    name: vault
  target:
    name: user-api-keys
    creationPolicy: Owner
  data:
  - secretKey: encryption_key
    remoteRef:
      key: ai-business-hub/encryption
      property: key
```

---

## 10. Monitoring & Observability

### 10.1 Prometheus Metrics

```typescript
// src/orchestrator/metrics.ts
import { Registry, Counter, Gauge, Histogram } from 'prom-client';

const register = new Registry();

// Job metrics
export const jobsTotal = new Counter({
  name: 'aibh_jobs_total',
  help: 'Total number of jobs processed',
  labelNames: ['tier', 'status', 'agent_type'],
  registers: [register],
});

export const jobDuration = new Histogram({
  name: 'aibh_job_duration_seconds',
  help: 'Job execution duration',
  labelNames: ['tier', 'agent_type'],
  buckets: [1, 5, 10, 30, 60, 120, 300, 600],
  registers: [register],
});

// Worker metrics
export const workersActive = new Gauge({
  name: 'aibh_workers_active',
  help: 'Number of active workers',
  labelNames: ['tier'],
  registers: [register],
});

export const workerUtilization = new Gauge({
  name: 'aibh_worker_utilization',
  help: 'Worker utilization percentage',
  labelNames: ['tier'],
  registers: [register],
});

// Queue metrics
export const queueDepth = new Gauge({
  name: 'aibh_queue_depth',
  help: 'Number of jobs in queue',
  labelNames: ['tier'],
  registers: [register],
});

export const queueWaitTime = new Histogram({
  name: 'aibh_queue_wait_seconds',
  help: 'Time jobs spend waiting in queue',
  labelNames: ['tier'],
  buckets: [0.1, 0.5, 1, 5, 10, 30, 60],
  registers: [register],
});
```

### 10.2 Grafana Dashboard Config

```json
{
  "dashboard": {
    "title": "AI Business Hub - Container Metrics",
    "panels": [
      {
        "title": "Jobs by Tier",
        "type": "graph",
        "targets": [
          {
            "expr": "sum(rate(aibh_jobs_total[5m])) by (tier)",
            "legendFormat": "{{tier}}"
          }
        ]
      },
      {
        "title": "Worker Utilization",
        "type": "gauge",
        "targets": [
          {
            "expr": "aibh_worker_utilization",
            "legendFormat": "{{tier}}"
          }
        ]
      },
      {
        "title": "Queue Depth",
        "type": "graph",
        "targets": [
          {
            "expr": "aibh_queue_depth",
            "legendFormat": "{{tier}}"
          }
        ]
      },
      {
        "title": "Job Duration (p95)",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(aibh_job_duration_seconds_bucket[5m]))",
            "legendFormat": "{{tier}}"
          }
        ]
      }
    ]
  }
}
```

### 10.3 Alerting Rules

```yaml
# prometheus/alerts.yaml
groups:
- name: ai-business-hub
  rules:
  - alert: HighQueueDepth
    expr: aibh_queue_depth{tier="free"} > 50
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "High queue depth for free tier"
      description: "Free tier queue has {{ $value }} pending jobs"

  - alert: WorkerPoolExhausted
    expr: aibh_worker_utilization{tier="free"} > 0.9
    for: 10m
    labels:
      severity: critical
    annotations:
      summary: "Worker pool nearly exhausted"
      description: "{{ $labels.tier }} tier at {{ $value | humanizePercentage }} utilization"

  - alert: LongQueueWait
    expr: histogram_quantile(0.95, rate(aibh_queue_wait_seconds_bucket[5m])) > 60
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "Jobs waiting too long in queue"
      description: "p95 queue wait time is {{ $value }}s"
```

---

## Summary

This containerization strategy provides:

1. **Cost Efficiency**: Shared pool for free tier minimizes infrastructure costs
2. **Performance**: Warm containers for Pro tier with fast startup
3. **Isolation**: Network and filesystem isolation between tenants
4. **Scalability**: HPA for automatic scaling based on demand
5. **Security**: Non-root containers, network policies, encrypted secrets
6. **Observability**: Comprehensive metrics and alerting

**Next Steps:**
- [ ] Build agent-executor Docker image
- [ ] Implement WorkerPoolManager
- [ ] Set up Redis job queue
- [ ] Configure Kubernetes cluster
- [ ] Deploy monitoring stack
- [ ] Load test tiered architecture
