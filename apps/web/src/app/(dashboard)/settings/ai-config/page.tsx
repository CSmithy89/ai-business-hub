import { redirect } from 'next/navigation'

export const metadata = {
  title: 'AI Configuration',
  description: 'Configure your AI preferences',
}

export default function SettingsAiConfigPage() {
  redirect('/settings/ai-config/providers')
}
