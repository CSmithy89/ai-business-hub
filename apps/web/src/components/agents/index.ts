/**
 * Agent Components
 *
 * Barrel export file for all agent-related components.
 * Provides a clean import path for consuming components.
 *
 * @example
 * ```typescript
 * import { AgentCard, AgentAvatar } from '@/components/agents'
 * ```
 */

// Core components
export { AgentAvatar } from './AgentAvatar'
export { AgentStatusBadge } from './AgentStatusBadge'

// Card variants
export { AgentCardCompact } from './AgentCardCompact'
export { AgentCardStandard } from './AgentCardStandard'
export { AgentCardExpanded } from './AgentCardExpanded'

// Modal
export { AgentDetailModal } from './AgentDetailModal'

// Tab components
export { OverviewTab } from './tabs/OverviewTab'
export { ActivityTab } from './tabs/ActivityTab'
export { ConfigurationTab } from './tabs/ConfigurationTab'
export { PermissionsTab } from './tabs/PermissionsTab'
export { AnalyticsTab } from './tabs/AnalyticsTab'

// Activity Feed components (Story 13.3)
export { LiveIndicator } from './LiveIndicator'
export { NewActivitiesBanner } from './NewActivitiesBanner'
export { ActivityCard } from './ActivityCard'
export { ActivityFilters } from './ActivityFilters'
export { ActivitySidebar } from './ActivitySidebar'
