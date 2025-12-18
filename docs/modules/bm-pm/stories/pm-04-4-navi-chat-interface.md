# Story PM-04.4: Navi Chat Interface

**Epic:** PM-04 - AI Team: Navi, Sage, Chrono
**Status:** drafted
**Points:** 8

---

## User Story

As a **project user**,
I want **to interact with Navi through a conversational chat interface**,
So that **I can manage my project using natural language commands**.

---

## Acceptance Criteria

### AC1: Users Can Send Natural Language Messages to Navi
**Given** I am on a project page with the agent panel open
**When** I type a message and send it to Navi
**Then** Navi receives the message and responds contextually based on project state

### AC2: Navi Responds with Contextual Help Based on Project State
**Given** I ask Navi a question about the project
**When** Navi processes the query
**Then** Navi provides relevant information using project data and KB context

### AC3: Navi Can Execute Slash Commands
**Given** I type a slash command in the chat (e.g., /create-task, /assign)
**When** I send the command
**Then** Navi parses the command and executes the corresponding action or creates a suggestion

### AC4: Chat History is Persisted Per Project
**Given** I have chatted with Navi in a project
**When** I navigate away and return to the project
**Then** the chat history is restored and I can continue the conversation

---

## Technical Notes

### Chat Interface Component

**Location:** `apps/web/src/components/pm/agents/AgentChat.tsx`

Main chat interface component for conversing with agents:

