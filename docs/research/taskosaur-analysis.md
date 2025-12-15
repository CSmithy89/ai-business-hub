# Taskosaur Analysis (Enhanced)

**Analyzed:** 2025-11-28
**Last Updated:** 2025-11-28 (Party Mode Deep Dive)
**Version/Commit:** Main branch (Taskosaur-main)
**Analyst:** Claude + BMAD Agent Team (AI Business Hub Research)

---

## Executive Summary

Taskosaur is a full-stack project management application with AI assistant capabilities. The codebase demonstrates production-ready patterns directly applicable to **AI Business Hub** modules defined in docs/archive/foundation-phase/MODULE-RESEARCH.md.

### Key Patterns for AI Business Hub:
- **BYOAI model switching** → Core Platform requirement
- **Room-based WebSocket architecture** → Real-time agent activity visualization
- **Notification system** → Human-in-the-loop approval gates
- **Automation executor pattern** → Intent recognition + action mapping
- **Token management with refresh** → Auth system foundation
- **React Context + custom events** → Cross-module state sharing

### Tech Stack Match:
**Taskosaur:** Next.js 16 + React 19 + NestJS + Prisma + Socket.io + Radix UI
**AI Business Hub Target:** Next.js + NestJS + Prisma + PostgreSQL + Radix UI (same stack!)

### Alignment with docs/archive/foundation-phase/MODULE-RESEARCH.md Goals:
| AI Business Hub Requirement | Taskosaur Pattern | Adoptability |
|----------------------------|-------------------|--------------|
| Conversational workflow creation | Chat panel + intent parsing | ✅ Adapt |
| BYOAI multi-provider | URL-based detection + per-provider formatting | ✅ Adopt |
| Human approval gates | Notification system + WebSocket | ✅ Adopt |
| Real-time agent visualization | Socket.io rooms + event emitters | ✅ Adopt |
| Session/context persistence | SessionStorage + DB settings | ✅ Adopt |

---

## 1. Conversational UI Architecture

### Key Files
| File | Description |
|------|-------------|
| `frontend/src/components/chat/ChatPanel.tsx` | Main chat UI component |
| `frontend/src/contexts/chat-context.tsx` | Chat open/close state |
| `frontend/src/lib/mcp-server.ts` | Client-side message processing |
| `backend/src/modules/ai-chat/ai-chat.service.ts` | Server-side AI orchestration |

### Pattern Summary

**Chat Panel Structure:**
- Slide-out panel from right side (400-650px resizable width)
- Three message types: `user`, `assistant`, `system`
- Session storage for conversation persistence
- Context-aware with workspace/project detection from URL

**Component Architecture:**
```typescript
// Message interface
interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

// Chat context - minimal, just open/close state
interface ChatContextType {
  isChatOpen: boolean;
  toggleChat: () => void;
}
```

**Streaming Implementation:**
- NOT true server-side streaming (SSE/WebSocket)
- Client-side simulated streaming via word-by-word display
- Backend returns full response, frontend chunks it

```typescript
// Simulated streaming in mcp-server.ts
if (options.stream && options.onChunk) {
  const words = userVisibleResponse.split(" ");
  for (let i = 0; i < words.length; i++) {
    const chunk = (i === 0 ? "" : " ") + words[i];
    options.onChunk(chunk);
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
}
```

**UI Library:**
- Radix UI primitives via shadcn/ui patterns
- react-icons/hi2 for icons
- Custom Tailwind styling with CSS variables
- Sonner for toast notifications

### Code Snippet - ChatPanel Core Structure
```tsx
// ChatPanel.tsx - Core state and rendering
const [messages, setMessages] = useState<Message[]>([]);
const [inputValue, setInputValue] = useState("");
const [isLoading, setIsLoading] = useState(false);
const [panelWidth, setPanelWidth] = useState(400);

// Message handling with streaming placeholder
const handleSendMessage = async () => {
  // Add user message immediately
  setMessages(prev => [...prev, userMessage]);

  // Add streaming placeholder
  const assistantMessage: Message = {
    role: "assistant",
    content: "",
    timestamp: new Date(),
    isStreaming: true,
  };
  setMessages(prev => [...prev, assistantMessage]);

  // Process with streaming callback
  await mcpServer.processMessage(userMessage.content, {
    stream: true,
    onChunk: handleChunk,
  });
};
```

### Adoption Recommendation
- [x] **Adapt for our needs**
- Adopt: Slide-out panel pattern, message structure, context integration
- Adapt: Replace simulated streaming with true SSE/WebSocket streaming
- Avoid: The MCP-based command parsing system (overly complex for general chat)

---

## 2. BYOAI Model Switching

### Key Files
| File | Description |
|------|-------------|
| `backend/src/modules/ai-chat/ai-chat.service.ts` | Provider detection & request formatting |
| `backend/src/modules/settings/settings.service.ts` | Settings CRUD with encryption flag |
| `frontend/src/components/settings/AISettings.tsx` | User configuration modal |
| `backend/src/modules/settings/dto/settings.dto.ts` | Settings DTO with validation |

### Pattern Summary

**Provider Detection (URL-based):**
```typescript
private detectProvider(apiUrl: string): string {
  const parsedUrl = new URL(apiUrl);
  const hostname = parsedUrl.hostname;
  if (hostname === 'openrouter.ai') return 'openrouter';
  if (hostname === 'api.openai.com') return 'openai';
  if (hostname === 'api.anthropic.com') return 'anthropic';
  if (hostname === 'generativelanguage.googleapis.com') return 'google';
  return 'custom';
}
```

**Settings Storage:**
```typescript
// Settings keys stored in database
ai_enabled: boolean     // Enable/disable AI
ai_api_key: string      // Encrypted API key
ai_model: string        // Model identifier (e.g., "gpt-4")
ai_api_url: string      // Provider endpoint URL
```

**Multi-Provider Request Formatting:**
```typescript
switch (provider) {
  case 'openrouter':
    requestUrl = `${apiUrl}/chat/completions`;
    requestHeaders['HTTP-Referer'] = process.env.APP_URL;
    requestHeaders['X-Title'] = 'Taskosaur AI Assistant';
    break;

  case 'openai':
    requestUrl = `${apiUrl}/chat/completions`;
    break;

  case 'anthropic':
    requestUrl = `${apiUrl}/messages`;
    requestHeaders['x-api-key'] = apiKey;
    requestHeaders['anthropic-version'] = '2023-06-01';
    delete requestHeaders['Authorization'];
    requestBody = {
      model,
      messages: messages.filter(m => m.role !== 'system'),
      system: messages.find(m => m.role === 'system')?.content,
      max_tokens: 500,
    };
    break;

  case 'google':
    requestUrl = `${apiUrl}/models/${model}:generateContent?key=${apiKey}`;
    delete requestHeaders['Authorization'];
    requestBody = {
      contents: messages.map(m => ({
        role: m.role === 'assistant' ? 'model' : m.role,
        parts: [{ text: m.content }],
      })),
    };
    break;
}
```

### Frontend Settings UI
```tsx
// AISettings.tsx - User configuration
<Input
  id="api-key"
  type={showApiKey ? "text" : "password"}
  value={apiKey}
  onChange={(e) => setApiKey(e.target.value)}
  placeholder="Enter your API key"
/>

<Input
  id="model"
  value={model}
  placeholder="e.g., deepseek/deepseek-chat-v3-0324:free"
/>

<Input
  id="api-url"
  type="url"
  value={apiUrl}
  placeholder="https://api.provider.com/v1"
/>
```

