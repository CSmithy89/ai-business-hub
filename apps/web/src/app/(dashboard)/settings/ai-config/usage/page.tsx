import { SettingsLayout } from '@/components/layouts/settings-layout'
import { TokenUsageDashboard } from '@/components/settings/token-usage-dashboard'
import { AIConfigSubnav } from '@/components/settings/ai-config-subnav'
import { WorkspaceRequired } from '@/components/settings/workspace-required'
import { getSession } from '@/lib/auth-server'

export const metadata = {
  title: 'Token Usage',
  description: 'View AI token usage statistics',
}

export default async function SettingsUsagePage() {
  const session = await getSession()
  const workspaceId = session?.session?.activeWorkspaceId

  return (
    <SettingsLayout
      title="Token Usage"
      description="View and analyze your AI token consumption"
    >
      <AIConfigSubnav />
      {workspaceId != null ? <TokenUsageDashboard /> : <WorkspaceRequired />}
    </SettingsLayout>
  )
}
