/**
 * Validation Page
 *
 * Chat interface for the Business Validation Module (BMV).
 * Users interact with Vera (team leader) and specialist agents
 * to validate their business idea.
 *
 * Story: 08.6 - Create Validation Chat Interface
 */

'use client'

import { useState, useRef, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import {
  Send,
  User,
  CheckCircle2,
  Circle,
  Loader2,
  ArrowRight,
  Target,
  TrendingUp,
  Users,
  ShieldCheck,
} from 'lucide-react'

// ============================================================================
// Types
// ============================================================================

interface ChatMessageData {
  id: string
  role: 'user' | 'assistant'
  agent?: string
  content: string
  timestamp: Date
  suggestedActions?: string[]
}

interface WorkflowStep {
  id: string
  name: string
  status: 'completed' | 'in_progress' | 'pending'
  icon: React.ReactNode
}

// ============================================================================
// Agent Configuration
// ============================================================================

const AGENTS = {
  vera: {
    name: 'Vera',
    role: 'Validation Lead',
    avatar: '/agents/vera.png',
    color: 'bg-purple-500',
  },
  marco: {
    name: 'Marco',
    role: 'Market Research',
    avatar: '/agents/marco.png',
    color: 'bg-blue-500',
  },
  cipher: {
    name: 'Cipher',
    role: 'Competitor Analysis',
    avatar: '/agents/cipher.png',
    color: 'bg-green-500',
  },
  persona: {
    name: 'Persona',
    role: 'Customer Research',
    avatar: '/agents/persona.png',
    color: 'bg-orange-500',
  },
  risk: {
    name: 'Risk',
    role: 'Feasibility Analyst',
    avatar: '/agents/risk.png',
    color: 'bg-red-500',
  },
}

// ============================================================================
// Components
// ============================================================================

function ValidationHeader({ businessName, score }: { businessName: string; score: number | null }) {
  return (
    <div className="flex items-center justify-between p-4 border-b">
      <div>
        <h1 className="text-2xl font-bold">Business Validation</h1>
        <p className="text-muted-foreground">{businessName}</p>
      </div>
      <div className="flex items-center gap-4">
        {score !== null ? (
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Validation Score</p>
            <p className="text-3xl font-bold">{score}/100</p>
          </div>
        ) : (
          <Badge variant="secondary">In Progress</Badge>
        )}
      </div>
    </div>
  )
}

function WorkflowProgress({ steps }: { steps: WorkflowStep[] }) {
  const completedCount = steps.filter(s => s.status === 'completed').length
  const progressPercent = (completedCount / steps.length) * 100

  return (
    <div className="p-4 border-b bg-muted/30">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-medium">Workflow Progress</h2>
        <span className="text-sm text-muted-foreground">
          {completedCount}/{steps.length} completed
        </span>
      </div>
      <Progress value={progressPercent} className="h-2 mb-4" />
      <div className="flex justify-between">
        {steps.map((step) => (
          <div key={step.id} className="flex flex-col items-center gap-1">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step.status === 'completed'
                  ? 'bg-green-500 text-white'
                  : step.status === 'in_progress'
                    ? 'bg-primary text-primary-foreground animate-pulse'
                    : 'bg-muted text-muted-foreground'
              }`}
            >
              {step.status === 'completed' ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : step.status === 'in_progress' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Circle className="w-4 h-4" />
              )}
            </div>
            <span className={`text-xs ${step.status === 'in_progress' ? 'font-medium' : ''}`}>
              {step.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function AgentAvatar({ agent }: { agent: string }) {
  const agentInfo = AGENTS[agent as keyof typeof AGENTS] || AGENTS.vera

  return (
    <Avatar className="w-8 h-8">
      <AvatarImage src={agentInfo.avatar} alt={agentInfo.name} />
      <AvatarFallback className={agentInfo.color}>
        {agentInfo.name[0]}
      </AvatarFallback>
    </Avatar>
  )
}

function ChatMessage({ message }: { message: ChatMessageData }) {
  const isUser = message.role === 'user'
  const agentInfo = AGENTS[message.agent as keyof typeof AGENTS] || AGENTS.vera
  const senderLabel = isUser ? 'You' : `${agentInfo.name}, ${agentInfo.role}`

  return (
    <article
      role="article"
      aria-label={`Message from ${senderLabel}`}
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
    >
      {isUser ? (
        <Avatar className="w-8 h-8" aria-hidden="true">
          <AvatarFallback className="bg-primary">
            <User className="w-4 h-4 text-primary-foreground" />
          </AvatarFallback>
        </Avatar>
      ) : (
        <AgentAvatar agent={message.agent || 'vera'} />
      )}
      <div className={`flex flex-col max-w-[80%] ${isUser ? 'items-end' : ''}`}>
        {!isUser && agentInfo && (
          <span className="text-xs text-muted-foreground mb-1" aria-hidden="true">
            {agentInfo.name} ({agentInfo.role})
          </span>
        )}
        <div
          className={`rounded-lg px-4 py-2 ${
            isUser
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted'
          }`}
        >
          <div className="text-sm whitespace-pre-wrap">
            {message.content}
          </div>
        </div>
        {message.suggestedActions && message.suggestedActions.length > 0 && (
          <div
            className="flex gap-2 mt-2 flex-wrap"
            role="group"
            aria-label="Suggested actions"
          >
            {message.suggestedActions.map((action, idx) => (
              <Button key={idx} variant="outline" size="sm">
                {action}
              </Button>
            ))}
          </div>
        )}
      </div>
    </article>
  )
}

function ChatInput({
  onSend,
  disabled,
}: {
  onSend: (message: string) => void
  disabled?: boolean
}) {
  const [input, setInput] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim() && !disabled) {
      onSend(input.trim())
      setInput('')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 border-t" aria-label="Chat message form">
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          disabled={disabled}
          className="flex-1"
          aria-label="Chat message input"
        />
        <Button
          type="submit"
          disabled={disabled || !input.trim()}
          aria-label={disabled ? 'Sending message' : 'Send message'}
        >
          {disabled ? (
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
          ) : (
            <Send className="w-4 h-4" aria-hidden="true" />
          )}
        </Button>
      </div>
    </form>
  )
}

function KeyFindingsPanel({ findings }: { findings: string[] }) {
  if (findings.length === 0) return null

  return (
    <Card className="m-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Key Findings</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-1">
          {findings.map((finding, idx) => (
            <li key={idx} className="text-sm flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>{finding}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// Main Page Component
// ============================================================================

export default function ValidationPage() {
  const params = useParams()
  const router = useRouter()
  const businessId = params.businessId as string

  const [messages, setMessages] = useState<ChatMessageData[]>([])
  const [isLoading, setIsLoading] = useState(false)
  // Score will be set when validation is complete (future workflow integration)
  const [score] = useState<number | null>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  // Workflow steps
  const [workflowSteps] = useState<WorkflowStep[]>([
    { id: 'idea', name: 'Idea', status: 'completed', icon: <Target className="w-4 h-4" /> },
    { id: 'market', name: 'Market', status: 'in_progress', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'competitors', name: 'Competitors', status: 'pending', icon: <ShieldCheck className="w-4 h-4" /> },
    { id: 'customers', name: 'Customers', status: 'pending', icon: <Users className="w-4 h-4" /> },
    { id: 'synthesis', name: 'Synthesis', status: 'pending', icon: <CheckCircle2 className="w-4 h-4" /> },
  ])

  // Key findings (populated during validation)
  const [keyFindings] = useState<string[]>([])

  // Initial welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: '1',
          role: 'assistant',
          agent: 'vera',
          content: `Welcome! I'm **Vera**, your Validation Team Lead. I'll guide you through validating your business idea with help from my team:

- **Marco** - Market Research Specialist
- **Cipher** - Competitive Intelligence
- **Persona** - Customer Research
- **Risk** - Feasibility Analysis

Let's start by understanding your business idea better. **What problem are you trying to solve, and who experiences this problem?**`,
          timestamp: new Date(),
          suggestedActions: ['Tell me about the problem', 'I have existing documents'],
        },
      ])
    }
  }, [messages.length])

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  const handleSendMessage = async (content: string) => {
    // Add user message
    const userMessage: ChatMessageData = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMessage])
    setIsLoading(true)

    // Simulate agent response (mock for MVP)
    setTimeout(() => {
      const agentMessage: ChatMessageData = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        agent: 'vera',
        content: getMockResponse(content),
        timestamp: new Date(),
        suggestedActions: ['Continue to Market Research', 'Add more details'],
      }
      setMessages((prev) => [...prev, agentMessage])
      setIsLoading(false)
    }, 1500)
  }

  // Mock response generator
  const getMockResponse = (userInput: string): string => {
    const lowerInput = userInput.toLowerCase()

    if (lowerInput.includes('problem') || lowerInput.includes('solve')) {
      return `That's a great starting point! Let me summarize what I'm hearing:

**Problem:** ${userInput}

I'm going to have **Marco** start researching the market size while I ask you a few more questions.

**What solution are you proposing?** And who is your target customer?`
    }

    if (lowerInput.includes('market') || lowerInput.includes('size')) {
      return `Excellent! I've noted that down. **Marco** will calculate the TAM/SAM/SOM with sources.

Meanwhile, let me understand your target customer better. Can you describe your **ideal customer**?

- What industry are they in?
- Company size?
- Key pain points?`
    }

    return `Thanks for sharing that! I've captured this information:

> ${userInput}

Let me coordinate with my team to analyze this further. **Cipher** will look at competitors while **Persona** develops customer profiles.

Is there anything specific you'd like us to focus on?`
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <ValidationHeader businessName="New Business" score={score} />

      <WorkflowProgress steps={workflowSteps} />

      <div className="flex flex-1 overflow-hidden">
        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          <div
            ref={scrollAreaRef}
            className="flex-1 overflow-y-auto p-4"
            role="log"
            aria-live="polite"
            aria-label="Agent conversation"
          >
            <div className="space-y-4">
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
              {isLoading && (
                <div
                  className="flex items-center gap-2 text-muted-foreground"
                  role="status"
                  aria-live="polite"
                >
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  <span className="text-sm">Vera is thinking...</span>
                </div>
              )}
            </div>
          </div>

          <ChatInput onSend={handleSendMessage} disabled={isLoading} />
        </div>

        {/* Sidebar - Key Findings */}
        {keyFindings.length > 0 && (
          <div className="w-80 border-l">
            <KeyFindingsPanel findings={keyFindings} />
          </div>
        )}
      </div>

      {/* Continue to Planning Button (shown when validation complete) */}
      {score !== null && score >= 60 && businessId && (
        <div className="p-4 border-t bg-muted/30">
          <Button
            className="w-full"
            size="lg"
            onClick={() => router.push(`/dashboard/${businessId}/planning` as Parameters<typeof router.push>[0])}
          >
            Continue to Planning <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      )}
    </div>
  )
}
