import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../common/services/prisma.service'
import { CreateExpenseDto } from './dto/create-expense.dto'

@Injectable()
export class ExpensesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(workspaceId: string, projectId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, workspaceId, deletedAt: null },
      select: { id: true },
    })
    if (!project) throw new NotFoundException('Project not found')

    const expenses = await this.prisma.projectExpense.findMany({
      where: { projectId },
      orderBy: { spentAt: 'desc' },
    })

    return { data: expenses }
  }

  async create(workspaceId: string, _actorId: string, projectId: string, dto: CreateExpenseDto) {
    if (!Number.isFinite(dto.amount) || dto.amount < 0) {
      throw new BadRequestException('Invalid amount')
    }

    const project = await this.prisma.project.findFirst({
      where: { id: projectId, workspaceId, deletedAt: null },
      select: { id: true, budget: true, actualSpend: true },
    })
    if (!project) throw new NotFoundException('Project not found')
    if (project.budget === null) throw new BadRequestException('Budget is not enabled for this project')

    const currentSpend = project.actualSpend ? Number(project.actualSpend) : 0
    const nextSpend = currentSpend + dto.amount

    const expense = await this.prisma.$transaction(async (tx) => {
      const created = await tx.projectExpense.create({
        data: {
          projectId,
          amount: dto.amount,
          description: dto.description,
          spentAt: dto.spentAt,
        },
      })

      await tx.project.update({
        where: { id: projectId },
        data: { actualSpend: nextSpend },
        select: { id: true },
      })

      return created
    })

    return { data: expense }
  }
}