**Default Values:**
- Model: `deepseek/deepseek-chat-v3-0324:free`
- API URL: `https://openrouter.ai/api/v1`

### Adoption Recommendation
- [x] **Adopt as-is**
- Excellent pattern for multi-provider support
- URL-based detection is simple and extensible
- Settings encryption handled at DB level
- Add: Provider-specific model dropdowns for better UX

---

## 3. Task/Workflow Definition

### Key Files
| File | Description |
|------|-------------|
| `backend/prisma/schema.prisma` | Complete data model (1183 lines) |
| `backend/src/modules/tasks/dto/create-task.dto.ts` | Task DTO with validation |
| `backend/src/constants/defaultWorkflow.ts` | Default workflow templates |
| `backend/src/modules/workflows/workflows.service.ts` | Workflow CRUD |

### Data Model Summary

**Task Model (Prisma):**
```prisma
model Task {
  id                String       @id @default(uuid())
  title             String
  description       String?
  type              TaskType     @default(TASK)      // TASK, BUG, EPIC, STORY, SUBTASK
  priority          TaskPriority @default(MEDIUM)    // LOWEST, LOW, MEDIUM, HIGH, HIGHEST
  taskNumber        Int          @map("task_number")
  slug              String
  startDate         DateTime?
  dueDate           DateTime?
  completedAt       DateTime?
  storyPoints       Int?
  originalEstimate  Int?         // minutes
  remainingEstimate Int?         // minutes
  customFields      Json?

  // Relations
  projectId         String
  statusId          String
  sprintId          String?
  parentTaskId      String?

  // Audit fields
  createdBy         String?
  updatedBy         String?
  isArchived        Boolean      @default(false)
}

enum TaskType {
  TASK
  BUG
  EPIC
  STORY
  SUBTASK
}

enum TaskPriority {
  LOWEST
  LOW
  MEDIUM
  HIGH
  HIGHEST
}
```

**Workflow System:**
```prisma
model Workflow {
  id             String       @id @default(uuid())
  name           String
  description    String?
  isDefault      Boolean      @default(false)
  organizationId String
  statuses       TaskStatus[]
  transitions    StatusTransition[]
}

model TaskStatus {
  id         String         @id @default(uuid())
  name       String         // "To Do", "In Progress", etc.
  color      String         // Hex color
  category   StatusCategory // TODO, IN_PROGRESS, DONE
  position   Int
  isDefault  Boolean        @default(false)
  workflowId String
}

model StatusTransition {
  id           String     @id @default(uuid())
  workflowId   String
  fromStatusId String
  toStatusId   String
}
```

**Default Workflow Configuration:**
```typescript
// defaultWorkflow.ts
export const DEFAULT_TASK_STATUSES = [
  { name: 'To Do', color: '#6366f1', category: 'TODO', position: 1, isDefault: true },
  { name: 'In Progress', color: '#f59e0b', category: 'IN_PROGRESS', position: 2 },
  { name: 'In Review', color: '#8b5cf6', category: 'IN_PROGRESS', position: 3 },
  { name: 'Done', color: '#10b981', category: 'DONE', position: 4 },
];

export const DEFAULT_STATUS_TRANSITIONS = [
  { from: 'To Do', to: 'In Progress' },
  { from: 'In Progress', to: 'In Review' },
  { from: 'In Progress', to: 'Done' },
  { from: 'In Review', to: 'To Do' },
  { from: 'In Review', to: 'Done' },
];
```

### Hierarchy Structure
```
Organization
  └── Workspace
        └── Project
              ├── Sprint
              │     └── Task
              │           └── Subtask
              └── Workflow
                    └── TaskStatus
                          └── StatusTransition
```

### Adoption Recommendation
- [x] **Adapt for our needs**
- Adopt: Entity hierarchy, workflow/status system, audit fields
- Adapt: Simplify for initial MVP (skip sprints, custom fields initially)
- Add: AI-specific task types for our modules

---

## 4. Real-time Updates

### Key Files
| File | Description |
|------|-------------|
| `backend/src/gateway/events.gateway.ts` | Socket.io gateway |
| `backend/package.json` | Socket.io dependencies |

### Pattern Summary

**Technology:** Socket.io (not native WebSockets)

**Gateway Structure:**
```typescript
// events.gateway.ts (inferred from package.json dependencies)
@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class EventsGateway {
  @WebSocketServer()
  server: Server;

  // Room-based organization for real-time updates
  handleConnection(client: Socket) {
    // Join rooms based on user's organization/workspace
  }

  // Emit events for task updates, comments, etc.
  emitTaskUpdate(taskId: string, update: any) {
    this.server.to(`task:${taskId}`).emit('task:updated', update);
  }
}
```

**AI Response "Streaming":**
- NOT using Socket.io for AI streaming
- Uses client-side simulation as mentioned in Section 1
- Backend uses standard HTTP POST with full response

**Dependencies (from package.json):**
```json
{
  "@nestjs/websockets": "^11.0.3",
  "@nestjs/platform-socket.io": "^11.0.3",
  "socket.io": "^4.8.1"
}
```

### Adoption Recommendation
- [x] **Adapt for our needs**
- Adopt: Socket.io for real-time collaboration features
- **Avoid for AI streaming** - use Server-Sent Events instead
- SSE is simpler and better suited for one-directional AI response streaming

---

## 5. State Management

### Key Files
| File | Description |
|------|-------------|
| `frontend/src/contexts/auth-context/index.tsx` | Auth state management |
| `frontend/src/contexts/chat-context.tsx` | Chat panel state |
| `frontend/src/lib/mcp-server.ts` | Chat session state (singleton) |

### Pattern Summary

**Approach:** React Context API (no Redux/Zustand)

**Auth Context Structure:**
```typescript
interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

interface AuthContextType extends AuthState {
  // Auth methods
  register: (userData: UserData) => Promise<any>;
  login: (loginData: LoginData) => Promise<any>;
  logout: () => Promise<void>;

  // User methods
  getAllUsers: () => Promise<any>;
  getUserById: (userId: string) => Promise<any>;
  updateUser: (userId: string, userData: UpdateUserData) => Promise<any>;

  // Utility
  isAuthenticated: () => boolean;
  getCurrentUser: () => User | null;
}
```

**Chat Context (Minimal):**
```typescript
interface ChatContextType {
  isChatOpen: boolean;
  toggleChat: () => void;
}
```

**MCP Server (Singleton Pattern):**
```typescript
class MCPServer {
  private context: TaskosaurContext = {};
  private conversationHistory: ChatMessage[] = [];
  private sessionId: string = this.getOrCreateSessionId();

  processMessage(message: string, options: StreamOptions): Promise<string>;
  clearHistory(): void;
  getHistory(): ChatMessage[];
  updateContext(updates: Partial<TaskosaurContext>): void;
}

export const mcpServer = new MCPServer(); // Singleton
```

**Key Patterns:**
1. Context stored in localStorage (`currentOrganizationId`, `access_token`)
2. Session storage for chat history (`mcp_conversation_history`, `mcp-session-id`)
3. Custom events for cross-component communication:
   - `aiSettingsChanged`
   - `organizationChanged`
   - `aiWorkspaceCreated`
   - `aiProjectCreated`

