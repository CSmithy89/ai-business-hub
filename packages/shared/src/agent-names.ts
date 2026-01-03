/**
 * Agent Name Mapping Utility
 *
 * Provides a centralized mapping between internal agent code names
 * and user-friendly display names. This addresses the naming complexity
 * where agents have creative internal names that aren't self-explanatory.
 *
 * @see docs/architecture/agent-naming.md
 * Epic: DM-11 | Story: DM-11.12
 */

// =============================================================================
// TYPES
// =============================================================================

/**
 * Agent display information
 */
export interface AgentDisplayInfo {
  /** User-friendly display name */
  display: string;
  /** Brief description of the agent's purpose */
  description: string;
  /** Icon name (lucide-react compatible) */
  icon: string;
  /** Category for grouping */
  category: 'platform' | 'pm' | 'knowledge' | 'monitoring' | 'integration';
}

// =============================================================================
// AGENT NAME MAP
// =============================================================================

/**
 * Mapping of internal agent names to display information.
 *
 * Internal names are creative code names used in the codebase.
 * Display names are user-friendly labels shown in the UI.
 */
export const AGENT_NAME_MAP = {
  // Platform Agents
  pulse: {
    display: 'Vitals',
    description: 'System health metrics and performance indicators',
    icon: 'heart-pulse',
    category: 'monitoring',
  },
  gateway: {
    display: 'Gateway',
    description: 'Central orchestration and routing for all agents',
    icon: 'route',
    category: 'platform',
  },
  dashboard_gateway: {
    display: 'Dashboard Agent',
    description: 'Dashboard orchestration and widget coordination',
    icon: 'layout-dashboard',
    category: 'platform',
  },

  // PM Agents
  navi: {
    display: 'Navigator',
    description: 'Project overview and task management assistant',
    icon: 'map',
    category: 'pm',
  },
  sage: {
    display: 'Advisor',
    description: 'Strategic planning and recommendation engine',
    icon: 'brain',
    category: 'pm',
  },
  chrono: {
    display: 'Scheduler',
    description: 'Timeline management and deadline tracking',
    icon: 'calendar-clock',
    category: 'pm',
  },

  // Knowledge Agents
  scribe: {
    display: 'Knowledge Writer',
    description: 'Document creation and content verification',
    icon: 'pen-tool',
    category: 'knowledge',
  },

  // Monitoring Agents
  herald: {
    display: 'Activity Monitor',
    description: 'Recent activity feed and notifications',
    icon: 'bell',
    category: 'monitoring',
  },

  // Integration Agents
  mcp_coordinator: {
    display: 'Tool Coordinator',
    description: 'MCP tool orchestration and capability management',
    icon: 'wrench',
    category: 'integration',
  },
} as const;

// =============================================================================
// TYPE EXPORTS
// =============================================================================

/**
 * Union type of all valid internal agent names.
 * Use this for type-safe agent name references.
 */
export type AgentInternalName = keyof typeof AGENT_NAME_MAP;

/**
 * Array of all agent internal names for iteration.
 */
export const AGENT_INTERNAL_NAMES = Object.keys(AGENT_NAME_MAP) as AgentInternalName[];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get the user-friendly display name for an agent.
 *
 * @param internalName - The internal agent code name
 * @returns The display name, or the internal name if not found
 *
 * @example
 * getAgentDisplayName('navi') // 'Navigator'
 * getAgentDisplayName('unknown') // 'unknown'
 */
export function getAgentDisplayName(internalName: string): string {
  const info = AGENT_NAME_MAP[internalName as AgentInternalName];
  return info?.display ?? internalName;
}

/**
 * Get the description for an agent.
 *
 * @param internalName - The internal agent code name
 * @returns The description, or empty string if not found
 *
 * @example
 * getAgentDescription('sage') // 'Strategic planning and recommendation engine'
 */
export function getAgentDescription(internalName: string): string {
  const info = AGENT_NAME_MAP[internalName as AgentInternalName];
  return info?.description ?? '';
}

/**
 * Get the icon name for an agent.
 *
 * @param internalName - The internal agent code name
 * @returns The icon name, or a default icon if not found
 *
 * @example
 * getAgentIcon('chrono') // 'calendar-clock'
 */
export function getAgentIcon(internalName: string): string {
  const info = AGENT_NAME_MAP[internalName as AgentInternalName];
  return info?.icon ?? 'bot';
}

/**
 * Get the category for an agent.
 *
 * @param internalName - The internal agent code name
 * @returns The category, or 'platform' as default
 */
export function getAgentCategory(internalName: string): AgentDisplayInfo['category'] {
  const info = AGENT_NAME_MAP[internalName as AgentInternalName];
  return info?.category ?? 'platform';
}

/**
 * Get all display information for an agent.
 *
 * @param internalName - The internal agent code name
 * @returns Full display info or null if not found
 */
export function getAgentInfo(internalName: string): AgentDisplayInfo | null {
  const info = AGENT_NAME_MAP[internalName as AgentInternalName];
  return info ?? null;
}

/**
 * Check if a name is a known agent internal name.
 *
 * @param name - The name to check
 * @returns True if it's a known agent name
 */
export function isKnownAgent(name: string): name is AgentInternalName {
  return name in AGENT_NAME_MAP;
}

/**
 * Get agents by category.
 *
 * @param category - The category to filter by
 * @returns Array of agent internal names in that category
 */
export function getAgentsByCategory(
  category: AgentDisplayInfo['category']
): AgentInternalName[] {
  return AGENT_INTERNAL_NAMES.filter(
    (name) => AGENT_NAME_MAP[name].category === category
  );
}
