/**
 * Create Project - Redirect to Projects List
 *
 * Story: PM-01.4 - Project creation is now handled via CreateProjectModal on the projects page.
 * This page redirects to the main projects list where users can use the "New Project" button.
 */

import { redirect } from 'next/navigation'

export const metadata = {
  title: 'New Project',
}

export default function NewProjectPage() {
  redirect('/dashboard/pm')
}