### Async Operations
```typescript
// Standard pattern with useCallback
const handleApiOperation = useCallback(
  async function <T>(operation: () => Promise<T>, updateUserState: boolean = false): Promise<T> {
    try {
      setAuthState(prev => ({ ...prev, error: null }));
      const result = await operation();
      if (updateUserState && result?.user) {
        setAuthState(prev => ({ ...prev, user: result.user }));
      }
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An error occurred";
      setAuthState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  },
  []
);
```

### Adoption Recommendation
- [x] **Adapt for our needs**
- Adopt: React Context for auth, minimal chat context
- Consider: Zustand for complex AI module state (simpler than Context for deep updates)
- Adopt: Custom events for cross-component communication
- Keep: LocalStorage/SessionStorage patterns for persistence

---

## Key Takeaways for AI Business Hub

### 1. **BYOAI Pattern is Production-Ready**
The URL-based provider detection with per-provider request formatting is clean and extensible. Direct adoption recommended with minor enhancements (model dropdowns per provider).

### 2. **Simulated Streaming Should Be Replaced**
Taskosaur's word-by-word client-side "streaming" is a UX trick, not true streaming. For AI Business Hub, implement proper Server-Sent Events (SSE) for actual token-by-token streaming from LLM providers.

### 3. **React Context is Sufficient for MVP**
No need for Redux/Zustand initially. The Context + custom events pattern handles cross-component state well. Consider Zustand only if state complexity grows significantly.

### 4. **Workflow System is Well-Designed**
The status/transition model allows custom workflows per organization. Adopt this pattern for any task-based features in AI Business Hub.

### 5. **Command-Based AI Architecture is Over-Engineered**
Taskosaur uses a complex command parsing system where AI must output `[COMMAND: name] {params}`. For general-purpose AI chat, a simpler approach with function calling or tool use would be better.

---

## Questions for Next Steps

1. **Streaming Strategy:** Should we use SSE (simpler) or WebSockets (bidirectional) for AI streaming?
2. **State Management:** Start with Context or adopt Zustand from the beginning for module state?
3. **Provider Priority:** Which providers to support first? (Recommend: OpenRouter > OpenAI > Anthropic)
4. **Database:** Stick with PostgreSQL + Prisma like Taskosaur, or evaluate alternatives?

---

## Technical Debt Noted in Taskosaur

1. No TypeScript strict mode enforcement in some files
2. Some hardcoded timeout values (18000ms)
3. Console.log statements left in production code
4. Some regex patterns could be vulnerable to ReDoS (partially mitigated)
5. Custom crypto implementation instead of native crypto

These should be avoided in AI Business Hub implementation.

---

## 6. Enhanced WebSocket Architecture (Deep Dive)

### Key Files

| File | Description |
|------|-------------|
| `backend/src/gateway/events.gateway.ts` | Full Socket.io gateway implementation |

### Room-Based Architecture

Taskosaur uses a hierarchical room system for targeted event broadcasting:

```typescript
// Room hierarchy - join more specific rooms as user navigates
client.join(`user:${client.userId}`);           // Personal notifications
client.join(`org:${data.organizationId}`);      // Organization-wide events
client.join(`workspace:${data.workspaceId}`);   // Workspace events
client.join(`project:${data.projectId}`);       // Project events
client.join(`task:${data.taskId}`);             // Task-specific updates
```

### Event Emitter Methods

```typescript
// Task lifecycle events
emitTaskCreated(projectId: string, task: any)
emitTaskUpdated(projectId: string, taskId: string, updates: any)
emitTaskDeleted(projectId: string, taskId: string)
emitTaskStatusChanged(projectId: string, taskId: string, statusChange: any)
emitTaskAssigned(projectId: string, taskId: string, assignment: any)

// Collaboration events
emitCommentAdded(projectId: string, taskId: string, comment: any)
emitUserTyping(taskId: string, user: any)
emitUserStoppedTyping(taskId: string, user: any)

// Time tracking events
emitTimeEntryStarted(projectId: string, taskId: string, timeEntry: any)
emitTimeEntryStopped(projectId: string, taskId: string, timeEntry: any)

// User notifications
emitNotification(userId: string, notification: any)
```

### Presence Tracking

```typescript
// Track online users across multiple tabs/devices
private connectedUsers = new Map<string, string[]>(); // userId -> socketIds[]

getConnectedUsersCount(): number
isUserOnline(userId: string): boolean
getOnlineUsersInRoom(room: string): string[]
```

### Application for AI Business Hub

| Taskosaur Event | AI Business Hub Equivalent |
|-----------------|---------------------------|
| `task:created` | `agent:task_started` |
| `task:status_changed` | `agent:status_changed` |
| `task:assigned` | `agent:assigned_to_user` |
| `comment:added` | `agent:feedback_received` |
| `notification` | `approval:required` / `agent:completed` |
| `user:typing` | `agent:processing` |

---

## 7. Notification System (Human-in-the-Loop)

### Key Files

| File | Description |
|------|-------------|
| `frontend/src/types/notification.ts` | Notification type definitions |
| `backend/src/modules/notifications/notifications.service.ts` | Full notification service |

### Notification Types

```typescript
export type NotificationType =
  | "TASK_ASSIGNED"
  | "TASK_STATUS_CHANGED"
  | "TASK_COMMENTED"
  | "TASK_DUE_SOON"
  | "PROJECT_CREATED"
  | "PROJECT_UPDATED"
  | "WORKSPACE_INVITED"
  | "MENTION"
  | "SYSTEM";

export type NotificationPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
```

### Notification Interface

```typescript
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  isRead: boolean;
  entityType?: string;     // "Task", "Project", etc.
  entityId?: string;       // Link to related entity
  actionUrl?: string;      // Deep link for action
  userId: string;
  organizationId?: string;
  createdBy?: string;
  createdAt: string;
  readAt?: string;
  createdByUser?: {        // Who triggered the notification
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
}
```

### Application for AI Business Hub Approvals

```typescript
// Map to AI Business Hub approval workflow
interface AgentApprovalNotification extends Notification {
  type: "AGENT_APPROVAL_REQUIRED" | "AGENT_ACTION_COMPLETED";
  entityType: "AgentTask" | "AIContent" | "EmailDraft";
  approvalOptions?: {
    approve: { label: string; action: string };
    reject: { label: string; action: string };
    edit: { label: string; action: string };
  };
  agentId: string;
  confidenceScore?: number;  // For auto-approval threshold
}
```

---

## 8. Automation Executor Pattern (Intent Recognition)

### Key Files

| File | Description |
|------|-------------|
| `frontend/src/lib/automation-executor.ts` | Intent parsing + action execution |

### Pattern Summary

Taskosaur uses regex-based intent recognition to map natural language to actions:

