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
  }

  export default class IORedis {
    constructor(options?: IORedisOptions);
    eval<T = unknown>(script: string, numKeys: number, ...args: (string | number)[]): Promise<T>;
    del(...keys: string[]): Promise<number>;
    hgetall<T extends Record<string, unknown> = Record<string, string>>(key: string): Promise<T>;
    flushdb(): Promise<void>;
    quit(): Promise<void>;
  }
}
