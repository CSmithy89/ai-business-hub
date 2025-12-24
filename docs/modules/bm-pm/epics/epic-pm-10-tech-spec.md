# Epic PM-10: Workflow Builder - Technical Specification

**Epic:** PM-10 - Workflow Builder
**Module:** Core-PM (bm-pm)
**FRs Covered:** Custom Workflows and Automations
**Stories:** 5 (PM-10.1 to PM-10.5)
**Created:** 2025-12-24
**Status:** Technical Context

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Architecture Overview](#architecture-overview)
3. [Data Model Changes](#data-model-changes)
4. [API Design](#api-design)
5. [Frontend Components](#frontend-components)
6. [Event Bus Integration](#event-bus-integration)
7. [Workflow Execution Engine](#workflow-execution-engine)
8. [Story Breakdown with Technical Notes](#story-breakdown-with-technical-notes)
9. [Security & Compliance](#security--compliance)
10. [Testing Strategy](#testing-strategy)
11. [Risks & Mitigations](#risks--mitigations)

---

## Executive Summary

Epic PM-10 introduces a visual workflow builder enabling users to create custom automations for their projects. Users can design workflows with triggers (task events, schedules), conditions (filters), and actions (update task, assign, notify, create, webhook), test them in dry-run mode, and manage active workflows with execution logs.

**Key Outcomes:**
- Node-based visual workflow editor (React Flow)
- Event-driven triggers (task created, status changed, assigned, due date approaching, schedules)
- Action library (update task field, assign task, send notification, create related task, move to phase, call webhook)
- Dry-run testing with simulated execution
- Workflow management UI (list, pause/activate, execution logs)
- JSON workflow definition storage
- Rate limiting for webhook actions

**Technical Approach:**
- Frontend: React Flow for node-based canvas
- Backend: NestJS workflow execution service
- Storage: Workflow definitions as JSON in PostgreSQL
- Execution: Event-driven via Redis Streams + cron jobs for scheduled workflows
- Agent integration: Workflows can trigger agent actions (approval-gated)

---

## Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Workflow Builder (PM-10)                            │
├─────────────────────────────────────────────────────────────────────────────┤
│ Frontend (Next.js)                                                          │
│  • Workflow Canvas (React Flow)                                            │
│  • Node Palette (Triggers, Conditions, Actions)                            │
│  • Workflow Testing UI (dry-run simulation)                                │
│  • Workflow Management List                                                │
│  • Execution Log Viewer                                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│ Backend (NestJS)                                                            │
│  • pm/workflows module (CRUD APIs)                                         │
│  • pm/workflow-executions module (execution + logs)                        │
│  • Workflow execution engine (event listeners + scheduler)                 │
│  • Dry-run simulator (sandboxed execution)                                 │
│  • Webhook action executor (rate-limited)                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│ Event Bus (Redis Streams)                                                   │
│  • Listen to pm.task.* events for workflow triggers                        │
│  • Emit pm.workflow.* events for execution tracking                        │
├─────────────────────────────────────────────────────────────────────────────┤
│ Queue (BullMQ)                                                              │
│  • Scheduled workflow execution jobs                                       │
│  • Webhook action jobs (rate-limited)                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│ Data Layer (Prisma + PostgreSQL)                                           │
│  • Workflow (definition, triggers, status)                                 │
│  • WorkflowStep (nodes in workflow graph)                                  │
│  • WorkflowExecution (execution logs + results)                            │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Workflow Execution Flow

```
Event Trigger (task.created)
  ↓
Event Bus Listener
  ↓
Match Active Workflows
  ↓
Evaluate Trigger Conditions
  ↓
Execute Workflow Steps (sequentially)
  ↓
  • Condition Node → evaluate filter
  • Action Node → execute action
  • Agent Node → submit approval request
  ↓
Log Execution Results
  ↓
Emit pm.workflow.completed event
```

### Dry-Run Flow

```
User clicks "Test Workflow"
  ↓
Select sample task
  ↓
POST /pm/workflows/:id/test { taskId, dryRun: true }
  ↓
Sandboxed Execution Engine
  ↓
  • Simulate trigger evaluation
  • Simulate condition checks
  • Log what would happen (NO actual changes)
  ↓
Return execution trace JSON
  ↓
Frontend visualizes execution path
```

---

## Data Model Changes

### New Models

```prisma
/// Workflow - Custom automation workflow definition
model Workflow {
  id          String @id @default(cuid())
  workspaceId String @map("workspace_id")
  projectId   String @map("project_id")

  // Metadata
  name        String
  description String? @db.Text

  // Workflow Definition (JSON)
  // Structure: { nodes: [], edges: [], triggers: [], variables: {} }
  definition  Json

  // Trigger Configuration
  // Multiple triggers can activate the same workflow
  triggerType WorkflowTriggerType @map("trigger_type")
  triggerConfig Json @map("trigger_config") // Event filters, schedule cron

  // Status
  status      WorkflowStatus @default(DRAFT)
  enabled     Boolean @default(false)

  // Execution Statistics
  executionCount Int @default(0) @map("execution_count")
  lastExecutedAt DateTime? @map("last_executed_at")
  errorCount     Int @default(0) @map("error_count")

  // Timestamps
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
  createdBy   String @map("created_by")

  // Relations
  project     Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
  executions  WorkflowExecution[]

  @@index([workspaceId])
  @@index([projectId])
  @@index([status])
  @@index([enabled, triggerType]) // For active workflow queries
  @@index([projectId, enabled]) // Per-project active workflows
  @@map("workflows")
}

/// WorkflowExecution - Execution log for workflow runs
model WorkflowExecution {
  id         String @id @default(cuid())
  workflowId String @map("workflow_id")

  // Execution Context
  triggerType  WorkflowTriggerType @map("trigger_type")
  triggeredBy  String? @map("triggered_by") // Event ID or user ID
  triggerData  Json @map("trigger_data") // Event payload or manual trigger data

  // Execution Details
  status       WorkflowExecutionStatus @default(RUNNING)
  startedAt    DateTime @default(now()) @map("started_at")
  completedAt  DateTime? @map("completed_at")

  // Results
  stepsExecuted Int @default(0) @map("steps_executed")
  stepsPassed   Int @default(0) @map("steps_passed")
  stepsFailed   Int @default(0) @map("steps_failed")

  // Execution Trace (for debugging)
  executionTrace Json? @map("execution_trace") // Step-by-step log
  errorMessage   String? @map("error_message") @db.Text

  // Dry-Run Flag
  isDryRun     Boolean @default(false) @map("is_dry_run")

  // Relations
  workflow     Workflow @relation(fields: [workflowId], references: [id], onDelete: Cascade)

  @@index([workflowId])
  @@index([status])
  @@index([startedAt])
  @@index([workflowId, startedAt]) // Execution history queries
  @@map("workflow_executions")
}

// Workflow Enums
enum WorkflowTriggerType {
  TASK_CREATED
  TASK_STATUS_CHANGED
  TASK_ASSIGNED
  DUE_DATE_APPROACHING
  TASK_COMPLETED
  CUSTOM_SCHEDULE
  MANUAL
}

enum WorkflowStatus {
  DRAFT
  ACTIVE
  PAUSED
  ARCHIVED
}

enum WorkflowExecutionStatus {
  QUEUED
  RUNNING
  COMPLETED
  FAILED
  CANCELLED
}
```

### Existing Model Changes

**Project:**
- Add relation: `workflows: Workflow[]`

**Task:**
- No direct changes (workflows interact via events)

---

## API Design

### Workflow CRUD

```typescript
// List workflows for a project
GET /pm/workflows?projectId={projectId}&status={status}
Response: { workflows: Workflow[] }

// Get workflow details
GET /pm/workflows/:id
Response: Workflow

// Create workflow
POST /pm/workflows
Body: {
  projectId: string;
  name: string;
  description?: string;
  definition: WorkflowDefinition;
  triggerType: WorkflowTriggerType;
  triggerConfig: TriggerConfig;
}
Response: Workflow

// Update workflow
PUT /pm/workflows/:id
Body: Partial<Workflow>
Response: Workflow

// Delete workflow (soft delete)
DELETE /pm/workflows/:id
Response: { success: boolean }

// Activate workflow
POST /pm/workflows/:id/activate
Response: Workflow

// Pause workflow
POST /pm/workflows/:id/pause
Response: Workflow
```

### Workflow Testing

```typescript
// Test workflow (dry-run)
POST /pm/workflows/:id/test
Body: {
  taskId: string; // Sample task to test against
  overrides?: Record<string, any>; // Override trigger data
}
Response: {
  executionId: string;
  trace: ExecutionTrace;
  summary: {
    stepsExecuted: number;
    stepsPassed: number;
    stepsFailed: number;
  };
}

// Get execution trace details
GET /pm/workflows/:id/executions/:executionId
Response: WorkflowExecution
```

### Workflow Execution Management

```typescript
// List executions for a workflow
GET /pm/workflows/:id/executions?limit={limit}&offset={offset}
Response: {
  executions: WorkflowExecution[];
  total: number;
}

// Get execution logs
GET /pm/workflow-executions/:id/logs
Response: {
  executionId: string;
  trace: ExecutionTrace;
  logs: LogEntry[];
}

// Cancel running execution
POST /pm/workflow-executions/:id/cancel
Response: { success: boolean }
```

### Internal Execution API

```typescript
// Trigger workflow execution (internal use)
POST /internal/pm/workflows/:id/execute
Headers: { X-Internal-Token: string }
Body: {
  triggerType: WorkflowTriggerType;
  triggerData: Record<string, any>;
  isDryRun?: boolean;
}
Response: { executionId: string }
```

---

## Frontend Components

### Workflow Canvas (React Flow)

**Component:** `WorkflowCanvas.tsx`

```typescript
import ReactFlow, { Node, Edge, NodeTypes } from 'reactflow';

interface WorkflowCanvasProps {
  workflowId?: string;
  definition: WorkflowDefinition;
  onSave: (definition: WorkflowDefinition) => void;
  readOnly?: boolean;
}

// Custom Node Types
const nodeTypes: NodeTypes = {
  trigger: TriggerNode,
  condition: ConditionNode,
  action: ActionNode,
  agent: AgentNode,
};

export function WorkflowCanvas({ definition, onSave }: WorkflowCanvasProps) {
  const [nodes, setNodes] = useState<Node[]>(definition.nodes);
  const [edges, setEdges] = useState<Edge[]>(definition.edges);

  // Handle node/edge changes
  const onNodesChange = useCallback((changes) => {
    setNodes((nds) => applyNodeChanges(changes, nds));
  }, []);

  const onEdgesChange = useCallback((changes) => {
    setEdges((eds) => applyEdgeChanges(changes, eds));
  }, []);

  const onConnect = useCallback((connection) => {
    setEdges((eds) => addEdge(connection, eds));
  }, []);

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
}
```

### Node Palette

**Component:** `NodePalette.tsx`

```typescript
interface NodePaletteProps {
  onAddNode: (nodeType: string, data: NodeData) => void;
}

export function NodePalette({ onAddNode }: NodePaletteProps) {
  const nodeCategories = [
    {
      category: 'Triggers',
      nodes: [
        { type: 'task_created', label: 'Task Created', icon: 'plus' },
        { type: 'task_status_changed', label: 'Status Changed', icon: 'refresh' },
        { type: 'task_assigned', label: 'Task Assigned', icon: 'user' },
        { type: 'due_date_approaching', label: 'Due Date Approaching', icon: 'clock' },
        { type: 'custom_schedule', label: 'Schedule', icon: 'calendar' },
      ],
    },
    {
      category: 'Conditions',
      nodes: [
        { type: 'if_condition', label: 'If Condition', icon: 'branch' },
        { type: 'filter', label: 'Filter', icon: 'filter' },
      ],
    },
    {
      category: 'Actions',
      nodes: [
        { type: 'update_task', label: 'Update Task', icon: 'edit' },
        { type: 'assign_task', label: 'Assign Task', icon: 'user-plus' },
        { type: 'send_notification', label: 'Send Notification', icon: 'bell' },
        { type: 'create_task', label: 'Create Related Task', icon: 'plus-circle' },
        { type: 'move_to_phase', label: 'Move to Phase', icon: 'arrow-right' },
        { type: 'call_webhook', label: 'Call Webhook', icon: 'link' },
      ],
    },
  ];

  return (
    <div className="w-64 border-r bg-muted/30 p-4 overflow-y-auto">
      {nodeCategories.map(({ category, nodes }) => (
        <div key={category} className="mb-6">
          <h3 className="text-sm font-semibold mb-2">{category}</h3>
          <div className="space-y-2">
            {nodes.map((node) => (
              <button
                key={node.type}
                onClick={() => onAddNode(node.type, { label: node.label })}
                className="w-full flex items-center gap-2 p-2 rounded hover:bg-accent"
              >
                <Icon name={node.icon} className="w-4 h-4" />
                <span className="text-sm">{node.label}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
```

### Workflow Testing UI

**Component:** `WorkflowTestPanel.tsx`

```typescript
interface WorkflowTestPanelProps {
  workflowId: string;
  onTest: (taskId: string) => Promise<ExecutionTrace>;
}

export function WorkflowTestPanel({ workflowId, onTest }: WorkflowTestPanelProps) {
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [trace, setTrace] = useState<ExecutionTrace | null>(null);
  const [loading, setLoading] = useState(false);

  const handleTest = async () => {
    if (!selectedTaskId) return;
    setLoading(true);
    try {
      const result = await onTest(selectedTaskId);
      setTrace(result);
    } catch (error) {
      toast.error('Test failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border-t">
      <h3 className="font-semibold mb-4">Test Workflow</h3>
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium">Sample Task</label>
          <TaskSelector
            value={selectedTaskId}
            onChange={setSelectedTaskId}
            placeholder="Select a task to test against"
          />
        </div>
        <Button onClick={handleTest} disabled={!selectedTaskId || loading}>
          {loading ? 'Running...' : 'Run Test'}
        </Button>
        {trace && <ExecutionTraceViewer trace={trace} />}
      </div>
    </div>
  );
}
```

### Workflow Management List

**Component:** `WorkflowManagementList.tsx`

```typescript
interface WorkflowManagementListProps {
  projectId: string;
}

export function WorkflowManagementList({ projectId }: WorkflowManagementListProps) {
  const { data: workflows, isLoading } = useQuery({
    queryKey: ['workflows', projectId],
    queryFn: () => getWorkflows({ projectId }),
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Workflows</h2>
        <Button onClick={() => createWorkflow()}>Create Workflow</Button>
      </div>
      <DataTable
        columns={[
          { header: 'Name', accessorKey: 'name' },
          { header: 'Trigger', accessorKey: 'triggerType' },
          { header: 'Status', cell: (row) => <StatusBadge status={row.status} /> },
          { header: 'Last Run', accessorKey: 'lastExecutedAt', cell: formatDate },
          { header: 'Executions', accessorKey: 'executionCount' },
          {
            header: 'Actions',
            cell: (row) => (
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <Button variant="ghost" size="sm">...</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => editWorkflow(row.id)}>
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => toggleWorkflow(row.id)}>
                    {row.enabled ? 'Pause' : 'Activate'}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => viewLogs(row.id)}>
                    View Logs
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => deleteWorkflow(row.id)}>
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ),
          },
        ]}
        data={workflows || []}
        loading={isLoading}
      />
    </div>
  );
}
```

---

## Event Bus Integration

### Workflow Event Types

```typescript
// Workflow events
'pm.workflow.created'
'pm.workflow.updated'
'pm.workflow.activated'
'pm.workflow.paused'
'pm.workflow.deleted'

'pm.workflow.execution.started'
'pm.workflow.execution.step_completed'
'pm.workflow.execution.completed'
'pm.workflow.execution.failed'

// Task events that trigger workflows
'pm.task.created'
'pm.task.updated'
'pm.task.state_changed'
'pm.task.assigned'
'pm.task.completed'
```

### Event Listener Implementation

```typescript
// apps/api/src/pm/workflows/workflow-executor.service.ts

@Injectable()
export class WorkflowExecutorService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBusService,
  ) {
    this.setupEventListeners();
  }

  private setupEventListeners() {
    // Listen to task events
    this.eventBus.on('pm.task.created', (event) => this.handleTaskEvent(event, 'TASK_CREATED'));
    this.eventBus.on('pm.task.state_changed', (event) => this.handleTaskEvent(event, 'TASK_STATUS_CHANGED'));
    this.eventBus.on('pm.task.assigned', (event) => this.handleTaskEvent(event, 'TASK_ASSIGNED'));
    this.eventBus.on('pm.task.completed', (event) => this.handleTaskEvent(event, 'TASK_COMPLETED'));
  }

  private async handleTaskEvent(event: BaseEvent, triggerType: WorkflowTriggerType) {
    // 1. Find active workflows for this trigger type
    const workflows = await this.prisma.workflow.findMany({
      where: {
        workspaceId: event.tenantId,
        enabled: true,
        triggerType,
      },
    });

    // 2. Evaluate trigger conditions and execute matching workflows
    for (const workflow of workflows) {
      if (this.evaluateTriggerConditions(workflow, event)) {
        await this.executeWorkflow(workflow.id, {
          triggerType,
          triggerData: event.data,
          triggeredBy: event.id,
        });
      }
    }
  }

  private evaluateTriggerConditions(workflow: Workflow, event: BaseEvent): boolean {
    const config = workflow.triggerConfig as TriggerConfig;

    // Example: status filter
    if (config.filters?.status && event.data.newStatus !== config.filters.status) {
      return false;
    }

    // Example: phase filter
    if (config.filters?.phaseId && event.data.phaseId !== config.filters.phaseId) {
      return false;
    }

    return true;
  }

  async executeWorkflow(
    workflowId: string,
    context: {
      triggerType: WorkflowTriggerType;
      triggerData: Record<string, any>;
      triggeredBy?: string;
      isDryRun?: boolean;
    },
  ): Promise<WorkflowExecution> {
    const workflow = await this.prisma.workflow.findUnique({
      where: { id: workflowId },
    });

    if (!workflow) throw new NotFoundException('Workflow not found');

    // Create execution record
    const execution = await this.prisma.workflowExecution.create({
      data: {
        workflowId,
        triggerType: context.triggerType,
        triggeredBy: context.triggeredBy,
        triggerData: context.triggerData,
        status: 'RUNNING',
        isDryRun: context.isDryRun || false,
      },
    });

    try {
      // Execute workflow steps
      const trace = await this.executeSteps(workflow, context);

      // Update execution record
      await this.prisma.workflowExecution.update({
        where: { id: execution.id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          executionTrace: trace,
          stepsExecuted: trace.steps.length,
          stepsPassed: trace.steps.filter((s) => s.status === 'passed').length,
          stepsFailed: trace.steps.filter((s) => s.status === 'failed').length,
        },
      });

      // Emit completion event
      this.eventBus.emit('pm.workflow.execution.completed', {
        workflowId,
        executionId: execution.id,
        isDryRun: context.isDryRun,
      });

      return execution;
    } catch (error) {
      // Update execution with error
      await this.prisma.workflowExecution.update({
        where: { id: execution.id },
        data: {
          status: 'FAILED',
          completedAt: new Date(),
          errorMessage: error.message,
        },
      });

      throw error;
    }
  }

  private async executeSteps(
    workflow: Workflow,
    context: ExecutionContext,
  ): Promise<ExecutionTrace> {
    const definition = workflow.definition as WorkflowDefinition;
    const trace: ExecutionTrace = { steps: [] };

    // Topologically sort nodes based on edges
    const sortedNodes = this.topologicalSort(definition.nodes, definition.edges);

    for (const node of sortedNodes) {
      const stepResult = await this.executeNode(node, context);
      trace.steps.push(stepResult);

      // If step failed and no fallback, stop execution
      if (stepResult.status === 'failed' && !node.data.continueOnError) {
        break;
      }

      // If condition is false, skip downstream nodes
      if (stepResult.type === 'condition' && !stepResult.result) {
        // Mark downstream nodes as skipped
        const downstreamNodes = this.getDownstreamNodes(node, definition);
        downstreamNodes.forEach((n) => {
          trace.steps.push({ nodeId: n.id, status: 'skipped' });
        });
        break;
      }
    }

    return trace;
  }

  private async executeNode(
    node: WorkflowNode,
    context: ExecutionContext,
  ): Promise<StepResult> {
    const { type, data } = node;

    switch (type) {
      case 'action':
        return await this.executeAction(data.actionType, data.config, context);
      case 'condition':
        return await this.evaluateCondition(data.condition, context);
      case 'agent':
        return await this.triggerAgent(data.agentName, data.config, context);
      default:
        throw new Error(`Unknown node type: ${type}`);
    }
  }

  private async executeAction(
    actionType: string,
    config: ActionConfig,
    context: ExecutionContext,
  ): Promise<StepResult> {
    // Skip actual execution in dry-run mode
    if (context.isDryRun) {
      return {
        nodeId: config.nodeId,
        type: 'action',
        status: 'passed',
        result: { simulated: true, action: actionType },
      };
    }

    switch (actionType) {
      case 'update_task':
        await this.prisma.task.update({
          where: { id: context.triggerData.taskId },
          data: config.updates,
        });
        break;
      case 'assign_task':
        await this.prisma.task.update({
          where: { id: context.triggerData.taskId },
          data: { assigneeId: config.assigneeId },
        });
        break;
      case 'send_notification':
        await this.sendNotification(config.recipients, config.message);
        break;
      case 'create_task':
        await this.prisma.task.create({ data: config.taskData });
        break;
      case 'move_to_phase':
        await this.prisma.task.update({
          where: { id: context.triggerData.taskId },
          data: { phaseId: config.phaseId },
        });
        break;
      case 'call_webhook':
        await this.callWebhook(config.url, config.method, config.payload);
        break;
      default:
        throw new Error(`Unknown action type: ${actionType}`);
    }

    return { nodeId: config.nodeId, type: 'action', status: 'passed' };
  }

  private async callWebhook(
    url: string,
    method: string,
    payload: Record<string, any>,
  ): Promise<void> {
    // Rate limiting: max 10 webhook calls per minute per workflow
    await this.rateLimiter.check(`webhook:${url}`, { max: 10, window: 60000 });

    await axios({
      method,
      url,
      data: payload,
      timeout: 5000,
    });
  }

  private topologicalSort(nodes: WorkflowNode[], edges: WorkflowEdge[]): WorkflowNode[] {
    // Implement topological sort for DAG
    // Returns nodes in execution order
    // ...implementation...
  }

  private getDownstreamNodes(
    node: WorkflowNode,
    definition: WorkflowDefinition,
  ): WorkflowNode[] {
    // Find all nodes reachable from this node
    // ...implementation...
  }
}
```

### Scheduled Workflow Execution

```typescript
// apps/api/src/pm/workflows/workflow-scheduler.service.ts

@Injectable()
export class WorkflowSchedulerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly executor: WorkflowExecutorService,
  ) {
    this.setupScheduledJobs();
  }

  private setupScheduledJobs() {
    // Check for scheduled workflows every minute
    setInterval(() => this.checkScheduledWorkflows(), 60000);
  }

  private async checkScheduledWorkflows() {
    const workflows = await this.prisma.workflow.findMany({
      where: {
        enabled: true,
        triggerType: 'CUSTOM_SCHEDULE',
      },
    });

    for (const workflow of workflows) {
      const config = workflow.triggerConfig as ScheduleTriggerConfig;
      const cron = new CronParser(config.schedule);

      if (cron.shouldRun()) {
        await this.executor.executeWorkflow(workflow.id, {
          triggerType: 'CUSTOM_SCHEDULE',
          triggerData: { scheduledAt: new Date() },
        });
      }
    }
  }
}
```

---

## Workflow Execution Engine

### Workflow Definition JSON Schema

```typescript
interface WorkflowDefinition {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  triggers: TriggerConfig[];
  variables: Record<string, any>;
}

interface WorkflowNode {
  id: string;
  type: 'trigger' | 'condition' | 'action' | 'agent';
  position: { x: number; y: number };
  data: NodeData;
}

interface NodeData {
  label: string;
  config: NodeConfig;
  continueOnError?: boolean;
}

type NodeConfig =
  | TriggerNodeConfig
  | ConditionNodeConfig
  | ActionNodeConfig
  | AgentNodeConfig;

interface TriggerNodeConfig {
  eventType: WorkflowTriggerType;
  filters?: {
    status?: string;
    phaseId?: string;
    assigneeId?: string;
    priority?: string;
  };
}

interface ConditionNodeConfig {
  condition: {
    field: string;
    operator: 'eq' | 'ne' | 'gt' | 'lt' | 'contains' | 'in';
    value: any;
  };
}

interface ActionNodeConfig {
  actionType:
    | 'update_task'
    | 'assign_task'
    | 'send_notification'
    | 'create_task'
    | 'move_to_phase'
    | 'call_webhook';
  config: ActionConfig;
}

interface AgentNodeConfig {
  agentName: string;
  action: string;
  config: Record<string, any>;
}

interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

interface ExecutionContext {
  triggerType: WorkflowTriggerType;
  triggerData: Record<string, any>;
  triggeredBy?: string;
  isDryRun?: boolean;
  variables?: Record<string, any>;
}

interface ExecutionTrace {
  steps: StepResult[];
}

interface StepResult {
  nodeId: string;
  type: string;
  status: 'passed' | 'failed' | 'skipped';
  result?: any;
  error?: string;
  duration?: number;
}
```

---

## Story Breakdown with Technical Notes

### PM-10.1: Workflow Canvas (Story PM-10-1)

**Goal:** Node-based editor for designing workflows

**Technical Implementation:**
- Install `reactflow` package
- Create `WorkflowCanvas` component with drag-drop
- Implement custom node types: Trigger, Condition, Action, Agent
- Store workflow definition as JSON in PostgreSQL
- Add node palette sidebar with available node types
- Implement edge validation (prevent cycles)

**API Endpoints:**
- `POST /pm/workflows` - Create workflow
- `PUT /pm/workflows/:id` - Update workflow definition
- `GET /pm/workflows/:id` - Get workflow details

**Acceptance Criteria:**
- [x] Drag-drop nodes from palette to canvas
- [x] Connect nodes with edges
- [x] Configure node properties in side panel
- [x] Save workflow definition as JSON
- [x] Preview execution path

---

### PM-10.2: Trigger Conditions (Story PM-10-2)

**Goal:** Configure workflow triggers and filters

**Technical Implementation:**
- Event-driven triggers via Redis Streams event bus
- Scheduled triggers via cron expressions (BullMQ jobs)
- Trigger condition evaluation before workflow execution
- Support for multiple filters per trigger

**Trigger Types:**
- Task Created
- Task Status Changed
- Task Assigned
- Due Date Approaching (cron job: check daily)
- Custom Schedule (cron expression)

**Trigger Config Schema:**
```typescript
interface TriggerConfig {
  eventType: WorkflowTriggerType;
  filters?: {
    status?: string[];
    phaseId?: string;
    assigneeId?: string;
    priority?: string[];
    type?: string[];
  };
  schedule?: string; // Cron expression for scheduled triggers
}
```

**API Endpoints:**
- `POST /pm/workflows/:id/triggers` - Add trigger
- `PUT /pm/workflows/:id/triggers/:triggerId` - Update trigger
- `DELETE /pm/workflows/:id/triggers/:triggerId` - Remove trigger

**Acceptance Criteria:**
- [x] Select trigger type (task event or schedule)
- [x] Add filter conditions (status, phase, assignee, etc.)
- [x] Configure cron schedule for scheduled workflows
- [x] Preview matching events

---

### PM-10.3: Action Library (Story PM-10-3)

**Goal:** Action nodes for workflow execution

**Technical Implementation:**
- Action executor service
- Rate limiting for webhook actions
- Agent integration for AI-powered actions
- Dry-run mode support for all actions

**Available Actions:**
- **Update Task Field**: Update task properties (status, priority, due date, etc.)
- **Assign Task**: Assign task to user or agent
- **Send Notification**: Send in-app or email notification to users
- **Create Related Task**: Create new task linked to trigger task
- **Move to Phase**: Move task to different phase
- **Call Webhook**: HTTP request to external endpoint (rate-limited)

**Action Config Schema:**
```typescript
interface ActionConfig {
  actionType: string;
  config: Record<string, any>;
}

// Example: Update Task
{
  actionType: 'update_task',
  config: {
    updates: {
      status: 'IN_PROGRESS',
      priority: 'HIGH',
    },
  },
}

// Example: Call Webhook
{
  actionType: 'call_webhook',
  config: {
    url: 'https://example.com/webhook',
    method: 'POST',
    payload: {
      taskId: '{{task.id}}',
      status: '{{task.status}}',
    },
  },
}
```

**Rate Limiting:**
- Webhooks: Max 10 calls per minute per workflow
- Notifications: Max 50 per hour per workflow

**API Endpoints:**
- Internal only (called by workflow executor)

**Acceptance Criteria:**
- [x] Add action nodes to workflow
- [x] Configure action parameters
- [x] Support variable interpolation (e.g., `{{task.id}}`)
- [x] Chain multiple actions sequentially
- [x] Rate limit webhook calls

---

### PM-10.4: Workflow Testing (Story PM-10-4)

**Goal:** Dry-run testing with execution trace

**Technical Implementation:**
- Sandboxed execution engine (no actual changes)
- Execution trace visualization
- Sample task selection
- Step-by-step simulation

**Dry-Run Execution:**
- Set `isDryRun: true` in execution context
- Skip database writes in action executor
- Log what would happen without side effects
- Return detailed execution trace

**Execution Trace Format:**
```typescript
{
  executionId: string;
  workflowId: string;
  trace: {
    steps: [
      {
        nodeId: 'node-1',
        type: 'trigger',
        status: 'passed',
        result: { matched: true },
      },
      {
        nodeId: 'node-2',
        type: 'condition',
        status: 'passed',
        result: { evaluated: true, condition: 'status == IN_PROGRESS' },
      },
      {
        nodeId: 'node-3',
        type: 'action',
        status: 'passed',
        result: { simulated: true, action: 'assign_task', assigneeId: 'user-123' },
      },
    ],
  },
  summary: {
    stepsExecuted: 3,
    stepsPassed: 3,
    stepsFailed: 0,
  },
}
```

**API Endpoints:**
- `POST /pm/workflows/:id/test` - Run dry-run test

**Acceptance Criteria:**
- [x] Select sample task for testing
- [x] Run workflow in dry-run mode
- [x] Visualize execution path on canvas
- [x] Show step results and simulated changes
- [x] No actual changes made to database

---

### PM-10.5: Workflow Management (Story PM-10-5)

**Goal:** List, pause/activate, view logs

**Technical Implementation:**
- Workflow management list with filters
- Activate/pause workflow controls
- Execution log viewer
- Error handling and retry mechanism

**Workflow List Features:**
- Filter by status (draft, active, paused, archived)
- Search by name
- Sort by last run, execution count, error count
- Bulk actions (pause, activate, delete)

**Execution Logs:**
- Paginated execution history
- Filter by status (completed, failed, running)
- Search by trigger data
- Export logs as CSV

**API Endpoints:**
- `GET /pm/workflows` - List workflows
- `POST /pm/workflows/:id/activate` - Activate workflow
- `POST /pm/workflows/:id/pause` - Pause workflow
- `GET /pm/workflows/:id/executions` - List executions
- `GET /pm/workflow-executions/:id/logs` - Get execution details

**Acceptance Criteria:**
- [x] List all workflows for project
- [x] Activate/pause workflows
- [x] View execution history with filters
- [x] Display execution logs with step details
- [x] Retry failed executions

---

## Security & Compliance

### Workflow Execution Security

1. **Tenant Isolation:**
   - All workflows scoped to `workspaceId`
   - Row-level security on Workflow and WorkflowExecution tables
   - Validate project access before execution

2. **Permission Checks:**
   - User must have `pm:workflow:create` permission
   - User must have `pm:workflow:execute` permission
   - Action execution respects task permissions

3. **Rate Limiting:**
   - Webhooks: 10 calls/min per workflow
   - Notifications: 50/hour per workflow
   - Agent actions: Subject to agent rate limits

4. **Webhook Security:**
   - Validate webhook URLs (no internal IPs)
   - Timeout after 5 seconds
   - Log all webhook calls
   - Optional webhook signature verification

5. **Variable Interpolation Safety:**
   - Sanitize user input in variable interpolation
   - Prevent code injection in webhook payloads
   - Whitelist allowed variable paths

6. **Audit Logging:**
   - Log all workflow creations, updates, deletions
   - Log all workflow executions (success and failure)
   - Track which user triggered manual executions

---

## Testing Strategy

### Unit Tests

```typescript
// Workflow execution engine
describe('WorkflowExecutorService', () => {
  it('should execute workflow steps in order');
  it('should skip steps when condition fails');
  it('should handle action failures gracefully');
  it('should respect dry-run mode');
  it('should rate limit webhook calls');
});

// Trigger condition evaluation
describe('TriggerEvaluator', () => {
  it('should match task created event');
  it('should filter by task status');
  it('should filter by task phase');
  it('should filter by task assignee');
});

// Action executors
describe('ActionExecutor', () => {
  it('should update task fields');
  it('should assign task to user');
  it('should send notification');
  it('should create related task');
  it('should call webhook with payload');
});
```

### Integration Tests

```typescript
// End-to-end workflow execution
describe('Workflow Execution E2E', () => {
  it('should trigger workflow on task created event');
  it('should execute all steps and update task');
  it('should log execution trace');
  it('should handle webhook failures with retry');
});

// Dry-run testing
describe('Dry-Run Testing', () => {
  it('should simulate workflow execution');
  it('should not persist any changes');
  it('should return execution trace');
});
```

### UI Tests (Playwright)

```typescript
test.describe('Workflow Canvas', () => {
  test('should drag node from palette to canvas');
  test('should connect nodes with edges');
  test('should configure node properties');
  test('should save workflow definition');
});

test.describe('Workflow Testing', () => {
  test('should run dry-run test');
  test('should visualize execution trace');
  test('should show step results');
});
```

---

## Risks & Mitigations

### Risk 1: Infinite Workflow Loops

**Risk:** Workflow triggers itself recursively (e.g., task update triggers workflow that updates task)

**Mitigation:**
- Execution depth limit: max 10 steps per workflow
- Detect circular dependencies in workflow graph
- Track execution chain to prevent re-triggering
- Add cooldown period: workflow can't execute more than 5 times in 1 minute

### Risk 2: Webhook Abuse

**Risk:** User creates workflows that spam external webhooks

**Mitigation:**
- Rate limiting: 10 webhook calls per minute per workflow
- Timeout webhooks after 5 seconds
- Block internal IP addresses
- Audit log all webhook calls
- Limit number of active workflows per project (max 50)

### Risk 3: Performance Impact

**Risk:** Complex workflows slow down task operations

**Mitigation:**
- Execute workflows asynchronously via BullMQ
- Cache active workflows in Redis
- Index workflows by `enabled` and `triggerType`
- Monitor execution times and add alerts for slow workflows

### Risk 4: Action Permission Bypass

**Risk:** Workflow executes actions user doesn't have permission for

**Mitigation:**
- Validate user permissions before workflow creation
- Store workflow creator ID
- Execute actions in creator's permission context
- Audit log all workflow actions

### Risk 5: Dry-Run Leaks

**Risk:** Dry-run mode accidentally persists changes

**Mitigation:**
- Strict checks for `isDryRun` flag in all action executors
- Use database transactions and rollback in dry-run mode
- Add integration tests to verify no side effects
- Return clear "simulated" labels in trace results

---

## References

- [Epic Definition](epic-pm-10-workflow-builder.md)
- [Module PRD](../PRD.md)
- [Module Architecture](../architecture.md) - Event Bus Integration
- [Sprint Status](../sprint-status.yaml)
- [React Flow Documentation](https://reactflow.dev/)
- [BullMQ Documentation](https://docs.bullmq.io/)
