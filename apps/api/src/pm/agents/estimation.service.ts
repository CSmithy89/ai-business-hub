import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { AgentsService } from './agents.service';
import { TaskType } from '@prisma/client';

export interface EstimateTaskDto {
  title: string;
  description?: string;
  type: TaskType;
  projectId: string;
}

export interface SageEstimate {
  storyPoints: number;
  estimatedHours: number;
  confidenceLevel: 'low' | 'medium' | 'high';
  confidenceScore: number;
  basis: string;
  coldStart: boolean;
  similarTasks?: string[];
  complexityFactors: string[];
}

export interface SimilarTask {
  id: string;
  title: string;
  type: TaskType;
  storyPoints: number | null;
  estimatedHours: number | null;
  actualHours: number | null;
}

export interface VelocityMetrics {
  avgPointsPerSprint: number | null;
  avgHoursPerSprint: number | null;
  sprintCount: number;
}

export interface EstimationMetrics {
  averageError: number | null;
  averageAccuracy: number | null;
  totalEstimations: number;
}

export interface StoryPointSuggestion {
  suggestionId: string;
  taskId: string;
  suggestedPoints: number;
  estimatedHours: number;
  confidenceLevel: 'low' | 'medium' | 'high';
  confidenceScore: number;
  reasoning: string;
  complexityFactors: string[];
  similarTasks: Array<{ id: string; title: string; points: number }>;
  coldStart: boolean;
  expiresAt: Date;
}

@Injectable()
export class EstimationService {
  private readonly logger = new Logger(EstimationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly agentsService: AgentsService,
  ) {}

  /**
   * Get estimate from Sage agent
   */
  async estimateTask(
    workspaceId: string,
    userId: string,
    dto: EstimateTaskDto,
  ): Promise<SageEstimate> {
    this.logger.log(
      `Estimating task: ${dto.title} (type: ${dto.type}, project: ${dto.projectId})`,
    );

    // Get similar tasks for historical context
    const similarTasks = await this.findSimilarTasks(
      workspaceId,
      dto.projectId,
      dto.type,
      `${dto.title} ${dto.description || ''}`.substring(0, 200),
      10,
    );

    // Calculate estimate using historical data or benchmarks
    const estimate = this.calculateEstimate(dto, similarTasks);

    return estimate;
  }

  /**
   * Calculate estimate using historical data or industry benchmarks
   */
  private calculateEstimate(
    dto: EstimateTaskDto,
    similarTasks: SimilarTask[],
  ): SageEstimate {
    let estimate: SageEstimate;

    if (similarTasks.length > 0) {
      // Use historical data
      const validTasks = similarTasks.filter(
        (t) => t.actualHours !== null && t.storyPoints !== null,
      );

      if (validTasks.length > 0) {
        const avgHours =
          validTasks.reduce((sum, t) => sum + (t.actualHours || 0), 0) /
          validTasks.length;
        const avgPoints =
          validTasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0) /
          validTasks.length;

        const confidence =
          validTasks.length >= 5 ? 'high' : ('medium' as const);
        const confidenceScore = Math.min(
          0.9,
          0.6 + validTasks.length * 0.05,
        );

        const complexityMultiplier = this.analyzeComplexity(
          dto.title,
          dto.description || '',
        );

        estimate = {
          storyPoints: Math.round(avgPoints * complexityMultiplier),
          estimatedHours: Math.round(avgHours * complexityMultiplier * 10) / 10,
          confidenceLevel: confidence,
          confidenceScore: Math.round(confidenceScore * 100) / 100,
          basis: `Based on ${validTasks.length} similar ${dto.type} tasks in this project (avg ${avgHours.toFixed(1)}h)`,
          coldStart: false,
          similarTasks: validTasks.map((t) => t.id),
          complexityFactors: this.getComplexityFactors(
            dto.title,
            dto.description || '',
          ),
        };
      } else {
        // Similar tasks found but no tracked time
        estimate = this.getIndustryBenchmarkEstimate(dto);
      }
    } else {
      // No historical data - use industry benchmarks
      estimate = this.getIndustryBenchmarkEstimate(dto);
    }

