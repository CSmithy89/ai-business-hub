import { NextRequest, NextResponse } from 'next/server'
import type { Agent, AgentTeam, AgentStatus } from '@hyvve/shared'

// Mock agent data - will be replaced with real database queries
const MOCK_AGENTS: Agent[] = [
  // Validation Team
  {
    id: 'vera',
    name: 'Vera',
    role: 'Validation Orchestrator',
    team: 'validation',
    description: 'Leads the validation team in assessing business viability',
    avatar: '🔍',
    themeColor: '#3b82f6',
    status: 'online',
    lastActive: new Date(),
    capabilities: [
      'Market Analysis',
      'Competitor Research',
      'Customer Discovery',
      'Idea Validation',
    ],
    metrics: {
      tasksCompleted: 142,
      successRate: 94,
      avgResponseTime: 2300,
      confidenceAvg: 87,
    },
    config: {
      providerId: null,
      model: null,
      temperature: 1,
      maxTokens: 4000,
      contextWindow: 8000,
      automationLevel: 'smart',
      confidenceThreshold: 70,
      tone: 50,
      customInstructions: '',
    },
    permissions: {
      dataAccess: ['validation', 'businesses'],
      canExecuteActions: true,
      requiresApproval: false,
    },
    workspaceId: 'default',
    enabled: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'val-market',
    name: 'Market Analyzer',
    role: 'Market Sizing Specialist',
    team: 'validation',
    description: 'Analyzes market size and opportunity',
    avatar: '📊',
    themeColor: '#3b82f6',
    status: 'online',
    lastActive: new Date(),
    capabilities: ['Market Sizing', 'TAM Analysis', 'Growth Projections'],
    metrics: {
      tasksCompleted: 89,
      successRate: 91,
      avgResponseTime: 1800,
      confidenceAvg: 85,
    },
    config: {
      providerId: null,
      model: null,
      temperature: 1,
      maxTokens: 4000,
      contextWindow: 8000,
      automationLevel: 'smart',
      confidenceThreshold: 70,
      tone: 50,
      customInstructions: '',
    },
    permissions: {
      dataAccess: ['validation', 'businesses'],
      canExecuteActions: true,
      requiresApproval: false,
    },
    workspaceId: 'default',
    enabled: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'val-competitor',
    name: 'Competitor Scout',
    role: 'Competitive Intelligence',
    team: 'validation',
    description: 'Maps competitive landscape',
    avatar: '🎯',
    themeColor: '#3b82f6',
    status: 'busy',
    lastActive: new Date(),
    capabilities: ['Competitor Analysis', 'SWOT Analysis', 'Market Positioning'],
    metrics: {
      tasksCompleted: 76,
      successRate: 88,
      avgResponseTime: 2100,
      confidenceAvg: 82,
    },
    config: {
      providerId: null,
      model: null,
      temperature: 1,
      maxTokens: 4000,
      contextWindow: 8000,
      automationLevel: 'smart',
      confidenceThreshold: 70,
      tone: 50,
      customInstructions: '',
    },
    permissions: {
      dataAccess: ['validation', 'businesses'],
      canExecuteActions: true,
      requiresApproval: false,
    },
    workspaceId: 'default',
    enabled: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'val-customer',
    name: 'Customer Advocate',
    role: 'Customer Discovery',
    team: 'validation',
    description: 'Conducts customer research and discovery',
    avatar: '👥',
    themeColor: '#3b82f6',
    status: 'online',
    lastActive: new Date(),
    capabilities: [
      'Customer Interviews',
      'Pain Point Analysis',
      'User Personas',
    ],
    metrics: {
      tasksCompleted: 102,
      successRate: 93,
      avgResponseTime: 1900,
      confidenceAvg: 89,
    },
    config: {
      providerId: null,
      model: null,
      temperature: 1,
      maxTokens: 4000,
      contextWindow: 8000,
      automationLevel: 'smart',
      confidenceThreshold: 70,
      tone: 50,
      customInstructions: '',
    },
    permissions: {
      dataAccess: ['validation', 'businesses'],
      canExecuteActions: true,
      requiresApproval: false,
    },
    workspaceId: 'default',
    enabled: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  // Planning Team
  {
    id: 'blake',
    name: 'Blake',
    role: 'Planning Orchestrator',
    team: 'planning',
    description: 'Leads business planning and strategy',
    avatar: '📋',
    themeColor: '#8b5cf6',
    status: 'online',
    lastActive: new Date(),
    capabilities: [
      'Business Planning',
      'Financial Modeling',
      'Strategy Development',
    ],
    metrics: {
      tasksCompleted: 128,
      successRate: 92,
      avgResponseTime: 2500,
      confidenceAvg: 86,
    },
    config: {
      providerId: null,
      model: null,
      temperature: 1,
      maxTokens: 4000,
      contextWindow: 8000,
      automationLevel: 'smart',
      confidenceThreshold: 70,
      tone: 50,
      customInstructions: '',
    },
    permissions: {
      dataAccess: ['planning', 'businesses'],
      canExecuteActions: true,
      requiresApproval: false,
    },
    workspaceId: 'default',
    enabled: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'plan-canvas',
    name: 'Canvas Crafter',
    role: 'Business Model Canvas',
    team: 'planning',
    description: 'Creates business model canvases',
    avatar: '🖼️',
    themeColor: '#8b5cf6',
    status: 'online',
    lastActive: new Date(),
    capabilities: ['Business Model Canvas', 'Value Propositions', 'Revenue Streams'],
    metrics: {
      tasksCompleted: 67,
      successRate: 90,
      avgResponseTime: 2200,
      confidenceAvg: 84,
    },
    config: {
      providerId: null,
      model: null,
      temperature: 1,
      maxTokens: 4000,
      contextWindow: 8000,
      automationLevel: 'smart',
      confidenceThreshold: 70,
      tone: 50,
      customInstructions: '',
    },
    permissions: {
      dataAccess: ['planning', 'businesses'],
      canExecuteActions: true,
      requiresApproval: false,
    },
    workspaceId: 'default',
    enabled: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'plan-finance',
    name: 'Finance Wizard',
    role: 'Financial Projections',
    team: 'planning',
    description: 'Develops financial models and projections',
    avatar: '💰',
    themeColor: '#8b5cf6',
    status: 'busy',
    lastActive: new Date(),
    capabilities: ['Financial Modeling', 'P&L Projections', 'Cash Flow Analysis'],
    metrics: {
      tasksCompleted: 54,
      successRate: 95,
      avgResponseTime: 3100,
      confidenceAvg: 91,
    },
    config: {
      providerId: null,
      model: null,
      temperature: 1,
      maxTokens: 4000,
      contextWindow: 8000,
      automationLevel: 'smart',
      confidenceThreshold: 70,
      tone: 50,
      customInstructions: '',
    },
    permissions: {
      dataAccess: ['planning', 'businesses'],
      canExecuteActions: true,
      requiresApproval: false,
    },
    workspaceId: 'default',
    enabled: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  // Branding Team
  {
    id: 'bella',
    name: 'Bella',
    role: 'Branding Orchestrator',
    team: 'branding',
    description: 'Leads brand strategy and creative direction',
    avatar: '🎨',
    themeColor: '#ec4899',
    status: 'online',
    lastActive: new Date(),
    capabilities: [
      'Brand Strategy',
      'Visual Identity',
      'Content Creation',
    ],
    metrics: {
      tasksCompleted: 156,
      successRate: 96,
      avgResponseTime: 1700,
      confidenceAvg: 90,
    },
    config: {
      providerId: null,
      model: null,
      temperature: 1.2,
      maxTokens: 4000,
      contextWindow: 8000,
      automationLevel: 'smart',
      confidenceThreshold: 70,
      tone: 60,
      customInstructions: '',
    },
    permissions: {
      dataAccess: ['branding', 'businesses'],
      canExecuteActions: true,
      requiresApproval: false,
    },
    workspaceId: 'default',
    enabled: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'brand-voice',
    name: 'Voice Curator',
    role: 'Brand Voice & Messaging',
    team: 'branding',
    description: 'Crafts brand voice and messaging',
    avatar: '📣',
    themeColor: '#ec4899',
    status: 'online',
    lastActive: new Date(),
    capabilities: ['Brand Voice', 'Messaging', 'Tone Guidelines'],
    metrics: {
      tasksCompleted: 94,
      successRate: 94,
      avgResponseTime: 1600,
      confidenceAvg: 88,
    },
    config: {
      providerId: null,
      model: null,
      temperature: 1.2,
      maxTokens: 4000,
      contextWindow: 8000,
      automationLevel: 'smart',
      confidenceThreshold: 70,
      tone: 65,
      customInstructions: '',
    },
    permissions: {
      dataAccess: ['branding', 'businesses'],
      canExecuteActions: true,
      requiresApproval: false,
    },
    workspaceId: 'default',
    enabled: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'brand-visual',
    name: 'Visual Designer',
    role: 'Visual Identity',
    team: 'branding',
    description: 'Creates visual brand identities',
    avatar: '🎭',
    themeColor: '#ec4899',
    status: 'offline',
    lastActive: new Date(Date.now() - 3600000), // 1 hour ago
    capabilities: ['Logo Design', 'Color Palettes', 'Typography'],
    metrics: {
      tasksCompleted: 81,
      successRate: 92,
      avgResponseTime: 2400,
      confidenceAvg: 86,
    },
    config: {
      providerId: null,
      model: null,
      temperature: 1.3,
      maxTokens: 4000,
      contextWindow: 8000,
      automationLevel: 'smart',
      confidenceThreshold: 70,
      tone: 55,
      customInstructions: '',
    },
    permissions: {
      dataAccess: ['branding', 'businesses'],
      canExecuteActions: true,
      requiresApproval: false,
    },
    workspaceId: 'default',
    enabled: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'brand-asset',
    name: 'Asset Creator',
    role: 'Asset Generation',
    team: 'branding',
    description: 'Generates brand assets and materials',
    avatar: '✨',
    themeColor: '#ec4899',
    status: 'online',
    lastActive: new Date(),
    capabilities: ['Asset Generation', 'Templates', 'Brand Guidelines'],
    metrics: {
      tasksCompleted: 118,
      successRate: 89,
      avgResponseTime: 2000,
      confidenceAvg: 83,
    },
    config: {
      providerId: null,
      model: null,
      temperature: 1.1,
      maxTokens: 4000,
      contextWindow: 8000,
      automationLevel: 'smart',
      confidenceThreshold: 70,
      tone: 58,
      customInstructions: '',
    },
    permissions: {
      dataAccess: ['branding', 'businesses'],
      canExecuteActions: true,
      requiresApproval: false,
    },
    workspaceId: 'default',
    enabled: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  // Orchestrator Team
  {
    id: 'orchid',
    name: 'Orchid',
    role: 'Chief Orchestrator',
    team: 'orchestrator',
    description: 'Coordinates all agents and workflows',
    avatar: '🎼',
    themeColor: '#a855f7',
    status: 'online',
    lastActive: new Date(),
    capabilities: [
      'Workflow Orchestration',
      'Task Routing',
      'Priority Management',
    ],
    metrics: {
      tasksCompleted: 203,
      successRate: 97,
      avgResponseTime: 1200,
      confidenceAvg: 92,
    },
    config: {
      providerId: null,
      model: null,
      temperature: 0.8,
      maxTokens: 4000,
      contextWindow: 8000,
      automationLevel: 'full_auto',
      confidenceThreshold: 85,
      tone: 45,
      customInstructions: '',
    },
    permissions: {
      dataAccess: ['all'],
      canExecuteActions: true,
      requiresApproval: false,
    },
    workspaceId: 'default',
    enabled: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'orch-approval',
    name: 'Approval Agent',
    role: 'Approval Processing',
    team: 'approval',
    description: 'Processes approval requests with confidence scoring',
    avatar: '✅',
    themeColor: '#10b981',
    status: 'online',
    lastActive: new Date(),
    capabilities: ['Confidence Scoring', 'Risk Assessment', 'Decision Support'],
    metrics: {
      tasksCompleted: 167,
      successRate: 98,
      avgResponseTime: 800,
      confidenceAvg: 94,
    },
    config: {
      providerId: null,
      model: null,
      temperature: 0.7,
      maxTokens: 4000,
      contextWindow: 8000,
      automationLevel: 'smart',
      confidenceThreshold: 85,
      tone: 40,
      customInstructions: '',
    },
    permissions: {
      dataAccess: ['approvals', 'businesses'],
      canExecuteActions: true,
      requiresApproval: false,
    },
    workspaceId: 'default',
    enabled: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

/**
 * GET /api/agents
 *
 * Fetch all agents for the workspace with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const team = searchParams.get('team') as AgentTeam | null
    const status = searchParams.get('status') as AgentStatus | null
    const search = searchParams.get('search')

    // Filter agents based on query params
    let filteredAgents = [...MOCK_AGENTS]

    if (team) {
      filteredAgents = filteredAgents.filter((agent) => agent.team === team)
    }

    if (status) {
      filteredAgents = filteredAgents.filter((agent) => agent.status === status)
    }

    if (search) {
      const searchLower = search.toLowerCase()
      filteredAgents = filteredAgents.filter(
        (agent) =>
          agent.name.toLowerCase().includes(searchLower) ||
          agent.role.toLowerCase().includes(searchLower) ||
          agent.description.toLowerCase().includes(searchLower)
      )
    }

    return NextResponse.json({
      data: filteredAgents,
    })
  } catch (error) {
    console.error('Error fetching agents:', error)
    return NextResponse.json(
      { error: 'Failed to fetch agents' },
      { status: 500 }
    )
  }
}
