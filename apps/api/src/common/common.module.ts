import { Module } from '@nestjs/common'
import { CsrfController } from './controllers/csrf.controller'
import { AuthGuard } from './guards/auth.guard'
import { TenantGuard } from './guards/tenant.guard'
import { RolesGuard } from './guards/roles.guard'
import { PrismaService } from './services/prisma.service'
import { EmailService } from './services/email.service'
import { DistributedLockService } from './services/distributed-lock.service'

/**
 * CommonModule provides shared utilities, guards, interceptors, and filters
 * that are used across the application.
 *
 * Exports:
 * - Guards: AuthGuard, TenantGuard, RolesGuard
 * - Services: PrismaService
 * - Decorators: @Roles, @Public, @CurrentUser, @CurrentWorkspace (imported from ./decorators)
 *
 * Usage:
 * ```typescript
 * import { AuthGuard, TenantGuard, RolesGuard } from '@/common/guards'
 * import { Roles, Public, CurrentUser, CurrentWorkspace } from '@/common/decorators'
 *
 * @Controller('example')
 * @UseGuards(AuthGuard, TenantGuard, RolesGuard)
 * export class ExampleController {
 *   @Get()
 *   @Roles('admin', 'owner')
 *   async list(@CurrentUser() user: User, @CurrentWorkspace() workspaceId: string) {
 *     // Implementation
 *   }
 * }
 * ```
 */
@Module({
  imports: [],
  controllers: [CsrfController],
  providers: [
    // Services
    PrismaService,
    EmailService,
    DistributedLockService,

    // Guards
    AuthGuard,
    TenantGuard,
    RolesGuard,
  ],
  exports: [
    // Services
    PrismaService,
    EmailService,
    DistributedLockService,

    // Guards
    AuthGuard,
    TenantGuard,
    RolesGuard,
  ],
})
export class CommonModule {}
