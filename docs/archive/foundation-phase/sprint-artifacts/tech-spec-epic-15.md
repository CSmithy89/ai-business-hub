# Epic Technical Specification: UI/UX Platform Foundation

**Date:** 2025-12-11
**Author:** Party Mode (PM John, Architect Winston, Dev Amelia, SM Bob, UX Sally)
**Epic ID:** EPIC-15
**Status:** Draft
**Source:** UI-UX-IMPROVEMENTS-BACKLOG.md

---

## Overview

EPIC-15 implements the **UI/UX Platform Foundation** for the HYVVE platform, addressing critical user flow issues, style guide compliance gaps, and core functionality requirements identified through comprehensive user testing and design audits.

This epic transforms HYVVE from a functional prototype into a polished, production-ready platform by:
- **Fixing broken first impressions** - Users land on meaningful content, not "No Workspace Selected"
- **Completing core functionality** - Chat works, settings save, approvals load
- **Applying style guide compliance** - Premium shadows, proper icons, consistent styling
- **Enabling business workflows** - Portfolio, onboarding wizard, business switcher

## Objectives and Scope

### In Scope

- **Icon System Overhaul**: Replace all Material Icon text strings with Lucide React components
- **Landing Page Flow**: Businesses portfolio as post-sign-in destination
- **User Onboarding**: 4-step wizard (Workspace → BYOAI → AI Team → Ready)
- **Chat Integration**: Connect chat panel to Agno backend with streaming responses
- **Settings Pages**: Profile, Security, Sessions, Workspace General, Workspace Members
- **Approvals Fix**: Data loading, skeleton states, demo fallback
- **AI Configuration**: BYOAI provider management page
- **Business Module**: Portfolio page, switcher dropdown, enhanced wizard
- **Style Guide Compliance**: Cards, buttons, focus states, agent colors, chat styling

### Out of Scope

- Responsive design for mobile/tablet (EPIC-16)
- Micro-animations and page transitions (EPIC-16)
- Real-time WebSocket updates (EPIC-16)
- Keyboard shortcuts beyond chat toggle (EPIC-16)
- Empty state character illustrations (EPIC-16)
- Celebration moments/confetti (EPIC-16)

---

## System Architecture Alignment

### Components Referenced

| Component | Purpose | Package |
|-----------|---------|---------|
| Sidebar | Main navigation | `apps/web/src/components/layout/sidebar.tsx` |
| Header | Top bar with search, notifications | `apps/web/src/components/layout/header.tsx` |
| ChatPanel | AI agent conversation interface | `apps/web/src/components/chat/chat-panel.tsx` |
| BusinessCard | Business portfolio card | `apps/web/src/components/business/business-card.tsx` |
| OnboardingWizard | Multi-step onboarding | `apps/web/src/components/onboarding/` |
| SettingsPages | Account and workspace settings | `apps/web/src/app/(app)/settings/` |
| ApprovalCard | Approval queue item | `apps/web/src/components/approval/approval-card.tsx` |
| AgentCard | AI team member card | `apps/web/src/components/agents/agent-card.tsx` |
| AgentOSService | NestJS↔AgentOS bridge | `apps/api/src/agentos/agentos.service.ts` |

### Architecture Constraints

- **ADR-001**: better-auth for authentication (already implemented)
- **ADR-002**: Hybrid API - Settings are NestJS module APIs
- **ADR-003**: Multi-tenancy - All business/workspace data requires tenant isolation
- **ADR-007**: AgentOS for agent runtime - Chat connects via AgentOS service
- Icons must use Lucide React (per style guide Section 13.1)
- CSS must use design tokens as CSS custom properties
- All forms must use Zod validation schemas

---

## Detailed Design

### Story 15.1: Replace Material Icon Text Strings with Lucide Components

#### Technical Requirements

**Files to Modify:**
```
apps/web/src/components/layout/sidebar.tsx
apps/web/src/components/layout/header.tsx
apps/web/src/components/chat/chat-panel.tsx
apps/web/src/components/chat/chat-input.tsx
```

**Icon Mapping:**

| Current Text | Lucide Component | Import |
|--------------|------------------|--------|
| `grid_view` | `LayoutGrid` | `import { LayoutGrid } from 'lucide-react'` |
| `check_circle` | `CheckCircle` | `import { CheckCircle } from 'lucide-react'` |
| `smart_toy` | `Bot` | `import { Bot } from 'lucide-react'` |
| `settings` | `Settings` | `import { Settings } from 'lucide-react'` |
| `group` | `Users` | `import { Users } from 'lucide-react'` |
| `folder_open` | `Folder` | `import { Folder } from 'lucide-react'` |
| `search` | `Search` | `import { Search } from 'lucide-react'` |
| `notifications` | `Bell` | `import { Bell } from 'lucide-react'` |
| `help` | `HelpCircle` | `import { HelpCircle } from 'lucide-react'` |
| `expand_more` | `ChevronDown` | `import { ChevronDown } from 'lucide-react'` |

**Component Pattern:**
```tsx
// Before (broken)
<span className="material-icons">grid_view</span>

// After (correct)
import { LayoutGrid } from 'lucide-react';

<LayoutGrid className="h-5 w-5" />
```

**Icon Sizing Standards:**
- Navigation icons: `h-5 w-5` (20px)
- Inline icons: `h-4 w-4` (16px)
- Large icons: `h-6 w-6` (24px)

**Verification:**
```bash
# Search for remaining text icons
grep -r "material-icons\|grid_view\|check_circle\|smart_toy" apps/web/src/
```

---

### Story 15.2: Create Businesses Portfolio Landing Page

#### Technical Requirements

**New Files:**
```
apps/web/src/app/(app)/businesses/page.tsx
apps/web/src/components/business/business-card.tsx
apps/web/src/components/business/business-grid.tsx
apps/web/src/components/business/add-business-card.tsx
apps/web/src/hooks/use-businesses.ts
```

**Route Configuration:**
```typescript
// apps/web/src/app/(app)/businesses/page.tsx
import { BusinessGrid } from '@/components/business/business-grid';
import { AddBusinessCard } from '@/components/business/add-business-card';

export default function BusinessesPage() {
  const { businesses, isLoading, error } = useBusinesses();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Your Businesses</h1>
        <Button asChild>
          <Link href="/onboarding/wizard">
            <Plus className="h-4 w-4 mr-2" />
            Add Business
          </Link>
        </Button>
      </div>

      {isLoading && <BusinessGridSkeleton />}
      {error && <ErrorState onRetry={refetch} />}
      {businesses?.length === 0 && <EmptyBusinessState />}
      {businesses && <BusinessGrid businesses={businesses} />}
    </div>
  );
}
```

