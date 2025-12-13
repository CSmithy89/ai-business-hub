import { SettingsLayout } from '@/components/layouts/settings-layout'
import { ModuleManagement } from '@/components/settings/module-management'

export const metadata = {
  title: 'Modules',
  description: 'Enable and manage workspace modules',
}

export default function SettingsModulesPage() {
  return (
    <SettingsLayout
      title="Modules"
      description="Enable and manage optional modules for this workspace"
    >
      <ModuleManagement />
    </SettingsLayout>
  )
}

