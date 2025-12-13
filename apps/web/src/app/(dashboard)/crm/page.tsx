/**
 * CRM Page
 *
 * Server component wrapper for metadata.
 * Updated: Story 16-24 - Page Title Tags
 */

import { CrmContent } from './CrmContent'

export const metadata = {
  title: 'CRM',
  description: 'AI-powered Customer Relationship Management (Coming Soon)',
}

export default function CRMPage() {
  return <CrmContent />
}