**Business Card Component:**
```typescript
// apps/web/src/components/business/business-card.tsx
interface BusinessCardProps {
  business: {
    id: string;
    name: string;
    logo?: string;
    status: 'draft' | 'validating' | 'planning' | 'branding' | 'active';
    validationScore?: number;
    planningProgress?: number;
    brandingProgress?: number;
    updatedAt: Date;
  };
}

export function BusinessCard({ business }: BusinessCardProps) {
  const statusColors = {
    draft: 'bg-gray-100 text-gray-700',
    validating: 'bg-blue-100 text-blue-700',
    planning: 'bg-purple-100 text-purple-700',
    branding: 'bg-pink-100 text-pink-700',
    active: 'bg-green-100 text-green-700',
  };

  return (
    <Card className="hover-lift cursor-pointer" onClick={() => router.push(`/businesses/${business.id}`)}>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Avatar>
            {business.logo ? (
              <AvatarImage src={business.logo} />
            ) : (
              <AvatarFallback>{business.name[0]}</AvatarFallback>
            )}
          </Avatar>
          <div>
            <CardTitle className="text-lg">{business.name}</CardTitle>
            <Badge className={statusColors[business.status]}>
              {business.status}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <ProgressItem label="Validation" value={business.validationScore} />
          <ProgressItem label="Planning" value={business.planningProgress} />
          <ProgressItem label="Branding" value={business.brandingProgress} />
        </div>
        <p className="text-sm text-muted-foreground mt-4">
          Updated {formatDistanceToNow(business.updatedAt)} ago
        </p>
      </CardContent>
      <CardFooter>
        <Button variant="ghost" className="w-full">
          Continue <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </CardFooter>
    </Card>
  );
}
```

**API Endpoint:**
```typescript
// apps/api/src/businesses/businesses.controller.ts
@Get()
@UseGuards(AuthGuard, TenantGuard)
async listBusinesses(
  @CurrentWorkspace() workspaceId: string,
  @Query('status') status?: string,
  @Query('search') search?: string,
  @Query('sortBy') sortBy?: 'name' | 'createdAt' | 'updatedAt',
  @Query('order') order?: 'asc' | 'desc',
) {
  return this.businessesService.findAll({
    workspaceId,
    status,
    search,
    sortBy,
    order,
  });
}
```

**Prisma Query:**
```typescript
// apps/api/src/businesses/businesses.service.ts
async findAll(params: ListBusinessesParams) {
  return this.prisma.business.findMany({
    where: {
      workspaceId: params.workspaceId,
      ...(params.status && { status: params.status }),
      ...(params.search && {
        name: { contains: params.search, mode: 'insensitive' },
      }),
    },
    orderBy: {
      [params.sortBy || 'updatedAt']: params.order || 'desc',
    },
    include: {
      _count: {
        select: { validationResults: true },
      },
    },
  });
}
```

---

### Story 15.3: Implement 4-Step User Onboarding Wizard

#### Technical Requirements

**New Files:**
```
apps/web/src/app/(auth)/onboarding/account-setup/page.tsx
apps/web/src/components/onboarding/onboarding-wizard.tsx
apps/web/src/components/onboarding/step-indicator.tsx
apps/web/src/components/onboarding/step-workspace.tsx
apps/web/src/components/onboarding/step-byoai.tsx
apps/web/src/components/onboarding/step-ai-team.tsx
apps/web/src/components/onboarding/step-complete.tsx
apps/web/src/hooks/use-onboarding.ts
```

**Wizard State Management:**
```typescript
// apps/web/src/hooks/use-onboarding.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface OnboardingState {
  currentStep: number;
  workspace: {
    name: string;
    slug: string;
  } | null;
  aiProvider: {
    provider: 'anthropic' | 'openai' | 'google' | 'deepseek' | 'openrouter';
    apiKey: string;
    verified: boolean;
  } | null;

  setStep: (step: number) => void;
  setWorkspace: (workspace: OnboardingState['workspace']) => void;
  setAiProvider: (provider: OnboardingState['aiProvider']) => void;
  reset: () => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      currentStep: 1,
      workspace: null,
      aiProvider: null,

      setStep: (step) => set({ currentStep: step }),
      setWorkspace: (workspace) => set({ workspace }),
      setAiProvider: (aiProvider) => set({ aiProvider }),
      reset: () => set({ currentStep: 1, workspace: null, aiProvider: null }),
    }),
    {
      name: 'onboarding-storage',
    }
  )
);
```

**Step 2: BYOAI Setup Component:**
```typescript
// apps/web/src/components/onboarding/step-byoai.tsx
const providers = [
  { id: 'anthropic', name: 'Claude', icon: '🧠', recommended: true },
  { id: 'openai', name: 'OpenAI', icon: '🤖' },
  { id: 'google', name: 'Google Gemini', icon: '💎' },
  { id: 'deepseek', name: 'DeepSeek', icon: '🔮' },
  { id: 'openrouter', name: 'OpenRouter', icon: '🌐' },
];

export function StepByoai({ onNext, onBack }: StepProps) {
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [testing, setTesting] = useState(false);
  const [verified, setVerified] = useState(false);

  const testApiKey = async () => {
    setTesting(true);
    try {
      const response = await fetch('/api/ai-providers/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: selectedProvider, apiKey }),
      });
      const data = await response.json();
      setVerified(data.valid);
      if (!data.valid) {
        toast.error(data.message || 'Invalid API key');
      }
    } catch {
      toast.error('Failed to validate API key');
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-3">
        {providers.map((provider) => (
          <Card
            key={provider.id}
            className={cn(
              'cursor-pointer transition-all',
              selectedProvider === provider.id && 'border-coral ring-2 ring-coral/20'
            )}
            onClick={() => setSelectedProvider(provider.id)}
          >
            <CardContent className="flex items-center gap-3 p-4">
              <span className="text-2xl">{provider.icon}</span>
              <span className="font-medium">{provider.name}</span>
              {provider.recommended && (
                <Badge variant="secondary">Recommended</Badge>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedProvider && (
        <div className="space-y-3">
          <Label>API Key</Label>
          <div className="flex gap-2">
            <Input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
              autoComplete="off"
            />
            <Button
              variant="outline"
              onClick={testApiKey}
              disabled={!apiKey || testing}
            >
              {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Test'}
            </Button>
          </div>
          {verified && (
            <p className="text-sm text-green-600 flex items-center gap-1">
              <CheckCircle className="h-4 w-4" /> API key verified
            </p>
          )}
        </div>
      )}
    </div>
  );
}
```

**API Key Validation Endpoint:**
```typescript
// apps/api/src/ai-providers/ai-providers.controller.ts
@Post('validate')
async validateApiKey(@Body() dto: ValidateApiKeyDto) {
  const { provider, apiKey } = dto;

  try {
    switch (provider) {
      case 'anthropic':
        // Call Anthropic API to list models
        const anthropic = new Anthropic({ apiKey });
        await anthropic.models.list();
        return { valid: true };

      case 'openai':
        const openai = new OpenAI({ apiKey });
        await openai.models.list();
        return { valid: true };

      // ... other providers
    }
  } catch (error) {
    return { valid: false, message: 'Invalid API key or rate limited' };
  }
}
```

