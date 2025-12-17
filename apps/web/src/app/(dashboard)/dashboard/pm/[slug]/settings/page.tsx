/**
 * PM Project Settings (placeholder)
 *
 * Story: PM-01.6 will implement settings UI.
 */

import Link from 'next/link'

export const metadata = {
  title: 'Project Settings',
}

export default async function ProjectSettingsPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-2xl font-semibold text-[rgb(var(--color-text-primary))]">Settings</h1>
      <p className="text-sm text-[rgb(var(--color-text-secondary))]">
        Settings UI is coming in PM-01.6. For now, use the Overview tab.
      </p>
      <Link href={{ pathname: '/dashboard/pm/[slug]', query: { slug } }} className="text-sm text-primary hover:underline">
        Back to overview
      </Link>
    </div>
  )
}

