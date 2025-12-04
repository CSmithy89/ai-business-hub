import { SettingsLayout } from '@/components/layouts/settings-layout'
import { LinkedAccountsCard } from '@/components/settings/linked-accounts-card'

export const metadata = {
  title: 'Linked Accounts | HYVVE',
  description: 'Manage your linked OAuth accounts',
}

export default function LinkedAccountsPage() {
  return (
    <SettingsLayout
      title="Linked Accounts"
      description="Connect and manage your OAuth providers for seamless sign-in"
    >
      <div className="space-y-6">
        <LinkedAccountsCard />
      </div>
    </SettingsLayout>
  )
}
