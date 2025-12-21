import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '../../common/services/prisma.service'
import { PagesService } from '../pages/pages.service'
import { DEFAULT_TEMPLATES } from './templates.constants'
import { CreateTemplateDto } from './dto/create-template.dto'

type TemplateResponse = {
  id: string
  title: string
  category: string
  description?: string
  content: Record<string, unknown>
  isBuiltIn: boolean
}

@Injectable()
export class TemplatesService {
  private readonly logger = new Logger(TemplatesService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly pagesService: PagesService,
  ) {}

  async listTemplates(workspaceId: string, tenantId: string): Promise<{ data: TemplateResponse[] }> {
    const customTemplates = await this.prisma.knowledgePage.findMany({
      where: {
        workspaceId,
        tenantId,
        deletedAt: null,
        isTemplate: true,
      },
      select: {
        id: true,
        title: true,
        templateCategory: true,
        content: true,
      },
      orderBy: { updatedAt: 'desc' },
    })

    const builtIns: TemplateResponse[] = DEFAULT_TEMPLATES.map((template) => ({
      id: template.id,
      title: template.title,
      category: template.category,
      description: template.description,
      content: template.content,
      isBuiltIn: true,
    }))

    const customs: TemplateResponse[] = customTemplates.map((template) => ({
      id: template.id,
      title: template.title,
      category: template.templateCategory?.trim() || 'Custom',
      content: template.content as Record<string, unknown>,
      isBuiltIn: false,
    }))

    return { data: [...builtIns, ...customs] }
  }

  async createTemplate(
    tenantId: string,
    workspaceId: string,
    actorId: string,
    dto: CreateTemplateDto,
  ): Promise<{ data: TemplateResponse }> {
    const category = dto.category?.trim() || 'Custom'

    const result = await this.pagesService.create(tenantId, workspaceId, actorId, {
      title: dto.title,
      content: dto.content,
      isTemplate: true,
      templateCategory: category,
    })

    const template = result.data

    this.logger.log({
      message: 'KB template created',
      workspaceId,
      templateId: template.id,
    })

    return {
      data: {
        id: template.id,
        title: template.title,
        category,
        content: template.content as Record<string, unknown>,
        isBuiltIn: false,
      },
    }
  }
}
