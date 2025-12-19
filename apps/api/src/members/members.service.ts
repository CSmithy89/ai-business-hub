import { Injectable, NotFoundException } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../common/services/prisma.service'
import { UpdateModulePermissionsDto } from './dto/update-module-permissions.dto'

/**
 * Service for managing workspace members
 */
@Injectable()
export class MembersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Update member module permissions
   */
  async updateModulePermissions(
    workspaceId: string,
    memberId: string,
    dto: UpdateModulePermissionsDto
  ) {
    // Get current member
    const member = await this.prisma.workspaceMember.findUnique({
      where: {
        id: memberId,
        workspaceId,
      },
    })

    if (!member) {
      throw new NotFoundException('Member not found in this workspace')
    }

    // Update module permissions
    const updated = await this.prisma.workspaceMember.update({
      where: { id: memberId },
      data: {
        modulePermissions: dto.modulePermissions
          ? (dto.modulePermissions as unknown as Prisma.InputJsonValue)
          : Prisma.JsonNull,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
          },
        },
      },
    })

    return {
      member: updated,
      previousPermissions: member.modulePermissions,
    }
  }

  /**
   * Get member by ID with user details
   */
  async getMember(workspaceId: string, memberId: string) {
    const member = await this.prisma.workspaceMember.findUnique({
      where: {
        id: memberId,
        workspaceId,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
          },
        },
      },
    })

    if (!member) {
      throw new NotFoundException('Member not found in this workspace')
    }

    return member
  }

  /**
   * List all members in a workspace
   * @param workspaceId - Workspace ID
   * @param search - Optional search query to filter by name or email
   */
  async listMembers(workspaceId: string, search?: string) {
    return this.prisma.workspaceMember.findMany({
      where: {
        workspaceId,
        ...(search && {
          user: {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
            ],
          },
        }),
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
          },
        },
      },
      orderBy: {
        invitedAt: 'desc',
      },
      take: search ? 20 : undefined, // Limit results when searching
    })
  }
}
