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

function resolveRedisUrl(): string | null {
  if (Object.prototype.hasOwnProperty.call(process.env, 'REDIS_URL')) {
    const explicit = process.env.REDIS_URL?.trim()
    if (explicit) return explicit

    // If REDIS_URL is present but blank, treat it as "unset" in development so
    // local Docker Redis works out of the box.
    if (process.env.NODE_ENV === 'development') {
      return 'redis://localhost:6379'
    }

    return null
  }

  // Dev-quality of life: if Docker Redis is running locally and the env var isn't set,
  // default to localhost. Never do this in production/test.
  if (process.env.NODE_ENV === 'development') {
    return 'redis://localhost:6379'
  }

  return null
}

function createIoRedis(): Redis | null {
  const redisUrl = resolveRedisUrl()
  if (!redisUrl) return null

  const existing = globalThis.__hyvve_io_redis__
  if (existing && existing.status !== 'end') return existing

  try {
    const client = new Redis(redisUrl, {
      // Safer defaults for dev/serverless-like environments:
      lazyConnect: true,
      enableOfflineQueue: false,
      maxRetriesPerRequest: 1,
      // Avoid infinite reconnection loops in dev; in production prefer Upstash.
      retryStrategy: () => null,
      connectTimeout: 1000,
    })

    client.on('error', (error) => {
      console.warn('[redis] ioredis error:', error)
    })

    globalThis.__hyvve_io_redis__ = client
    return client
  } catch (error) {
    console.warn('[redis] Invalid REDIS_URL; falling back:', error)
    return null
  }
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
