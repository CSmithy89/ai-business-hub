/**
 * Approval Queue Page
 *
 * Server component wrapper for metadata.
 * Renders client component for interactive content.
 *
 * Story: 04-4 - Create Approval Queue Dashboard
 * Updated: Story 16-24 - Page Title Tags
 */

import { ApprovalsContent } from './ApprovalsContent'

export const metadata = {
  title: 'Approvals',
  description: 'Review and approve AI-generated actions that require your attention',
}

export default function ApprovalsPage() {
  return <ApprovalsContent />
}
