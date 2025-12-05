/**
 * Role Template Selector Component
 * Story 09-15: Implement Permission Templates
 *
 * Displays role templates as cards for quick selection when creating a new role.
 */

import { ROLE_TEMPLATES, type RoleTemplate } from '@/lib/role-templates'
import {
  FileText,
  Code,
  BarChart3,
  Megaphone,
  Headphones,
  Plus,
  type LucideIcon,
} from 'lucide-react'

/**
 * Map icon names to Lucide components
 */
const ICON_MAP: Record<string, LucideIcon> = {
  FileText,
  Code,
  BarChart3,
  Megaphone,
  Headphones,
}

/**
 * Props for RoleTemplateSelector component
 */
interface RoleTemplateSelectorProps {
  /** Called when a template is selected */
  onSelectTemplate: (template: RoleTemplate) => void
  /** Called when user chooses to start from scratch */
  onStartFromScratch: () => void
  /** Whether the selector is disabled */
  disabled?: boolean
}

/**
 * RoleTemplateSelector Component
 *
 * Displays a grid of role template cards that users can select from
 * to quickly create common role types, or start from scratch for custom roles.
 */
export function RoleTemplateSelector({
  onSelectTemplate,
  onStartFromScratch,
  disabled = false,
}: RoleTemplateSelectorProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold mb-2">Choose a template</h3>
        <p className="text-sm text-gray-600">
          Select a pre-configured role template to get started quickly, or create a custom
          role from scratch.
        </p>
      </div>

      {/* Template Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {ROLE_TEMPLATES.map((template) => {
          const IconComponent = ICON_MAP[template.icon] || FileText

          return (
            <button
              key={template.id}
              type="button"
              onClick={() => onSelectTemplate(template)}
              disabled={disabled}
              className="group relative flex items-start gap-4 p-4 border rounded-lg text-left hover:border-primary hover:bg-primary/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {/* Icon */}
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <IconComponent className="h-5 w-5 text-primary" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm mb-1 group-hover:text-primary transition-colors">
                  {template.name}
                </h4>
                <p className="text-xs text-gray-600 line-clamp-2">
                  {template.description}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  {template.permissions.length} permissions
                </p>
              </div>
            </button>
          )
        })}

        {/* Start from scratch option */}
        <button
          type="button"
          onClick={onStartFromScratch}
          disabled={disabled}
          className="group relative flex items-start gap-4 p-4 border-2 border-dashed rounded-lg text-left hover:border-primary hover:bg-primary/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {/* Icon */}
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
            <Plus className="h-5 w-5 text-gray-600 group-hover:text-primary" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm mb-1 group-hover:text-primary transition-colors">
              Start from scratch
            </h4>
            <p className="text-xs text-gray-600">
              Create a custom role with your own permission configuration
            </p>
          </div>
        </button>
      </div>
    </div>
  )
}
