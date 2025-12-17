/**
 * PM Project Detail (placeholder)
 *
 * Story: PM-01.3 - navigation target
 * Story: PM-01.5 will implement the full overview tab.
 */

import Link from 'next/link'

export const metadata = {
  title: 'Project',
}

export default async function PmProjectDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  return (
    <div className="flex flex-col gap-3">
      <div>
        <h1 className="text-2xl font-semibold text-[rgb(var(--color-text-primary))]">
          Project: {slug}
        </h1>
        <p className="text-sm text-[rgb(var(--color-text-secondary))]">
          Project overview UI is coming in PM-01.5.
        </p>
      </div>

      <Link href={{ pathname: '/dashboard/pm' }} className="text-sm text-primary hover:underline">
        Back to projects
      </Link>
    </div>
  )
}
