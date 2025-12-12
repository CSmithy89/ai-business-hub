/**
 * Demo Agent Data
 *
 * Provides realistic sample agents for demo mode
 * with activity metrics and configurations.
 *
 * Story: 16.8 - Implement Demo Mode Consistency
 */

import type { Agent } from '@hyvve/shared';

/**
 * Demo agents with varied statuses and activity
 */
export const DEMO_AGENTS: Agent[] = [
  {
    id: 'demo-agent-vera',
    name: 'Vera',
    role: 'Validation Orchestrator',
    team: 'validation',
    description: 'Expert in market validation, customer discovery, and competitive analysis. Helps validate your business idea before you invest time and money.',
    avatar: '🔍',
    themeColor: '#8B5CF6',
    status: 'online',
    lastActive: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
    capabilities: [
      'Market research',
      'Competitor analysis',
      'Customer interviews',
      'Market sizing',
      'Validation scoring',
    ],
    metrics: {
      tasksCompleted: 127,
      successRate: 94,
      avgResponseTime: 3200,
      confidenceAvg: 88,
    },
    config: {
      providerId: null,
      model: null,
      temperature: 0.7,
      maxTokens: 4000,
      contextWindow: 8000,
      automationLevel: 'smart',
      confidenceThreshold: 75,
      tone: 35,
      customInstructions: 'Focus on data-driven insights and actionable recommendations.',
    },
    permissions: {
      dataAccess: ['validation', 'market_research'],
      canExecuteActions: true,
      requiresApproval: false,
    },
    workspaceId: 'demo-workspace',
    enabled: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 90), // 90 days ago
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
  },
  {
    id: 'demo-agent-paul',
    name: 'Paul',
    role: 'Planning Strategist',
    team: 'planning',
    description: 'Strategic business planner specializing in business models, financial projections, and go-to-market strategies.',
    avatar: '📊',
    themeColor: '#3B82F6',
    status: 'busy',
    lastActive: new Date(Date.now() - 1000 * 60 * 2), // 2 minutes ago
    capabilities: [
      'Business model design',
      'Financial modeling',
      'Go-to-market strategy',
      'Resource planning',
      'Milestone planning',
    ],
    metrics: {
      tasksCompleted: 98,
      successRate: 91,
      avgResponseTime: 4500,
      confidenceAvg: 85,
    },
    config: {
      providerId: null,
      model: null,
      temperature: 0.6,
      maxTokens: 6000,
      contextWindow: 16000,
      automationLevel: 'smart',
      confidenceThreshold: 80,
      tone: 25,
      customInstructions: 'Provide detailed financial analysis and strategic recommendations.',
    },
    permissions: {
      dataAccess: ['planning', 'financial', 'validation'],
      canExecuteActions: true,
      requiresApproval: false,
    },
    workspaceId: 'demo-workspace',
    enabled: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 90), // 90 days ago
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 1), // 1 hour ago
  },
  {
    id: 'demo-agent-bella',
    name: 'Bella',
    role: 'Brand Architect',
    team: 'branding',
    description: 'Creative brand strategist who crafts compelling brand identities, visual systems, and messaging that resonates with your target audience.',
    avatar: '🎨',
    themeColor: '#EC4899',
    status: 'online',
    lastActive: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
    capabilities: [
      'Brand strategy',
      'Visual identity design',
      'Brand voice development',
      'Logo concepts',
      'Asset generation',
    ],
    metrics: {
      tasksCompleted: 84,
      successRate: 96,
      avgResponseTime: 5200,
      confidenceAvg: 89,
    },
    config: {
      providerId: null,
      model: null,
      temperature: 0.9,
      maxTokens: 4000,
      contextWindow: 8000,
      automationLevel: 'smart',
      confidenceThreshold: 70,
      tone: 60,
      customInstructions: 'Balance creativity with strategic thinking. Focus on brand differentiation.',
    },
    permissions: {
      dataAccess: ['branding', 'validation', 'planning'],
      canExecuteActions: true,
      requiresApproval: false,
    },
    workspaceId: 'demo-workspace',
    enabled: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 90), // 90 days ago
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 3), // 3 hours ago
  },
  {
    id: 'demo-agent-alex',
    name: 'Alex',
    role: 'Approval Manager',
    team: 'approval',
    description: 'Reviews and routes decisions that need human input. Uses confidence scoring to determine what can be auto-approved vs. needs review.',
    avatar: '✅',
    themeColor: '#10B981',
    status: 'online',
    lastActive: new Date(Date.now() - 1000 * 60 * 1), // 1 minute ago
    capabilities: [
      'Confidence scoring',
      'Risk assessment',
      'Approval routing',
      'Pattern recognition',
      'Decision recommendations',
    ],
    metrics: {
      tasksCompleted: 342,
      successRate: 97,
      avgResponseTime: 1200,
      confidenceAvg: 92,
    },
    config: {
      providerId: null,
      model: null,
      temperature: 0.3,
      maxTokens: 2000,
      contextWindow: 4000,
      automationLevel: 'full_auto',
      confidenceThreshold: 85,
      tone: 20,
      customInstructions: 'Prioritize accuracy and risk assessment. Be conservative with automation.',
    },
    permissions: {
      dataAccess: ['approvals', 'all_modules'],
      canExecuteActions: true,
      requiresApproval: false,
    },
    workspaceId: 'demo-workspace',
    enabled: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 90), // 90 days ago
    updatedAt: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
  },
  {
    id: 'demo-agent-oracle',
    name: 'Oracle',
    role: 'Platform Orchestrator',
    team: 'orchestrator',
    description: 'Master coordinator that manages workflows, delegates tasks to specialist agents, and ensures seamless collaboration across the platform.',
    avatar: '🧭',
    themeColor: '#F59E0B',
    status: 'online',
    lastActive: new Date(Date.now() - 1000 * 60 * 3), // 3 minutes ago
    capabilities: [
      'Workflow orchestration',
      'Task delegation',
      'Agent coordination',
      'Priority management',
      'System optimization',
    ],
    metrics: {
      tasksCompleted: 456,
      successRate: 98,
      avgResponseTime: 800,
      confidenceAvg: 93,
    },
    config: {
      providerId: null,
      model: null,
      temperature: 0.5,
      maxTokens: 3000,
      contextWindow: 8000,
      automationLevel: 'full_auto',
      confidenceThreshold: 90,
      tone: 30,
      customInstructions: 'Optimize for efficiency and coordination. Monitor all agent activities.',
    },
    permissions: {
      dataAccess: ['all_modules'],
      canExecuteActions: true,
      requiresApproval: false,
    },
    workspaceId: 'demo-workspace',
    enabled: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 90), // 90 days ago
    updatedAt: new Date(Date.now() - 1000 * 60 * 10), // 10 minutes ago
  },
];

