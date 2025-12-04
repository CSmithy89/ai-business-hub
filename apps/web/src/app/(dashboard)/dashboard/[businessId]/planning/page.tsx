/**
 * Planning Page
 *
 * Chat interface for the Business Planning Module (BMP).
 * Users interact with Blake (team leader) and specialist agents
 * to develop their business plan.
 *
 * Story: 08.13 - Create Planning Page with Workflow Progress
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
  LayoutGrid,
  Calculator,
  DollarSign,
  TrendingUp,
  FileText,
  Download,
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
  blake: {
    name: 'Blake',
    role: 'Planning Lead',
    avatar: '/agents/blake.png',
    color: 'bg-indigo-500',
  },
  model: {
    name: 'Model',
    role: 'Business Model Expert',
    avatar: '/agents/model.png',
    color: 'bg-blue-500',
  },
  finance: {
    name: 'Finance',
    role: 'Financial Analyst',
    avatar: '/agents/finance.png',
    color: 'bg-green-500',
  },
  revenue: {
    name: 'Revenue',
    role: 'Monetization Strategist',
    avatar: '/agents/revenue.png',
    color: 'bg-yellow-500',
  },
  forecast: {
    name: 'Forecast',
    role: 'Growth Forecaster',
    avatar: '/agents/forecast.png',
    color: 'bg-purple-500',
  },
}

// ============================================================================
// Components
// ============================================================================

function PlanningHeader({
  businessName,
  completedWorkflows,
}: {
  businessName: string
  completedWorkflows: number
}) {
  return (
    <div className="flex items-center justify-between p-4 border-b">
      <div>
        <h1 className="text-2xl font-bold">Business Planning</h1>
        <p className="text-muted-foreground">{businessName}</p>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Workflows Complete</p>
          <p className="text-3xl font-bold">{completedWorkflows}/5</p>
        </div>
      </div>
    </div>
  )
}

function WorkflowProgress({ steps }: { steps: WorkflowStep[] }) {
  const completedCount = steps.filter((s) => s.status === 'completed').length
  const progressPercent = (completedCount / steps.length) * 100

  return (
    <div className="p-4 border-b bg-muted/30">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-medium">Planning Progress</h2>
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
            <span className={`text-xs ${step.status === 'in_progress' ? 'font-medium' : ''}`}>{step.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function AgentAvatar({ agent }: { agent: string }) {
  const agentInfo = AGENTS[agent as keyof typeof AGENTS] || AGENTS.blake

  return (
    <Avatar className="w-8 h-8">
      <AvatarImage src={agentInfo.avatar} alt={agentInfo.name} />
      <AvatarFallback className={agentInfo.color}>{agentInfo.name[0]}</AvatarFallback>
    </Avatar>
  )
}

function ChatMessage({ message }: { message: ChatMessageData }) {
  const isUser = message.role === 'user'
  const agentInfo = message.agent ? AGENTS[message.agent as keyof typeof AGENTS] : null

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      {isUser ? (
        <Avatar className="w-8 h-8">
          <AvatarFallback className="bg-primary">
            <User className="w-4 h-4 text-primary-foreground" />
          </AvatarFallback>
        </Avatar>
      ) : (
        <AgentAvatar agent={message.agent || 'blake'} />
      )}
      <div className={`flex flex-col max-w-[80%] ${isUser ? 'items-end' : ''}`}>
        {!isUser && agentInfo && (
          <span className="text-xs text-muted-foreground mb-1">
            {agentInfo.name} ({agentInfo.role})
          </span>
        )}
        <div className={`rounded-lg px-4 py-2 ${isUser ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
          <div className="text-sm whitespace-pre-wrap">{message.content}</div>
        </div>
        {message.suggestedActions && message.suggestedActions.length > 0 && (
          <div className="flex gap-2 mt-2 flex-wrap">
            {message.suggestedActions.map((action, idx) => (
              <Button key={idx} variant="outline" size="sm">
                {action}
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ChatInput({ onSend, disabled }: { onSend: (message: string) => void; disabled?: boolean }) {
  const [input, setInput] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim() && !disabled) {
      onSend(input.trim())
      setInput('')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 border-t">
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          disabled={disabled}
          className="flex-1"
        />
        <Button type="submit" disabled={disabled || !input.trim()}>
          {disabled ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </Button>
      </div>
    </form>
  )
}

function ArtifactsPanel({ artifacts }: { artifacts: Array<{ name: string; status: string; icon: React.ReactNode }> }) {
  return (
    <Card className="m-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Planning Artifacts</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {artifacts.map((artifact, idx) => (
            <div key={idx} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {artifact.icon}
                <span className="text-sm">{artifact.name}</span>
              </div>
              {artifact.status === 'completed' ? (
                <Button variant="ghost" size="sm">
                  <Download className="w-4 h-4" />
                </Button>
              ) : (
                <Badge variant="secondary" className="text-xs">
                  {artifact.status}
                </Badge>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// Main Page Component
// ============================================================================

export default function PlanningPage() {
  const params = useParams()
  const router = useRouter()
  const businessId = params.businessId as string

  const [messages, setMessages] = useState<ChatMessageData[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  // Workflow steps
  const [workflowSteps] = useState<WorkflowStep[]>([
    { id: 'canvas', name: 'Canvas', status: 'in_progress', icon: <LayoutGrid className="w-4 h-4" /> },
    { id: 'financials', name: 'Financials', status: 'pending', icon: <Calculator className="w-4 h-4" /> },
    { id: 'pricing', name: 'Pricing', status: 'pending', icon: <DollarSign className="w-4 h-4" /> },
    { id: 'growth', name: 'Growth', status: 'pending', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'plan', name: 'Plan', status: 'pending', icon: <FileText className="w-4 h-4" /> },
  ])

  // Artifacts
  const [artifacts] = useState([
    { name: 'Business Model Canvas', status: 'in progress', icon: <LayoutGrid className="w-4 h-4" /> },
    { name: 'Financial Projections', status: 'pending', icon: <Calculator className="w-4 h-4" /> },
    { name: 'Pricing Strategy', status: 'pending', icon: <DollarSign className="w-4 h-4" /> },
    { name: 'Growth Forecast', status: 'pending', icon: <TrendingUp className="w-4 h-4" /> },
    { name: 'Business Plan', status: 'pending', icon: <FileText className="w-4 h-4" /> },
  ])

  const completedCount = workflowSteps.filter((s) => s.status === 'completed').length

  // Initial welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: '1',
          role: 'assistant',
          agent: 'blake',
          content: `Welcome to Business Planning! I'm **Blake**, your Planning Team Lead. I'll guide you through developing your business plan with help from my team:

- **Model** - Business Model Canvas Expert
- **Finance** - Financial Analyst
- **Revenue** - Monetization Strategist
- **Forecast** - Growth Forecaster

Your business has been validated - now let's turn that validated idea into an investor-ready plan!

**Let's start with your Business Model Canvas.** Based on your validation data, I'll have Model begin drafting the canvas sections. Would you like to:`,
          timestamp: new Date(),
          suggestedActions: ['Start Business Model Canvas', 'Review validation findings first', 'Jump to financials'],
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
        agent: getResponsibleAgent(content),
        content: getMockResponse(content),
        timestamp: new Date(),
        suggestedActions: getSuggestedActions(content),
      }
      setMessages((prev) => [...prev, agentMessage])
      setIsLoading(false)
    }, 1500)
  }

  // Determine which agent should respond
  const getResponsibleAgent = (userInput: string): string => {
    const lowerInput = userInput.toLowerCase()

    if (lowerInput.includes('canvas') || lowerInput.includes('value prop') || lowerInput.includes('customer segment')) {
      return 'model'
    }
    if (lowerInput.includes('financ') || lowerInput.includes('p&l') || lowerInput.includes('projection')) {
      return 'finance'
    }
    if (lowerInput.includes('price') || lowerInput.includes('revenue') || lowerInput.includes('monetiz')) {
      return 'revenue'
    }
    if (lowerInput.includes('growth') || lowerInput.includes('forecast') || lowerInput.includes('scenario')) {
      return 'forecast'
    }
    return 'blake'
  }

  // Mock response generator
  const getMockResponse = (userInput: string): string => {
    const lowerInput = userInput.toLowerCase()

    if (lowerInput.includes('canvas') || lowerInput.includes('start')) {
      return `I'll start drafting your Business Model Canvas based on your validation data.

**Customer Segments** (from your validation):
Based on your ICP, we're targeting mid-market B2B companies with 100-1000 employees in technology and professional services.

**Value Propositions**:
- 90% automation of routine operations
- ~5 hours/week human involvement
- AI-powered decision support

Let me continue with the remaining sections. **Model** will now develop:
- Channels
- Customer Relationships
- Revenue Streams

**What pricing model are you considering?** (subscription, transaction-based, hybrid)`
    }

    if (lowerInput.includes('financ') || lowerInput.includes('projection')) {
      return `I'll hand this to **Finance** to build your financial projections.

Based on your market sizing (TAM: $4.2B, SAM: $840M, SOM: $42M), here's an initial revenue model:

**Year 1:** $500K (penetrating 1.2% of SOM)
**Year 2:** $1.5M (3.6% of SOM)
**Year 3:** $4.2M (10% of SOM)

**Key Assumptions:**
- Average contract value: $50K/year
- Customer acquisition: 10 -> 30 -> 84 customers
- Gross margin: 75%

Would you like to adjust these assumptions or proceed to cost structure?`
    }

    if (lowerInput.includes('price') || lowerInput.includes('subscription')) {
      return `**Revenue** here. Based on your customer profiles, I recommend a tiered SaaS model:

**Starter:** $99/month (up to 5 users)
**Growth:** $299/month (up to 20 users)
**Enterprise:** Custom pricing

**Unit Economics:**
- ARPU: $200/month
- Target CAC: $2,000
- LTV:CAC ratio: 3.6:1 (healthy!)

This aligns with the willingness-to-pay data from customer validation. Shall I model expansion revenue from upsells?`
    }

    return `Thanks for that input! I've noted it down and will incorporate it into the plan.

I'm coordinating with my team to update the relevant sections:
- **Model** is refining the canvas
- **Finance** will adjust projections accordingly
- **Revenue** is validating pricing assumptions

Is there a specific area you'd like to dive deeper into?`
  }

  // Get suggested actions based on context
  const getSuggestedActions = (userInput: string): string[] => {
    const lowerInput = userInput.toLowerCase()

    if (lowerInput.includes('canvas')) {
      return ['Continue to Revenue Streams', 'Refine Value Props', 'Move to Financials']
    }
    if (lowerInput.includes('financ')) {
      return ['Adjust assumptions', 'Add cost structure', 'Run scenarios']
    }
    if (lowerInput.includes('price')) {
      return ['Model expansion revenue', 'Compare to competitors', 'Proceed to Growth']
    }
    return ['Continue planning', 'Ask a question', 'Review progress']
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <PlanningHeader businessName="New Business" completedWorkflows={completedCount} />

      <WorkflowProgress steps={workflowSteps} />

      <div className="flex flex-1 overflow-hidden">
        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          <div ref={scrollAreaRef} className="flex-1 overflow-y-auto p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
              {isLoading && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Blake is thinking...</span>
                </div>
              )}
            </div>
          </div>

          <ChatInput onSend={handleSendMessage} disabled={isLoading} />
        </div>

        {/* Sidebar - Artifacts */}
        <div className="w-80 border-l hidden lg:block">
          <ArtifactsPanel artifacts={artifacts} />
        </div>
      </div>

      {/* Continue to Branding Button (shown when planning complete) */}
      {completedCount === 5 && (
        <div className="p-4 border-t bg-muted/30">
          <Button
            className="w-full"
            size="lg"
            onClick={() => router.push(`/dashboard/${businessId}/branding` as Parameters<typeof router.push>[0])}
          >
            Continue to Branding <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      )}
    </div>
  )
}
