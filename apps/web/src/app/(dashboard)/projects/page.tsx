/**
 * Projects Page
 *
 * Server component wrapper for metadata.
 * Updated: Story 16-24 - Page Title Tags
 */

import { ProjectsContent } from './ProjectsContent'

export const metadata = {
  title: 'Projects',
  description: 'AI-powered Project Management',
}

export default function ProjectsPage() {
  return <ProjectsContent />
}
