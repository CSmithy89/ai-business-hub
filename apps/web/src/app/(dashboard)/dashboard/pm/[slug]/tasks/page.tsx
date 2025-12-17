/**
 * PM Project Tasks (placeholder)
 *
 * Epic: PM-02 (Task Management System) will implement tasks UI.
 */

import Link from 'next/link'

export const metadata = {
  title: 'Project Tasks',
}

export default async function ProjectTasksPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-2xl font-semibold text-[rgb(var(--color-text-primary))]">Tasks</h1>
      <p className="text-sm text-[rgb(var(--color-text-secondary))]">
        Tasks UI is coming in Epic PM-02. For now, use the Overview tab.
      </p>
      <Link href={{ pathname: '/dashboard/pm/[slug]', query: { slug } }} className="text-sm text-primary hover:underline">
        Back to overview
      </Link>
    </div>
  )
}

