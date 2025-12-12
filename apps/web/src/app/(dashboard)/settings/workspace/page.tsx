/**
 * Workspace Settings Page
 *
 * Server component wrapper for metadata.
 * Updated: Story 16-24 - Page Title Tags
 */

import { WorkspaceContent } from './WorkspaceContent'

export const metadata = {
  title: 'Workspace Settings',
  description: 'Manage your workspace name, image, and timezone',
}

export default function WorkspaceSettingsPage() {
  return <WorkspaceContent />
}
