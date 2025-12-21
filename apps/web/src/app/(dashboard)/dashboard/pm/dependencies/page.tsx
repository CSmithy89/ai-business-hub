/**
 * PM Dependencies Dashboard Page
 *
 * Story: PM-09.3 - Cross-Project Dependencies
 */

import { DependenciesDashboard } from '@/components/pm/dependencies/DependenciesDashboard'

export const metadata = {
  title: 'Dependencies',
  description: 'Cross-project dependency overview for PM tasks',
}

export default function DependenciesPage() {
  return <DependenciesDashboard />
}