```typescript
class AutomationExecutor {
  // Map action names to actual functions
  private actionMap: Record<string, (...args: any[]) => any> = {
    createWorkspace: automation.createWorkspace,
    createTask: automation.createTask,
    updateTaskStatus: automation.updateTaskStatus,
    // ... more actions
  };

  // Parse natural language to intent
  parseUserIntent(message: string, context: ExecutionContext): ParsedIntent | null {
    const intentPatterns = [
      {
        pattern: /(?:create|add|make|new)\s+(?:a\s+)?task\s+(?:called|named)?\s*["\']?([^"'\n]+)["\']?/i,
        action: "createTask",
        extractor: (match) => ({ taskTitle: match[1].trim(), ...context }),
      },
      // ... more patterns
    ];

    for (const { pattern, action, extractor } of intentPatterns) {
      const match = message.match(pattern);
      if (match) {
        return { action, parameters: extractor(match), confidence: 0.8 };
      }
    }
    return null;
  }

  // Execute the matched action
  async executeAction(action: string, parameters: Record<string, any>): Promise<AutomationResult> {
    const fn = this.actionMap[action];
    const args = this.prepareArguments(action, parameters);
    return await fn(...args);
  }
}
```

### Application for AI Business Hub

For conversational workflow creation, consider:
- **Use LLM for intent** instead of regex (more flexible)
- **Keep action mapping pattern** (clean separation)
- **Add validation layer** before execution (human approval gates)

```typescript
// AI Business Hub adaptation
interface WorkflowIntent {
  action: "create_email_sequence" | "generate_content" | "schedule_social";
  parameters: Record<string, any>;
  confidence: number;
  requiresApproval: boolean;  // Based on confidence threshold
}
```

---

## 9. API Client Architecture

### Key Files

| File | Description |
|------|-------------|
| `frontend/src/lib/api.ts` | Full API client with interceptors |

### Token Management

```typescript
const TokenManager = {
  getAccessToken: () => localStorage.getItem("access_token"),
  setAccessToken: (token: string) => localStorage.setItem("access_token", token),
  getRefreshToken: () => Cookies.get("refresh_token"),
  setRefreshToken: (token: string) => Cookies.set("refresh_token", token, {
    expires: 30, // 30 days
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  }),
  getCurrentOrgId: () => localStorage.getItem("currentOrganizationId"),
  clearTokens: () => { /* clear all */ },
};
```

### Request/Response Interceptors

```typescript
// Request interceptor - adds auth headers
api.interceptors.request.use((config) => {
  const token = TokenManager.getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;

  const orgId = TokenManager.getCurrentOrgId();
  if (orgId) config.headers["X-Organization-ID"] = orgId;

  return config;
});

// Response interceptor - handles 401, retry, refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Handle 401 - refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const newToken = await refreshTokens();
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return api(originalRequest);
    }

    // Retry on network errors with exponential backoff
    if (shouldRetry && retryCount <= MAX_RETRY_ATTEMPTS) {
      const delay = RETRY_DELAY_BASE * Math.pow(2, retryCount - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
      return api(originalRequest);
    }

    return Promise.reject(handleApiError(error));
  }
);
```

### Adoption Recommendation

- [x] **Adopt as-is**
- Token management pattern is production-ready
- Refresh token queue prevents race conditions
- Exponential backoff is properly implemented

---

## 10. UI/UX Patterns for Task Management

### Key Files

| File | Description |
|------|-------------|
| `frontend/src/components/tasks/KanbanBoard.tsx` | Drag-and-drop Kanban |
| `frontend/src/components/tasks/TaskCard.tsx` | Task card with metadata |
| `frontend/src/components/tasks/views/*.tsx` | Multiple view types |

### Multiple View Types

Taskosaur supports multiple task views:
1. **Kanban Board** - Drag-and-drop columns by status
2. **List View** - Table with sortable columns
3. **Calendar View** - Due date visualization
4. **Gantt View** - Timeline/dependency visualization

### Kanban Implementation

```typescript
// Drag-and-drop hook
const { dragState, handleDragStart, handleDragOver, handleDrop, handleDragEnd } = useDragAndDrop({
  onDrop: async (task, fromStatusId, toStatusId) => {
    await updateTaskStatus(task.id, toStatusId);
    onRefresh?.();
  },
});

// Column pagination - load more as user scrolls
const handleColumnScroll = async (statusId: string, currentPage: number) => {
  if (!status.pagination.hasNextPage) return;
  await onLoadMore(statusId, currentPage + 1);
};
```

### Task Card Pattern

```typescript
interface TaskCardProps {
  task: Task;
  onDragStart: () => void;
  onDragEnd: () => void;
  isDragging: boolean;
}

// Visual indicators
- Type icon (Bug=red, Story=green, Epic=purple, Subtask=blue)
- Priority badge (HIGHEST=🔴, HIGH=🟠, MEDIUM=🟡, LOW=🟢)
- Due date with color coding (overdue=red, today=orange, soon=yellow)
- Assignee avatar
- Metadata counts (subtasks, comments, attachments)
- Email integration indicator (if created from email)
```

### Slide-Out Detail Modal

```typescript
<CustomModal
  animation="slide-right"
  height="h-screen"
  width="w-full md:w-[80%] lg:w-[60%]"
  position="items-start justify-end"
  closeOnOverlayClick={true}
>
  <TaskDetailClient task={task} />
</CustomModal>
```

### Application for AI Business Hub Product Task Manager

```typescript
// Map to AI Business Hub product creation workflow
interface ProductTask {
  id: string;
  title: string;
  type: "RESEARCH" | "CONTENT" | "DESIGN" | "REVIEW" | "LAUNCH";
  status: "TODO" | "AI_PROCESSING" | "AWAITING_APPROVAL" | "IN_PROGRESS" | "DONE";
  assignedAgent?: string;  // AI agent handling this
  assignedUser?: string;   // Human owner
  confidenceScore?: number;
  aiOutput?: {
    type: "draft" | "suggestion" | "analysis";
    content: string;
    generatedAt: Date;
  };
}

// Visual indicators for AI tasks
- Agent avatar/icon instead of user avatar
- Confidence score badge
- "AI Generated" tag
- Approval action buttons (Approve/Edit/Reject)
```

---

## 11. User Flow Summary

### Taskosaur User Flow

```
1. Login → Organization Selection → Workspace Selection
2. Workspace → Projects List → Select Project
3. Project → Task Views (Kanban/List/Calendar/Gantt)
4. Task → Click to open slide-out detail modal
5. Chat Panel → Toggle from header → AI assistant for commands
```

### AI Business Hub Adaptation

```
1. Login → Organization Selection → Module Selection (CRM/Content/Email/etc.)
2. Module Dashboard → Quick Stats + Pending Approvals
3. Agent Activity Feed → Real-time updates via WebSocket
4. Approval Queue → Human-in-the-loop tasks
5. Chat Panel → Conversational workflow creation + agent commands
6. Product Creation Flow:
   - "Create new product campaign" → Intent parsed
   - Agent assigns tasks: Research → Content → Design → Review
   - Each stage can be Kanban board with AI tasks
   - Human approves/edits at gates
```

---

## Summary: What to Adopt for AI Business Hub

### Adopt As-Is

| Pattern | Source File | Rationale |
|---------|-------------|-----------|
| BYOAI multi-provider | `ai-chat.service.ts` | Clean, extensible |
| Token management | `api.ts` | Production-ready |
| WebSocket rooms | `events.gateway.ts` | Scalable architecture |
| Notification types | `notification.ts` | Maps to approvals |
| Task card UI | `TaskCard.tsx` | Good UX patterns |

### Adapt for AI Business Hub

