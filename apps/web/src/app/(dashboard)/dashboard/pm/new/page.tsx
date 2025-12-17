/**
 * Create Project (placeholder)
 *
 * Story: PM-01.4 will implement the multi-step create project modal/wizard.
 */

import Link from 'next/link'

export const metadata = {
  title: 'New Project',
}

export default function NewProjectPage() {
  return (
    <div className="flex flex-col gap-3">
      <div>
        <h1 className="text-2xl font-semibold text-[rgb(var(--color-text-primary))]">New Project</h1>
        <p className="text-sm text-[rgb(var(--color-text-secondary))]">
          Project creation wizard is coming in PM-01.4.
        </p>
      </div>

      <Link href={{ pathname: '/dashboard/pm' }} className="text-sm text-primary hover:underline">
        Back to projects
      </Link>
    </div>
  )
}
