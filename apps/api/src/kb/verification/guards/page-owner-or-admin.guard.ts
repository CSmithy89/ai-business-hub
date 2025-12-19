import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common'
import { PrismaService } from '../../../common/services/prisma.service'

/**
 * Guard to check if user is page owner or workspace admin
 */
@Injectable()
export class PageOwnerOrAdminGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()
    const user = request.user
    const pageId = request.params.id

    if (!user || !pageId) {
      return false
    }

    // Find page and check ownership
    const page = await this.prisma.knowledgePage.findUnique({
      where: { id: pageId },
      select: {
        id: true,
        ownerId: true,
        workspaceId: true,
        deletedAt: true,
      },
    })

    if (!page) {
      throw new NotFoundException('Page not found')
    }

    if (page.deletedAt) {
      throw new NotFoundException('Page has been deleted')
    }

    // Check if user is page owner
    if (page.ownerId === user.id) {
      return true
    }

    // Check if user is workspace admin or owner
    const member = await this.prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: user.id,
          workspaceId: page.workspaceId,
        },
      },
      select: { role: true },
    })

    if (member && (member.role === 'ADMIN' || member.role === 'OWNER')) {
      return true
    }

    throw new ForbiddenException(
      'Only page owner or workspace admin can verify pages',
    )
  }
}