| Pattern | Changes Needed |
|---------|---------------|
| Simulated streaming | Replace with SSE for real streaming |
| Regex intent parsing | Use LLM + function calling |
| Task types | Add AI-specific types (RESEARCH, CONTENT, etc.) |
| Approval workflow | Add confidence scores + auto-approval thresholds |
| Chat panel | Add agent activity visualization |

### Avoid

| Pattern | Reason |
|---------|--------|
| Command syntax `[COMMAND: x]` | Over-engineered, use native LLM tools |
| DOM-based automation | Fragile, prefer API calls |
| Custom crypto | Use native Node.js crypto |

---

## 12. Authentication System (Deep Dive)

### Key Files

| File | Description |
|------|-------------|
| `backend/src/modules/auth/auth.service.ts` | Core auth service (375 lines) |
| `backend/src/modules/auth/strategies/jwt.strategy.ts` | Passport JWT strategy |
| `backend/src/modules/auth/guards/jwt-auth.guard.ts` | JWT guard with public route support |
| `backend/src/modules/auth/guards/roles.guard.ts` | Role-based access control |
| `backend/src/modules/auth/decorators/public.decorator.ts` | `@Public()` decorator |

### JWT Token Flow

```typescript
// auth.service.ts - Token generation
const payload: JwtPayload = {
  sub: user.id,      // Subject (user ID)
  email: user.email,
  role: user.role,   // User's global role
};

const accessToken = this.jwtService.sign(payload);
const refreshToken = this.jwtService.sign(payload, {
  expiresIn: '7d', // Configurable via JWT_REFRESH_EXPIRES_IN
});

// Store refresh token in database for validation
await this.usersService.updateRefreshToken(user.id, refreshToken);
```

### JWT Strategy Pattern

```typescript
// jwt.strategy.ts - Passport integration
export interface JwtPayload {
  sub: string;     // User ID
  email: string;
  role: string;
  iat?: number;    // Issued at
  exp?: number;    // Expiration
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService, usersService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.usersService.findOne(payload.sub);
    if (!user) throw new UnauthorizedException('User not found');
    return { id: user.id, email: user.email, role: user.role };
  }
}
```

### Guard Composition

```typescript
// jwt-auth.guard.ts - Supports @Public() decorator
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // Check for @Public() decorator
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return true;
    return super.canActivate(context);
  }
}

// Public decorator - skip auth for specific routes
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
```

### Hierarchical Role-Based Access Control (RBAC)

```typescript
// roles.guard.ts - Multi-scope RBAC
type ScopeType = 'ORGANIZATION' | 'WORKSPACE' | 'PROJECT';

// Role hierarchy (higher number = more permissions)
const ROLE_RANK = {
  VIEWER: 1,
  MEMBER: 2,
  ADMIN: 3,
  OWNER: 4,
  SUPER_ADMIN: 100, // Bypass all checks
};

// Check membership at the appropriate scope level
async getMemberRole(type: ScopeType, userId: string, scopeId: string) {
  switch (type) {
    case 'ORGANIZATION':
      return await prisma.organizationMember.findUnique({...});
    case 'WORKSPACE':
      return await prisma.workspaceMember.findUnique({...});
    case 'PROJECT':
      return await prisma.projectMember.findUnique({...});
  }
}
```

### Password Reset Flow

```typescript
// Secure password reset implementation
async forgotPassword(email: string) {
  const resetToken = crypto.randomBytes(32).toString('hex');
  const hashedResetToken = await bcrypt.hash(resetToken, 10);

  await this.usersService.updateResetToken(
    user.id,
    hashedResetToken,
    new Date(Date.now() + 24 * 60 * 60 * 1000) // 24hr expiry
  );

  const resetUrl = `${FRONTEND_URL}/reset-password?token=${resetToken}`;
  await this.emailService.sendPasswordResetEmail(email, { resetUrl });
}

async resetPassword(token: string, newPassword: string) {
  // Validate password strength
  if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
    throw new BadRequestException('Password must contain uppercase, lowercase, and number');
  }

  // Find user by comparing hashed tokens (secure lookup)
  for (const user of await this.usersService.findAllUsersWithResetTokens()) {
    if (await bcrypt.compare(token, user.resetToken)) {
      // Found valid user - update password
    }
  }

  // Transaction: update password + clear tokens + invalidate sessions
  await this.prisma.$transaction([
    updatePassword,
    clearResetToken,
    invalidateRefreshTokens, // Force re-login on all devices
  ]);
}
```

### Application for AI Business Hub

```typescript
// Enhanced auth for AI Business Hub
interface AIBusinessHubAuthPayload extends JwtPayload {
  sub: string;
  email: string;
  role: string;
  // AI-specific additions
  apiQuota?: {
    remaining: number;
    resetAt: Date;
  };
  moduleAccess?: string[]; // ['crm', 'content', 'email']
  agentPermissions?: {
    canCreateAgents: boolean;
    canApproveOutput: boolean;
    autoApprovalThreshold: number; // 0-100 confidence
  };
}

// Module-level RBAC (adapt from project-level)
type ModuleScopeType = 'ORGANIZATION' | 'MODULE' | 'AGENT';

// Decorator for agent endpoints
export const RequiresAgentPermission = (permission: string) =>
  SetMetadata('agentPermission', permission);
```

### Adoption Recommendation

- [x] **Adopt with enhancements**
- Adopt: JWT + refresh token pattern, hierarchical RBAC, public decorator
- Adopt: Password reset with secure token comparison
- Enhance: Add API quota tracking in JWT payload
- Enhance: Add module-level permissions
- Consider: OAuth2 integration for enterprise customers

---

## 13. Email/Inbox Integration (Deep Dive)

### Key Files

| File | Description |
|------|-------------|
| `backend/src/modules/inbox/services/email-sync.service.ts` | IMAP sync (1383 lines) |
| `backend/src/modules/inbox/services/email-reply.service.ts` | SMTP outbound |
| `backend/src/modules/inbox/dto/create-rule.dto.ts` | Inbox rule definitions |
| `backend/src/modules/inbox/utils/email-sync.utils.ts` | Email parsing utilities |

### IMAP Synchronization Architecture

```typescript
// Scheduled sync every 5 minutes
@Cron(CronExpression.EVERY_5_MINUTES)
async syncAllInboxes() {
  const accounts = await this.prisma.emailAccount.findMany({
    where: {
      syncEnabled: true,
      projectInbox: { enabled: true },
    },
  });

  for (const account of accounts) {
    // Check if enough time has passed since last sync
    const shouldSync = !account.lastSyncAt ||
      now.getTime() - account.lastSyncAt.getTime() >= syncIntervalMinutes * 60 * 1000;

    if (shouldSync) {
      await this.syncInbox(account);
    }
  }
}
```

### IMAP Connection with Robust Error Handling

```typescript
// ImapFlow client configuration
const client = new ImapFlow({
  host: account.imapHost,
  port: account.imapPort || 993,
  secure: account.imapUseSsl !== false,
  auth: {
    user: account.imapUsername,
    pass: this.crypto.decrypt(account.imapPassword), // Encrypted storage
  },
  // TLS configuration
  tls: {
    rejectUnauthorized: account.imapTlsRejectUnauth !== false,
    minVersion: account.imapTlsMinVersion || 'TLSv1.2',
    servername: account.imapServername, // SNI for IP-based connections
  },
  // Timeout safety
  socketTimeout: 120000,
  greetingTimeout: 60000,
  connectionTimeout: 60000,
  disableAutoIdle: true,
});

// Timeout wrapper for connection
await Promise.race([
  client.connect(),
  new Promise((_, reject) =>
    setTimeout(() => reject(new Error('IMAP connect timeout')), 60000)
  ),
]);
```