/**
 * Get demo agents filtered by team or status
 */
export function getDemoAgents(filters?: {
  team?: string;
  status?: string;
  enabled?: boolean;
}): Agent[] {
  let agents = [...DEMO_AGENTS];

  if (filters?.team) {
    agents = agents.filter((agent) => agent.team === filters.team);
  }

  if (filters?.status) {
    agents = agents.filter((agent) => agent.status === filters.status);
  }

  if (filters?.enabled !== undefined) {
    agents = agents.filter((agent) => agent.enabled === filters.enabled);
  }

  return agents;
}

/**
 * Get a single demo agent by ID
 */
export function getDemoAgent(id: string): Agent | undefined {
  return DEMO_AGENTS.find((agent) => agent.id === id);
}

/**
 * Demo agent statistics
 */
export const DEMO_AGENT_STATS = {
  total: DEMO_AGENTS.length,
  online: DEMO_AGENTS.filter((a) => a.status === 'online').length,
  busy: DEMO_AGENTS.filter((a) => a.status === 'busy').length,
  offline: DEMO_AGENTS.filter((a) => a.status === 'offline').length,
  enabled: DEMO_AGENTS.filter((a) => a.enabled).length,
  totalTasksCompleted: DEMO_AGENTS.reduce((sum, a) => sum + a.metrics.tasksCompleted, 0),
  avgSuccessRate: Math.round(
    DEMO_AGENTS.reduce((sum, a) => sum + a.metrics.successRate, 0) / DEMO_AGENTS.length
  ),
  avgConfidence: Math.round(
    DEMO_AGENTS.reduce((sum, a) => sum + a.metrics.confidenceAvg, 0) / DEMO_AGENTS.length
  ),
};
