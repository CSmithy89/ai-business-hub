import { SettingsLayout } from '@/components/layouts/settings-layout'
import { MCPIntegrations } from '@/components/settings/mcp-integrations'

export const metadata = {
  title: 'MCP Integrations',
  description: 'Manage Model Context Protocol servers',
}

export default function SettingsMCPPage() {
  return (
    <SettingsLayout
      title="MCP Integrations"
      description="Connect MCP servers to safely expand what your agents can do"
    >
      <MCPIntegrations />
    </SettingsLayout>
  )
}

