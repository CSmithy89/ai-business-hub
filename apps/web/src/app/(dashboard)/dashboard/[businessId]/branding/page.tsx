/**
 * Branding Page
 *
 * Chat interface for the Branding Module (BM-Brand).
 * Users interact with Bella (team leader) and specialist agents
 * to develop their brand identity.
 *
 * Story: 08.18 - Create Branding Page with Visual Identity Preview
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
// Tabs not installed yet - using simple cards instead
import {
  Send,
  User,
  CheckCircle2,
  Circle,
  Loader2,
  ArrowRight,
  Sparkles,
  MessageSquare,
  Palette,
  Type,
  Image as ImageIcon,
  FileText,
  Package,
  CheckSquare,
  Download,
  Copy,
} from 'lucide-react'
import { agentClient } from '@/lib/agent-client'

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

interface ColorItem {
  name: string
  hex: string
  rgb?: string
  usage: string
}

interface TypographyItem {
  name: string
  size: string
  weight: string
  family?: string
}

interface VisualIdentity {
  colors?: {
    primary?: ColorItem[]
    secondary?: ColorItem[]
    neutrals?: ColorItem[]
  }
  typography?: {
    primary?: {
      family: string
      weights: string[]
    }
    scale?: TypographyItem[]
  }
  logo?: {
    type: string
    rationale: string
    variants: string[]
  }
}

interface BrandingSession {
  completedWorkflows: string[]
  positioning?: unknown
  voiceGuidelines?: unknown
  visualIdentity?: VisualIdentity
  generatedAssets?: Array<{ type: string; name: string; url?: string; status: string }>
}

// ============================================================================
// Agent Configuration
// ============================================================================

const AGENTS = {
  bella: {
    name: 'Bella',
    role: 'Brand Team Lead',
    avatar: '/agents/bella.png',
    color: 'bg-pink-500',
  },
  sage: {
    name: 'Sage',
    role: 'Brand Strategist',
    avatar: '/agents/sage.png',
    color: 'bg-purple-500',
  },
  vox: {
    name: 'Vox',
    role: 'Voice Architect',
    avatar: '/agents/vox.png',
    color: 'bg-indigo-500',
  },
  iris: {
    name: 'Iris',
    role: 'Visual Designer',
    avatar: '/agents/iris.png',
    color: 'bg-cyan-500',
  },
  artisan: {
    name: 'Artisan',
    role: 'Asset Generator',
    avatar: '/agents/artisan.png',
    color: 'bg-orange-500',
  },
  audit: {
    name: 'Audit',
    role: 'Brand Auditor',
    avatar: '/agents/audit.png',
    color: 'bg-red-500',
  },
}

// ============================================================================
// Components
// ============================================================================

function BrandingHeader({
  businessName,
  completedWorkflows,
}: {
  businessName: string
  completedWorkflows: number
}) {
  return (
    <div className="flex items-center justify-between p-4 border-b">
      <div>
        <h1 className="text-2xl font-bold">Brand Development</h1>
        <p className="text-muted-foreground">{businessName}</p>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Workflows Complete</p>
          <p className="text-3xl font-bold">{completedWorkflows}/6</p>
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
        <h2 className="text-sm font-medium">Brand Progress</h2>
        <span className="text-sm text-muted-foreground">
          {completedCount}/{steps.length} completed
        </span>
      </div>
      <Progress value={progressPercent} className="h-2 mb-4" />
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
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
            <span className={`text-xs text-center ${step.status === 'in_progress' ? 'font-medium' : ''}`}>
              {step.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function AgentAvatar({ agent }: { agent: string }) {
  const agentInfo = AGENTS[agent as keyof typeof AGENTS] || AGENTS.bella

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
        <AgentAvatar agent={message.agent || 'bella'} />
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

function ColorPalettePreview({ colors }: { colors?: VisualIdentity['colors'] }) {
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch (err) {
      console.error('Failed to copy to clipboard:', err)
    }
  }

  if (!colors) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Color Palette
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Complete Visual Identity workflow to see colors
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Palette className="w-4 h-4" />
          Color Palette
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {colors.primary && colors.primary.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Primary</p>
            <div className="flex gap-2">
              {colors.primary.map((color) => (
                <div key={color.hex} className="group relative">
                  <div
                    className="w-12 h-12 rounded-lg shadow-sm border cursor-pointer"
                    style={{ backgroundColor: color.hex }}
                    onClick={() => copyToClipboard(color.hex)}
                  />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/50 rounded-lg">
                    <Copy className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-xs text-center mt-1">{color.hex}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        {colors.secondary && colors.secondary.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Secondary</p>
            <div className="flex gap-2">
              {colors.secondary.map((color) => (
                <div key={color.hex} className="group relative">
                  <div
                    className="w-10 h-10 rounded-lg shadow-sm border cursor-pointer"
                    style={{ backgroundColor: color.hex }}
                    onClick={() => copyToClipboard(color.hex)}
                  />
                  <p className="text-xs text-center mt-1">{color.hex}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        {colors.neutrals && colors.neutrals.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Neutrals</p>
            <div className="flex gap-1">
              {colors.neutrals.map((color) => (
                <div
                  key={color.hex}
                  className="w-8 h-8 rounded border cursor-pointer"
                  style={{ backgroundColor: color.hex }}
                  onClick={() => copyToClipboard(color.hex)}
                  title={`${color.name}: ${color.hex}`}
                />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function TypographyPreview({ typography }: { typography?: VisualIdentity['typography'] }) {
  if (!typography) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Type className="w-4 h-4" />
            Typography
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Complete Visual Identity workflow to see typography
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Type className="w-4 h-4" />
          Typography
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {typography.primary && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Primary Font</p>
            <p className="text-lg font-semibold" style={{ fontFamily: typography.primary.family }}>
              {typography.primary.family}
            </p>
            <p className="text-xs text-muted-foreground">
              Weights: {typography.primary.weights.join(', ')}
            </p>
          </div>
        )}
        {typography.scale && typography.scale.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Type Scale</p>
            <div className="space-y-1">
              {typography.scale.slice(0, 4).map((item) => (
                <div key={item.name} className="flex items-baseline justify-between">
                  <span className="text-sm text-muted-foreground">{item.name}</span>
                  <span className="font-medium" style={{ fontSize: item.size }}>
                    Aa
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function LogoPreview({ logo }: { logo?: VisualIdentity['logo'] }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <ImageIcon className="w-4 h-4" />
          Logo Concept
        </CardTitle>
      </CardHeader>
      <CardContent>
        {logo ? (
          <div className="space-y-3">
            <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
              <div className="text-center">
                <Sparkles className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm font-medium">{logo.type}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">{logo.rationale}</p>
            <div className="flex flex-wrap gap-1">
              {logo.variants.map((variant) => (
                <Badge key={variant} variant="secondary" className="text-xs">
                  {variant}
                </Badge>
              ))}
            </div>
          </div>
        ) : (
          <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
            <p className="text-sm text-muted-foreground">Complete Visual Identity workflow</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function AssetGallery({ assets }: { assets?: BrandingSession['generatedAssets'] }) {
  const defaultAssets = [
    { type: 'logo', name: 'Primary Logo', status: 'pending' },
    { type: 'logo', name: 'Icon/Symbol', status: 'pending' },
    { type: 'logo', name: 'Favicon Set', status: 'pending' },
    { type: 'social', name: 'Social Media Kit', status: 'pending' },
    { type: 'document', name: 'Business Card Template', status: 'pending' },
    { type: 'document', name: 'Brand Guidelines PDF', status: 'pending' },
  ]

  const displayAssets = assets && assets.length > 0 ? assets : defaultAssets

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Package className="w-4 h-4" />
          Brand Assets
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {displayAssets.map((asset, idx) => (
            <div key={idx} className="flex items-center justify-between py-2 border-b last:border-0">
              <div className="flex items-center gap-2">
                {asset.type === 'logo' ? (
                  <ImageIcon className="w-4 h-4 text-muted-foreground" />
                ) : asset.type === 'social' ? (
                  <Sparkles className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <FileText className="w-4 h-4 text-muted-foreground" />
                )}
                <span className="text-sm">{asset.name}</span>
              </div>
              {asset.status === 'generated' && 'url' in asset && asset.url ? (
                <Button variant="ghost" size="sm">
                  <Download className="w-4 h-4" />
                </Button>
              ) : (
                <Badge variant="secondary" className="text-xs">
                  {asset.status}
                </Badge>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function PreviewPanel({ brandingData }: { brandingData: BrandingSession | null }) {
  return (
    <div className="space-y-4">
      <h3 className="font-medium text-sm">Visual Identity Preview</h3>
      <ColorPalettePreview colors={brandingData?.visualIdentity?.colors} />
      <TypographyPreview typography={brandingData?.visualIdentity?.typography} />
      <LogoPreview logo={brandingData?.visualIdentity?.logo} />
      <AssetGallery assets={brandingData?.generatedAssets} />

      {/* Brand Guidelines Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Brand Guidelines
          </CardTitle>
        </CardHeader>
        <CardContent>
          {brandingData?.completedWorkflows?.includes('guidelines') ? (
            <div className="space-y-3">
              <p className="text-sm">Your brand guidelines document is ready!</p>
              <Button className="w-full">
                <Download className="w-4 h-4 mr-2" />
                Download Brand Guidelines PDF
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Complete all workflows to generate brand guidelines
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ============================================================================
// Main Page Component
// ============================================================================

export default function BrandingPage() {
  const params = useParams()
  const router = useRouter()
  const businessId = params.businessId as string

  const [messages, setMessages] = useState<ChatMessageData[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [brandingData, setBrandingData] = useState<BrandingSession | null>(null)
  const [currentWorkflow, setCurrentWorkflow] = useState<string>('overview')
  const [sessionId, setSessionId] = useState<string | undefined>()
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  // Workflow steps
  const [workflowSteps, setWorkflowSteps] = useState<WorkflowStep[]>([
    { id: 'strategy', name: 'Strategy', status: 'in_progress', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'voice', name: 'Voice', status: 'pending', icon: <MessageSquare className="w-4 h-4" /> },
    { id: 'visual', name: 'Visual', status: 'pending', icon: <Palette className="w-4 h-4" /> },
    { id: 'guidelines', name: 'Guidelines', status: 'pending', icon: <FileText className="w-4 h-4" /> },
    { id: 'assets', name: 'Assets', status: 'pending', icon: <Package className="w-4 h-4" /> },
    { id: 'audit', name: 'Audit', status: 'pending', icon: <CheckSquare className="w-4 h-4" /> },
  ])

  const completedCount = workflowSteps.filter((s) => s.status === 'completed').length

  // Fetch initial branding status
  useEffect(() => {
    const fetchBrandingStatus = async () => {
      try {
        const response = await fetch(`/api/branding/${businessId}/chat`)
        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            setBrandingData(data.data)
            // Update workflow steps based on completed workflows
            const completed = data.data.completedWorkflows || []
            setWorkflowSteps((prev) =>
              prev.map((step) => ({
                ...step,
                status: completed.includes(step.id)
                  ? 'completed'
                  : step.id === 'strategy' && completed.length === 0
                    ? 'in_progress'
                    : 'pending',
              }))
            )
          }
        }
      } catch (error) {
        console.error('Failed to fetch branding status:', error)
      }
    }

    fetchBrandingStatus()
  }, [businessId])

  // Initial welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: '1',
          role: 'assistant',
          agent: 'bella',
          content: `Welcome to Brand Development! I'm **Bella**, your Brand Team Lead.

I'll coordinate our specialists to create your complete brand identity:

**Our Team:**
- **Sage** - Brand Strategy (positioning, values, archetype)
- **Vox** - Voice Architecture (tone, messaging, vocabulary)
- **Iris** - Visual Identity (colors, typography, logo)
- **Artisan** - Asset Generation (deliverables, templates)
- **Audit** - Quality Assurance (consistency verification)

Based on your business plan, we'll create a cohesive brand that resonates with your target audience.

**Ready to start with Brand Strategy?**

I'll have Sage guide you through:
- Selecting your brand archetype
- Defining your core values
- Crafting your positioning statement
- Developing key messaging`,
          timestamp: new Date(),
          suggestedActions: ['Start Brand Strategy', 'Review business plan first', 'Jump to Visual Identity'],
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

    try {
      // Call real agent API
      const response = await agentClient.runBranding({
        message: content,
        business_id: businessId,
        session_id: sessionId,
        context: {
          current_workflow: currentWorkflow,
          branding_data: brandingData || undefined,
          completed_workflows: workflowSteps
            .filter((s) => s.status === 'completed')
            .map((s) => s.id),
        },
      })

      // Store session ID for continuity
      if (response.session_id) {
        setSessionId(response.session_id)
      }

      // Create agent message from response
      const agentMessage: ChatMessageData = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        agent: response.agent_name?.toLowerCase() || 'bella',
        content: response.content || 'I apologize, but I encountered an issue. Could you try again?',
        timestamp: new Date(),
        suggestedActions: getSuggestedActions(content),
      }
      setMessages((prev) => [...prev, agentMessage])

      // Parse metadata for workflow updates
      if (response.metadata.current_workflow) {
        setCurrentWorkflow(response.metadata.current_workflow as string)
        // Mark previous workflow as complete if we moved to a new one
        const workflowOrder = ['strategy', 'voice', 'visual', 'guidelines', 'assets', 'audit']
        const currentIdx = workflowOrder.indexOf(response.metadata.current_workflow as string)
        if (currentIdx > 0) {
          setWorkflowSteps((prev) =>
            prev.map((step, idx) => ({
              ...step,
              status:
                idx < currentIdx ? 'completed' : idx === currentIdx ? 'in_progress' : step.status,
            }))
          )
        }
      }
    } catch (error) {
      console.error('Error calling branding agent:', error)

      // Fallback error message
      const errorMessage: ChatMessageData = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        agent: 'bella',
        content: 'I apologize, but I encountered an error processing your message. Please try again.',
        timestamp: new Date(),
        suggestedActions: ['Try again', 'Ask a different question'],
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  // Get suggested actions based on current workflow
  const getSuggestedActions = (userInput: string): string[] => {
    const lowerInput = userInput.toLowerCase()

    if (lowerInput.includes('strategy') || currentWorkflow === 'strategy') {
      return ['Continue to Voice & Tone', 'Refine brand values', 'Review positioning']
    }
    if (lowerInput.includes('voice') || currentWorkflow === 'voice') {
      return ['Move to Visual Identity', 'Add messaging examples', 'Review tone guidelines']
    }
    if (lowerInput.includes('visual') || currentWorkflow === 'visual') {
      return ['Generate brand guidelines', 'Refine color palette', 'Create logo concepts']
    }
    if (lowerInput.includes('asset') || currentWorkflow === 'assets') {
      return ['Download assets', 'Generate more templates', 'Run brand audit']
    }
    return ['Continue', 'Ask a question', 'Review progress']
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <BrandingHeader businessName="New Business" completedWorkflows={completedCount} />

      <WorkflowProgress steps={workflowSteps} />

      <div className="flex flex-1 overflow-hidden">
        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <div ref={scrollAreaRef} className="flex-1 overflow-y-auto p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
              {isLoading && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Working on {currentWorkflow}...</span>
                </div>
              )}
            </div>
          </div>

          <ChatInput onSend={handleSendMessage} disabled={isLoading} />
        </div>

        {/* Sidebar - Preview Panel */}
        <div className="w-80 border-l hidden lg:block overflow-y-auto p-4">
          <PreviewPanel brandingData={brandingData} />
        </div>
      </div>

      {/* Continue Button (shown when branding complete) */}
      {completedCount === 6 && (
        <div className="p-4 border-t bg-muted/30">
          <Button
            className="w-full"
            size="lg"
            onClick={() => router.push(`/dashboard/${businessId}` as Parameters<typeof router.push>[0])}
          >
            Complete Onboarding <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      )}
    </div>
  )
}
