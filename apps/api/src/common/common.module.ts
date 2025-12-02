import { Module } from '@nestjs/common'
import { AuthGuard } from './guards/auth.guard'
import { TenantGuard } from './guards/tenant.guard'
import { RolesGuard } from './guards/roles.guard'
import { PrismaService } from './services/prisma.service'

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
  providers: [
    // Services
    PrismaService,

    // Guards
    AuthGuard,
    TenantGuard,
    RolesGuard,
  ],
  exports: [
    // Services
    PrismaService,

    // Guards
    AuthGuard,
    TenantGuard,
    RolesGuard,
  ],
})
export class CommonModule {}
