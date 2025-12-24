import { Injectable, BadRequestException, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { EventPublisherService, RedisProvider } from '../../events';
import axios from 'axios';
import { EventTypes } from '@hyvve/shared';
import { getNestedValue } from './utils/get-nested-value';

/**
 * Action Configuration Types
 */
interface ActionConfig {
  nodeId: string;
  [key: string]: any;
}

interface UpdateTaskConfig extends ActionConfig {
  updates: {
    status?: string;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    dueDate?: string; // ISO date or variable
    customFields?: Record<string, any>;
  };
}

interface AssignTaskConfig extends ActionConfig {
  assigneeId: string; // User ID or variable
  notifyAssignee?: boolean; // Default: true
}

interface SendNotificationConfig extends ActionConfig {
  recipients: string[]; // User IDs or variables
  title: string;
  message: string;
  type?: 'IN_APP' | 'EMAIL' | 'BOTH';
}

interface CreateTaskConfig extends ActionConfig {
  taskData: {
    title: string;
    description?: string;
    phaseId?: string;
    assigneeId?: string;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    dueDate?: string;
    parentTaskId?: string;
  };
  linkToTriggerTask?: boolean; // Default: true
}

interface MoveToPhaseConfig extends ActionConfig {
  phaseId: string; // Phase ID or variable
}

interface CallWebhookConfig extends ActionConfig {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  payload?: Record<string, any>;
  timeout?: number; // Default: 5000ms
}

/**
 * Execution Context
 */
interface ExecutionContext {
  workflowId: string;
  workspaceId: string; // Required for tenant isolation
  triggerType: string;
  triggerData: Record<string, any>;
  triggeredBy?: string;
  isDryRun?: boolean;
}

/**
 * Step Result
 */
interface StepResult {
  nodeId: string;
  type: 'action' | 'condition' | 'trigger';
  status: 'passed' | 'failed' | 'skipped';
  result?: any;
  error?: string;
  duration?: number;
}

/**
 * ActionExecutorService
 *
 * Executes workflow actions with configuration and context.
 * Supports 6 action types:
 * - UPDATE_TASK: Update task fields
 * - ASSIGN_TASK: Assign task to user
 * - SEND_NOTIFICATION: Send in-app notification
 * - CREATE_TASK: Create related task
 * - MOVE_TO_PHASE: Move task to different phase
 * - CALL_WEBHOOK: Call external webhook
 *
 * Story: PM-10.3 - Action Library
 */
/**
 * Whitelist of allowed variable paths for interpolation
 * This prevents access to sensitive data like API keys or internal state.
 */
const ALLOWED_VARIABLE_PATHS = [
  // Workflow context
  'workflowId',
  'workspaceId',
  'triggerType',
  'triggeredBy',
  // Trigger data - task fields
  'triggerData.taskId',
  'triggerData.title',
  'triggerData.description',
  'triggerData.status',
  'triggerData.priority',
  'triggerData.dueDate',
  'triggerData.phaseId',
  'triggerData.projectId',
  'triggerData.assigneeId',
  'triggerData.createdBy',
  'triggerData.taskNumber',
  'triggerData.type',
  'triggerData.parentId',
  // Trigger data - schedule fields
  'triggerData.scheduledAt',
  'triggerData.schedule',
  'triggerData.daysUntilDue',
  // Trigger data - custom fields (nested access allowed)
  'triggerData.customFields',
];

/**
 * Check if a path is allowed for variable interpolation
 */
function isPathAllowed(path: string): boolean {
  // Direct match
  if (ALLOWED_VARIABLE_PATHS.includes(path)) {
    return true;
  }

  // Check if path starts with an allowed prefix (for nested access like triggerData.customFields.myField)
  return ALLOWED_VARIABLE_PATHS.some(
    (allowed) => path.startsWith(`${allowed}.`) || path === allowed,
  );
}

@Injectable()
export class ActionExecutorService implements OnModuleInit {
  private readonly logger = new Logger(ActionExecutorService.name);
  // Rate limit keys for Redis (cluster-safe)
  private readonly WEBHOOK_RATE_LIMIT_PREFIX = 'workflow:ratelimit:webhook:';
  private readonly NOTIFICATION_RATE_LIMIT_PREFIX = 'workflow:ratelimit:notification:';

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly eventPublisher: EventPublisherService,
    private readonly redisProvider: RedisProvider,
  ) {}

  async onModuleInit() {
    this.logger.log('Action executor service initialized with Redis rate limiting');
  }

  /**
   * Execute a workflow action
   *
   * @param actionType - The type of action to execute
   * @param config - Action configuration
   * @param context - Execution context with trigger data
   * @returns Step result with status and result data
   */
  async executeAction(
    actionType: string,
    config: ActionConfig,
    context: ExecutionContext,
  ): Promise<StepResult> {
    const startTime = Date.now();

    try {
      // Skip actual execution in dry-run mode
      if (context.isDryRun) {
        return this.simulateAction(actionType, config, context);
      }

      // Execute action based on type
      const result = await this.executeActionInternal(actionType, config, context);

      return {
        nodeId: config.nodeId,
        type: 'action',
        status: 'passed',
        result,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      this.logger.error({
        message: 'Action execution failed',
        actionType,
        nodeId: config.nodeId,
        error: error instanceof Error ? error.message : String(error),
      });

      return {
        nodeId: config.nodeId,
        type: 'action',
        status: 'failed',
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Internal action execution dispatcher
   */
  private async executeActionInternal(
    actionType: string,
    config: ActionConfig,
    context: ExecutionContext,
  ): Promise<any> {
    switch (actionType) {
      case 'UPDATE_TASK':
        return await this.updateTask(config as UpdateTaskConfig, context);
      case 'ASSIGN_TASK':
        return await this.assignTask(config as AssignTaskConfig, context);
      case 'SEND_NOTIFICATION':
        return await this.sendNotification(config as SendNotificationConfig, context);
      case 'CREATE_TASK':
        return await this.createRelatedTask(config as CreateTaskConfig, context);
      case 'MOVE_TO_PHASE':
        return await this.moveToPhase(config as MoveToPhaseConfig, context);
      case 'CALL_WEBHOOK':
        return await this.callWebhook(config as CallWebhookConfig, context);
      default:
        throw new BadRequestException(`Unknown action type: ${actionType}`);
    }
  }

  /**
   * Simulate action in dry-run mode
   */
  private simulateAction(
    actionType: string,
    config: ActionConfig,
    context: ExecutionContext,
  ): StepResult {
    this.logger.log(
      `Simulating action ${actionType} for workflow ${context.workflowId} (dry-run mode)`,
    );

    return {
      nodeId: config.nodeId,
      type: 'action',
      status: 'passed',
      result: {
        simulated: true,
        action: actionType,
        config: this.interpolateVariables(config, context),
      },
    };
  }

  /**
   * UPDATE_TASK Action
   *
   * Updates task fields (status, priority, due date, custom fields)
   */
  private async updateTask(
    config: UpdateTaskConfig,
    context: ExecutionContext,
  ): Promise<any> {
    const taskId = context.triggerData.taskId;
    if (!taskId) {
      throw new BadRequestException('No taskId in trigger data');
    }

    // Interpolate variables in updates
    const updates = this.interpolateVariables(config.updates, context);

    this.logger.log(`Updating task ${taskId} with updates:`, updates);

    // Update task with tenant isolation - use updateMany with workspaceId filter
    const result = await this.prisma.task.updateMany({
      where: {
        id: taskId,
        workspaceId: context.workspaceId, // Tenant isolation
      },
      data: updates,
    });

    if (result.count === 0) {
      throw new BadRequestException('Task not found or access denied');
    }

    // Emit task updated event
    await this.eventPublisher.publish(
      EventTypes.PM_TASK_UPDATED,
      {
        taskId,
        updates,
        source: 'workflow',
      },
      {
        tenantId: context.workspaceId,
        userId: 'system',
      },
    );

    return { taskId, updates };
  }

  /**
   * ASSIGN_TASK Action
   *
   * Assigns task to a user or agent
   */
  private async assignTask(
    config: AssignTaskConfig,
    context: ExecutionContext,
  ): Promise<any> {
    const taskId = context.triggerData.taskId;
    if (!taskId) {
      throw new BadRequestException('No taskId in trigger data');
    }

    const assigneeId = this.interpolateVariable(config.assigneeId, context);

    this.logger.log(`Assigning task ${taskId} to user ${assigneeId}`);

    // Get task title for notification (with tenant isolation)
    const task = await this.prisma.task.findFirst({
      where: {
        id: taskId,
        workspaceId: context.workspaceId, // Tenant isolation
      },
      select: { id: true, title: true },
    });

    if (!task) {
      throw new BadRequestException('Task not found or access denied');
    }

    // Update task assignee with tenant isolation
    await this.prisma.task.updateMany({
      where: {
        id: taskId,
        workspaceId: context.workspaceId, // Tenant isolation
      },
      data: { assigneeId },
    });

    // Send notification if enabled
    if (config.notifyAssignee !== false) {
      await this.notifications.createNotification({
        userId: assigneeId,
        workspaceId: context.workspaceId,
        type: 'TASK_ASSIGNED',
        title: 'Task Assigned',
        message: `You have been assigned to task: ${task.title}`,
        data: { taskId: task.id },
      });
    }

    // Emit task assigned event
    await this.eventPublisher.publish(
      EventTypes.PM_TASK_ASSIGNED,
      {
        taskId: task.id,
        assigneeId,
      },
      {
        tenantId: context.workspaceId,
        userId: 'system',
      },
    );

    return { taskId: task.id, assigneeId };
  }

  /**
   * SEND_NOTIFICATION Action
   *
   * Sends in-app or email notification to specified recipients
   */
  private async sendNotification(
    config: SendNotificationConfig,
    context: ExecutionContext,
  ): Promise<any> {
    const workflowId = context.workflowId;

    // Rate limiting: Max 50 notifications per hour per workflow
    await this.checkNotificationRateLimit(workflowId);

    // Use workspaceId from context (tenant isolation)
    const workspaceId = context.workspaceId;

    // Interpolate recipients and message
    const recipients = config.recipients.map((r) =>
      this.interpolateVariable(r, context),
    );
    const title = this.interpolateVariable(config.title, context);
    const message = this.interpolateVariable(config.message, context);

    this.logger.log(
      `Sending notification to ${recipients.length} recipient(s): ${title}`,
    );

    // Send notifications
    await Promise.all(
      recipients.map((recipientId) =>
        this.notifications.createNotification({
          userId: recipientId,
          workspaceId,
          type: 'WORKFLOW_NOTIFICATION',
          title,
          message,
          data: {
            workflowId,
            triggerType: context.triggerType,
          },
        }),
      ),
    );

    return {
      recipientCount: recipients.length,
      recipients,
      title,
    };
  }

  /**
   * CREATE_TASK Action
   *
   * Creates a new task related to the trigger task
   */
  private async createRelatedTask(
    config: CreateTaskConfig,
    context: ExecutionContext,
  ): Promise<any> {
    const taskId = context.triggerData.taskId;
    if (!taskId) {
      throw new BadRequestException('No taskId in trigger data for CREATE_TASK action');
    }

    // Fetch task with tenant isolation
    const task = await this.prisma.task.findFirst({
      where: {
        id: taskId,
        workspaceId: context.workspaceId, // Tenant isolation
      },
    });

    if (!task) {
      throw new BadRequestException('Trigger task not found or access denied');
    }

    // Interpolate task data
    const taskData = this.interpolateVariables(config.taskData, context);

    this.logger.log(
      `Creating related task: ${taskData.title} (parent: ${task.id})`,
    );

    // Use transaction to prevent task number race condition
    const newTask = await this.prisma.$transaction(async (tx) => {
      // Get next task number for project with tenant isolation (within transaction)
      const lastTask = await tx.task.findFirst({
        where: {
          projectId: task.projectId,
          workspaceId: context.workspaceId, // Tenant isolation
        },
        orderBy: { taskNumber: 'desc' },
        select: { taskNumber: true },
      });
      const taskNumber = (lastTask?.taskNumber || 0) + 1;

      // Create new task (within transaction)
      return tx.task.create({
        data: {
          title: taskData.title,
          description: taskData.description,
          phaseId: taskData.phaseId || task.phaseId,
          assigneeId: taskData.assigneeId,
          priority: taskData.priority || 'MEDIUM',
          dueDate: taskData.dueDate ? new Date(taskData.dueDate) : null,
          projectId: task.projectId,
          workspaceId: context.workspaceId, // Use context workspaceId
          createdBy: task.createdBy,
          parentId: config.linkToTriggerTask !== false ? task.id : taskData.parentTaskId,
          taskNumber,
        },
      });
    });

    // Emit task created event
    await this.eventPublisher.publish(
      EventTypes.PM_TASK_CREATED,
      {
        taskId: newTask.id,
        source: 'workflow',
      },
      {
        tenantId: context.workspaceId,
        userId: 'system',
      },
    );

    return { taskId: newTask.id, parentTaskId: task.id };
  }

  /**
   * MOVE_TO_PHASE Action
   *
   * Moves task to a different phase
   */
  private async moveToPhase(
    config: MoveToPhaseConfig,
    context: ExecutionContext,
  ): Promise<any> {
    const taskId = context.triggerData.taskId;
    if (!taskId) {
      throw new BadRequestException('No taskId in trigger data');
    }

    const phaseId = this.interpolateVariable(config.phaseId, context);

    // Get current task to capture old phase (with tenant isolation)
    const currentTask = await this.prisma.task.findFirst({
      where: {
        id: taskId,
        workspaceId: context.workspaceId, // Tenant isolation
      },
      select: { id: true, phaseId: true },
    });

    if (!currentTask) {
      throw new BadRequestException('Task not found or access denied');
    }

    // Validate phase exists in the same workspace
    const phase = await this.prisma.phase.findFirst({
      where: {
        id: phaseId,
        project: {
          workspaceId: context.workspaceId, // Tenant isolation via project
        },
      },
    });
    if (!phase) {
      throw new BadRequestException(`Phase not found or access denied: ${phaseId}`);
    }

    this.logger.log(
      `Moving task ${taskId} to phase ${phaseId} (${phase.name})`,
    );

    // Update task phase with tenant isolation
    await this.prisma.task.updateMany({
      where: {
        id: taskId,
        workspaceId: context.workspaceId, // Tenant isolation
      },
      data: { phaseId },
    });

    // Emit phase changed event
    await this.eventPublisher.publish(
      'pm.task.phase_changed' as any,
      {
        taskId: currentTask.id,
        oldPhaseId: currentTask.phaseId,
        newPhaseId: phaseId,
      },
      {
        tenantId: context.workspaceId,
        userId: 'system',
      },
    );

    return { taskId: currentTask.id, phaseId };
  }

  /**
   * CALL_WEBHOOK Action
   *
   * Makes HTTP request to external webhook endpoint
   */
  private async callWebhook(
    config: CallWebhookConfig,
    context: ExecutionContext,
  ): Promise<any> {
    const workflowId = context.workflowId;

    // Rate limiting: Max 10 webhook calls per minute per workflow
    await this.checkWebhookRateLimit(workflowId);

    // Validate URL (no internal IPs)
    this.validateWebhookUrl(config.url);

    // Validate and constrain timeout (1s-30s)
    const MIN_TIMEOUT = 1000;
    const MAX_TIMEOUT = 30000;
    const DEFAULT_TIMEOUT = 5000;

    let timeout = config.timeout ?? DEFAULT_TIMEOUT;
    if (timeout < MIN_TIMEOUT) {
      this.logger.warn(`Webhook timeout ${timeout}ms is below minimum, using ${MIN_TIMEOUT}ms`);
      timeout = MIN_TIMEOUT;
    } else if (timeout > MAX_TIMEOUT) {
      this.logger.warn(`Webhook timeout ${timeout}ms exceeds maximum, using ${MAX_TIMEOUT}ms`);
      timeout = MAX_TIMEOUT;
    }

    // Interpolate payload and headers
    const payload = this.interpolateVariables(config.payload || {}, context);
    const headers = this.interpolateVariables(config.headers || {}, context);

    this.logger.log(
      `Calling webhook: ${config.method} ${config.url}`,
    );

    try {
      const response = await axios({
        method: config.method,
        url: config.url,
        data: payload,
        headers,
        timeout,
      });

      return {
        status: response.status,
        statusText: response.statusText,
        data: response.data,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        // Sanitize error message to prevent information leakage
        // Only include HTTP status codes, not response body or internal paths
        const status = error.response?.status;
        const statusText = error.response?.statusText;

        let sanitizedMessage: string;
        if (status) {
          sanitizedMessage = `Webhook call failed with status ${status}`;
          if (statusText) {
            sanitizedMessage += ` (${statusText})`;
          }
        } else if (error.code === 'ECONNABORTED') {
          sanitizedMessage = 'Webhook call timed out';
        } else if (error.code === 'ENOTFOUND' || error.code === 'EAI_AGAIN') {
          sanitizedMessage = 'Webhook endpoint not reachable';
        } else if (error.code === 'ECONNREFUSED') {
          sanitizedMessage = 'Webhook connection refused';
        } else {
          sanitizedMessage = 'Webhook call failed due to network error';
        }

        // Log detailed error for debugging (server-side only)
        this.logger.error({
          message: 'Webhook call failed',
          url: config.url,
          method: config.method,
          error: error.message,
          code: error.code,
          status,
        });

        throw new BadRequestException(sanitizedMessage);
      }
      throw error;
    }
  }

  /**
   * Check webhook rate limit using Redis (cluster-safe)
   *
   * Max 10 calls per minute per workflow
   */
  private async checkWebhookRateLimit(workflowId: string): Promise<void> {
    const key = `${this.WEBHOOK_RATE_LIMIT_PREFIX}${workflowId}`;
    const redis = this.redisProvider.getClient();
    const windowMs = 60 * 1000; // 1 minute
    const limit = 10;

    // Use INCR with EXPIRE for atomic rate limiting
    const current = await redis.incr(key);

    // Set expiry only on first increment (key just created)
    if (current === 1) {
      await redis.pexpire(key, windowMs);
    }

    if (current > limit) {
      throw new BadRequestException(
        'Webhook rate limit exceeded (10 calls per minute per workflow)',
      );
    }
  }

  /**
   * Check notification rate limit using Redis (cluster-safe)
   *
   * Max 50 notifications per hour per workflow
   */
  private async checkNotificationRateLimit(workflowId: string): Promise<void> {
    const key = `${this.NOTIFICATION_RATE_LIMIT_PREFIX}${workflowId}`;
    const redis = this.redisProvider.getClient();
    const windowMs = 60 * 60 * 1000; // 1 hour
    const limit = 50;

    // Use INCR with EXPIRE for atomic rate limiting
    const current = await redis.incr(key);

    // Set expiry only on first increment (key just created)
    if (current === 1) {
      await redis.pexpire(key, windowMs);
    }

    if (current > limit) {
      throw new BadRequestException(
        'Notification rate limit exceeded (50 per hour per workflow)',
      );
    }
  }

  /**
   * Validate webhook URL
   *
   * Block internal IPs to prevent SSRF attacks
   */
  private validateWebhookUrl(url: string): void {
    const parsedUrl = new URL(url);

    // Block internal IPs
    const hostname = parsedUrl.hostname;
    const blockedPatterns = [
      /^localhost$/i,
      /^127\.\d+\.\d+\.\d+$/,
      /^192\.168\.\d+\.\d+$/,
      /^10\.\d+\.\d+\.\d+$/,
      /^172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+$/,
      /^169\.254\.\d+\.\d+$/, // Link-local addresses (AWS/cloud metadata)
      /^100\.(6[4-9]|[7-9]\d|1[0-1]\d|12[0-7])\.\d+\.\d+$/, // Carrier-grade NAT
      /^\[::1\]$/,
      /^\[fe80:/i, // IPv6 link-local
    ];

    if (blockedPatterns.some((pattern) => pattern.test(hostname))) {
      throw new BadRequestException('Internal URLs are not allowed for webhooks');
    }
  }

  /**
   * Sanitize string to prevent XSS attacks
   *
   * Escapes HTML special characters in interpolated values.
   */
  private sanitizeString(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  }

  /**
   * Interpolate a single variable
   *
   * Supports {{variable.path}} syntax with XSS protection.
   * Only allows access to whitelisted paths for security.
   */
  private interpolateVariable(value: any, context: ExecutionContext): any {
    if (typeof value !== 'string') return value;

    // Match {{variable.path}} pattern
    const regex = /\{\{([^}]+)\}\}/g;
    return value.replace(regex, (match, path) => {
      const trimmedPath = path.trim();

      // Validate path against whitelist to prevent access to sensitive data
      if (!isPathAllowed(trimmedPath)) {
        this.logger.warn(`Blocked access to non-whitelisted variable path: ${trimmedPath}`);
        return match; // Keep original placeholder if path not allowed
      }

      // Use getNestedValue for safe nested property access
      const result = getNestedValue(context as unknown as Record<string, unknown>, trimmedPath);

      if (result === undefined) {
        return match; // Keep original if not found
      }

      // Sanitize to prevent XSS
      return this.sanitizeString(String(result));
    });
  }

  /**
   * Interpolate variables in objects/arrays recursively
   */
  private interpolateVariables(obj: any, context: ExecutionContext): any {
    if (typeof obj === 'string') {
      return this.interpolateVariable(obj, context);
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.interpolateVariables(item, context));
    }

    if (typeof obj === 'object' && obj !== null) {
      const result: any = {};
      for (const [key, value] of Object.entries(obj)) {
        result[key] = this.interpolateVariables(value, context);
      }
      return result;
    }

    return obj;
  }
}