### Email Thread Detection

```typescript
// Thread ID extraction for conversation grouping
static extractThreadId(message: EmailMessage): string {
  // Priority: References > In-Reply-To > Message-ID
  if (message.references?.length) {
    return message.references[0]; // First reference is original message
  }
  if (message.inReplyTo) {
    return message.inReplyTo;
  }
  return message.messageId; // New thread
}
```

### Auto-Create Tasks from Emails

```typescript
// Convert email to task (or comment on existing task)
async autoCreateTask(message: InboxMessage, inbox: ProjectInbox, reporterId: string) {
  // Find existing task by thread ID (for replies)
  const existingTask = await this.prisma.task.findFirst({
    where: {
      emailThreadId: message.threadId,
      projectId: inbox.projectId,
    },
  });

  if (existingTask) {
    // Add as comment to existing task
    await this.prisma.taskComment.create({
      data: {
        taskId: existingTask.id,
        authorId: reporterId,
        content: message.bodyHtml || message.bodyText,
        emailMessageId: message.messageId, // Link to original email
      },
    });
  } else {
    // Create new task
    const task = await this.prisma.task.create({
      data: {
        title: message.subject,
        description: message.bodyHtml || message.bodyText,
        emailThreadId: message.threadId,
        allowEmailReplies: true,
        inboxMessageId: message.id,
        // Apply rule results
        priority: ruleResult?.priority || inbox.defaultPriority,
        statusId: inbox.defaultStatusId,
      },
    });
  }
}
```

### Inbox Rules Engine

```typescript
// Rule definition (create-rule.dto.ts)
interface InboxRule {
  name: string;
  priority: number;        // Higher runs first
  enabled: boolean;
  stopOnMatch: boolean;    // Stop processing further rules

  // Condition structure
  conditions: {
    any?: RuleCondition[];  // OR matching
    all?: RuleCondition[];  // AND matching
  };

  // Actions to execute
  actions: {
    setPriority?: 'LOWEST' | 'LOW' | 'MEDIUM' | 'HIGH' | 'HIGHEST';
    assignTo?: string;      // User ID
    addLabels?: string[];   // Label IDs
    setTaskType?: string;
    markAsSpam?: boolean;
    autoReply?: string;     // Template content
  };
}

// Condition operators
interface RuleCondition {
  field: 'from' | 'subject' | 'body' | 'to' | 'cc';
  operator: 'contains' | 'equals' | 'matches' | 'startsWith' | 'endsWith';
  value: string;
}

// Example rule
{
  name: "VIP Customer",
  priority: 100,
  conditions: {
    any: [
      { from: { contains: "@vip-customer.com" } },
      { subject: { matches: "urgent|critical" } },
    ],
  },
  actions: {
    setPriority: "HIGH",
    assignTo: "user-id",
    addLabels: ["vip", "urgent"],
  },
  stopOnMatch: true,
}
```

### Rule Evaluation Engine

```typescript
private evaluateCondition(condition: any, message: any): boolean {
  for (const [field, rules] of Object.entries(condition)) {
    const fieldValue = this.getFieldValue(field, message);

    for (const [operator, value] of Object.entries(rules)) {
      switch (operator) {
        case 'contains':
          return fieldValue?.toLowerCase().includes(value.toLowerCase());
        case 'equals':
          return fieldValue === value;
        case 'matches':
          return new RegExp(value, 'i').test(fieldValue);
        case 'startsWith':
          return fieldValue?.toLowerCase().startsWith(value.toLowerCase());
        case 'endsWith':
          return fieldValue?.toLowerCase().endsWith(value.toLowerCase());
      }
    }
  }
  return false;
}
```

### Auto-Reply via SMTP

```typescript
// Send auto-reply using configured SMTP
const transporter = nodemailer.createTransport({
  host: account.smtpHost,
  port: account.smtpPort,
  secure: account.smtpPort === 465,
  requireTLS: account.smtpRequireTls,
  auth: {
    user: account.smtpUsername,
    pass: this.crypto.decrypt(account.smtpPassword),
  },
  tls: {
    rejectUnauthorized: account.smtpTlsRejectUnauth !== false,
    minVersion: account.smtpTlsMinVersion || 'TLSv1.2',
  },
});

await transporter.sendMail({
  from: `${inbox.name} <${account.emailAddress}>`,
  to: message.fromEmail,
  subject: `Re: ${message.subject}`,
  text: template,
  html: template.replace(/\n/g, '<br>'),
  inReplyTo: message.messageId, // Thread linking
});
```

### User Auto-Creation from Email

```typescript
// Create user account for external email senders
async findOrCreateUserFromEmail(
  fromField: string,
  organizationId: string,
  workspaceId: string,
  projectId: string
): Promise<User> {
  const email = EmailSyncUtils.extractEmail(fromField);
  let user = await this.prisma.user.findUnique({ where: { email } });

  if (!user) {
    // Generate secure random password (user must reset)
    const secureRandomPassword = randomBytes(32).toString('hex');
    const hashedPassword = await bcrypt.hash(secureRandomPassword, 10);

    user = await this.prisma.user.create({
      data: {
        email,
        firstName: extractedName || email.split('@')[0],
        username: await this.generateUniqueUsername(email),
        password: hashedPassword,
        source: UserSource.EMAIL_INBOX, // Track origin
        role: 'VIEWER',
      },
    });

    // Add to org/workspace/project with VIEWER role
    await this.prisma.$transaction([
      prisma.organizationMember.create({ userId: user.id, organizationId, role: 'VIEWER' }),
      prisma.workspaceMember.create({ userId: user.id, workspaceId, role: 'VIEWER' }),
      prisma.projectMember.create({ userId: user.id, projectId, role: 'VIEWER' }),
    ]);
  }

  return user;
}
```

### Application for AI Business Hub (BMX Module)

```typescript
// AI Business Hub email integration patterns
interface AIEmailProcessor {
  // Analyze incoming email with AI
  async analyzeEmail(message: InboxMessage): Promise<EmailAnalysis> {
    return {
      intent: 'support_request' | 'sales_inquiry' | 'feedback' | 'spam',
      sentiment: 'positive' | 'neutral' | 'negative',
      urgency: 1-10,
      suggestedLabels: string[],
      suggestedResponse?: string,
      confidenceScore: number,
    };
  }

  // AI-powered auto-reply drafting
  async draftReply(message: InboxMessage, context: CustomerContext): Promise<EmailDraft> {
    return {
      subject: string,
      body: string,
      requiresApproval: boolean, // Based on confidence
      suggestedActions: string[],
    };
  }
}

// Rules engine with AI enhancement
interface AIEnhancedRule extends InboxRule {
  aiConditions?: {
    intentIs?: string[];        // AI-detected intent
    sentimentIs?: string[];     // AI-detected sentiment
    urgencyAbove?: number;      // AI-detected urgency threshold
  };
  aiActions?: {
    generateDraft?: boolean;    // AI draft response
    summarize?: boolean;        // AI summary
    extractEntities?: boolean;  // Extract names, dates, etc.
  };
}
```

### Adoption Recommendation

