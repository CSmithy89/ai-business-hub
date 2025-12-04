/**
 * Branding Team Chat API
 *
 * Handles chat messages with the BM-Brand Branding Team.
 * Routes to Bella (team leader) who delegates to specialists.
 *
 * Story: 08.17 - Implement Branding Team Agno Configuration
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@hyvve/db'

// ============================================================================
// Types
// ============================================================================

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  agent?: string
  timestamp: string
}

interface BrandingChatResponse {
  success: boolean
  data: {
    message: ChatMessage
    workflow_status: 'in_progress' | 'completed'
    current_workflow?: string
    output?: {
      positioning?: BrandPositioning
      voiceGuidelines?: VoiceGuidelines
      visualIdentity?: VisualIdentity
    }
  }
}

interface BrandPositioning {
  archetype: {
    primary: string
    secondary?: string
    rationale: string
  }
  values: Array<{
    name: string
    definition: string
    behaviors: string[]
  }>
  personality: {
    traits: string[]
    spectrum: Array<{ dimension: string; position: number }>
  }
  positioning: {
    statement: string
    taglines: string[]
    elevator_pitch: string
  }
  messaging: {
    pillars: Array<{ pillar: string; proof_points: string[] }>
    brand_promise: string
  }
}

interface VoiceGuidelines {
  personality_statement: string
  attributes: Array<{
    attribute: string
    description: string
    dos: string[]
    donts: string[]
  }>
  tone: {
    default: string
    contexts: Array<{ context: string; tone: string; example: string }>
  }
  vocabulary: {
    preferred: string[]
    avoid: string[]
    brand_terms: Array<{ term: string; definition: string }>
  }
  grammar_style: {
    capitalization: string
    contractions: string
    emoji: string
  }
  templates: Array<{
    name: string
    template: string
    example: string
  }>
}

interface VisualIdentity {
  logo: {
    type: string
    rationale: string
    variants: string[]
    rules: {
      minimum_size: string
      clear_space: string
      usage_donts: string[]
    }
  }
  colors: {
    primary: Array<{ name: string; hex: string; rgb: string; usage: string }>
    secondary: Array<{ name: string; hex: string; rgb: string; usage: string }>
    accents: Array<{ name: string; hex: string; usage: string }>
    neutrals: Array<{ name: string; hex: string; usage: string }>
    semantic: {
      success: string
      warning: string
      error: string
      info: string
    }
  }
  typography: {
    primary: {
      family: string
      weights: string[]
      source: string
      usage: string
    }
    secondary?: {
      family: string
      weights: string[]
      source: string
      usage: string
    }
    scale: Array<{ name: string; size: string; line_height: string; weight: string }>
  }
  design_principles: Array<{
    principle: string
    description: string
    application: string
  }>
}

// ============================================================================
// Agent Definitions
// ============================================================================

const BRANDING_AGENTS = {
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
    role: 'Visual Identity Designer',
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
// Mock Response Generator
// ============================================================================

function generateBrandingResponse(
  message: string,
  _businessContext: { name?: string; industry?: string } | null
): {
  agent: string
  content: string
  suggestedActions: string[]
  workflow_status: 'in_progress' | 'completed'
  current_workflow: string
  output?: BrandingChatResponse['data']['output']
} {
  const lowerMessage = message.toLowerCase()

  // Brand Strategy workflow
  if (
    lowerMessage.includes('start') ||
    lowerMessage.includes('strategy') ||
    lowerMessage.includes('archetype') ||
    lowerMessage.includes('values')
  ) {
    return {
      agent: 'sage',
      content: `I'm **Sage**, your Brand Strategist. Let's develop your brand positioning and strategy!

Based on your business plan, I'll guide you through:

## Brand Positioning Framework

**1. Brand Archetype Selection**
I see your business as aligning with the **Sage Archetype** - focused on wisdom, expertise, and trusted guidance. This fits perfectly with an AI-powered business platform.

**Archetype Characteristics:**
- **Core desire:** Truth and understanding
- **Goal:** Use intelligence to understand the world
- **Fear:** Being misled or ignorant
- **Strategy:** Seek information and knowledge

**2. Core Values Identification**
Based on your business model, I recommend these core values:

| Value | Definition | Behavioral Example |
|-------|------------|-------------------|
| **Innovation** | Pioneering AI-first solutions | Ship features that surprise and delight |
| **Empowerment** | Enabling human potential | 90% automation, 5 hours human oversight |
| **Integrity** | Transparent, trustworthy AI | Clear explanations for all AI decisions |
| **Excellence** | Quality in every interaction | Premium experience, attention to detail |

**3. Positioning Statement**
*"For ambitious business owners who want to scale without burnout, HYVVE is the AI business platform that handles 90% of operations intelligently, because we believe human time should be spent on strategy, not routine tasks."*

Would you like to refine any of these elements before we move to brand voice?`,
      suggestedActions: ['Refine archetype', 'Adjust values', 'Continue to Voice'],
      workflow_status: 'in_progress',
      current_workflow: 'strategy',
      output: {
        positioning: {
          archetype: {
            primary: 'Sage',
            secondary: 'Creator',
            rationale: 'Wisdom-focused AI platform enabling creative business building',
          },
          values: [
            {
              name: 'Innovation',
              definition: 'Pioneering AI-first solutions',
              behaviors: ['Ship features that surprise', 'Challenge status quo', 'Embrace experimentation'],
            },
            {
              name: 'Empowerment',
              definition: 'Enabling human potential',
              behaviors: ['90% automation target', 'Clear ownership', 'Support human decisions'],
            },
            {
              name: 'Integrity',
              definition: 'Transparent, trustworthy AI',
              behaviors: ['Explain AI reasoning', 'Admit limitations', 'Protect user data'],
            },
            {
              name: 'Excellence',
              definition: 'Quality in every interaction',
              behaviors: ['Premium UX', 'Attention to detail', 'Continuous improvement'],
            },
          ],
          personality: {
            traits: ['Intelligent', 'Approachable', 'Confident', 'Helpful', 'Forward-thinking'],
            spectrum: [
              { dimension: 'Serious vs Playful', position: 35 },
              { dimension: 'Traditional vs Modern', position: 85 },
              { dimension: 'Formal vs Casual', position: 45 },
            ],
          },
          positioning: {
            statement:
              'For ambitious business owners who want to scale without burnout, HYVVE is the AI business platform that handles 90% of operations intelligently.',
            taglines: [
              'AI-Powered. Human-Centered.',
              'Your Business, 90% Automated.',
              'The Intelligent Business Platform.',
              "Scale Smart. Live Well.",
            ],
            elevator_pitch:
              'HYVVE is an AI business platform that handles 90% of your operations with just 5 hours of human oversight per week, letting you focus on strategy while AI handles the routine.',
          },
          messaging: {
            pillars: [
              {
                pillar: 'AI Automation',
                proof_points: ['90% task automation', 'Confidence-based approvals', 'Intelligent routing'],
              },
              {
                pillar: 'Human Control',
                proof_points: ['Strategic oversight', 'Clear escalation', 'Full transparency'],
              },
              {
                pillar: 'Business Growth',
                proof_points: ['Scale without burnout', 'Focus on value', 'Data-driven decisions'],
              },
            ],
            brand_promise: 'We give you time back by making your business run itself.',
          },
        },
      },
    }
  }

  // Voice workflow
  if (
    lowerMessage.includes('voice') ||
    lowerMessage.includes('tone') ||
    lowerMessage.includes('messaging') ||
    lowerMessage.includes('vocabulary')
  ) {
    return {
      agent: 'vox',
      content: `I'm **Vox**, your Voice Architect. Let's create your brand's verbal identity!

## Brand Voice Guidelines

**Voice Personality Statement:**
*"We speak like a trusted advisor who makes complex things simple - knowledgeable but never condescending, confident but never arrogant."*

**Voice Attributes:**

| Attribute | Description | ✅ DO | ❌ DON'T |
|-----------|-------------|-------|---------|
| **Clear** | Simple, jargon-free | "Let's automate your invoicing" | "Leverage our synergistic workflow optimization" |
| **Confident** | Assured expertise | "Here's the best approach" | "Maybe you could try..." |
| **Warm** | Human and approachable | "Welcome! I'm here to help" | "User login successful" |
| **Empowering** | Enable, don't dictate | "You have three options" | "You must do this" |

**Tone Modulation:**

| Context | Tone | Example |
|---------|------|---------|
| **Onboarding** | Welcoming, encouraging | "Great start! Let's build your business together." |
| **Errors** | Calm, solution-focused | "Something went wrong. Here's how we'll fix it..." |
| **Success** | Celebratory, brief | "Done! Your business plan is ready." |
| **Support** | Patient, thorough | "Let me walk you through this step by step." |

**Vocabulary Guidelines:**

✅ **Preferred Terms:**
- "Your business" (not "the business")
- "We recommend" (not "you should")
- "Smart automation" (not "AI replacement")
- "Approve" (not "authorize")

❌ **Terms to Avoid:**
- "Synergy", "leverage", "utilize"
- Technical jargon without explanation
- Passive voice when active is clearer
- "Honestly" or "actually" (implies previous dishonesty)

Would you like to continue to Visual Identity design?`,
      suggestedActions: ['Refine voice', 'Add examples', 'Continue to Visual Identity'],
      workflow_status: 'in_progress',
      current_workflow: 'voice',
      output: {
        voiceGuidelines: {
          personality_statement:
            'We speak like a trusted advisor who makes complex things simple - knowledgeable but never condescending, confident but never arrogant.',
          attributes: [
            {
              attribute: 'Clear',
              description: 'Simple, jargon-free communication',
              dos: ["Let's automate your invoicing", 'Here are your next steps'],
              donts: ['Leverage our synergistic workflow optimization'],
            },
            {
              attribute: 'Confident',
              description: 'Assured expertise without arrogance',
              dos: ["Here's the best approach", 'Based on the data, I recommend'],
              donts: ['Maybe you could try...', 'I think perhaps...'],
            },
            {
              attribute: 'Warm',
              description: 'Human and approachable',
              dos: ["Welcome! I'm here to help", 'Great question!'],
              donts: ['User login successful', 'Request processed'],
            },
            {
              attribute: 'Empowering',
              description: "Enable, don't dictate",
              dos: ['You have three options', 'Would you like to...'],
              donts: ['You must do this', 'You need to...'],
            },
          ],
          tone: {
            default: 'Friendly professional - warm yet competent',
            contexts: [
              {
                context: 'Onboarding',
                tone: 'Welcoming, encouraging',
                example: "Great start! Let's build your business together.",
              },
              {
                context: 'Errors',
                tone: 'Calm, solution-focused',
                example: "Something went wrong. Here's how we'll fix it...",
              },
              { context: 'Success', tone: 'Celebratory, brief', example: 'Done! Your business plan is ready.' },
              { context: 'Support', tone: 'Patient, thorough', example: 'Let me walk you through this step by step.' },
            ],
          },
          vocabulary: {
            preferred: ['Your business', 'We recommend', 'Smart automation', 'Approve', 'Insights'],
            avoid: ['Synergy', 'Leverage', 'Utilize', 'Actually', 'Honestly'],
            brand_terms: [
              { term: 'HYVVE', definition: 'The platform (always capitalized)' },
              { term: '90/5 Promise', definition: '90% automation with 5 hours/week human involvement' },
              { term: 'Smart Approval', definition: 'Confidence-based routing for human decisions' },
            ],
          },
          grammar_style: {
            capitalization: 'Sentence case for headings, proper nouns only capitalized',
            contractions: "Use contractions for warmth (we're, you'll, let's)",
            emoji: 'Sparingly in casual contexts (social, celebrations), never in formal documents',
          },
          templates: [
            {
              name: 'Welcome message',
              template: "Welcome to HYVVE, [Name]! I'm [Agent], and I'm here to help you [goal].",
              example: "Welcome to HYVVE, Sarah! I'm Blake, and I'm here to help you build your business plan.",
            },
            {
              name: 'Error message',
              template: "[Empathy]. [What happened]. [Solution].",
              example: "Sorry about that. The upload failed because the file was too large. Try a file under 10MB.",
            },
            {
              name: 'Success message',
              template: '[Achievement]! [What this means]. [Optional next step].',
              example: "Done! Your financial projections are ready. Want to review the assumptions?",
            },
          ],
        },
      },
    }
  }

  // Visual Identity workflow
  if (
    lowerMessage.includes('visual') ||
    lowerMessage.includes('color') ||
    lowerMessage.includes('logo') ||
    lowerMessage.includes('typography')
  ) {
    return {
      agent: 'iris',
      content: `I'm **Iris**, your Visual Identity Designer. Let's create your visual brand system!

## Visual Identity Specification

**Logo System:**

Based on your Sage archetype and tech-forward positioning, I recommend a **combination mark** (wordmark + symbol) for flexibility.

**Logo Concept:**
- **Symbol:** Abstract honeycomb pattern representing interconnected AI systems
- **Wordmark:** Clean, geometric sans-serif
- **Rationale:** Honeycombs suggest efficiency, collaboration, and intelligent systems

**Logo Variants:**
1. Primary (horizontal): Symbol + Wordmark
2. Stacked (vertical): Symbol above wordmark
3. Symbol only: For small sizes/favicons
4. Wordmark only: For large format applications

---

## Color Palette

**Primary Colors:**
| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| **HYVVE Indigo** | #4F46E5 | 79, 70, 229 | Primary brand, CTAs |
| **HYVVE Navy** | #1E1B4B | 30, 27, 75 | Headers, emphasis |

**Secondary Colors:**
| Name | Hex | Usage |
|------|-----|-------|
| **Sage Green** | #10B981 | Success, validation |
| **Warm Amber** | #F59E0B | Highlights, alerts |

**Neutral Palette:**
| Name | Hex | Usage |
|------|-----|-------|
| **Slate 900** | #0F172A | Primary text |
| **Slate 500** | #64748B | Secondary text |
| **Slate 100** | #F1F5F9 | Backgrounds |
| **White** | #FFFFFF | Cards, surfaces |

---

## Typography

**Primary: Inter**
- Weights: 400 (Regular), 500 (Medium), 600 (SemiBold), 700 (Bold)
- Use: Headlines, body text, UI elements
- Source: Google Fonts

**Scale:**
| Name | Size | Line Height | Weight |
|------|------|-------------|--------|
| Display | 3rem (48px) | 1.1 | Bold |
| H1 | 2.25rem (36px) | 1.2 | SemiBold |
| H2 | 1.5rem (24px) | 1.3 | SemiBold |
| Body | 1rem (16px) | 1.5 | Regular |
| Caption | 0.875rem (14px) | 1.4 | Regular |

Would you like to proceed to asset generation or refine the visual identity?`,
      suggestedActions: ['Refine colors', 'Adjust typography', 'Generate assets'],
      workflow_status: 'in_progress',
      current_workflow: 'visual',
      output: {
        visualIdentity: {
          logo: {
            type: 'Combination mark (wordmark + symbol)',
            rationale: 'Flexible system supporting various use cases and sizes',
            variants: ['Primary horizontal', 'Stacked vertical', 'Symbol only', 'Wordmark only'],
            rules: {
              minimum_size: '24px height for digital, 10mm for print',
              clear_space: 'Height of H in HYVVE on all sides',
              usage_donts: ['Stretch or distort', 'Add effects', 'Change colors', 'Rotate'],
            },
          },
          colors: {
            primary: [
              {
                name: 'HYVVE Indigo',
                hex: '#4F46E5',
                rgb: '79, 70, 229',
                usage: 'Primary brand, CTAs, key elements',
              },
              { name: 'HYVVE Navy', hex: '#1E1B4B', rgb: '30, 27, 75', usage: 'Headers, emphasis, depth' },
            ],
            secondary: [
              { name: 'Sage Green', hex: '#10B981', rgb: '16, 185, 129', usage: 'Success, validation, growth' },
              { name: 'Warm Amber', hex: '#F59E0B', rgb: '245, 158, 11', usage: 'Highlights, alerts, energy' },
            ],
            accents: [
              { name: 'Sky Blue', hex: '#0EA5E9', usage: 'Links, information' },
              { name: 'Rose', hex: '#F43F5E', usage: 'Errors, warnings' },
            ],
            neutrals: [
              { name: 'Slate 900', hex: '#0F172A', usage: 'Primary text' },
              { name: 'Slate 500', hex: '#64748B', usage: 'Secondary text' },
              { name: 'Slate 100', hex: '#F1F5F9', usage: 'Backgrounds' },
              { name: 'White', hex: '#FFFFFF', usage: 'Cards, surfaces' },
            ],
            semantic: {
              success: '#10B981',
              warning: '#F59E0B',
              error: '#EF4444',
              info: '#0EA5E9',
            },
          },
          typography: {
            primary: {
              family: 'Inter',
              weights: ['400 Regular', '500 Medium', '600 SemiBold', '700 Bold'],
              source: 'Google Fonts',
              usage: 'All text - headlines, body, UI',
            },
            scale: [
              { name: 'Display', size: '3rem (48px)', line_height: '1.1', weight: 'Bold' },
              { name: 'H1', size: '2.25rem (36px)', line_height: '1.2', weight: 'SemiBold' },
              { name: 'H2', size: '1.5rem (24px)', line_height: '1.3', weight: 'SemiBold' },
              { name: 'H3', size: '1.25rem (20px)', line_height: '1.4', weight: 'Medium' },
              { name: 'Body', size: '1rem (16px)', line_height: '1.5', weight: 'Regular' },
              { name: 'Small', size: '0.875rem (14px)', line_height: '1.4', weight: 'Regular' },
              { name: 'Caption', size: '0.75rem (12px)', line_height: '1.4', weight: 'Medium' },
            ],
          },
          design_principles: [
            {
              principle: 'Clarity First',
              description: 'Every element should have clear purpose',
              application: 'Generous whitespace, clear hierarchy, obvious CTAs',
            },
            {
              principle: 'Intelligent Simplicity',
              description: 'Complex under the hood, simple on the surface',
              application: 'Progressive disclosure, smart defaults, hidden complexity',
            },
            {
              principle: 'Human-Centered AI',
              description: 'AI serves humans, never intimidates',
              application: 'Warm colors, friendly avatars, conversational UI',
            },
          ],
        },
      },
    }
  }

  // Default Bella response
  return {
    agent: 'bella',
    content: `I'm **Bella**, your Brand Team Lead. Welcome to brand development!

I'll coordinate our team of specialists to create a comprehensive brand identity:

**Our Team:**
- **Sage** (Brand Strategist) - Positioning, archetype, values
- **Vox** (Voice Architect) - Tone, messaging, vocabulary
- **Iris** (Visual Designer) - Logo, colors, typography
- **Artisan** (Asset Generator) - Production-ready deliverables
- **Audit** (Quality Assurance) - Consistency verification

**Brand Development Workflow:**

1. 🎯 **Brand Strategy** - Define who you are and why you matter
2. 🗣️ **Brand Voice** - How you communicate your identity
3. 🎨 **Visual Identity** - How you look
4. 📋 **Brand Guidelines** - Documentation for consistency
5. 📦 **Asset Generation** - Production-ready deliverables
6. ✅ **Brand Audit** - Quality and consistency check

**Ready to begin?**

Based on your business plan, I'll have Sage start with brand strategy. We'll define your:
- Brand archetype (your personality type)
- Core values (what you stand for)
- Positioning statement (how you're different)
- Key messaging (how you talk about it)

Shall we start with brand strategy?`,
    suggestedActions: ['Start Brand Strategy', 'Review business context', 'Jump to Visual Identity'],
    workflow_status: 'in_progress',
    current_workflow: 'overview',
  }
}

// ============================================================================
// API Handlers
// ============================================================================

export async function POST(request: NextRequest, { params }: { params: Promise<{ businessId: string }> }) {
  try {
    const { businessId } = await params
    const body = await request.json()
    const { message } = body

    if (!message) {
      return NextResponse.json({ success: false, message: 'Message is required' }, { status: 400 })
    }

    // Fetch business and branding session
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      include: {
        brandingData: true,
      },
    })

    if (!business) {
      return NextResponse.json({ success: false, message: 'Business not found' }, { status: 404 })
    }

    // Create branding session if it doesn't exist
    let brandingSession = business.brandingData
    if (!brandingSession) {
      brandingSession = await prisma.brandingSession.create({
        data: {
          businessId,
          completedWorkflows: [],
        },
      })

      // Update business branding status
      await prisma.business.update({
        where: { id: businessId },
        data: { brandingStatus: 'IN_PROGRESS' },
      })
    }

    // Generate response
    const response = generateBrandingResponse(message, {
      name: business.name,
      industry: business.industry || undefined,
    })

    // Update session with outputs if provided
    if (response.output) {
      const updateData: Record<string, unknown> = {}

      if (response.output.positioning) {
        updateData.positioning = response.output.positioning
        if (!brandingSession.completedWorkflows.includes('strategy')) {
          updateData.completedWorkflows = [...brandingSession.completedWorkflows, 'strategy']
        }
      }

      if (response.output.voiceGuidelines) {
        updateData.voiceGuidelines = response.output.voiceGuidelines
        const workflows = (updateData.completedWorkflows as string[]) || brandingSession.completedWorkflows
        if (!workflows.includes('voice')) {
          updateData.completedWorkflows = [...workflows, 'voice']
        }
      }

      if (response.output.visualIdentity) {
        updateData.visualIdentity = response.output.visualIdentity
        const workflows = (updateData.completedWorkflows as string[]) || brandingSession.completedWorkflows
        if (!workflows.includes('visual')) {
          updateData.completedWorkflows = [...workflows, 'visual']
        }
      }

      if (Object.keys(updateData).length > 0) {
        await prisma.brandingSession.update({
          where: { id: brandingSession.id },
          data: updateData,
        })
      }
    }

    const chatResponse: BrandingChatResponse = {
      success: true,
      data: {
        message: {
          role: 'assistant',
          content: response.content,
          agent: response.agent,
          timestamp: new Date().toISOString(),
        },
        workflow_status: response.workflow_status,
        current_workflow: response.current_workflow,
        output: response.output,
      },
    }

    return NextResponse.json(chatResponse)
  } catch (error) {
    console.error('Branding chat error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ businessId: string }> }) {
  try {
    const { businessId } = await params

    // Fetch branding session status
    const brandingSession = await prisma.brandingSession.findUnique({
      where: { businessId },
    })

    if (!brandingSession) {
      return NextResponse.json({
        success: true,
        data: {
          status: 'not_started',
          completedWorkflows: [],
        },
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        status: brandingSession.completedWorkflows.length >= 5 ? 'completed' : 'in_progress',
        completedWorkflows: brandingSession.completedWorkflows,
        positioning: brandingSession.positioning,
        voiceGuidelines: brandingSession.voiceGuidelines,
        visualIdentity: brandingSession.visualIdentity,
        generatedAssets: brandingSession.generatedAssets,
      },
    })
  } catch (error) {
    console.error('Branding GET error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}

export { BRANDING_AGENTS }
