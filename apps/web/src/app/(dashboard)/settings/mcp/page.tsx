import { SettingsLayout } from '@/components/layouts/settings-layout'
import { MCPIntegrations } from '@/components/settings/mcp-integrations'
import { WorkspaceRequired } from '@/components/settings/workspace-required'
import { getSession } from '@/lib/auth-server'

export const metadata = {
  title: 'MCP Integrations',
  description: 'Manage Model Context Protocol servers',
}

export default async function SettingsMCPPage() {
  const session = await getSession()
  const workspaceId = session?.session.activeWorkspaceId

  return (
    <SettingsLayout
      title="MCP Integrations"
      description="Connect MCP servers to safely expand what your agents can do"
    >
      {workspaceId ? <MCPIntegrations /> : <WorkspaceRequired />}
    </SettingsLayout>
  )
}