- [x] **Adopt with AI enhancements**
- Adopt: IMAP sync pattern, thread detection, rules engine
- Adopt: User auto-creation from email (for customer onboarding)
- Adopt: SMTP auto-reply architecture
- Enhance: Add AI analysis layer for intent/sentiment
- Enhance: AI-powered draft generation
- Consider: Webhook integration for email providers (Gmail API, Microsoft Graph)

---

## 14. Queue System (Deep Dive)

### Key Files

| File | Description |
|------|-------------|
| `backend/src/modules/queue/services/queue.service.ts` | Queue management |
| `backend/src/modules/queue/providers/queue.provider.ts` | Adapter factory with fallback |
| `backend/src/modules/queue/interfaces/queue.interface.ts` | Generic queue interface |
| `backend/src/modules/queue/adapters/bullmq/bullmq.adapter.ts` | BullMQ (Redis) implementation |
| `backend/src/modules/queue/adapters/better-queue/better-queue.adapter.ts` | In-memory fallback |

### Abstract Queue Interface

```typescript
// queue.interface.ts - Provider-agnostic interface
interface IQueue<T = any> {
  readonly name: string;

  // Job operations
  add(name: string, data: T, options?: JobOptions): Promise<IJob<T>>;
  addBulk(jobs: BulkJobOptions<T>[]): Promise<IJob<T>[]>;

  // Job retrieval
  getJob(jobId: string): Promise<IJob<T> | null>;
  getJobs(statuses: JobStatus[]): Promise<IJob<T>[]>;
  getWaiting(): Promise<IJob<T>[]>;
  getActive(): Promise<IJob<T>[]>;
  getCompleted(): Promise<IJob<T>[]>;
  getFailed(): Promise<IJob<T>[]>;

  // Queue control
  pause(): Promise<void>;
  resume(): Promise<void>;
  close(): Promise<void>;
  isPaused(): Promise<boolean>;

  // Maintenance
  clean(grace: number, limit: number, status: JobStatus): Promise<void>;
  obliterate(): Promise<void>;
  drain(): Promise<void>;

  // Statistics
  getStats(): Promise<QueueStats>;

  // Event listeners
  on(event: QueueEvent, handler: (...args: any[]) => void): void;
  off(event: QueueEvent, handler: (...args: any[]) => void): void;
  once(event: QueueEvent, handler: (...args: any[]) => void): void;
}

interface JobOptions {
  priority?: number;
  delay?: number;       // Delay in ms
  attempts?: number;    // Retry attempts
  backoff?: {
    type: 'fixed' | 'exponential';
    delay: number;
  };
  removeOnComplete?: boolean | number; // Keep last N
  removeOnFail?: boolean | number;
}
```

### Adapter Factory with Intelligent Fallback

```typescript
// queue.provider.ts - Graceful degradation
@Injectable()
export class QueueProviderFactory {
  private requestedBackend: string;
  private actualBackend: string;
  private fallbackOccurred = false;
  private redisAvailable = false;

  async createAdapter(): Promise<IQueueAdapter> {
    this.requestedBackend = this.config.backend || QueueBackend.BULLMQ;

    if (this.requestedBackend === QueueBackend.BULLMQ) {
      return await this.createBullMQAdapter();
    }
    if (this.requestedBackend === QueueBackend.BETTER_QUEUE) {
      return await this.createBetterQueueAdapter();
    }
  }

  private async createBullMQAdapter(): Promise<IQueueAdapter> {
    // Validate Redis connection first
    this.redisAvailable = await this.redisValidator.checkConnection(
      this.config.bullmq.connection
    );

    if (this.redisAvailable) {
      this.actualBackend = QueueBackend.BULLMQ;
      return new BullMQAdapter(this.config.bullmq);
    }

    // Redis unavailable - fallback to in-memory
    if (this.config.enableFallback ?? true) {
      this.logger.warn('Redis unavailable - falling back to better-queue (in-memory)');
      this.fallbackOccurred = true;
      return await this.createBetterQueueAdapter();
    }

    throw new Error('Redis unavailable and fallback disabled');
  }
}
```

### BullMQ Adapter (Redis-backed)

```typescript
// bullmq.adapter.ts - Production queue
class BullMQAdapter implements IQueueAdapter {
  private readonly queues = new Map<string, IQueue>();
  private readonly workers = new Map<string, IWorker>();

  createQueue<T>(name: string, config?: any): IQueue<T> {
    const queueOptions: QueueOptions = {
      connection: this.config.connection, // Redis connection
      defaultJobOptions: this.config.defaultJobOptions,
      prefix: this.config.prefix, // Key prefix for multi-tenant
    };

    const queue = new BullMQQueueAdapter<T>(name, queueOptions);
    this.queues.set(name, queue);
    return queue;
  }

  createWorker<T>(name: string, processor: WorkerProcessor<T>): IWorker<T> {
    const worker = new BullMQWorkerAdapter<T>(name, processor, {
      connection: this.config.connection,
    });
    this.workers.set(name, worker);
    return worker;
  }

  async isHealthy(): Promise<boolean> {
    try {
      await this.redisClient.ping();
      return true;
    } catch {
      return false;
    }
  }
}
```

### Better-Queue Adapter (In-memory fallback)

```typescript
// better-queue.adapter.ts - Development/fallback
class BetterQueueAdapter implements IQueueAdapter {
  constructor(config?: BetterQueueConfig) {
    this.config = config || {
      store: 'memory',
      concurrent: 5,
      maxRetries: 3,
      retryDelay: 1000,
    };
  }

  // Always healthy - no external dependencies
  isHealthy(): Promise<boolean> {
    return Promise.resolve(true);
  }
}
```

### Queue Service (Singleton Manager)

```typescript
// queue.service.ts - Central queue management
@Injectable()
export class QueueService {
  private readonly queues = new Map<string, IQueue>();
  private adapter: IQueueAdapter | null = null;

  async initialize(): Promise<void> {
    this.adapter = await this.providerFactory.createAdapter();
  }

  registerQueue(name: string): void {
    if (this.queues.has(name)) {
      this.logger.warn(`Queue "${name}" already registered`);
      return;
    }
    const queue = this.adapter.createQueue(name);
    this.queues.set(name, queue);
  }

  getQueue<T>(name: string): IQueue<T> {
    const queue = this.queues.get(name);
    if (!queue) throw new Error(`Queue "${name}" not found`);
    return queue as IQueue<T>;
  }

  // Aggregated statistics across all queues
  async getGlobalStats(): Promise<AggregatedStats> {
    const stats = {
      totalQueues: this.queues.size,
      totalWaiting: 0,
      totalActive: 0,
      totalCompleted: 0,
      totalFailed: 0,
      totalDelayed: 0,
    };

    await Promise.all(
      Array.from(this.queues.values()).map(async (queue) => {
        const queueStats = await queue.getStats();
        stats.totalWaiting += queueStats.waiting;
        stats.totalActive += queueStats.active;
        // ... aggregate other stats
      })
    );

    return stats;
  }
}
```

### Queue Events

```typescript
enum QueueEvent {
  WAITING = 'waiting',
  ACTIVE = 'active',
  PROGRESS = 'progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  STALLED = 'stalled',
  DELAYED = 'delayed',
  DRAINED = 'drained',
  PAUSED = 'paused',
  RESUMED = 'resumed',
  ERROR = 'error',
}

enum JobStatus {
  WAITING = 'waiting',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  FAILED = 'failed',
  DELAYED = 'delayed',
  PAUSED = 'paused',
}
```

