import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common'
import { PrismaService } from '../../common/services/prisma.service'
import { CreateSavedViewDto } from './dto/create-saved-view.dto'
import { UpdateSavedViewDto } from './dto/update-saved-view.dto'

@Injectable()
export class SavedViewsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * List all saved views for a project (user's own + shared views)
   */
  async list(workspaceId: string, userId: string, projectId: string) {
    const views = await this.prisma.savedView.findMany({
      where: {
        projectId,
        OR: [
          { userId }, // User's own views
          { isShared: true }, // Shared views
        ],
      },
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
    })

    if (!view) {
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
    // Parse JSON strings
    const filters = dto.filters ? JSON.parse(dto.filters) : {}
    const columns = dto.columns ? JSON.parse(dto.columns) : null

    // If setting as default, unset any existing default for this user + project
    if (dto.isDefault) {
      await this.prisma.savedView.updateMany({
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

    const view = await this.prisma.savedView.create({
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

    return { data: view }
  }

  /**
   * Update a saved view
   */
  async update(workspaceId: string, userId: string, id: string, dto: UpdateSavedViewDto) {
    const view = await this.prisma.savedView.findUnique({
      where: { id },
    })

    if (!view) {
      throw new NotFoundException('Saved view not found')
    }

    // Only owner can update
    if (view.userId !== userId) {
      throw new ForbiddenException('You can only update your own views')
    }

    // Parse JSON strings if provided
    const filters = dto.filters ? JSON.parse(dto.filters) : undefined
    const columns = dto.columns ? JSON.parse(dto.columns) : undefined

    // If setting as default, unset any existing default for this user + project
    if (dto.isDefault) {
      await this.prisma.savedView.updateMany({
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

    const updated = await this.prisma.savedView.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.viewType && { viewType: dto.viewType }),
        ...(filters !== undefined && { filters }),
        ...(dto.sortBy !== undefined && { sortBy: dto.sortBy }),
        ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
        ...(columns !== undefined && { columns }),
        ...(dto.isDefault !== undefined && { isDefault: dto.isDefault }),
        ...(dto.isShared !== undefined && { isShared: dto.isShared }),
      },
    })

    return { data: updated }
  }

  /**
   * Delete a saved view
   */
  async delete(workspaceId: string, userId: string, id: string) {
    const view = await this.prisma.savedView.findUnique({
      where: { id },
    })

    if (!view) {
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
