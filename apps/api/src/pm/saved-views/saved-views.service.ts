import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../../common/services/prisma.service'
import { CreateSavedViewDto } from './dto/create-saved-view.dto'
import { UpdateSavedViewDto } from './dto/update-saved-view.dto'

@Injectable()
export class SavedViewsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Parse JSON string safely with error handling
   */
  private parseJsonSafe<T>(
    jsonString: string | undefined,
    fieldName: string
  ): T | undefined {
    if (!jsonString) return undefined
    try {
      return JSON.parse(jsonString) as T
    } catch {
      throw new BadRequestException(`Invalid JSON format for ${fieldName}`)
    }
  }

  /**
   * Verify that a project belongs to the specified workspace
   */
  private async verifyProjectAccess(
    projectId: string,
    workspaceId: string
  ): Promise<void> {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, workspaceId },
      select: { id: true },
    })
    if (!project) {
      throw new NotFoundException('Project not found in this workspace')
    }
  }

  /**
   * List all saved views for a project (user's own + shared views)
   */
  async list(workspaceId: string, userId: string, projectId: string) {
    // Verify project belongs to workspace (multi-tenant isolation)
    await this.verifyProjectAccess(projectId, workspaceId)

    const views = await this.prisma.savedView.findMany({
      where: {
        projectId,
        OR: [
          { userId }, // User's own views
          { isShared: true }, // Shared views
        ],
      },
      take: 100, // Pagination limit to prevent unbounded queries
      orderBy: [
        { isDefault: 'desc' }, // Default views first
        { createdAt: 'desc' },
      ],
    })

    return { data: views }
  }

  /**
   * Get a specific saved view by ID
   */
  async getById(workspaceId: string, userId: string, id: string) {
    const view = await this.prisma.savedView.findUnique({
      where: { id },
      include: { project: { select: { workspaceId: true } } },
    })

    if (!view) {
      throw new NotFoundException('Saved view not found')
    }

    // Verify workspace access (multi-tenant isolation)
    if (view.project.workspaceId !== workspaceId) {
      throw new NotFoundException('Saved view not found')
    }

    // Check access: must be owner or view must be shared
    if (view.userId !== userId && !view.isShared) {
      throw new ForbiddenException('You do not have access to this view')
    }

    return { data: view }
  }

  /**
   * Create a new saved view
   */
  async create(workspaceId: string, userId: string, dto: CreateSavedViewDto) {
    // Verify project belongs to workspace (multi-tenant isolation)
    await this.verifyProjectAccess(dto.projectId, workspaceId)

    // Parse JSON strings safely
    const filters = (this.parseJsonSafe<Prisma.InputJsonObject>(
      dto.filters,
      'filters'
    ) ?? {}) as Prisma.InputJsonValue
    const columns = this.parseJsonSafe<Prisma.InputJsonObject>(
      dto.columns,
      'columns'
    ) as Prisma.InputJsonValue | null ?? Prisma.JsonNull

    // Use transaction to prevent race condition when setting default view
    const view = await this.prisma.$transaction(async (tx) => {
      // If setting as default, unset any existing default for this user + project
      if (dto.isDefault) {
        await tx.savedView.updateMany({
          where: {
            userId,
            projectId: dto.projectId,
            isDefault: true,
          },
          data: {
            isDefault: false,
          },
        })
      }

      return tx.savedView.create({
        data: {
          name: dto.name,
          projectId: dto.projectId,
          userId,
          viewType: dto.viewType,
          filters,
          sortBy: dto.sortBy,
          sortOrder: dto.sortOrder,
          columns,
          isDefault: dto.isDefault ?? false,
          isShared: dto.isShared ?? false,
        },
      })
    })

    return { data: view }
  }

  /**
   * Update a saved view
   */
  async update(
    workspaceId: string,
    userId: string,
    id: string,
    dto: UpdateSavedViewDto
  ) {
    const view = await this.prisma.savedView.findUnique({
      where: { id },
      include: { project: { select: { workspaceId: true } } },
    })

    if (!view) {
      throw new NotFoundException('Saved view not found')
    }

    // Verify workspace access (multi-tenant isolation)
    if (view.project.workspaceId !== workspaceId) {
      throw new NotFoundException('Saved view not found')
    }

    // Only owner can update
    if (view.userId !== userId) {
      throw new ForbiddenException('You can only update your own views')
    }

    // Parse JSON strings safely if provided
    const filters = this.parseJsonSafe<Prisma.InputJsonObject>(
      dto.filters,
      'filters'
    )
    const columns = this.parseJsonSafe<Prisma.InputJsonObject>(
      dto.columns,
      'columns'
    )

    // Use transaction to prevent race condition when setting default view
    const updated = await this.prisma.$transaction(async (tx) => {
      // If setting as default, unset any existing default for this user + project
      if (dto.isDefault) {
        await tx.savedView.updateMany({
          where: {
            userId,
            projectId: view.projectId,
            isDefault: true,
            id: { not: id },
          },
          data: {
            isDefault: false,
          },
        })
      }

      return tx.savedView.update({
        where: { id },
        data: {
          ...(dto.name && { name: dto.name }),
          ...(dto.viewType && { viewType: dto.viewType }),
          ...(filters !== undefined && { filters: filters as Prisma.InputJsonValue }),
          ...(dto.sortBy !== undefined && { sortBy: dto.sortBy }),
          ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
          ...(columns !== undefined && { columns: columns as Prisma.InputJsonValue }),
          ...(dto.isDefault !== undefined && { isDefault: dto.isDefault }),
          ...(dto.isShared !== undefined && { isShared: dto.isShared }),
        },
      })
    })

    return { data: updated }
  }

  /**
   * Delete a saved view
   */
  async delete(workspaceId: string, userId: string, id: string) {
    const view = await this.prisma.savedView.findUnique({
      where: { id },
      include: { project: { select: { workspaceId: true } } },
    })

    if (!view) {
      throw new NotFoundException('Saved view not found')
    }

    // Verify workspace access (multi-tenant isolation)
    if (view.project.workspaceId !== workspaceId) {
      throw new NotFoundException('Saved view not found')
    }

    // Only owner can delete
    if (view.userId !== userId) {
      throw new ForbiddenException('You can only delete your own views')
    }

    await this.prisma.savedView.delete({
      where: { id },
    })

    return { data: { success: true } }
  }

  /**
   * Get the default view for a user + project (if any)
   */
  async getDefault(workspaceId: string, userId: string, projectId: string) {
    // Verify project belongs to workspace (multi-tenant isolation)
    await this.verifyProjectAccess(projectId, workspaceId)

    const view = await this.prisma.savedView.findFirst({
      where: {
        userId,
        projectId,
        isDefault: true,
      },
    })

    return { data: view }
  }
}