---

### Story 15.4: Connect Chat Panel to Agno Backend

#### Technical Requirements

**Files to Modify:**
```
apps/web/src/components/chat/chat-panel.tsx
apps/web/src/components/chat/chat-input.tsx
apps/web/src/components/chat/chat-message.tsx
apps/web/src/hooks/use-chat.ts
apps/api/src/agents/agents.controller.ts
apps/api/src/agents/agents.service.ts
```

**Chat Hook Implementation:**
```typescript
// apps/web/src/hooks/use-chat.ts
import { useCallback, useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  agentId?: string;
  timestamp: Date;
  status: 'sending' | 'sent' | 'error';
}

interface UseChatOptions {
  agentId?: string;
  businessId?: string;
  workspaceId: string;
}

export function useChat({ agentId = 'hub', businessId, workspaceId }: UseChatOptions) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const queryClient = useQueryClient();

  // Load chat history
  const { data: history } = useQuery({
    queryKey: ['chat-history', workspaceId, businessId, agentId],
    queryFn: async () => {
      const params = new URLSearchParams({
        workspaceId,
        ...(businessId && { businessId }),
        agentId,
      });
      const res = await fetch(`/api/chat/history?${params}`);
      return res.json();
    },
  });

  // Send message with streaming
  const sendMessage = useCallback(async (content: string) => {
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: new Date(),
      status: 'sent',
    };

    setMessages(prev => [...prev, userMessage]);
    setIsStreaming(true);

    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch('/api/agents/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId,
          workspaceId,
          businessId,
          message: content,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) throw new Error('Failed to send message');

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: '',
        agentId,
        timestamp: new Date(),
        status: 'sending',
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Stream response
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        setMessages(prev => {
          const updated = [...prev];
          const lastIdx = updated.length - 1;
          updated[lastIdx] = {
            ...updated[lastIdx],
            content: updated[lastIdx].content + chunk,
          };
          return updated;
        });
      }

      // Mark as sent
      setMessages(prev => {
        const updated = [...prev];
        const lastIdx = updated.length - 1;
        updated[lastIdx].status = 'sent';
        return updated;
      });

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }

      setMessages(prev => {
        const updated = [...prev];
        const lastIdx = updated.length - 1;
        updated[lastIdx].status = 'error';
        return updated;
      });

      toast.error('Failed to get response. Please try again.');
    } finally {
      setIsStreaming(false);
    }
  }, [agentId, workspaceId, businessId]);

  const stopStreaming = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  return {
    messages: history ? [...history, ...messages] : messages,
    sendMessage,
    isStreaming,
    stopStreaming,
  };
}
```

**NestJS Chat Controller:**
```typescript
// apps/api/src/agents/agents.controller.ts
@Post('chat')
@UseGuards(AuthGuard, TenantGuard)
async chat(
  @Body() dto: ChatDto,
  @Res() res: Response,
  @CurrentUser() user: User,
) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    const stream = await this.agentOSService.streamChat({
      agentId: dto.agentId,
      workspaceId: dto.workspaceId,
      businessId: dto.businessId,
      userId: user.id,
      message: dto.message,
    });

    for await (const chunk of stream) {
      res.write(chunk);
    }

    res.end();
  } catch (error) {
    res.status(500).json({ error: 'Agent unavailable' });
  }
}
```

**AgentOS Service Stream Method:**
```typescript
// apps/api/src/agentos/agentos.service.ts
async *streamChat(params: StreamChatParams): AsyncGenerator<string> {
  const response = await fetch(`${this.agentOSUrl}/agents/${params.agentId}/runs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.getJwt()}`,
    },
    body: JSON.stringify({
      input: { message: params.message },
      context: {
        workspaceId: params.workspaceId,
        businessId: params.businessId,
        userId: params.userId,
      },
      stream: true,
    }),
  });

  if (!response.body) {
    throw new Error('No response body');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    yield decoder.decode(value);
  }
}
```

**Chat Agent Selection Component:**
```typescript
// apps/web/src/components/chat/agent-selector.tsx
'use client';

import { useState } from 'react';
import { ChevronDown, Bot } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface Agent {
  id: string;
  name: string;
  description: string;
  avatar?: string;
  color: string;
}

const AVAILABLE_AGENTS: Agent[] = [
  {
    id: 'hub',
    name: 'Hub',
    description: 'Default orchestrator - routes to specialists',
    color: 'var(--agent-hub)',
  },
  {
    id: 'maya',
    name: 'Maya',
    description: 'CRM & customer relationships',
    color: 'var(--agent-maya)',
  },
  {
    id: 'atlas',
    name: 'Atlas',
    description: 'Projects & task management',
    color: 'var(--agent-atlas)',
  },
  {
    id: 'nova',
    name: 'Nova',
    description: 'Marketing & content creation',
    color: 'var(--agent-nova)',
  },
  {
    id: 'echo',
    name: 'Echo',
    description: 'Analytics & business insights',
    color: 'var(--agent-echo)',
  },
];

interface AgentSelectorProps {
  selectedAgentId: string;
  onAgentChange: (agentId: string) => void;
  disabled?: boolean;
}

export function AgentSelector({
  selectedAgentId,
  onAgentChange,
  disabled,
}: AgentSelectorProps) {
  const selectedAgent = AVAILABLE_AGENTS.find((a) => a.id === selectedAgentId) || AVAILABLE_AGENTS[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={disabled}
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded-full border bg-white/50',
          'hover:bg-white/80 transition-colors',
          'disabled:opacity-50 disabled:cursor-not-allowed'
        )}
      >
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center"
          style={{ backgroundColor: selectedAgent.color }}
        >
          <Bot className="w-3.5 h-3.5 text-white" />
        </div>
        <span className="text-sm font-medium">{selectedAgent.name}</span>
        <ChevronDown className="w-4 h-4 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        {AVAILABLE_AGENTS.map((agent) => (
          <DropdownMenuItem
            key={agent.id}
            onClick={() => onAgentChange(agent.id)}
            className={cn(
              'flex items-start gap-3 p-3 cursor-pointer',
              agent.id === selectedAgentId && 'bg-muted'
            )}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
              style={{ backgroundColor: agent.color }}
            >
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="font-medium">{agent.name}</span>
              <span className="text-xs text-muted-foreground">
                {agent.description}
              </span>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

**Chat Panel Header with Agent Selector:**
```typescript
// apps/web/src/components/chat/chat-panel.tsx (updated header section)
import { AgentSelector } from './agent-selector';
import { useChatStore } from '@/stores/chat-store';

