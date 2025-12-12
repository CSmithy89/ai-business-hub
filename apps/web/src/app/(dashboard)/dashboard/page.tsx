/**
 * Portfolio Dashboard Page
 *
 * Server component wrapper for metadata.
 * Renders client component for interactive content.
 *
 * Story: 08.2 - Implement Portfolio Dashboard with Business Cards
 * Updated: Story 16-24 - Page Title Tags
 */

import { DashboardContent } from './DashboardContent'

export const metadata = {
  title: 'Dashboard',
  description: 'Manage and track your business portfolio',
}

export default function PortfolioDashboardPage() {
  return <DashboardContent />
}
