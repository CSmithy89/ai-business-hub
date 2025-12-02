import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'

/**
 * PrismaService - NestJS wrapper for Prisma Client
 *
 * Provides Prisma database access throughout the NestJS application.
 * Manages connection lifecycle and integrates with NestJS module system.
 *
 * @example
 * ```typescript
 * @Injectable()
 * export class UsersService {
 *   constructor(private prisma: PrismaService) {}
 *
 *   async findById(id: string) {
 *     return this.prisma.user.findUnique({ where: { id } })
 *   }
 * }
 * ```
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    })
  }

  /**
   * Connect to database when module initializes
   */
  async onModuleInit() {
    await this.$connect()
  }

  /**
   * Disconnect from database when module destroys
   */
  async onModuleDestroy() {
    await this.$disconnect()
  }
}