### Application for AI Business Hub

```typescript
// AI Business Hub queue architecture
interface AIBusinessHubQueues {
  // Agent task execution
  'agent:tasks': {
    agentId: string;
    taskType: 'research' | 'content' | 'email' | 'analysis';
    input: Record<string, any>;
    priority: number;
    timeout: number;
  };

  // Content generation pipeline
  'content:generation': {
    templateId: string;
    variables: Record<string, any>;
    outputFormat: 'html' | 'markdown' | 'json';
    approvalRequired: boolean;
  };

  // Email processing
  'email:outbound': {
    recipientId: string;
    templateId: string;
    scheduledAt?: Date;
    trackOpens: boolean;
    trackClicks: boolean;
  };

  // Background AI processing
  'ai:batch': {
    provider: 'openai' | 'anthropic' | 'openrouter';
    model: string;
    prompts: Array<{ id: string; prompt: string }>;
    callbackUrl: string;
  };
}

// Queue configuration for AI workloads
const AI_QUEUE_CONFIG = {
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
    removeOnComplete: 100, // Keep last 100 completed jobs
    removeOnFail: 500,     // Keep last 500 failed for debugging
  },
  limiter: {
    max: 10,        // Max concurrent jobs
    duration: 1000, // Per second
  },
};

// Priority levels for AI tasks
enum AITaskPriority {
  CRITICAL = 1,    // User-initiated, needs immediate response
  HIGH = 5,        // Important but can wait a few seconds
  NORMAL = 10,     // Background processing
  LOW = 20,        // Batch jobs, can wait minutes
  BACKGROUND = 50, // Non-urgent, run when idle
}
```

### Worker Pattern for AI Tasks

```typescript
// AI task processor
const aiTaskProcessor: WorkerProcessor<AITask> = async (job) => {
  const { agentId, taskType, input, timeout } = job.data;

  try {
    // Update job progress
    await job.updateProgress(10);

    // Execute with timeout
    const result = await Promise.race([
      executeAgentTask(agentId, taskType, input),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Task timeout')), timeout)
      ),
    ]);

    await job.updateProgress(100);
    return result;
  } catch (error) {
    // Log for debugging
    await job.log(`Failed: ${error.message}`);
    throw error; // Triggers retry with backoff
  }
};

// Register worker
queueService.getQueue('agent:tasks').createWorker(aiTaskProcessor);
```

### Adoption Recommendation

- [x] **Adopt as foundation for agent processing**
- Adopt: Abstract queue interface (enables provider switching)
- Adopt: BullMQ for production (Redis persistence, retries, rate limiting)
- Adopt: Better-queue fallback for development/testing
- Adopt: Global stats aggregation for monitoring dashboard
- Enhance: Add dead-letter queue for failed AI tasks
- Enhance: Add job scheduling for recurring agent tasks
- Consider: Separate queues by priority (critical vs batch)

---

## Next Steps for AI Business Hub Implementation

Based on this deep analysis, the recommended implementation order is:

### Phase 1: Foundation
1. **Auth System** - JWT + RBAC (Section 12)
2. **Queue System** - BullMQ infrastructure (Section 14)
3. **WebSocket Gateway** - Real-time updates (Section 6)

### Phase 2: Core Features
4. **BYOAI Provider** - Multi-provider AI (Section 2)
5. **Chat UI** - Conversational interface (Section 1)
6. **Task System** - Workflow management (Section 3)

### Phase 3: Module-Specific
7. **Email Integration** - BMX module foundation (Section 13)
8. **Notification System** - Approval workflows (Section 7)
9. **Automation Executor** - Intent recognition (Section 8)

### Phase 4: Polish
10. **UI/UX Patterns** - Kanban, task cards (Section 10)
11. **API Client** - Token management (Section 9)
12. **User Flow** - End-to-end experience (Section 11)

---

## 15. Project Management Module (BM-PM) - MOVED

> **Note**: Section 15 (BM-PM Architecture) and Section 16 (Plane Deep-Dive) have been extracted to dedicated module documentation for better organization.

### New Location

The BM-PM module architecture documentation is now located at:

- **Module Overview**: [`/docs/modules/bm-pm/README.md`](/docs/modules/bm-pm/README.md)
- **Architecture Specification**: [`/docs/modules/bm-pm/architecture.md`](/docs/modules/bm-pm/architecture.md)
- **Plane Analysis**: [`/docs/modules/bm-pm/research/plane-analysis.md`](/docs/modules/bm-pm/research/plane-analysis.md)

### Summary of Extracted Content

The extracted documentation includes:

**Architecture (Section 15)**:
- Core hierarchy design (Business → Product → Phase → Task)
- Plane pattern integration and mapping
- Complete TypeScript data models (Business, Product, Phase, AgentTask)
- Integration architecture (BMAD, Agno, WebSocket)
- Analytics requirements (Critical/Important/Nice-to-have)
- UI mockups (Product Dashboard, Phase View, Agent Activity Panel)
- Adoption recommendations and implementation priority

**Plane Analysis (Section 16)**:
- Tech stack and monorepo structure
- Key features: Inbox, Estimate Points, Issue Relations, Views, Pages
- Cycle analytics patterns
- Adoption checklist with priorities

---

## Summary: Taskosaur Patterns for AI Business Hub

This analysis document has covered 14 major pattern areas from Taskosaur that inform the AI Business Hub architecture:

### Core Patterns Adopted

1. **Authentication**: JWT + refresh tokens with hierarchical RBAC (Section 12)
2. **Real-time**: WebSocket with room-based subscriptions (Section 6)
3. **Queue System**: Abstract interface with BullMQ + fallback (Section 14)
4. **Email Integration**: IMAP sync with rules engine (Section 13)
5. **Task Management**: Kanban with status workflows (Section 3)
6. **Notification System**: Multi-channel delivery (Section 7)
7. **Analytics**: Sprint velocity, KPI metrics (Section 10)

### AI-Specific Enhancements

Based on the patterns analyzed, the following AI-specific enhancements are recommended:

1. **Agent Assignment**: Tasks can be human, agent, or hybrid
2. **Approval Workflows**: Confidence-based auto-approval
3. **Agent Monitoring**: Real-time progress and output streaming
4. **BYOAI Integration**: Per-business AI provider configuration
5. **BMAD Phases**: Template-driven workflow phases

### Related Documentation

- [BM-PM Module Architecture](/docs/modules/bm-pm/architecture.md) - Full module specification
- [Plane Analysis](/docs/modules/bm-pm/research/plane-analysis.md) - Additional patterns from Plane
- [MASTER-PLAN](/docs/MASTER-PLAN.md) - Overall architecture vision
- [MODULE-RESEARCH](/docs/archive/foundation-phase/MODULE-RESEARCH.md) - Module discovery and planning

### Next Implementation Steps

1. Finalize data models in Prisma schema
2. Build core Business/Product/Phase/Task APIs
3. Implement WebSocket gateway for real-time updates
4. Create agent assignment and execution framework
5. Build MVP dashboard with critical analytics
6. Add Views system for custom filtering
7. Integrate with Agno for multi-agent orchestration

This document serves as the pattern research reference, while the BM-PM module documentation provides the implementation specification.
