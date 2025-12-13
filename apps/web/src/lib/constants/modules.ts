/**
 * Module Constants
 * Available modules in the HYVVE platform
 */

export interface ModuleInfo {
  id: string
  name: string
  description: string
  category: 'onboarding' | 'operations' | 'growth' | 'intelligence'
  isCore: boolean
}

/**
 * Available modules in the HYVVE platform
 */
export const AVAILABLE_MODULES: readonly ModuleInfo[] = [
  {
    id: 'bm-validation',
    name: 'Business Validation',
    description: 'Validate business ideas with market research and competitor analysis',
    category: 'onboarding',
    isCore: true, // Core modules are always available
  },
  {
    id: 'bm-planning',
    name: 'Business Planning',
    description: 'Create business plans, financial projections, and pitch decks',
    category: 'onboarding',
    isCore: true,
  },
  {
    id: 'bm-branding',
    name: 'Brand Development',
    description: 'Develop brand strategy, visual identity, and marketing assets',
    category: 'onboarding',
    isCore: true,
  },
  {
    id: 'bm-crm',
    name: 'CRM',
    description: 'Customer relationship management with AI-powered lead scoring',
    category: 'operations',
    isCore: false,
  },
  {
    id: 'bm-inventory',
    name: 'Inventory Management',
    description: 'Track inventory, manage stock levels, and automate reordering',
    category: 'operations',
    isCore: false,
  },
  {
    id: 'bm-marketing',
    name: 'Marketing Automation',
    description: 'Automated content creation, scheduling, and campaign management',
    category: 'growth',
    isCore: false,
  },
  {
    id: 'bm-analytics',
    name: 'Business Analytics',
    description: 'AI-powered insights and reporting across all business data',
    category: 'intelligence',
    isCore: false,
  },
] as const

/**
 * Module categories with display names
 */
export const MODULE_CATEGORIES = [
  { id: 'onboarding', name: 'Business Onboarding' },
  { id: 'operations', name: 'Operations' },
  { id: 'growth', name: 'Growth' },
  { id: 'intelligence', name: 'Business Intelligence' },
] as const

/**
 * Get module info by ID
 */
export function getModuleById(moduleId: string): ModuleInfo | undefined {
  return AVAILABLE_MODULES.find((m) => m.id === moduleId)
}

/**
 * Check if a module ID is valid
 */
export function isValidModuleId(moduleId: string): boolean {
  return AVAILABLE_MODULES.some((m) => m.id === moduleId)
}

/**
 * Check if a module is a core module (always enabled)
 */
export function isCoreModule(moduleId: string): boolean {
  const moduleInfo = getModuleById(moduleId)
  return moduleInfo?.isCore ?? false
}