```typescript
'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAgentChat } from '@/hooks/pm/useAgentChat';
import { cn } from '@/lib/utils';

interface AgentChatProps {
  projectId: string;
  agentName: 'navi' | 'sage' | 'chrono';
}

export function AgentChat({ projectId, agentName }: AgentChatProps) {
  const [message, setMessage] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    messages,
    isLoading,
    isSending,
    sendMessage,
    loadHistory,
  } = useAgentChat({ projectId, agentName });

  useEffect(() => {
    loadHistory();
  }, [projectId, agentName]);

  useEffect(() => {
    // Scroll to bottom on new messages
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!message.trim() || isSending) return;

    const userMessage = message;
    setMessage('');

    await sendMessage(userMessage);

    // Focus input after sending
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isSlashCommand = message.startsWith('/');

  return (
    <div className="flex flex-col h-full">
      {/* Chat Messages */}
      <ScrollArea
        ref={scrollRef}
        className="flex-1 p-4"
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <EmptyState agentName={agentName} />
        ) : (
          <div className="space-y-4">
            {messages.map((msg, idx) => (
              <ChatMessage
                key={idx}
                message={msg}
                agentName={agentName}
              />
            ))}
          </div>
        )}

        {isSending && (
          <div className="mt-4">
            <ChatMessage
              message={{
                role: 'AGENT',
                message: '',
                createdAt: new Date().toISOString(),
              }}
              agentName={agentName}
              isTyping
            />
          </div>
        )}
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t p-3">
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <input
              ref={inputRef}
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Ask ${agentName} anything...`}
              disabled={isSending}
              className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {isSlashCommand && (
              <div className="mt-1 text-xs text-muted-foreground">
                Slash command detected. Available: /create-task, /assign, /set-priority
              </div>
            )}
          </div>
          <Button
            size="sm"
            onClick={handleSend}
            disabled={!message.trim() || isSending}
          >
            {isSending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

function ChatMessage({
  message,
  agentName,
  isTyping = false,
}: {
  message: any;
  agentName: string;
  isTyping?: boolean;
}) {
  const isUser = message.role === 'USER';

  return (
    <div
      className={cn(
        'flex gap-3',
        isUser && 'flex-row-reverse'
      )}
    >
      <div className={cn(
        'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium',
        isUser ? 'bg-primary text-primary-foreground' : 'bg-accent text-accent-foreground'
      )}>
        {isUser ? 'You' : agentName[0].toUpperCase()}
      </div>

      <div
        className={cn(
          'flex-1 px-4 py-2 rounded-lg text-sm',
          isUser
            ? 'bg-primary text-primary-foreground ml-12'
            : 'bg-accent text-accent-foreground mr-12'
        )}
      >
        {isTyping ? (
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        ) : (
          <>
            <div className="whitespace-pre-wrap break-words">
              {message.message}
            </div>
            <div className="mt-1 text-xs opacity-60">
              {formatMessageTime(message.createdAt)}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function EmptyState({ agentName }: { agentName: string }) {
  const suggestions = {
    navi: [
      'What tasks are due today?',
      'Show me overdue tasks',
      'Create a task for API review',
      'What is blocking the project?',
    ],
    sage: [
      'Estimate this task',
      'How accurate are my estimates?',
      'Show me similar tasks',
    ],
    chrono: [
      'Start timer',
      'How much time did I spend this week?',
      'Show time report',
    ],
  };

  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      <div className="text-4xl mb-4">{getAgentEmoji(agentName)}</div>
      <h3 className="font-semibold mb-2">
        Chat with {agentName.charAt(0).toUpperCase() + agentName.slice(1)}
      </h3>
      <p className="text-sm text-muted-foreground mb-4">
        {getAgentDescription(agentName)}
      </p>
      <div className="text-xs text-muted-foreground mb-2">
        Try asking:
      </div>
      <div className="flex flex-col gap-1">
        {suggestions[agentName]?.map((suggestion, idx) => (
          <div
            key={idx}
            className="text-xs text-primary hover:underline cursor-pointer"
          >
            "{suggestion}"
          </div>
        ))}
      </div>
    </div>
  );
}

function getAgentEmoji(agentName: string): string {
  const emojis: Record<string, string> = {
    navi: '🧭',
    sage: '🎯',
    chrono: '⏱️',
  };
  return emojis[agentName] || '🤖';
}

function getAgentDescription(agentName: string): string {
  const descriptions: Record<string, string> = {
    navi: 'Your PM orchestration assistant. Ask about tasks, create items, and get project insights.',
    sage: 'Your estimation specialist. Get task estimates and learn from historical data.',
    chrono: 'Your time tracking assistant. Manage timers and generate time reports.',
  };
  return descriptions[agentName] || 'Your AI assistant';
}

function formatMessageTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;

  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}
```

### Chat Service Backend

**Location:** `apps/api/src/pm/agents/chat.service.ts`

Service for managing chat interactions and conversation history:

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { ConversationRole } from '@prisma/client';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get conversation history for a project and agent
   */
  async getConversationHistory(params: {
    workspaceId: string;
    projectId: string;
    agentName: string;
    limit?: number;
  }) {
    return this.prisma.agentConversation.findMany({
      where: {
        workspaceId: params.workspaceId,
        projectId: params.projectId,
        agentName: params.agentName,
      },
      orderBy: { createdAt: 'asc' },
      take: params.limit || 50,
    });
  }

  /**
   * Store a message in conversation history
   */
  async storeMessage(params: {
    workspaceId: string;
    projectId: string;
    userId: string;
    agentName: string;
    role: ConversationRole;
    message: string;
    metadata?: any;
  }) {
    return this.prisma.agentConversation.create({
      data: {
        workspaceId: params.workspaceId,
        projectId: params.projectId,
        userId: params.userId,
        agentName: params.agentName,
        role: params.role,
        message: params.message,
        metadata: params.metadata,
      },
    });
  }

  /**
   * Clear conversation history for a project and agent
   */
  async clearConversationHistory(params: {
    workspaceId: string;
    projectId: string;
    agentName: string;
  }) {
    return this.prisma.agentConversation.deleteMany({
      where: {
        workspaceId: params.workspaceId,
        projectId: params.projectId,
        agentName: params.agentName,
      },
    });
  }

  /**
   * Parse slash command from message
   */
  parseSlashCommand(message: string): {
    isCommand: boolean;
    command?: string;
    args?: string[];
  } {
    if (!message.startsWith('/')) {
      return { isCommand: false };
    }

    const parts = message.slice(1).split(' ');
    const command = parts[0];
    const args = parts.slice(1);

    return {
      isCommand: true,
      command,
      args,
    };
  }
}
```

### Slash Command Parser

**Location:** `agents/pm/tools/command_parser.py`

Utility for parsing and executing slash commands:

```python
from typing import Optional, Dict, Any
from agno import tool
import requests

class SlashCommandParser:
    """Parse and execute slash commands from chat."""

    COMMANDS = {
        'create-task': 'create_task_from_command',
        'assign': 'assign_task_from_command',
        'set-priority': 'set_priority_from_command',
        'move-to': 'move_task_from_command',
        'estimate': 'estimate_task_from_command',
        'start-timer': 'start_timer_from_command',
        'stop-timer': 'stop_timer_from_command',
    }

    @staticmethod
    def parse(message: str) -> Dict[str, Any]:
        """
        Parse slash command from message.

        Returns:
            {
                'is_command': bool,
                'command': str,
                'args': list,
                'raw_message': str
            }
        """
        if not message.startswith('/'):
            return {'is_command': False, 'raw_message': message}

        parts = message[1:].split(' ', 1)
        command = parts[0]
        args_str = parts[1] if len(parts) > 1 else ''

        return {
            'is_command': True,
            'command': command,
            'args': args_str,
            'raw_message': message,
        }


@tool
def create_task_from_command(args: str, project_id: str) -> dict:
    """
    Create a task from slash command.

    Command format: /create-task [title] --desc [description] --priority [priority]

    Example: /create-task API Review --desc Review the new API endpoints --priority HIGH
    """
    import re

    # Parse title (everything before first --)
    title_match = re.match(r'^([^-]+)', args)
    title = title_match.group(1).strip() if title_match else args

    # Parse flags
    description = None
    priority = 'MEDIUM'

    desc_match = re.search(r'--desc\s+([^-]+)', args)
    if desc_match:
        description = desc_match.group(1).strip()

    priority_match = re.search(r'--priority\s+(\w+)', args)
    if priority_match:
        priority = priority_match.group(1).upper()

    # Create suggestion for task creation
    suggestion = {
        'action': 'CREATE_TASK',
        'payload': {
            'title': title,
            'description': description,
            'priority': priority,
            'projectId': project_id,
        },
        'confidence': 0.85,  # High confidence for explicit commands
        'reasoning': f'User requested task creation via slash command',
    }

    return suggestion


@tool
def assign_task_from_command(args: str, project_id: str) -> dict:
    """
    Assign a task from slash command.

    Command format: /assign [task_id or task_title] to [assignee_name]

    Example: /assign API-123 to John
    Example: /assign "API Review" to Jane
    """
    import re

    # Parse: [task] to [assignee]
    match = re.match(r'^(.+?)\s+to\s+(.+)$', args, re.IGNORECASE)
    if not match:
        return {
            'error': 'Invalid format. Use: /assign [task] to [assignee]'
        }

    task_identifier = match.group(1).strip().strip('"')
    assignee_name = match.group(2).strip()

    # Search for task by ID or title
    response = requests.get(
        f"{API_URL}/api/pm/tasks",
        params={'projectId': project_id, 'search': task_identifier}
    )
    tasks = response.json()

    if not tasks:
        return {
            'error': f'Task not found: {task_identifier}'
        }

    task = tasks[0]

    # Search for user by name
    response = requests.get(
        f"{API_URL}/api/users/search",
        params={'query': assignee_name}
    )
    users = response.json()

    if not users:
        return {
            'error': f'User not found: {assignee_name}'
        }

    assignee = users[0]

    suggestion = {
        'action': 'ASSIGN_TASK',
        'payload': {
            'taskId': task['id'],
            'taskTitle': task['title'],
            'assigneeId': assignee['id'],
            'assigneeName': assignee['name'],
        },
        'confidence': 0.85,
        'reasoning': f'User requested assignment via slash command',
    }

    return suggestion


@tool
def set_priority_from_command(args: str, project_id: str) -> dict:
    """
    Set task priority from slash command.

    Command format: /set-priority [task] [URGENT|HIGH|MEDIUM|LOW]

    Example: /set-priority API-123 URGENT
    Example: /set-priority "API Review" HIGH
    """
    import re

    # Parse: [task] [priority]
    match = re.match(r'^(.+?)\s+(URGENT|HIGH|MEDIUM|LOW)$', args, re.IGNORECASE)
    if not match:
        return {
            'error': 'Invalid format. Use: /set-priority [task] [URGENT|HIGH|MEDIUM|LOW]'
        }

    task_identifier = match.group(1).strip().strip('"')
    priority = match.group(2).upper()

    # Search for task
    response = requests.get(
        f"{API_URL}/api/pm/tasks",
        params={'projectId': project_id, 'search': task_identifier}
    )
    tasks = response.json()

    if not tasks:
        return {
            'error': f'Task not found: {task_identifier}'
        }

    task = tasks[0]

    suggestion = {
        'action': 'SET_PRIORITY',
        'payload': {
            'taskId': task['id'],
            'taskTitle': task['title'],
            'priority': priority,
            'currentPriority': task.get('priority'),
        },
        'confidence': 0.9,
        'reasoning': f'User requested priority change via slash command',
    }

    return suggestion
```

### Custom Hook for Chat

**Location:** `apps/web/src/hooks/pm/useAgentChat.ts`

React hook for managing agent chat state:

```typescript
import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface Message {
  role: 'USER' | 'AGENT';
  message: string;
  metadata?: any;
  createdAt: string;
}

interface UseAgentChatParams {
  projectId: string;
  agentName: 'navi' | 'sage' | 'chrono';
}

export function useAgentChat({ projectId, agentName }: UseAgentChatParams) {
  const [messages, setMessages] = useState<Message[]>([]);
  const queryClient = useQueryClient();

  // Load conversation history
  const { isLoading } = useQuery({
    queryKey: ['agent-chat', projectId, agentName],
    queryFn: async () => {
      const response = await api.get(`/pm/agents/conversations/${projectId}`, {
        params: { agentName },
      });
      setMessages(response.data);
      return response.data;
    },
    staleTime: 0, // Always fresh
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      // Add user message immediately
      const userMessage: Message = {
        role: 'USER',
        message,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMessage]);

      // Send to agent
      const response = await api.post('/pm/agents/chat', {
        projectId,
        agentName,
        message,
      });

      return response.data;
    },
    onSuccess: (data) => {
      // Add agent response
      const agentMessage: Message = {
        role: 'AGENT',
        message: data.response,
        metadata: data.metadata,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, agentMessage]);

      // Invalidate queries that might have changed
      queryClient.invalidateQueries({ queryKey: ['suggestions'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: (error) => {
      console.error('Failed to send message:', error);
      // Remove the optimistic user message on error
      setMessages((prev) => prev.slice(0, -1));
    },
  });

  const sendMessage = useCallback(
    async (message: string) => {
      await sendMessageMutation.mutateAsync(message);
    },
    [sendMessageMutation]
  );

  const loadHistory = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['agent-chat', projectId, agentName] });
  }, [queryClient, projectId, agentName]);

  const clearHistory = useCallback(async () => {
    await api.delete(`/pm/agents/conversations/${projectId}`, {
      params: { agentName },
    });
    setMessages([]);
    queryClient.invalidateQueries({ queryKey: ['agent-chat', projectId, agentName] });
  }, [projectId, agentName, queryClient]);

  return {
    messages,
    isLoading,
    isSending: sendMessageMutation.isPending,
    sendMessage,
    loadHistory,
    clearHistory,
  };
}
```

### Agent Service Updates

**Location:** `apps/api/src/pm/agents/agents.service.ts`

Update AgentsService to handle slash commands:

```typescript
async chat(params: {
  workspaceId: string;
  projectId: string;
  userId: string;
  agentName: 'navi' | 'sage' | 'chrono';
  message: string;
}) {
  // Check if message is a slash command
  const commandInfo = this.chatService.parseSlashCommand(params.message);

  if (commandInfo.isCommand) {
    return this.handleSlashCommand({
      ...params,
      command: commandInfo.command!,
      args: commandInfo.args || [],
    });
  }

  // Regular chat flow
  const history = await this.chatService.getConversationHistory({
    workspaceId: params.workspaceId,
    projectId: params.projectId,
    agentName: params.agentName,
    limit: 50,
  });

  const response = await this.invokeAgent({
    sessionId: `${params.workspaceId}-${params.projectId}`,
    userId: params.userId,
    workspaceId: params.workspaceId,
    projectId: params.projectId,
    agentName: params.agentName,
    message: params.message,
    history,
  });

  // Store both user message and agent response
  await this.chatService.storeMessage({
    workspaceId: params.workspaceId,
    projectId: params.projectId,
    userId: params.userId,
    agentName: params.agentName,
    role: 'USER',
    message: params.message,
  });

  await this.chatService.storeMessage({
    workspaceId: params.workspaceId,
    projectId: params.projectId,
    userId: params.userId,
    agentName: params.agentName,
    role: 'AGENT',
    message: response.message,
    metadata: response.metadata,
  });

  return response;
}

private async handleSlashCommand(params: {
  workspaceId: string;
  projectId: string;
  userId: string;
  agentName: string;
  command: string;
  args: string[];
}) {
  // Invoke agent with command context
  const response = await this.invokeAgent({
    sessionId: `${params.workspaceId}-${params.projectId}`,
    userId: params.userId,
    workspaceId: params.workspaceId,
    projectId: params.projectId,
    agentName: params.agentName,
    message: `/${params.command} ${params.args.join(' ')}`,
    isCommand: true,
  });

  return response;
}
```

---

## Dependencies

### Prerequisites

- **PM-04.1** (Navi Agent Foundation) - Navi agent must exist
- **PM-04.3** (Navi Suggestion Cards) - Suggestions created from commands
- **PM-02** (Tasks) - Task operations for command execution

### Blocks

- None - This is a standalone feature within PM-04

---

## Tasks

### Backend Tasks
- [ ] Create `apps/api/src/pm/agents/chat.service.ts`
- [ ] Implement `getConversationHistory()` method
- [ ] Implement `storeMessage()` method
- [ ] Implement `clearConversationHistory()` method
- [ ] Implement `parseSlashCommand()` method
- [ ] Update `AgentsService.chat()` to handle slash commands
- [ ] Add chat history endpoint to `agents.controller.ts`
- [ ] Create DTOs: `GetConversationHistoryDto`

### Agent Layer Tasks
- [ ] Create `agents/pm/tools/command_parser.py`
- [ ] Implement `SlashCommandParser` class
- [ ] Implement `create_task_from_command` tool
- [ ] Implement `assign_task_from_command` tool
- [ ] Implement `set_priority_from_command` tool
- [ ] Add command parsing to Navi agent
- [ ] Update Navi instructions to recognize slash commands

### Frontend Tasks
- [ ] Create `apps/web/src/components/pm/agents/AgentChat.tsx`
- [ ] Create `apps/web/src/hooks/pm/useAgentChat.ts`
- [ ] Implement message history scrolling and persistence
- [ ] Implement typing indicator for agent responses
- [ ] Implement slash command autocomplete
- [ ] Add empty state with sample prompts
- [ ] Integrate AgentChat into AgentPanel component

### Integration Tasks
- [ ] Test conversation history persistence across sessions
- [ ] Test slash command parsing and execution
- [ ] Test message sending and receiving
- [ ] Test WebSocket real-time message delivery
- [ ] Test chat with multiple agents in same project
- [ ] Test conversation history limit (50 messages)

---

## Testing Requirements

### Unit Tests

**Backend (NestJS):**
- `ChatService.getConversationHistory()` returns messages in chronological order
- `ChatService.storeMessage()` creates conversation record
- `ChatService.parseSlashCommand()` correctly identifies commands
- `AgentsService.chat()` routes slash commands correctly
- Workspace isolation enforced
- Message history limited to 50 messages

**Location:** `apps/api/src/pm/agents/chat.service.spec.ts`

**Agents (Python):**
- `SlashCommandParser.parse()` extracts command and args
- `create_task_from_command` parses flags correctly
- `assign_task_from_command` finds task and assignee
- `set_priority_from_command` validates priority values
- Command tools return proper suggestions

**Location:** `agents/pm/tests/test_command_parser.py`

**Frontend (Vitest):**
- `AgentChat` component displays messages correctly
- User and agent messages have different styling
- Typing indicator shows during agent response
- Empty state displays sample prompts
- `useAgentChat` hook manages state correctly

**Location:** `apps/web/src/components/pm/agents/AgentChat.test.tsx`

### Integration Tests

**API Endpoints:**
- `POST /pm/agents/chat` stores conversation and returns response
- `GET /pm/agents/conversations/:projectId` returns history
- `DELETE /pm/agents/conversations/:projectId` clears history
- Slash commands create suggestions correctly
- WebSocket events sent on message

**Location:** `apps/api/test/pm/agents/chat.e2e-spec.ts`

### E2E Tests (Playwright)

**User Flows:**
1. Open agent panel → type message → send → agent responds → history persisted
2. Type "/create-task API Review" → send → suggestion card appears
3. Navigate away → return → chat history restored
4. Chat with Navi → switch to Sage → separate conversation histories
5. Ask "What tasks are due today?" → Navi responds with task list

**Location:** `apps/web/e2e/pm/agents/agent-chat.spec.ts`

---

## Definition of Done

- [ ] All acceptance criteria met
- [ ] Users can send natural language messages to Navi
- [ ] Navi responds with contextual help based on project state
- [ ] Slash commands parsed and executed correctly
- [ ] Chat history persisted per project and agent
- [ ] Conversation history restored across sessions
- [ ] Unit tests passing (backend + agents + frontend)
- [ ] Integration tests passing
- [ ] E2E tests passing
- [ ] Code reviewed and approved
- [ ] Documentation updated:
  - [ ] Slash command reference
  - [ ] Chat API endpoints
  - [ ] Agent command tools
- [ ] Workspace isolation verified
- [ ] No regressions in existing features

---

## References

- [Epic Definition](../epics/epic-pm-04-ai-team-navi-sage-chrono.md)
- [Epic Tech Spec](../epics/epic-pm-04-tech-spec.md)
- [Story PM-04.1 (Navi Foundation)](./pm-04-1-navi-agent-foundation.md)
- [Story PM-04.2 (Navi Daily Briefing)](./pm-04-2-navi-daily-briefing.md)
- [Story PM-04.3 (Navi Suggestion Cards)](./pm-04-3-navi-suggestion-cards.md)
- [Module PRD](../PRD.md)
- [Module Architecture](../architecture.md)
- [Sprint Status](../sprint-status.yaml)

---

## Dev Notes

### Chat Message Flow

```
1. User types message in AgentChat component
2. Frontend: useAgentChat.sendMessage()
   - Optimistically add user message to UI
   - POST /pm/agents/chat
3. Backend: AgentsService.chat()
   - Check if slash command
   - If command: handleSlashCommand()
   - Else: regular chat flow
4. Backend: Invoke agent via Agno
   - Load conversation history (last 50 messages)
   - Agent processes with context
   - Agent returns response
5. Backend: Store both messages in AgentConversation
6. Frontend: Add agent response to UI
7. WebSocket: Broadcast message to project room
```

### Slash Command Format

All slash commands follow the pattern:
```
/command [required-arg] --flag [value]
```

Supported commands:
- `/create-task [title] --desc [description] --priority [URGENT|HIGH|MEDIUM|LOW]`
- `/assign [task] to [assignee]`
- `/set-priority [task] [priority]`
- `/move-to [task] [phase]`
- `/estimate [task]`
- `/start-timer [task]`
- `/stop-timer`

### Conversation History Management

- Store last 50 messages per project per agent
- Order by `createdAt ASC` for display
- Clear old messages when limit exceeded
- Separate history for each agent (Navi, Sage, Chrono)
- User can manually clear history

### Message Persistence Strategy

Store every message immediately:
- User message stored before agent invocation
- Agent response stored after completion
- Both messages linked by timestamp
- Metadata stores agent response details (tool calls, suggestions, etc.)

### Typing Indicator

Show typing indicator while agent is processing:
- Display immediately after user sends message
- Show animated dots
- Remove when agent response arrives
- Timeout after 30 seconds with error message

### Empty State Prompts

Each agent has suggested prompts:

**Navi:**
- "What tasks are due today?"
- "Show me overdue tasks"
- "Create a task for API review"
- "What is blocking the project?"

**Sage:**
- "Estimate this task"
- "How accurate are my estimates?"
- "Show me similar tasks"

**Chrono:**
- "Start timer"
- "How much time did I spend this week?"
- "Show time report"

### Slash Command Autocomplete

Show hint when user types `/`:
```
Slash command detected. Available:
/create-task, /assign, /set-priority, /move-to, /estimate, /start-timer, /stop-timer
```

Consider implementing full autocomplete in Phase 2:
- Dropdown with command list
- Tab completion
- Inline help text

### WebSocket Integration

Subscribe to project room for real-time updates:
```typescript
socket.emit('project:subscribe', { projectId });
socket.on('agent:message', handleNewMessage);
```

This ensures multiple users see chat updates in real-time.

### Context Window Management

Limit conversation history to 50 messages to avoid token overflow:
- Agent receives last 50 messages as context
- Older messages still stored in DB
- User can view full history (paginated)
- Consider summarization for very long conversations (Phase 2)

### Multi-Agent Context Isolation

Each agent maintains separate conversation:
- Navi focuses on PM orchestration
- Sage focuses on estimation
- Chrono focuses on time tracking

Conversations don't cross-pollinate, ensuring focused interactions.

---

## Dev Agent Record

### Context Reference
- TBD - Will be created during story-context workflow

### Agent Model Used
- TBD

### Completion Notes List
- TBD

### File List
- TBD

---

## Senior Developer Review

**Reviewer:** TBD
**Date:** TBD
**Review Status:** PENDING

### Summary
TBD

### Code Quality
TBD

### Security
TBD

### Architecture
TBD

### Testing
TBD

### Acceptance Criteria Verification
TBD

### Issues Found
TBD

### Recommendations
TBD

### Decision
TBD
