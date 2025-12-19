import { Metadata } from 'next'
import { StaleContentDashboard } from '@/components/kb/StaleContentDashboard'

export const metadata: Metadata = {
  title: 'Stale Content',
  description: 'Review and manage pages needing verification or updates',
}

export default function StaleContentPage() {
  return (
    <div className="container mx-auto py-8">
      <StaleContentDashboard />
    </div>
  )
}