    return estimate;
  }

  /**
   * Get industry benchmark estimate for cold-start
   */
  private getIndustryBenchmarkEstimate(dto: EstimateTaskDto): SageEstimate {
    const benchmarks: Record<string, { hours: number; points: number }> = {
      EPIC: { hours: 80, points: 21 },
      STORY: { hours: 16, points: 5 },
      TASK: { hours: 8, points: 3 },
      SUBTASK: { hours: 4, points: 2 },
      BUG: { hours: 4, points: 2 },
      RESEARCH: { hours: 8, points: 3 },
      CONTENT: { hours: 4, points: 2 },
      AGENT_REVIEW: { hours: 2, points: 1 },
    };

    const benchmark = benchmarks[dto.type] || { hours: 8, points: 3 };

    const complexityMultiplier = this.analyzeComplexity(
      dto.title,
      dto.description || '',
    );

    return {
      storyPoints: Math.round(benchmark.points * complexityMultiplier),
      estimatedHours:
        Math.round(benchmark.hours * complexityMultiplier * 10) / 10,
      confidenceLevel: 'low',
      confidenceScore: 0.4,
      basis: `Based on industry benchmarks for ${dto.type} tasks (no historical data available)`,
      coldStart: true,
      complexityFactors: this.getComplexityFactors(
        dto.title,
        dto.description || '',
      ),
    };
  }

  /**
   * Analyze task complexity and return multiplier (0.5 to 2.0)
   */
  private analyzeComplexity(title: string, description: string): number {
    const text = `${title} ${description}`.toLowerCase();

    // Simple indicators (reduce estimate)
    const simpleKeywords = [
      'fix',
      'update',
      'minor',
      'quick',
      'simple',
      'small',
      'typo',
    ];
    const simpleCount = simpleKeywords.filter((kw) =>
      text.includes(kw),
    ).length;

    // Complex indicators (increase estimate)
    const complexKeywords = [
      'implement',
      'integrate',
      'migrate',
      'redesign',
      'complex',
      'architecture',
      'system',
      'end-to-end',
      'full',
      'complete',
      'refactor',
      'rewrite',
      'new',
      'multiple',
      'all',
    ];
    const complexCount = complexKeywords.filter((kw) =>
      text.includes(kw),
    ).length;

    // Calculate multiplier
    if (simpleCount > complexCount) {
      return 0.7; // Simpler than average
    } else if (complexCount > simpleCount) {
      return 1.5; // More complex than average
    } else {
      return 1.0; // Average complexity
    }
  }

  /**
   * Extract complexity factors for transparency
   */
  private getComplexityFactors(title: string, description: string): string[] {
    const text = `${title} ${description}`.toLowerCase();
    const factors: string[] = [];

    if (text.includes('integrate') || text.includes('integration')) {
      factors.push('Integration required');
    }
    if (text.includes('migrate') || text.includes('migration')) {
      factors.push('Data migration involved');
    }
    if (text.includes('architecture') || text.includes('architectural')) {
      factors.push('Architectural changes');
    }
    if (text.includes('multiple')) {
      factors.push('Multiple components affected');
    }
    if (text.includes('new')) {
      factors.push('New functionality (higher uncertainty)');
    }
    if (text.includes('fix') || text.includes('bug')) {
      factors.push('Bug fix (potentially simpler)');
    }
    if (text.includes('simple') || text.includes('minor')) {
      factors.push('Marked as simple/minor');
    }

    return factors.length > 0 ? factors : ['Standard complexity'];
  }

  /**
   * Find similar completed tasks for estimation reference
   */
  async findSimilarTasks(
    workspaceId: string,
    projectId: string,
    taskType: TaskType,
    query: string,
    limit: number = 10,
  ): Promise<SimilarTask[]> {
    // Use full-text search on task titles/descriptions
    const tasks = await this.prisma.task.findMany({
      where: {
        workspaceId,
        projectId,
        type: taskType,
        status: 'DONE',
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
        actualHours: { not: null },
      },
      select: {
        id: true,
        title: true,
        type: true,
        storyPoints: true,
        estimatedHours: true,
        actualHours: true,
      },
      take: limit,
      orderBy: { completedAt: 'desc' },
    });

    return tasks;
  }

  /**
   * Calculate team velocity
   */
  async calculateVelocity(
    workspaceId: string,
    projectId: string,
    _sprintCount: number = 3, // TODO: Use for sprint-based velocity calculation
  ): Promise<VelocityMetrics> {
    // For MVP, calculate based on completed tasks in time windows
    // Proper sprint support would come from PM-02 (Task Management)

    const completedTasks = await this.prisma.task.findMany({
      where: {
        workspaceId,
        projectId,
        status: 'DONE',
        completedAt: { not: null },
      },
      select: {
        storyPoints: true,
        actualHours: true,
        completedAt: true,
      },
      orderBy: { completedAt: 'desc' },
      take: 50, // Last 50 completed tasks
    });

    if (completedTasks.length === 0) {
      return {
        avgPointsPerSprint: null,
        avgHoursPerSprint: null,
        sprintCount: 0,
      };
    }

    const totalPoints = completedTasks.reduce(
      (sum, t) => sum + (t.storyPoints || 0),
      0,
    );
    const totalHours = completedTasks.reduce(
      (sum, t) => sum + (t.actualHours || 0),
      0,
    );

    // Simplified: assume 2-week sprints, calculate velocity
    const oldestTask = completedTasks[completedTasks.length - 1];
    const weeksOfData =
      oldestTask.completedAt
        ? Math.ceil(
            (new Date().getTime() - oldestTask.completedAt.getTime()) /
              (1000 * 60 * 60 * 24 * 7),
          )
        : 0;

    const sprintsCompleted = Math.max(1, Math.floor(weeksOfData / 2));

    return {
      avgPointsPerSprint: Math.round(totalPoints / sprintsCompleted),
      avgHoursPerSprint: Math.round(totalHours / sprintsCompleted),
      sprintCount: sprintsCompleted,
    };
  }

  /**
   * Get estimation accuracy metrics
   */
  async getEstimationMetrics(
    workspaceId: string,
    projectId: string,
    taskType?: TaskType,
  ): Promise<EstimationMetrics> {
    const where: any = {
      workspaceId,
      projectId,
      estimatedHours: { not: null },
      actualHours: { not: null },
    };

    if (taskType) {
      where.type = taskType;
    }

    const tasks = await this.prisma.task.findMany({
      where,
      select: {
        estimatedHours: true,
        actualHours: true,
      },
    });

    if (tasks.length === 0) {
      return {
        averageError: null,
        averageAccuracy: null,
        totalEstimations: 0,
      };
    }

    const errors = tasks.map((t) =>
      Math.abs((t.actualHours! - t.estimatedHours!) / t.estimatedHours!),
    );
    const avgError = errors.reduce((sum, e) => sum + e, 0) / errors.length;
    const avgAccuracy = 1 - avgError;

    return {
      averageError: Math.round(avgError * 100) / 100,
      averageAccuracy: Math.round(avgAccuracy * 100),
      totalEstimations: tasks.length,
    };
  }

  // ============================================
  // Story Point Suggestions (PM-04-6)
  // ============================================

  /**
   * Suggest story points for a task
   * Creates an AgentSuggestion that user can accept/reject
   */
  async suggestStoryPoints(
    taskId: string,
    workspaceId: string,
    userId: string,
  ): Promise<StoryPointSuggestion> {
    this.logger.log(`Generating story point suggestion for task ${taskId}`);

    // Get the task
    const task = await this.prisma.task.findFirst({
      where: { id: taskId, workspaceId },
      include: {
        phase: {
          include: { project: true },
        },
      },
    });

    if (!task) {
      throw new Error(`Task ${taskId} not found in workspace`);
    }

    // Generate estimate using existing logic
    const estimate = await this.estimateTask(workspaceId, userId, {
      title: task.title,
      description: task.description || undefined,
      type: task.type,
      projectId: task.phase.projectId,
    });

    // Map to Fibonacci story points
    const fibonacciPoints = this.mapToFibonacci(estimate.storyPoints);

    // Get similar tasks for reference
    const similarTasks = await this.findSimilarTasks(
      workspaceId,
      task.phase.projectId,
      task.type,
      task.title,
      5,
    );

    // Create suggestion record
    const suggestion = await this.prisma.agentSuggestion.create({
      data: {
        workspaceId,
        projectId: task.phase.projectId,
        userId,
        agentName: 'sage',
        suggestionType: 'UPDATE_TASK',
        status: 'PENDING',
        title: `Set story points to ${fibonacciPoints}`,
        description: `Sage suggests ${fibonacciPoints} story points for "${task.title}"`,
        reasoning: estimate.basis,
        confidence: estimate.confidenceScore,
        priority: estimate.confidenceLevel === 'high' ? 'high' : estimate.confidenceLevel === 'medium' ? 'medium' : 'low',
        actionPayload: {
          taskId,
          suggestedPoints: fibonacciPoints,
          estimatedHours: estimate.estimatedHours,
          complexityFactors: estimate.complexityFactors,
          coldStart: estimate.coldStart,
        },
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h expiry
      },
    });

    return {
      suggestionId: suggestion.id,
      taskId,
      suggestedPoints: fibonacciPoints,
      estimatedHours: estimate.estimatedHours,
      confidenceLevel: estimate.confidenceLevel,
      confidenceScore: estimate.confidenceScore,
      reasoning: estimate.basis,
      complexityFactors: estimate.complexityFactors,
      similarTasks: similarTasks.map(t => ({
        id: t.id,
        title: t.title,
        points: t.storyPoints || 0,
      })),
      coldStart: estimate.coldStart,
      expiresAt: suggestion.expiresAt!,
    };
  }

  /**
   * Accept a story point suggestion and apply to task
   */
  async acceptStoryPointSuggestion(
    suggestionId: string,
    workspaceId: string,
    overridePoints?: number,
  ): Promise<{ taskId: string; appliedPoints: number }> {
    const suggestion = await this.prisma.agentSuggestion.findFirst({
      where: { id: suggestionId, workspaceId, status: 'PENDING' },
    });

    if (!suggestion) {
      throw new Error('Suggestion not found or already processed');
    }

    const payload = suggestion.actionPayload as {
      taskId: string;
      suggestedPoints: number;
    };

    const pointsToApply = overridePoints ?? payload.suggestedPoints;

    // Update the task with story points
    await this.prisma.task.update({
      where: { id: payload.taskId },
      data: { storyPoints: pointsToApply },
    });

    // Mark suggestion as accepted
    await this.prisma.agentSuggestion.update({
      where: { id: suggestionId },
      data: {
        status: 'ACCEPTED',
        acceptedAt: new Date(),
      },
    });

    this.logger.log(
      `Accepted story point suggestion ${suggestionId}: applied ${pointsToApply} points to task ${payload.taskId}`,
    );

    return {
      taskId: payload.taskId,
      appliedPoints: pointsToApply,
    };
  }

  /**
   * Reject a story point suggestion
   */
  async rejectStoryPointSuggestion(
    suggestionId: string,
    workspaceId: string,
    reason?: string,
  ): Promise<void> {
    const suggestion = await this.prisma.agentSuggestion.findFirst({
      where: { id: suggestionId, workspaceId, status: 'PENDING' },
    });

    if (!suggestion) {
      throw new Error('Suggestion not found or already processed');
    }

    await this.prisma.agentSuggestion.update({
      where: { id: suggestionId },
      data: {
        status: 'REJECTED',
        rejectedAt: new Date(),
        reasoning: reason ? `${suggestion.reasoning}\n\nRejection reason: ${reason}` : suggestion.reasoning,
      },
    });

    this.logger.log(`Rejected story point suggestion ${suggestionId}`);
  }

  /**
   * Map any point value to nearest Fibonacci number
   */
  private mapToFibonacci(points: number): number {
    const fibonacci = [1, 2, 3, 5, 8, 13, 21];

    // Find nearest Fibonacci number
    let closest = fibonacci[0];
    let minDiff = Math.abs(points - closest);

    for (const fib of fibonacci) {
      const diff = Math.abs(points - fib);
      if (diff < minDiff) {
        minDiff = diff;
        closest = fib;
      }
    }

    return closest;
  }
}
