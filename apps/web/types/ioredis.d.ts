declare module 'ioredis' {
  export interface IORedisOptions {
    host?: string;
    port?: number;
    username?: string;
    password?: string;
    db?: number;
    tls?: Record<string, unknown>;
    lazyConnect?: boolean;
    enableOfflineQueue?: boolean;
    maxRetriesPerRequest?: number | null;
    connectTimeout?: number;
    retryStrategy?: (times: number) => number | null;
  }

  export type RedisStatus =
    | 'wait'
    | 'reconnecting'
    | 'connecting'
    | 'connect'
    | 'ready'
    | 'close'
    | 'end';

  export default class IORedis {
    constructor(options?: IORedisOptions);
    constructor(path: string, options?: IORedisOptions);
    eval<T = unknown>(script: string, numKeys: number, ...args: (string | number)[]): Promise<T>;
    del(...keys: string[]): Promise<number>;
    hgetall<T extends Record<string, unknown> = Record<string, string>>(key: string): Promise<T>;
    flushdb(): Promise<void>;
    quit(): Promise<void>;
    on(event: 'error', listener: (error: unknown) => void): this;
    on(event: RedisStatus, listener: () => void): this;
    status: RedisStatus;
  }
}
