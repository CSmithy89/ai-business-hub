/**
 * AI Agents Page
 *
 * Server component wrapper for metadata.
 * Renders client component for interactive content.
 *
 * Story: 13-5 - Agent Dashboard Page
 * Updated: Story 16-24 - Page Title Tags
 */

import { AgentsContent } from './AgentsContent'

export const metadata = {
  title: 'AI Team',
  description: 'Manage and monitor all AI agents working on your behalf',
}

export default function AgentsPage() {
  return <AgentsContent />
}
