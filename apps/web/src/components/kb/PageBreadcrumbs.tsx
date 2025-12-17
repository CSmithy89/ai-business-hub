'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { Home } from 'lucide-react'
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
} from '@/components/ui/breadcrumb'
import type { KBPage } from '@/hooks/use-kb-pages'

interface PageBreadcrumbsProps {
  currentPage: KBPage
  allPages: KBPage[]
  maxVisible?: number
}

interface BreadcrumbSegment {
  id: string
  title: string
  slug: string
}

function buildBreadcrumbPath(
  currentPage: KBPage,
  allPages: KBPage[]
): BreadcrumbSegment[] {
  const path: BreadcrumbSegment[] = []
  const pageMap = new Map<string, KBPage>()

  // Build a map for quick lookup
  allPages.forEach((page) => {
    pageMap.set(page.id, page)
  })

  // Walk up the parent chain
  let current: KBPage | undefined = currentPage
  while (current) {
    path.unshift({
      id: current.id,
      title: current.title,
      slug: current.slug,
    })

    if (current.parentId) {
      current = pageMap.get(current.parentId)
    } else {
      current = undefined
    }
  }

  return path
}

export function PageBreadcrumbs({
  currentPage,
  allPages,
  maxVisible = 3,
}: PageBreadcrumbsProps) {
  const path = useMemo(
    () => buildBreadcrumbPath(currentPage, allPages),
    [currentPage, allPages]
  )

  // Determine if we need to truncate
  const shouldTruncate = path.length > maxVisible

  // Build the visible segments
  let visibleSegments: BreadcrumbSegment[]
  let showEllipsis = false

  if (shouldTruncate && path.length > maxVisible) {
    // Show first segment, ellipsis, and last (maxVisible - 1) segments
    const lastSegments = path.slice(-(maxVisible - 1))
    visibleSegments = [path[0], ...lastSegments]
    showEllipsis = true
  } else {
    visibleSegments = path
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {/* KB Home */}
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/kb" className="flex items-center gap-1.5">
              <Home className="h-3.5 w-3.5" />
              <span>KB Home</span>
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>

        {visibleSegments.length > 0 && <BreadcrumbSeparator />}

        {visibleSegments.map((segment, index) => {
          const isLast = index === visibleSegments.length - 1
          const isFirst = index === 0

          // Show ellipsis after the first segment if needed
          if (showEllipsis && isFirst) {
            return (
              <div key={segment.id} className="inline-flex items-center gap-1.5">
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href={`/kb/${segment.slug}`}>{segment.title}</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbEllipsis />
                </BreadcrumbItem>
                <BreadcrumbSeparator />
              </div>
            )
          }

          return (
            <div key={segment.id} className="inline-flex items-center gap-1.5">
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{segment.title}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={`/kb/${segment.slug}`}>{segment.title}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!isLast && <BreadcrumbSeparator />}
            </div>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