export function ChatPanel() {
  const { currentAgentId, setCurrentAgent } = useChatStore();
  const [isStreaming, setIsStreaming] = useState(false);

  const handleAgentChange = (agentId: string) => {
    setCurrentAgent(agentId);
    // Optionally show agent greeting
    toast.info(`Switched to ${AVAILABLE_AGENTS.find(a => a.id === agentId)?.name}`);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header with Agent Selector */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-white/50">
        <AgentSelector
          selectedAgentId={currentAgentId}
          onAgentChange={handleAgentChange}
          disabled={isStreaming}
        />
        <div className="flex items-center gap-2">
          {/* Minimize/maximize buttons */}
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto">
        {/* Chat messages */}
      </div>

      {/* Input area */}
      <ChatInput onSend={sendMessage} disabled={isStreaming} />
    </div>
  );
}
```

**Chat Store for Agent State:**
```typescript
// apps/web/src/stores/chat-store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ChatState {
  currentAgentId: string;
  setCurrentAgent: (agentId: string) => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      currentAgentId: 'hub',
      setCurrentAgent: (agentId) => set({ currentAgentId: agentId }),
    }),
    {
      name: 'chat-storage',
    }
  )
);
```

**Agent Response Indicator:**
```typescript
// apps/web/src/components/chat/chat-message.tsx
interface ChatMessageProps {
  message: Message;
  agentId?: string;
}

export function ChatMessage({ message, agentId }: ChatMessageProps) {
  const agent = agentId ? AVAILABLE_AGENTS.find((a) => a.id === agentId) : null;

  if (message.role === 'assistant' && agent) {
    return (
      <div className="flex gap-3 items-start">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
          style={{ backgroundColor: agent.color }}
        >
          <Bot className="w-4 h-4 text-white" />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium" style={{ color: agent.color }}>
            {agent.name}
          </span>
          <div className="message-agent-bubble">
            {message.content}
          </div>
        </div>
      </div>
    );
  }

  // User message rendering...
}
```

---

### Story 15.5: Fix Approvals Page Data Loading

#### Technical Requirements

**Files to Modify:**
```
apps/web/src/app/(app)/approvals/page.tsx
apps/web/src/hooks/use-approvals.ts
apps/api/src/approvals/approvals.controller.ts
```

**Demo Data Fallback:**
```typescript
// apps/web/src/lib/demo-data/approvals.ts
export const demoApprovals: ApprovalItem[] = [
  {
    id: 'demo-1',
    type: 'content',
    title: 'Blog Post: AI Automation Trends 2025',
    description: 'A comprehensive guide to AI trends...',
    confidenceScore: 92,
    status: 'pending',
    recommendation: 'approve',
    reviewType: 'quick',
    priority: 'medium',
    agentId: 'nova',
    agentName: 'Nova',
    createdAt: new Date(Date.now() - 1000 * 60 * 30), // 30 min ago
    dueAt: new Date(Date.now() + 1000 * 60 * 60 * 24), // 24 hours
  },
  {
    id: 'demo-2',
    type: 'email',
    title: 'Welcome Email Campaign',
    description: 'Automated welcome sequence for new signups',
    confidenceScore: 78,
    status: 'pending',
    recommendation: 'review',
    reviewType: 'quick',
    priority: 'high',
    agentId: 'maya',
    agentName: 'Maya',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    dueAt: new Date(Date.now() + 1000 * 60 * 60 * 12), // 12 hours
  },
  {
    id: 'demo-3',
    type: 'agent_action',
    title: 'CRM Contact Update',
    description: 'Merge duplicate contacts: John Smith entries',
    confidenceScore: 45,
    status: 'pending',
    recommendation: 'full_review',
    reviewType: 'full',
    priority: 'low',
    agentId: 'maya',
    agentName: 'Maya',
    aiReasoning: 'Low confidence due to potential data loss. Multiple contacts have different email addresses that may not be duplicates.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 hours ago
    dueAt: new Date(Date.now() + 1000 * 60 * 60 * 48), // 48 hours
  },
];
```

**Approvals Hook with Fallback:**
```typescript
// apps/web/src/hooks/use-approvals.ts
export function useApprovals(options?: UseApprovalsOptions) {
  const { workspaceId } = useWorkspace();

  return useQuery({
    queryKey: ['approvals', workspaceId, options],
    queryFn: async () => {
      try {
        const params = new URLSearchParams({
          ...(options?.status && { status: options.status }),
          ...(options?.type && { type: options.type }),
        });

        const res = await fetch(`/api/approvals?${params}`);

        if (!res.ok) {
          throw new Error('Failed to fetch approvals');
        }

        return res.json();
      } catch (error) {
        // Return demo data on error (development/demo mode)
        if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
          return demoApprovals;
        }
        throw error;
      }
    },
    retry: 1,
    staleTime: 30 * 1000, // 30 seconds
  });
}
```

---

### Story 15.6-15.10: Settings Pages Implementation

#### Technical Requirements

**Shared Settings Layout:**
```typescript
// apps/web/src/app/(app)/settings/layout.tsx
const settingsNav = [
  { title: 'Profile', href: '/settings', icon: User },
  { title: 'Security', href: '/settings/security', icon: Shield },
  { title: 'Sessions', href: '/settings/sessions', icon: Monitor },
  { title: 'Workspace', href: '/settings/workspace', icon: Building2 },
  { title: 'Members', href: '/settings/workspace/members', icon: Users },
  { title: 'AI Config', href: '/settings/ai-config', icon: Bot },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-8">
      <aside className="w-56 shrink-0">
        <nav className="space-y-1">
          {settingsNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm',
                pathname === item.href
                  ? 'bg-coral/10 text-coral font-medium'
                  : 'text-muted-foreground hover:bg-muted'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.title}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
```

**Profile Page Form:**
```typescript
// apps/web/src/components/settings/profile-form.tsx
const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email(),
});

export function ProfileForm() {
  const { user } = useAuth();
  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
    },
  });

  const updateProfile = useMutation({
    mutationFn: async (data: z.infer<typeof profileSchema>) => {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update profile');
      return res.json();
    },
    onSuccess: () => {
      toast.success('Profile updated successfully');
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((data) => updateProfile.mutate(data))}>
        <div className="space-y-6">
          <AvatarUpload
            currentAvatar={user?.image}
            onUpload={handleAvatarUpload}
          />

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input {...field} autoComplete="name" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input {...field} disabled autoComplete="email" />
                </FormControl>
                <FormDescription>
                  Email cannot be changed. Contact support if needed.
                </FormDescription>
              </FormItem>
            )}
          />

          <Button type="submit" disabled={updateProfile.isPending}>
            {updateProfile.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </form>
    </Form>
  );
}
```

**Sessions Page:**
```typescript
// apps/web/src/app/(app)/settings/sessions/page.tsx
interface Session {
  id: string;
  userAgent: string;
  ipAddress: string;
  location?: string;
  lastActive: Date;
  createdAt: Date;
  isCurrent: boolean;
}

