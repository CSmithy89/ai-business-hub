/**
 * Redis utility (dev + prod)
 *
 * Priority:
 * 1) `REDIS_URL` (direct Redis via `ioredis`, best for local development)
 * 2) Upstash REST (`UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`)
 * 3) In-memory (caller fallback)
 */

import Redis from 'ioredis'
import { Redis as UpstashRedis } from '@upstash/redis'

declare global {
   
  var __hyvve_io_redis__: Redis | undefined
   
  var __hyvve_upstash_redis__: UpstashRedis | undefined
}

export type RedisBackend =
  | { kind: 'redis-url'; client: Redis }
  | { kind: 'upstash'; client: UpstashRedis }
  | { kind: 'none'; client: null }

function createIoRedis(): Redis | null {
  const redisUrl = process.env.REDIS_URL
  if (!redisUrl) return null

  if (!globalThis.__hyvve_io_redis__) {
    const url = new URL(redisUrl)

    const dbFromPath = url.pathname?.replace('/', '')
    const db = dbFromPath ? Number(dbFromPath) : undefined

    globalThis.__hyvve_io_redis__ = new Redis({
      host: url.hostname,
      port: url.port ? Number(url.port) : 6379,
      username: url.username || undefined,
      password: url.password || undefined,
      db: Number.isFinite(db) ? db : undefined,
      tls: url.protocol === 'rediss:' ? {} : undefined,
      // Safer defaults for dev/serverless-like environments:
      lazyConnect: true,
      enableOfflineQueue: false,
      maxRetriesPerRequest: 1,
    })
  }

  return globalThis.__hyvve_io_redis__
}

function createUpstashRedis(): UpstashRedis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null

  if (!globalThis.__hyvve_upstash_redis__) {
    globalThis.__hyvve_upstash_redis__ = new UpstashRedis({ url, token })
  }

  return globalThis.__hyvve_upstash_redis__
}

export function getRedisBackend(): RedisBackend {
  const ioRedis = createIoRedis()
  if (ioRedis) return { kind: 'redis-url', client: ioRedis }

  const upstash = createUpstashRedis()
  if (upstash) return { kind: 'upstash', client: upstash }

  return { kind: 'none', client: null }
}
