import { SettingsLayout } from '@/components/layouts/settings-layout'
import { TokenUsageDashboard } from '@/components/settings/token-usage-dashboard'

export const metadata = {
  title: 'Token Usage',
  description: 'View AI token usage statistics',
}

export default function SettingsUsagePage() {
  return (
    <SettingsLayout
      title="Token Usage"
      description="View and analyze your AI token consumption"
    >
      <TokenUsageDashboard />
    </SettingsLayout>
  )
}
