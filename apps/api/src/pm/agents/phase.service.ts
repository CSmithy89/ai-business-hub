import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { TaskStatus } from '@prisma/client';
import { PrismaService } from '../../common/services/prisma.service';
import { AgentsService } from './agents.service';

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

export interface PhaseCheckpoint {
  id: string;
  phaseId: string;
  name: string;
  description?: string;
  checkpointDate: Date;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  completedAt?: Date;
  remindAt3Days: boolean;
  remindAt1Day: boolean;
  remindAtDayOf: boolean;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class PhaseService {
  private readonly logger = new Logger(PhaseService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly agentsService: AgentsService,
  ) {}

  /**
   * Analyze phase completion readiness and provide task recommendations.
   * This method invokes the Scope agent to analyze the phase.
   */
  async analyzePhaseCompletion(
    workspaceId: string,
    phaseId: string,
    userId: string,
  ): Promise<PhaseCompletionAnalysis> {
    this.logger.log(
      `Analyzing phase completion: ${phaseId} for workspace ${workspaceId}`,
    );

    // 1. Get phase with tasks and project context
    const phase = await this.prisma.phase.findUnique({
      where: { id: phaseId },
      include: {
        tasks: {
          where: {
            status: { not: TaskStatus.DONE },
            deletedAt: null,
          },
          orderBy: { taskNumber: 'asc' },
        },
        project: {
          include: {
            phases: {
              where: { deletedAt: null },
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

    // 2. Build context for Scope agent
    const incompleteTasks = phase.tasks.map((task) => ({
      id: task.id,
      title: task.title,
      status: task.status,
      taskNumber: task.taskNumber,
      priority: task.priority,
      assignmentType: task.assignmentType,
    }));

    const agentMessage = `Analyze phase completion for "${phase.name}".

Phase Status:
- Total tasks: ${phase.totalTasks}
- Completed tasks: ${phase.completedTasks}
- Completion rate: ${phase.totalTasks > 0 ? Math.round((phase.completedTasks / phase.totalTasks) * 100) : 0}%

Incomplete Tasks (${incompleteTasks.length}):
${incompleteTasks.map((t) => `- [${t.status}] ${t.title} (${t.priority} priority)`).join('\n')}

For each incomplete task, recommend an action:
- COMPLETE: Task should be finished before phase ends
- CARRY OVER: Task should move to next phase
- CANCEL: Task is no longer needed or blocked indefinitely

Provide clear reasoning for each recommendation.
Also identify any blockers preventing phase completion and provide a phase readiness summary.`;

    // 3. Invoke Scope agent for analysis
    try {
      const agentResponse = await this.agentsService.invokeAgent({
        workspaceId,
        sessionId: `phase-analysis-${phaseId}`,
        userId,
        agentName: 'scope',
        projectId: phase.projectId,
        message: agentMessage,
      });

      // 4. Parse agent response into structured format
      const analysis = this.parseAnalysis(
        agentResponse,
        phase,
        incompleteTasks,
      );

      this.logger.log(
        `Phase analysis complete: ${analysis.recommendations.length} recommendations generated`,
      );

      return analysis;
    } catch (error) {
      this.logger.error(
        `Failed to analyze phase completion: ${error.message}`,
        error.stack,
      );

      // Fallback: return basic analysis without agent recommendations
      return this.generateBasicAnalysis(phase, incompleteTasks);
    }
  }

  /**
   * Get upcoming checkpoints for a phase (next 3 days).
   */
  async getUpcomingCheckpoints(
    workspaceId: string,
    phaseId: string,
  ): Promise<PhaseCheckpoint[]> {
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
   * Parse agent response into structured analysis.
   * This is a simplified parser - in production, you'd use more sophisticated
   * LLM response parsing or structured output.
   */
  private parseAnalysis(
    agentResponse: any,
    phase: any,
    incompleteTasks: any[],
  ): PhaseCompletionAnalysis {
    // Extract agent message content
    const agentMessage =
      agentResponse.response?.content || agentResponse.message || '';

    // Default recommendations (carry over)
    const recommendations = incompleteTasks.map((task) => ({
      taskId: task.id,
      taskTitle: task.title,
      action: 'carry_over' as const,
      reasoning:
        'Task not yet completed. Recommend carrying to next phase unless blocked or no longer relevant.',
    }));

    // Find next phase
    const nextPhase = phase.project.phases.find(
      (p: any) => p.phaseNumber === phase.phaseNumber + 1,
    );

    // Calculate readiness
    const completionRate =
      phase.totalTasks > 0 ? phase.completedTasks / phase.totalTasks : 0;
    const readyForCompletion = completionRate >= 0.8;

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
        readyForCompletion,
        blockers,
        nextPhasePreview: nextPhase
          ? `Next: ${nextPhase.name} (Phase ${nextPhase.phaseNumber})`
          : 'No next phase defined',
        estimatedTimeToComplete:
          incompleteTasks.length <= 3 ? '1-2 days' : '3-5 days',
      },
    };
  }

  /**
   * Generate basic analysis when agent is unavailable.
   */
  private generateBasicAnalysis(
    phase: any,
    incompleteTasks: any[],
  ): PhaseCompletionAnalysis {
    const nextPhase = phase.project.phases.find(
      (p: any) => p.phaseNumber === phase.phaseNumber + 1,
    );

    const completionRate =
      phase.totalTasks > 0 ? phase.completedTasks / phase.totalTasks : 0;

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
      recommendations: incompleteTasks.map((task) => ({
        taskId: task.id,
        taskTitle: task.title,
        action: 'carry_over' as const,
        reasoning: 'Automatic recommendation: carry over to next phase',
      })),
      summary: {
        readyForCompletion: completionRate >= 0.8,
        blockers: [],
        nextPhasePreview: nextPhase
          ? `Next: ${nextPhase.name}`
          : 'No next phase',
      },
    };
  }
}