export default function SessionsPage() {
  const { data: sessions, isLoading } = useQuery({
    queryKey: ['sessions'],
    queryFn: async () => {
      const res = await fetch('/api/auth/sessions');
      return res.json();
    },
  });

  const revokeSession = useMutation({
    mutationFn: async (sessionId: string) => {
      await fetch(`/api/auth/sessions/${sessionId}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      toast.success('Session revoked');
    },
  });

  const revokeAllOther = useMutation({
    mutationFn: async () => {
      await fetch('/api/auth/sessions/revoke-others', { method: 'POST' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      toast.success('All other sessions revoked');
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold">Active Sessions</h2>
          <p className="text-sm text-muted-foreground">
            Manage your active sessions across devices
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => revokeAllOther.mutate()}
          disabled={revokeAllOther.isPending}
        >
          Sign out all other sessions
        </Button>
      </div>

      <div className="space-y-4">
        {sessions?.map((session: Session) => (
          <SessionCard
            key={session.id}
            session={session}
            onRevoke={() => revokeSession.mutate(session.id)}
          />
        ))}
      </div>
    </div>
  );
}
```

---

### Story 15.10a: Implement Workspace Roles Page

#### Technical Requirements

**New Files:**
```
apps/web/src/app/(app)/settings/workspace/roles/page.tsx
apps/web/src/components/settings/roles-table.tsx
apps/web/src/components/settings/permission-matrix.tsx
apps/web/src/config/roles-permissions.ts
```

**Roles Configuration:**
```typescript
// apps/web/src/config/roles-permissions.ts
export const WORKSPACE_ROLES = {
  owner: {
    name: 'Owner',
    description: 'Full access, can delete workspace, transfer ownership',
    color: 'bg-coral/10 text-coral',
  },
  admin: {
    name: 'Admin',
    description: 'Manage members, settings, billing; cannot delete workspace',
    color: 'bg-blue-100 text-blue-700',
  },
  member: {
    name: 'Member',
    description: 'Standard access to all features, cannot manage members',
    color: 'bg-green-100 text-green-700',
  },
  viewer: {
    name: 'Viewer',
    description: 'Read-only access to all data',
    color: 'bg-gray-100 text-gray-700',
  },
  billing: {
    name: 'Billing',
    description: 'Access to billing and subscription settings only',
    color: 'bg-purple-100 text-purple-700',
  },
} as const;

export type WorkspaceRole = keyof typeof WORKSPACE_ROLES;

export const PERMISSION_MATRIX: Record<string, Record<WorkspaceRole, 'full' | 'limited' | 'none'>> = {
  'Workspace Settings': {
    owner: 'full',
    admin: 'full',
    member: 'limited',
    viewer: 'none',
    billing: 'none',
  },
  'Member Management': {
    owner: 'full',
    admin: 'full',
    member: 'none',
    viewer: 'none',
    billing: 'none',
  },
  'Billing & Subscription': {
    owner: 'full',
    admin: 'full',
    member: 'none',
    viewer: 'none',
    billing: 'full',
  },
  'Business Management': {
    owner: 'full',
    admin: 'full',
    member: 'full',
    viewer: 'limited',
    billing: 'none',
  },
  'AI Agent Configuration': {
    owner: 'full',
    admin: 'full',
    member: 'limited',
    viewer: 'none',
    billing: 'none',
  },
  'Approval Actions': {
    owner: 'full',
    admin: 'full',
    member: 'full',
    viewer: 'none',
    billing: 'none',
  },
  'Data Export': {
    owner: 'full',
    admin: 'full',
    member: 'limited',
    viewer: 'none',
    billing: 'none',
  },
};
```

**Permission Matrix Component:**
```typescript
// apps/web/src/components/settings/permission-matrix.tsx
import { WORKSPACE_ROLES, PERMISSION_MATRIX, WorkspaceRole } from '@/config/roles-permissions';
import { Check, X, Minus } from 'lucide-react';

const PermissionIcon = ({ level }: { level: 'full' | 'limited' | 'none' }) => {
  switch (level) {
    case 'full':
      return <Check className="h-4 w-4 text-green-600" />;
    case 'limited':
      return <Minus className="h-4 w-4 text-yellow-600" />;
    case 'none':
      return <X className="h-4 w-4 text-red-400" />;
  }
};

export function PermissionMatrix() {
  const roles = Object.keys(WORKSPACE_ROLES) as WorkspaceRole[];
  const permissions = Object.keys(PERMISSION_MATRIX);

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-48">Permission</TableHead>
            {roles.map((role) => (
              <TableHead key={role} className="text-center">
                {WORKSPACE_ROLES[role].name}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {permissions.map((permission) => (
            <TableRow key={permission}>
              <TableCell className="font-medium">{permission}</TableCell>
              {roles.map((role) => (
                <TableCell key={role} className="text-center">
                  <div className="flex justify-center">
                    <PermissionIcon level={PERMISSION_MATRIX[permission][role]} />
                  </div>
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="flex gap-6 mt-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Check className="h-4 w-4 text-green-600" />
          <span>Full access</span>
        </div>
        <div className="flex items-center gap-2">
          <Minus className="h-4 w-4 text-yellow-600" />
          <span>Limited access</span>
        </div>
        <div className="flex items-center gap-2">
          <X className="h-4 w-4 text-red-400" />
          <span>No access</span>
        </div>
      </div>
    </div>
  );
}
```

**Roles Page:**
```typescript
// apps/web/src/app/(app)/settings/workspace/roles/page.tsx
import { WORKSPACE_ROLES, WorkspaceRole } from '@/config/roles-permissions';
import { PermissionMatrix } from '@/components/settings/permission-matrix';

export default function RolesPage() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold">Workspace Roles</h2>
        <p className="text-sm text-muted-foreground">
          View the default roles and their permissions in your workspace.
        </p>
      </div>

      {/* Role Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {(Object.entries(WORKSPACE_ROLES) as [WorkspaceRole, typeof WORKSPACE_ROLES[WorkspaceRole]][]).map(
          ([key, role]) => (
            <Card key={key}>
              <CardHeader className="pb-2">
                <Badge className={role.color}>{role.name}</Badge>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{role.description}</p>
              </CardContent>
            </Card>
          )
        )}
      </div>

      {/* Permission Matrix */}
      <Card>
        <CardHeader>
          <CardTitle>Permission Matrix</CardTitle>
          <CardDescription>
            Detailed breakdown of what each role can access
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PermissionMatrix />
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground">
        Custom roles are coming soon. Contact support if you need specific permission configurations.
      </p>
    </div>
  );
}
```

---

### Stories 15.19-15.25: Style Guide Implementation

#### CSS Custom Properties

```css
/* apps/web/src/app/globals.css */

:root {
  /* Colors - Warm Coral Primary */
  --color-primary: #FF6B6B;
  --color-primary-hover: #FF5252;
  --color-primary-light: rgba(255, 107, 107, 0.1);

  /* Backgrounds */
  --bg-cream: #FFFBF5;
  --bg-white: #FFFFFF;
  --bg-soft: #FFF8F0;

  /* Borders */
  --border-subtle: #f0ebe4;
  --border-default: #e5ddd4;
  --border-strong: #d4c9bc;

  /* Shadows */
  --shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.08);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.12);
  --shadow-xl: 0 16px 48px rgba(0, 0, 0, 0.15);
  --shadow-primary: 0 2px 8px rgba(255, 107, 107, 0.25);
  --shadow-primary-hover: 0 4px 12px rgba(255, 107, 107, 0.35);

  /* Border Radius */
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;
  --radius-xl: 24px;
  --radius-full: 9999px;

  /* Spacing */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;

  /* Agent Character Colors */
  --agent-hub: #FF6B6B;
  --agent-maya: #20B2AA;
  --agent-atlas: #FF9F43;
  --agent-sage: #2ECC71;
  --agent-nova: #FF6B9D;
  --agent-echo: #4B7BEC;
  --agent-vera: #FF6B6B;
  --agent-marco: #4B7BEC;
  --agent-cipher: #20B2AA;
  --agent-persona: #9B59B6;
  --agent-risk: #FF9F43;

  /* Typography */
  --tracking-tighter: -0.02em;
  --tracking-tight: -0.01em;
}

/* Utility Classes */
.hover-lift {
  transition: transform 200ms ease-out, box-shadow 200ms ease-out;
}

.hover-lift:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.press-feedback:active {
  transform: scale(0.98);
}

/* Focus States */
:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

/* Card Base Styling */
.card-premium {
  background: var(--bg-white);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  box-shadow: var(--shadow-sm);
  transition: all 200ms ease-out;
}

.card-premium:hover {
  border-color: var(--border-default);
  box-shadow: var(--shadow-md);
}

/* Button Primary */
.btn-primary {
  background: var(--color-primary);
  color: white;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-primary);
  transition: all 150ms ease-out;
}

.btn-primary:hover {
  background: var(--color-primary-hover);
  transform: translateY(-1px);
  box-shadow: var(--shadow-primary-hover);
}

.btn-primary:active {
  transform: scale(0.98);
}

/* Chat Message Bubbles */
.message-agent-bubble {
  background: var(--bg-white);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  border-top-left-radius: var(--radius-sm);
  padding: var(--space-4);
}

.message-user-bubble {
  background: var(--color-primary);
  color: white;
  border-radius: var(--radius-lg);
  border-top-right-radius: var(--radius-sm);
  padding: var(--space-4);
}

/* Input Focus */
input:focus,
textarea:focus,
select:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(255, 107, 107, 0.15);
}
```

---

### Story 15.26: Implement Appearance Settings Page

#### Technical Requirements

**Files to Create:**
```
apps/web/src/app/(app)/settings/appearance/page.tsx
apps/web/src/components/settings/theme-selector.tsx
apps/web/src/components/settings/appearance-preview.tsx
apps/web/src/stores/appearance-store.ts
apps/web/src/lib/themes.ts
```

**Theme Configuration:**
```typescript
// apps/web/src/lib/themes.ts
export const THEMES = {
  light: {
    name: 'Light',
    description: 'Default light theme',
    icon: 'Sun',
  },
  dark: {
    name: 'Dark',
    description: 'Easy on the eyes',
    icon: 'Moon',
  },
  system: {
    name: 'System',
    description: 'Follows device settings',
    icon: 'Monitor',
  },
} as const;

export type Theme = keyof typeof THEMES;

export const SIDEBAR_DENSITIES = {
  comfortable: {
    name: 'Comfortable',
    description: 'More spacing for easier reading',
    iconSize: 20,
    padding: 12,
  },
  compact: {
    name: 'Compact',
    description: 'More content in less space',
    iconSize: 18,
    padding: 8,
  },
} as const;

export type SidebarDensity = keyof typeof SIDEBAR_DENSITIES;

export const FONT_SIZES = {
  small: {
    name: 'Small',
    base: 14,
    scale: 0.875,
  },
  medium: {
    name: 'Medium',
    base: 16,
    scale: 1,
  },
  large: {
    name: 'Large',
    base: 18,
    scale: 1.125,
  },
} as const;

export type FontSize = keyof typeof FONT_SIZES;
```

**Appearance Store (Zustand with Persist):**
```typescript
// apps/web/src/stores/appearance-store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Theme, SidebarDensity, FontSize } from '@/lib/themes';

interface AppearanceState {
  theme: Theme;
  sidebarDensity: SidebarDensity;
  fontSize: FontSize;
  setTheme: (theme: Theme) => void;
  setSidebarDensity: (density: SidebarDensity) => void;
  setFontSize: (size: FontSize) => void;
  reset: () => void;
}

const defaultState = {
  theme: 'system' as Theme,
  sidebarDensity: 'comfortable' as SidebarDensity,
  fontSize: 'medium' as FontSize,
};

export const useAppearanceStore = create<AppearanceState>()(
  persist(
    (set) => ({
      ...defaultState,
      setTheme: (theme) => set({ theme }),
      setSidebarDensity: (sidebarDensity) => set({ sidebarDensity }),
      setFontSize: (fontSize) => set({ fontSize }),
      reset: () => set(defaultState),
    }),
    {
      name: 'appearance-storage',
    }
  )
);
```

**Theme Selector Component:**
```typescript
// apps/web/src/components/settings/theme-selector.tsx
'use client';

import { Sun, Moon, Monitor, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { THEMES, type Theme } from '@/lib/themes';
import { useAppearanceStore } from '@/stores/appearance-store';

const iconMap = {
  Sun,
  Moon,
  Monitor,
};

export function ThemeSelector() {
  const { theme, setTheme } = useAppearanceStore();

  return (
    <div className="grid grid-cols-3 gap-3">
      {(Object.entries(THEMES) as [Theme, typeof THEMES[Theme]][]).map(
        ([key, config]) => {
          const Icon = iconMap[config.icon as keyof typeof iconMap];
          const isSelected = theme === key;

          return (
            <button
              key={key}
              onClick={() => setTheme(key)}
              className={cn(
                'relative flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all',
                isSelected
                  ? 'border-coral bg-coral/5'
                  : 'border-border hover:border-muted-foreground'
              )}
            >
              {isSelected && (
                <div className="absolute top-2 right-2">
                  <Check className="h-4 w-4 text-coral" />
                </div>
              )}
              <Icon className={cn('h-6 w-6', isSelected && 'text-coral')} />
              <span className="text-sm font-medium">{config.name}</span>
              <span className="text-xs text-muted-foreground text-center">
                {config.description}
              </span>
            </button>
          );
        }
      )}
    </div>
  );
}
```

**Appearance Preview Component:**
```typescript
// apps/web/src/components/settings/appearance-preview.tsx
'use client';

import { useAppearanceStore } from '@/stores/appearance-store';
import { FONT_SIZES, SIDEBAR_DENSITIES } from '@/lib/themes';
import { cn } from '@/lib/utils';

export function AppearancePreview() {
  const { theme, sidebarDensity, fontSize } = useAppearanceStore();
  const fontConfig = FONT_SIZES[fontSize];
  const densityConfig = SIDEBAR_DENSITIES[sidebarDensity];

  return (
    <div
      className={cn(
        'relative border rounded-lg overflow-hidden h-48',
        theme === 'dark' ? 'bg-gray-900' : 'bg-cream'
      )}
      style={{ fontSize: `${fontConfig.base}px` }}
    >
      {/* Mini Sidebar Preview */}
      <div
        className={cn(
          'absolute left-0 top-0 h-full w-16 border-r',
          theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-border'
        )}
        style={{ padding: densityConfig.padding }}
      >
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={cn(
                'rounded',
                theme === 'dark' ? 'bg-gray-700' : 'bg-muted'
              )}
              style={{
                width: densityConfig.iconSize,
                height: densityConfig.iconSize,
              }}
            />
          ))}
        </div>
      </div>

      {/* Mini Content Preview */}
      <div className="ml-16 p-4 space-y-3">
        <div
          className={cn(
            'h-4 w-32 rounded',
            theme === 'dark' ? 'bg-gray-700' : 'bg-muted'
          )}
        />
        <div
          className={cn(
            'h-3 w-48 rounded',
            theme === 'dark' ? 'bg-gray-800' : 'bg-muted/50'
          )}
        />
        <div
          className={cn(
            'h-20 rounded border',
            theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-border'
          )}
        />
      </div>

      {/* Label */}
      <div className="absolute bottom-2 right-2">
        <span className={cn(
          'text-xs px-2 py-1 rounded',
          theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-muted text-muted-foreground'
        )}>
          Preview
        </span>
      </div>
    </div>
  );
}
```

**Appearance Settings Page:**
```typescript
// apps/web/src/app/(app)/settings/appearance/page.tsx
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';
import { ThemeSelector } from '@/components/settings/theme-selector';
import { AppearancePreview } from '@/components/settings/appearance-preview';
import { useAppearanceStore } from '@/stores/appearance-store';
import { SIDEBAR_DENSITIES, FONT_SIZES, type SidebarDensity, type FontSize } from '@/lib/themes';

export default function AppearancePage() {
  const { sidebarDensity, fontSize, setSidebarDensity, setFontSize, reset } = useAppearanceStore();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Appearance</h2>
          <p className="text-sm text-muted-foreground">
            Customize how HYVVE looks and feels
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={reset}>
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset to defaults
        </Button>
      </div>

      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Preview</CardTitle>
          <CardDescription>
            See how your changes will look
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AppearancePreview />
        </CardContent>
      </Card>

      {/* Theme Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Theme</CardTitle>
          <CardDescription>
            Select your preferred color scheme
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ThemeSelector />
        </CardContent>
      </Card>

      {/* Sidebar Density */}
      <Card>
        <CardHeader>
          <CardTitle>Sidebar Density</CardTitle>
          <CardDescription>
            Control the spacing in the navigation sidebar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={sidebarDensity}
            onValueChange={(value) => setSidebarDensity(value as SidebarDensity)}
            className="space-y-3"
          >
            {(Object.entries(SIDEBAR_DENSITIES) as [SidebarDensity, typeof SIDEBAR_DENSITIES[SidebarDensity]][]).map(
              ([key, config]) => (
                <div key={key} className="flex items-center space-x-3">
                  <RadioGroupItem value={key} id={`density-${key}`} />
                  <Label htmlFor={`density-${key}`} className="flex flex-col cursor-pointer">
                    <span className="font-medium">{config.name}</span>
                    <span className="text-sm text-muted-foreground">{config.description}</span>
                  </Label>
                </div>
              )
            )}
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Font Size */}
      <Card>
        <CardHeader>
          <CardTitle>Font Size</CardTitle>
          <CardDescription>
            Adjust the text size across the interface
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={fontSize}
            onValueChange={(value) => setFontSize(value as FontSize)}
            className="space-y-3"
          >
            {(Object.entries(FONT_SIZES) as [FontSize, typeof FONT_SIZES[FontSize]][]).map(
              ([key, config]) => (
                <div key={key} className="flex items-center space-x-3">
                  <RadioGroupItem value={key} id={`font-${key}`} />
                  <Label htmlFor={`font-${key}`} className="cursor-pointer">
                    <span className="font-medium">{config.name}</span>
                    <span className="text-sm text-muted-foreground ml-2">
                      ({config.base}px base)
                    </span>
                  </Label>
                </div>
              )
            )}
          </RadioGroup>
        </CardContent>
      </Card>
    </div>
  );
}
```

**Dark Mode CSS Variables:**
```css
/* apps/web/src/app/globals.css - add dark mode support */
.dark {
  --color-primary: #FF7B7B;
  --color-primary-hover: #FF8A8A;
  --color-primary-light: rgba(255, 123, 123, 0.15);

  --bg-cream: #1a1a1a;
  --bg-white: #242424;
  --bg-soft: #1f1f1f;

  --border-subtle: #333333;
  --border-default: #404040;
  --border-strong: #4d4d4d;

  --shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.3);
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.4);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.5);
  --shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.6);

  color-scheme: dark;
}

/* System preference detection */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme='light']) {
    /* Apply dark mode variables */
  }
}
```

**Theme Provider Integration:**
```typescript
// apps/web/src/providers/theme-provider.tsx
'use client';

import { useEffect } from 'react';
import { useAppearanceStore } from '@/stores/appearance-store';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme, fontSize } = useAppearanceStore();

  useEffect(() => {
    const root = document.documentElement;

    // Handle theme
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      root.classList.toggle('dark', mediaQuery.matches);

      const handler = (e: MediaQueryListEvent) => {
        root.classList.toggle('dark', e.matches);
      };
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    } else {
      root.classList.toggle('dark', theme === 'dark');
    }
  }, [theme]);

  useEffect(() => {
    // Handle font size
    const root = document.documentElement;
    const sizes = { small: '14px', medium: '16px', large: '18px' };
    root.style.fontSize = sizes[fontSize];
  }, [fontSize]);

  return <>{children}</>;
}
```

---

## API Contracts

### Business Endpoints

```typescript
// GET /api/businesses
interface ListBusinessesResponse {
  businesses: Business[];
  total: number;
  page: number;
  limit: number;
}

// POST /api/businesses
interface CreateBusinessRequest {
  name: string;
  description?: string;
  industry?: string;
  stage?: 'idea' | 'pre_seed' | 'seed' | 'series_a' | 'established';
  teamSize?: string;
  fundingStatus?: string;
}

// GET /api/businesses/:id
interface BusinessDetailResponse extends Business {
  validationResults: ValidationResult[];
  planningData: PlanningData;
  brandingAssets: BrandingAsset[];
}
```

### Chat Endpoints

```typescript
// POST /api/agents/chat
interface ChatRequest {
  agentId: string;
  workspaceId: string;
  businessId?: string;
  message: string;
  attachments?: {
    type: 'file' | 'image';
    url: string;
    name: string;
  }[];
}

// Response: SSE stream of message chunks
// Content-Type: text/event-stream

// GET /api/chat/history
interface ChatHistoryResponse {
  messages: Message[];
  hasMore: boolean;
  cursor?: string;
}
```

### Settings Endpoints

```typescript
// PATCH /api/user/profile
interface UpdateProfileRequest {
  name?: string;
  avatar?: string;
}

// POST /api/user/avatar
// Content-Type: multipart/form-data
interface UploadAvatarResponse {
  url: string;
}

// GET /api/auth/sessions
interface SessionsResponse {
  sessions: Session[];
}

// DELETE /api/auth/sessions/:id
// POST /api/auth/sessions/revoke-others

// PATCH /api/workspaces/:id
interface UpdateWorkspaceRequest {
  name?: string;
  timezone?: string;
  language?: string;
  logo?: string;
}

// POST /api/workspaces/:id/members/invite
interface InviteMemberRequest {
  emails: string[];
  role: 'admin' | 'member' | 'viewer' | 'billing';
  message?: string;
}
```

---

## Database Changes

### Business Model (if not exists)

```prisma
model Business {
  id              String   @id @default(cuid())
  workspaceId     String   @map("workspace_id")
  name            String
  description     String?  @db.Text
  logo            String?
  status          String   @default("draft") // draft, validating, planning, branding, active
  industry        String?
  stage           String?  // idea, pre_seed, seed, series_a, established
  teamSize        String?
  fundingStatus   String?

  validationScore Float?   @map("validation_score")
  planningProgress Float?  @map("planning_progress")
  brandingProgress Float?  @map("branding_progress")

  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")

  workspace       Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)

  @@index([workspaceId])
  @@index([workspaceId, status])
  @@map("businesses")
}
```

### User Onboarding Fields

```prisma
model User {
  // ... existing fields

  onboardingComplete Boolean @default(false) @map("onboarding_complete")
  onboardingStep     Int     @default(1) @map("onboarding_step")
}
```

---

## Testing Requirements

### Unit Tests

```typescript
// Icon replacement verification
describe('Sidebar', () => {
  it('renders Lucide icons not text strings', () => {
    render(<Sidebar />);
    expect(screen.queryByText('grid_view')).not.toBeInTheDocument();
    expect(screen.getByTestId('layout-grid-icon')).toBeInTheDocument();
  });
});

// Chat hook tests
describe('useChat', () => {
  it('sends message and receives streaming response', async () => {
    const { result } = renderHook(() => useChat({ workspaceId: 'test' }));

    await act(async () => {
      await result.current.sendMessage('Hello');
    });

    expect(result.current.messages).toHaveLength(2);
    expect(result.current.messages[0].role).toBe('user');
    expect(result.current.messages[1].role).toBe('assistant');
  });
});
```

### E2E Tests

```typescript
// apps/web/e2e/onboarding.spec.ts
test('complete onboarding wizard', async ({ page }) => {
  await page.goto('/onboarding/account-setup');

  // Step 1: Workspace
  await page.fill('[name="workspaceName"]', 'Test Workspace');
  await page.click('button:has-text("Continue")');

  // Step 2: BYOAI
  await page.click('[data-provider="anthropic"]');
  await page.fill('[name="apiKey"]', 'claude_api_key_example');
  await page.click('button:has-text("Test")');
  await expect(page.locator('text=API key verified')).toBeVisible();
  await page.click('button:has-text("Continue")');

  // Step 3: AI Team intro
  await page.click('button:has-text("Continue")');

  // Step 4: Complete
  await expect(page.locator('text=Welcome')).toBeVisible();
  await page.click('button:has-text("Go to Dashboard")');

  // Verify redirect
  await expect(page).toHaveURL('/businesses');
});
```

### Visual Regression Tests

```typescript
// Test style guide compliance
test('card styling matches style guide', async ({ page }) => {
  await page.goto('/businesses');

  const card = page.locator('.business-card').first();

  // Check shadow
  const shadow = await card.evaluate((el) =>
    getComputedStyle(el).boxShadow
  );
  expect(shadow).toContain('rgba(0, 0, 0');

  // Check border radius
  const radius = await card.evaluate((el) =>
    getComputedStyle(el).borderRadius
  );
  expect(radius).toBe('16px');
});
```

---

## Rollout Plan

### Phase 1: Infrastructure (Stories 15.1, 15.5)
- Icon system fix (cross-cutting)
- Approvals data loading fix

### Phase 2: Core Flows (Stories 15.2, 15.3, 15.15)
- Businesses portfolio page
- User onboarding wizard
- Sign-in flow redirect

### Phase 3: Chat Integration (Story 15.4)
- Chat backend connection
- Streaming responses
- Error handling

### Phase 4: Settings (Stories 15.6-15.10a, 15.13, 15.26)
- Profile page
- Security page
- Sessions page
- Workspace settings
- Members page
- Roles page (15.10a)
- AI configuration
- Appearance settings (15.26)

### Phase 5: Business Module (Stories 15.11, 15.14, 15.16)
- Menu restructuring
- Business switcher
- Enhanced wizard

### Phase 6: Style Compliance (Stories 15.17-15.25)
- Approval cards
- Agent cards
- Card styling
- Button styling
- Focus states
- Chat styling
- Header fixes
- Form accessibility
- Agent colors

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Icon rendering | 100% Lucide | Automated test |
| Post-signin redirect | 100% to /businesses | Analytics |
| Chat response time | <2s first token | APM |
| Settings save success | >99% | Error tracking |
| Style guide compliance | >90% | Visual audit |
| Accessibility score | >90 Lighthouse | CI check |

---

_Tech Spec created: 2025-12-11_
_Epic: EPIC-15 UI/UX Platform Foundation_
_Stories: 15.1-15.26 (including 15.10a)_
