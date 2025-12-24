import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue, Worker } from 'bullmq';
import { PrismaService } from '../../common/services/prisma.service';
import { WorkflowExecutorService } from './workflow-executor.service';
import { CronExpressionParser } from 'cron-parser';

interface TriggerConfig {
  schedule?: string;
  daysBeforeDue?: number;
}

/**
 * WorkflowSchedulerService
 *
 * Manages scheduled workflow execution using BullMQ.
 * Handles:
 * - DUE_DATE_APPROACHING triggers (daily check)
 * - CUSTOM_SCHEDULE triggers (cron expressions)
 *
 * Story: PM-10.2 - Trigger Conditions
 */
@Injectable()
export class WorkflowSchedulerService implements OnModuleInit {
  private readonly logger = new Logger(WorkflowSchedulerService.name);
  private worker: Worker | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly executor: WorkflowExecutorService,
    @InjectQueue('workflow-scheduler') private schedulerQueue: Queue,
  ) {}

  async onModuleInit() {
    this.logger.log('Workflow scheduler service initializing...');

    try {
      await this.setupScheduledJobs();
      this.setupWorker();

      this.logger.log('Workflow scheduler service initialized');
    } catch (error) {
      this.logger.error('Failed to initialize workflow scheduler service', error);
      throw error;
    }
  }

  /**
   * Setup scheduled jobs for workflow triggers
   */
  private async setupScheduledJobs() {
    // Due Date Approaching: Check daily at 8am UTC
    await this.schedulerQueue.add(
      'check-due-date-approaching',
      {},
      {
        repeat: {
          pattern: '0 8 * * *', // Daily at 8am
        },
        jobId: 'due-date-approaching-daily',
      },
    );

    // Custom Schedule: Check every minute for workflows that need to run
    // Each workflow will be evaluated against its cron schedule
    await this.schedulerQueue.add(
      'check-custom-schedules',
      {},
      {
        repeat: {
          pattern: '* * * * *', // Every minute
        },
        jobId: 'custom-schedules-check',
      },
    );

    this.logger.log('Scheduled jobs registered');
  }

  /**
   * Setup BullMQ worker to process scheduled jobs
   */
  private setupWorker() {
    this.worker = new Worker(
      'workflow-scheduler',
      async (job) => {
        this.logger.debug(`Processing job: ${job.name}`);

        try {
          if (job.name === 'check-due-date-approaching') {
            await this.checkDueDateApproaching();
          } else if (job.name === 'check-custom-schedules') {
            await this.checkCustomSchedules();
          }
        } catch (error) {
          this.logger.error({
            message: 'Scheduled job failed',
            jobName: job.name,
            error: error instanceof Error ? error.message : String(error),
          });
          throw error; // Re-throw to mark job as failed
        }
      },
      {
        connection: {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379', 10),
        },
      },
    );

    this.worker.on('completed', (job) => {
      this.logger.debug(`Job ${job.name} completed`);
    });

    this.worker.on('failed', (job, err) => {
      this.logger.error({
        message: `Job ${job?.name} failed`,
        error: err.message,
      });
    });

    this.logger.log('Worker registered for workflow-scheduler queue');
  }

  /**
   * Check for tasks with approaching due dates
   * Runs daily at 8am UTC
   */
  private async checkDueDateApproaching(): Promise<void> {
    this.logger.log('Checking for due date approaching workflows...');

    // Find all active DUE_DATE_APPROACHING workflows
    // Note: We query across all workspaces but filter tasks by workspace in the loop below
    const workflows = await this.prisma.workflow.findMany({
      where: {
        enabled: true,
        triggerType: 'DUE_DATE_APPROACHING',
      },
      include: {
        project: {
          select: {
            workspaceId: true,
          },
        },
      },
    });

    this.logger.log(`Found ${workflows.length} DUE_DATE_APPROACHING workflow(s)`);

    for (const workflow of workflows) {
      try {
        const config = workflow.triggerConfig as TriggerConfig;
        const daysAhead = config.daysBeforeDue || 1;

        // Calculate target date range
        const now = new Date();
        const targetDate = new Date(now);
        targetDate.setDate(targetDate.getDate() + daysAhead);

        // Set to end of target day
        const targetDateEnd = new Date(targetDate);
        targetDateEnd.setHours(23, 59, 59, 999);

        this.logger.debug(
          `Checking workflow ${workflow.id} for tasks due within ${daysAhead} day(s)`,
        );

        // Find tasks due soon in this workflow's project
        // Include workspaceId for proper tenant isolation
        const tasks = await this.prisma.task.findMany({
          where: {
            workspaceId: workflow.project.workspaceId,
            projectId: workflow.projectId,
            dueDate: {
              gte: now,
              lte: targetDateEnd,
            },
            status: {
              not: 'DONE',
            },
          },
        });

        this.logger.debug(
          `Found ${tasks.length} task(s) due within ${daysAhead} day(s) for workflow ${workflow.id}`,
        );

        // Execute workflow for each matching task
        for (const task of tasks) {
          try {
            await this.executor.executeWorkflow(workflow.id, {
              triggerType: 'DUE_DATE_APPROACHING',
              triggerData: {
                taskId: task.id,
                dueDate: task.dueDate,
                daysUntilDue: Math.ceil(
                  (task.dueDate!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
                ),
              },
            });
          } catch (error) {
            this.logger.error({
              message: 'Failed to execute DUE_DATE_APPROACHING workflow',
              workflowId: workflow.id,
              taskId: task.id,
              error: error instanceof Error ? error.message : String(error),
            });
            // Continue with other tasks
          }
        }
      } catch (error) {
        this.logger.error({
          message: 'Error processing DUE_DATE_APPROACHING workflow',
          workflowId: workflow.id,
          error: error instanceof Error ? error.message : String(error),
        });
        // Continue with other workflows
      }
    }

    this.logger.log('Finished checking due date approaching workflows');
  }

  /**
   * Check for custom schedule workflows that need to run
   * Runs every minute
   */
  private async checkCustomSchedules(): Promise<void> {
    this.logger.debug('Checking for custom schedule workflows...');

    // Find all active CUSTOM_SCHEDULE workflows
    // Note: We query across all workspaces - each workflow has its own workspace context
    const workflows = await this.prisma.workflow.findMany({
      where: {
        enabled: true,
        triggerType: 'CUSTOM_SCHEDULE',
      },
      include: {
        project: {
          select: {
            workspaceId: true,
          },
        },
      },
    });

    if (workflows.length === 0) {
      this.logger.debug('No active CUSTOM_SCHEDULE workflows found');
      return;
    }

    this.logger.debug(`Found ${workflows.length} CUSTOM_SCHEDULE workflow(s)`);

    const now = new Date();

    for (const workflow of workflows) {
      try {
        const config = workflow.triggerConfig as TriggerConfig;
        const cronExpression = config.schedule;

        if (!cronExpression) {
          this.logger.warn(
            `Workflow ${workflow.id} has CUSTOM_SCHEDULE trigger but no schedule configured`,
          );
          continue;
        }

        // Check if the workflow should run now
        if (this.shouldRunNow(cronExpression, now, workflow.lastExecutedAt)) {
          this.logger.log(
            `Executing CUSTOM_SCHEDULE workflow ${workflow.id} (${workflow.name})`,
          );

          await this.executor.executeWorkflow(workflow.id, {
            triggerType: 'CUSTOM_SCHEDULE',
            triggerData: {
              scheduledAt: now.toISOString(),
              schedule: cronExpression,
            },
          });
        }
      } catch (error) {
        this.logger.error({
          message: 'Error processing CUSTOM_SCHEDULE workflow',
          workflowId: workflow.id,
          error: error instanceof Error ? error.message : String(error),
        });
        // Continue with other workflows
      }
    }

    this.logger.debug('Finished checking custom schedule workflows');
  }

  /**
   * Check if a cron schedule should run now
   *
   * @param cronExpression - Cron expression to evaluate
   * @param now - Current time
   * @param lastExecutedAt - Last execution time (to prevent duplicate runs)
   * @returns True if the schedule should run now
   */
  private shouldRunNow(
    cronExpression: string,
    now: Date,
    lastExecutedAt: Date | null,
  ): boolean {
    try {
      // Parse cron expression
      const interval = CronExpressionParser.parse(cronExpression, {
        currentDate: now,
      });

      // Get the previous occurrence time
      const prevOccurrence = interval.prev().toDate();

      // If never executed, check if previous occurrence was within last minute
      if (!lastExecutedAt) {
        const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
        return prevOccurrence >= oneMinuteAgo;
      }

      // If executed before, check if previous occurrence is after last execution
      // This prevents duplicate runs within the same minute
      return prevOccurrence > lastExecutedAt;
    } catch (error) {
      this.logger.error({
        message: 'Invalid cron expression',
        cronExpression,
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  /**
   * Validate a cron expression
   *
   * @param cronExpression - Cron expression to validate
   * @returns True if valid, false otherwise
   */
  validateCronExpression(cronExpression: string): boolean {
    try {
      CronExpressionParser.parse(cronExpression);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get next run times for a cron expression
   *
   * @param cronExpression - Cron expression
   * @param count - Number of next run times to return
   * @returns Array of next run times
   */
  getNextRunTimes(cronExpression: string, count: number = 5): Date[] {
    try {
      const interval = CronExpressionParser.parse(cronExpression);
      const times: Date[] = [];

      for (let i = 0; i < count; i++) {
        times.push(interval.next().toDate());
      }

      return times;
    } catch (error) {
      this.logger.error({
        message: 'Failed to get next run times',
        cronExpression,
        error: error instanceof Error ? error.message : String(error),
      });
      return [];
    }
  }

  /**
   * Cleanup on module destroy
   */
  async onModuleDestroy() {
    if (this.worker) {
      await this.worker.close();
      this.logger.log('Workflow scheduler worker stopped');
    }
  }
}
