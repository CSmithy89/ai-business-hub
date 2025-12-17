/**
 * PM Project Docs (placeholder)
 *
 * Epic: KB-01 will implement project docs linking.
 */

import Link from 'next/link'

export const metadata = {
  title: 'Project Docs',
}

export default async function ProjectDocsPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-2xl font-semibold text-[rgb(var(--color-text-primary))]">Docs</h1>
      <p className="text-sm text-[rgb(var(--color-text-secondary))]">
        Project docs are coming in KB-01. For now, use the Overview tab.
      </p>
      <Link href={{ pathname: '/dashboard/pm/[slug]', query: { slug } }} className="text-sm text-primary hover:underline">
        Back to overview
      </Link>
    </div>
  )
}

