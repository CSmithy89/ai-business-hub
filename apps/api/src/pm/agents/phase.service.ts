import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { TaskStatus, CheckpointStatus, PhaseStatus } from '@prisma/client';
import { PrismaService } from '../../common/services/prisma.service';
import { TaskActionDto, PhaseTransitionDto } from '../phases/dto/phase-transition.dto';

export interface PhaseCompletionAnalysis {
  phaseId: string;
  phaseName: string;
  totalTasks: number;
  completedTasks: number;
  incompleteTasks: Array<{
    id: string;
    title: string;
    status: TaskStatus;
    taskNumber: number;
  }>;
  recommendations: Array<{
    taskId: string;
    taskTitle: string;
    action: 'complete' | 'carry_over' | 'cancel';
    reasoning: string;
    suggestedPhase?: string;
  }>;
  summary: {
    readyForCompletion: boolean;
    blockers: string[];
    nextPhasePreview: string;
    estimatedTimeToComplete?: string;
  };
}

export interface PhaseCheckpointResult {
  id: string;
  phaseId: string;
  name: string;
  description: string | null;
  checkpointDate: Date;
  status: CheckpointStatus;
  completedAt: Date | null;
  remindAt3Days: boolean;
  remindAt1Day: boolean;
  remindAtDayOf: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PhaseTransitionResult {
  success: true;
  completedPhase: {
    id: string;
    name: string;
    status: PhaseStatus;
    completedAt: Date | null;
  };
  activePhase: {
    id: string;
    name: string;
    status: PhaseStatus;
    startDate: Date | null;
  } | null;
}

@Injectable()
export class PhaseService {
  private readonly logger = new Logger(PhaseService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Analyze phase completion readiness and provide task recommendations.
   * This method provides basic analysis - Scope agent integration can be added later.
   */
  async analyzePhaseCompletion(
    workspaceId: string,
    phaseId: string,
    _userId: string,
  ): Promise<PhaseCompletionAnalysis> {
    this.logger.log(
      `Analyzing phase completion: ${phaseId} for workspace ${workspaceId}`,
    );

    // 1. Get phase with tasks and project context
    const phase = await this.prisma.phase.findUnique({
      where: { id: phaseId },
      include: {
        project: {
          include: {
            phases: {
              orderBy: { phaseNumber: 'asc' },
            },
          },
        },
      },
    });

    if (!phase) {
      throw new NotFoundException(`Phase ${phaseId} not found`);
    }

    // Verify workspace ownership
    if (phase.project.workspaceId !== workspaceId) {
      throw new NotFoundException(`Phase ${phaseId} not found in workspace`);
    }

    // Get incomplete tasks for this phase
    const tasks = await this.prisma.task.findMany({
      where: {
        phaseId,
        status: { not: TaskStatus.DONE },
      },
      orderBy: { taskNumber: 'asc' },
    });

    // 2. Build context for analysis
    const incompleteTasks = tasks.map((task) => ({
      id: task.id,
      title: task.title,
      status: task.status,
      taskNumber: task.taskNumber,
      priority: task.priority,
      assignmentType: task.assignmentType,
    }));

    // 3. Generate analysis (basic analysis - Scope agent can enhance this)
    const analysis = this.generateBasicAnalysis(phase, incompleteTasks);

    this.logger.log(
      `Phase analysis complete: ${analysis.recommendations.length} recommendations generated`,
    );

    return analysis;
  }

  /**
   * Get upcoming checkpoints for a phase (next 3 days).
   */
  async getUpcomingCheckpoints(
    workspaceId: string,
    phaseId: string,
  ): Promise<PhaseCheckpointResult[]> {
    // Verify phase exists and belongs to workspace
    const phase = await this.prisma.phase.findUnique({
      where: { id: phaseId },
      include: { project: true },
    });

    if (!phase) {
      throw new NotFoundException(`Phase ${phaseId} not found`);
    }

    if (phase.project.workspaceId !== workspaceId) {
      throw new NotFoundException(`Phase ${phaseId} not found in workspace`);
    }

    const now = new Date();
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(now.getDate() + 3);

    const checkpoints = await this.prisma.phaseCheckpoint.findMany({
      where: {
        phaseId,
        status: 'PENDING',
        checkpointDate: {
          gte: now,
          lte: threeDaysFromNow,
        },
      },
      orderBy: { checkpointDate: 'asc' },
    });

    return checkpoints;
  }

  /**
   * Generate basic analysis without agent assistance.
   */
  private generateBasicAnalysis(
    phase: {
      id: string;
      name: string;
      phaseNumber: number;
      totalTasks: number;
      completedTasks: number;
      project: {
        phases: Array<{ phaseNumber: number; name: string }>;
      };
    },
    incompleteTasks: Array<{
      id: string;
      title: string;
      status: TaskStatus;
      taskNumber: number;
      priority: string;
      assignmentType: string | null;
    }>,
  ): PhaseCompletionAnalysis {
    const nextPhase = phase.project.phases.find(
      (p) => p.phaseNumber === phase.phaseNumber + 1,
    );

    const completionRate =
      phase.totalTasks > 0 ? phase.completedTasks / phase.totalTasks : 0;

    // Identify blockers
    const blockers: string[] = [];
    const blockedTasks = incompleteTasks.filter(
      (t) => t.status === TaskStatus.AWAITING_APPROVAL,
    );
    if (blockedTasks.length > 0) {
      blockers.push(
        `${blockedTasks.length} task(s) awaiting approval must be resolved`,
      );
    }

    // Generate recommendations based on task status and priority
    const recommendations = incompleteTasks.map((task) => {
      let action: 'complete' | 'carry_over' | 'cancel' = 'carry_over';
      let reasoning = 'Recommend carrying to next phase';

      if (task.status === TaskStatus.IN_PROGRESS) {
        action = 'complete';
        reasoning = 'Task in progress - recommend completing before phase ends';
      } else if (task.status === TaskStatus.AWAITING_APPROVAL) {
        action = 'complete';
        reasoning = 'Task awaiting approval - blocker that must be resolved';
      } else if (task.priority === 'HIGH' || task.priority === 'URGENT') {
        action = 'complete';
        reasoning = `High priority task - should complete in current phase`;
      }

      return {
        taskId: task.id,
        taskTitle: task.title,
        action,
        reasoning,
      };
    });

    return {
      phaseId: phase.id,
      phaseName: phase.name,
      totalTasks: phase.totalTasks,
      completedTasks: phase.completedTasks,
      incompleteTasks: incompleteTasks.map((t) => ({
        id: t.id,
        title: t.title,
        status: t.status,
        taskNumber: t.taskNumber,
      })),
      recommendations,
      summary: {
        readyForCompletion: completionRate >= 0.8 && blockers.length === 0,
        blockers,
        nextPhasePreview: nextPhase
          ? `Next: ${nextPhase.name}`
          : 'No next phase defined',
        estimatedTimeToComplete:
          incompleteTasks.length <= 3 ? '1-2 days' : '3-5 days',
      },
    };
  }

  /**
   * Execute phase transition with bulk task operations.
   * Implements the flow from PM-05.2 spec.
   */
  async executePhaseTransition(
    workspaceId: string,
    phaseId: string,
    userId: string,
    dto: PhaseTransitionDto,
  ): Promise<PhaseTransitionResult> {
    this.logger.log(
      `Executing phase transition: ${phaseId} for workspace ${workspaceId}`,
    );

    // 1. Verify phase ownership and permissions
    const phase = await this.prisma.phase.findFirst({
      where: {
        id: phaseId,
        project: { workspaceId, deletedAt: null },
      },
      include: { project: true },
    });

    if (!phase) {
      throw new NotFoundException('Phase not found');
    }

    // 2. Validate transition readiness (check blockers)
    const analysis = await this.analyzePhaseCompletion(
      workspaceId,
      phaseId,
      userId,
    );
    if (!analysis.summary.readyForCompletion) {
      throw new BadRequestException('Phase has unresolved blockers');
    }

    // 3. Execute task actions in transaction
    return this.prisma.$transaction(async (tx) => {
      // 3a. Process each task action
      for (const taskAction of dto.taskActions) {
        await this.executeTaskAction(tx, taskAction, phaseId);
      }

      // 3b. Mark current phase as COMPLETED
      const completedPhase = await tx.phase.update({
        where: { id: phaseId },
        data: {
          status: PhaseStatus.COMPLETED,
          completedAt: new Date(),
          completionNote: dto.completionNote,
        },
      });

      // 3c. Activate next phase
      const nextPhase = await tx.phase.findFirst({
        where: {
          projectId: phase.projectId,
          phaseNumber: phase.phaseNumber + 1,
        },
      });

      let activePhase = null;
      if (nextPhase) {
        activePhase = await tx.phase.update({
          where: { id: nextPhase.id },
          data: {
            status: PhaseStatus.CURRENT,
            startDate: new Date(),
          },
        });
      }

      this.logger.log(
        `Phase transition complete: ${phaseId} → ${activePhase?.id || 'none'}`,
      );

      return {
        success: true,
        completedPhase: {
          id: completedPhase.id,
          name: completedPhase.name,
          status: completedPhase.status,
          completedAt: completedPhase.completedAt,
        },
        activePhase: activePhase
          ? {
              id: activePhase.id,
              name: activePhase.name,
              status: activePhase.status,
              startDate: activePhase.startDate,
            }
          : null,
      };
    });
  }

  /**
   * Execute a single task action within a transaction.
   */
  private async executeTaskAction(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tx: any, // Prisma transaction client
    taskAction: TaskActionDto,
    _currentPhaseId: string,
  ): Promise<void> {
    switch (taskAction.action) {
      case 'complete':
        await tx.task.update({
          where: { id: taskAction.taskId },
          data: {
            status: TaskStatus.DONE,
            completedAt: new Date(),
          },
        });
        break;

      case 'carry_over':
        if (!taskAction.targetPhaseId) {
          throw new BadRequestException(
            'Target phase required for carry_over action',
          );
        }
        await tx.task.update({
          where: { id: taskAction.taskId },
          data: { phaseId: taskAction.targetPhaseId },
        });
        break;

      case 'cancel':
        await tx.task.update({
          where: { id: taskAction.taskId },
          data: {
            status: TaskStatus.CANCELLED,
            // Note: cancelledAt field doesn't exist in current schema
            // Using completedAt for now as a timestamp
            completedAt: new Date(),
          },
        });
        break;
    }
  }
}
