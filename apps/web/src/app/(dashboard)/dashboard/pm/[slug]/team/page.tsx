/**
 * PM Project Team (placeholder)
 *
 * Story: PM-01.8 will implement team management.
 */

import Link from 'next/link'

export const metadata = {
  title: 'Project Team',
}

export default async function ProjectTeamPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-2xl font-semibold text-[rgb(var(--color-text-primary))]">Team</h1>
      <p className="text-sm text-[rgb(var(--color-text-secondary))]">
        Team management UI is coming in PM-01.8. For now, use the Overview tab.
      </p>
      <Link href={{ pathname: '/dashboard/pm/[slug]', query: { slug } }} className="text-sm text-primary hover:underline">
        Back to overview
      </Link>
    </div>
  )
}

