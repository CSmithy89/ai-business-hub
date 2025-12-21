/**
 * Agent Colors Configuration
 *
 * Defines consistent character colors for each AI agent across the platform.
 * Used in agent cards, chat messages, approval cards, and onboarding.
 *
 * Story 15-17, 15-25: Agent character colors throughout
 */

export interface AgentConfig {
  name: string;
  role: string;
  color: string;
  icon: string;
  description: string;
}

/**
 * Platform Agents - Core orchestration and business operations
 */
export const PLATFORM_AGENTS: Record<string, AgentConfig> = {
  hub: {
    name: 'Hub',
    role: 'Orchestrator',
    color: '#FF6B6B',
    icon: '🎯',
    description: 'Your central coordinator that routes tasks to the right agent',
  },
  maya: {
    name: 'Maya',
    role: 'CRM & Relationships',
    color: '#20B2AA',
    icon: '🐚',
    description: 'Manages customer relationships and communications',
  },
  atlas: {
    name: 'Atlas',
    role: 'Projects & Tasks',
    color: '#FF9F43',
    icon: '🗺️',
    description: 'Handles project management and task organization',
  },
  sage: {
    name: 'Sage',
    role: 'Strategy & Analysis',
    color: '#2ECC71',
    icon: '🌿',
    description: 'Provides strategic insights and analysis',
  },
  nova: {
    name: 'Nova',
    role: 'Marketing & Content',
    color: '#FF6B9D',
    icon: '✨',
    description: 'Creates marketing content and campaigns',
  },
  echo: {
    name: 'Echo',
    role: 'Analytics & Insights',
    color: '#4B7BEC',
    icon: '📊',
    description: 'Analyzes data and provides business intelligence',
  },
  scribe: {
    name: 'Scribe',
    role: 'Knowledge Base',
    color: '#3B82F6',
    icon: '📝',
    description: 'Captures and curates knowledge base documentation',
  },
};

/**
 * Validation Team Agents - Business validation module
 */
export const VALIDATION_AGENTS: Record<string, AgentConfig> = {
  vera: {
    name: 'Vera',
    role: 'Validation Lead',
    color: '#FF6B6B',
    icon: '🎯',
    description: 'Leads the validation process and coordinates the team',
  },
  marco: {
    name: 'Marco',
    role: 'Market Research',
    color: '#4B7BEC',
    icon: '📊',
    description: 'Conducts market research and competitive analysis',
  },
  cipher: {
    name: 'Cipher',
    role: 'Competitive Intel',
    color: '#20B2AA',
    icon: '🔍',
    description: 'Gathers competitive intelligence and market positioning',
  },
  persona: {
    name: 'Persona',
    role: 'Customer Discovery',
    color: '#9B59B6',
    icon: '👤',
    description: 'Identifies and profiles target customers',
  },
  risk: {
    name: 'Risk',
    role: 'Risk Assessment',
    color: '#FF9F43',
    icon: '⚠️',
    description: 'Evaluates business risks and mitigation strategies',
  },
};

/**
 * All agents combined
 */
export const ALL_AGENTS: Record<string, AgentConfig> = {
  ...PLATFORM_AGENTS,
  ...VALIDATION_AGENTS,
};

/**
 * Get agent config by name (case-insensitive)
 */
export function getAgentConfig(agentName: string): AgentConfig | null {
  const normalizedName = agentName.toLowerCase();
  return ALL_AGENTS[normalizedName] || null;
}

/**
 * Get agent color by name (returns default gray if not found)
 */
export function getAgentColor(agentName: string): string {
  const config = getAgentConfig(agentName);
  return config?.color || '#6B7280'; // Default to gray-500
}

/**
 * Get agent icon by name (returns default icon if not found)
 */
export function getAgentIcon(agentName: string): string {
  const config = getAgentConfig(agentName);
  return config?.icon || '🤖';
}

/**
 * CSS custom properties for agent colors (for use in globals.css)
 */
export const AGENT_COLOR_CSS_VARS = `
  --agent-hub: #FF6B6B;
  --agent-maya: #20B2AA;
  --agent-atlas: #FF9F43;
  --agent-sage: #2ECC71;
  --agent-nova: #FF6B9D;
  --agent-echo: #4B7BEC;
  --agent-scribe: #3B82F6;
  --agent-vera: #FF6B6B;
  --agent-marco: #4B7BEC;
  --agent-cipher: #20B2AA;
  --agent-persona: #9B59B6;
  --agent-risk: #FF9F43;
`;
