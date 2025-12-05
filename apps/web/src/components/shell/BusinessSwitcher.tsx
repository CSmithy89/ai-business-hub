/**
 * BusinessSwitcher Component
 *
 * Dropdown showing all businesses in current workspace.
 * Allows quick switching between businesses and return to portfolio.
 *
 * Story: 08.2 - Implement Portfolio Dashboard with Business Cards
 */

'use client'

import { useRouter, useParams } from 'next/navigation'
import { useBusinesses } from '@/hooks/use-businesses'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Building2, LayoutGrid, ChevronsUpDown, Check } from 'lucide-react'

interface BusinessSwitcherProps {
  collapsed: boolean
}

export function BusinessSwitcher({ collapsed }: BusinessSwitcherProps) {
  const router = useRouter()
  const params = useParams()
  const { data: businesses } = useBusinesses()

  const currentBusinessId = params.businessId as string | undefined

  // Find current business
  const currentBusiness = businesses?.find((b) => b.id === currentBusinessId)

  // If collapsed, show icon only
  if (collapsed) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10"
            aria-label="Switch business"
          >
            <Building2 className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" className="w-[240px]">
          <DropdownMenuItem onClick={() => router.push('/dashboard')}>
            <LayoutGrid className="mr-2 h-4 w-4" />
            All Businesses
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {businesses?.map((business) => (
            <DropdownMenuItem
              key={business.id}
              onClick={() => router.push(`/dashboard/${business.id}/overview` as Parameters<typeof router.push>[0])}
            >
              <Building2 className="mr-2 h-4 w-4" />
              <span className="truncate">{business.name}</span>
              {business.id === currentBusinessId && (
                <Check className="ml-auto h-4 w-4" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  // Expanded state
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="w-full justify-start">
          <Building2 className="mr-2 h-4 w-4" />
          <span className="flex-1 truncate text-left">
            {currentBusiness?.name ?? 'All Businesses'}
          </span>
          <ChevronsUpDown className="ml-auto h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-[240px]">
        <DropdownMenuItem onClick={() => router.push('/dashboard')}>
          <LayoutGrid className="mr-2 h-4 w-4" />
          All Businesses
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {businesses?.map((business) => (
          <DropdownMenuItem
            key={business.id}
            onClick={() => router.push(`/dashboard/${business.id}/overview` as Parameters<typeof router.push>[0])}
          >
            <Building2 className="mr-2 h-4 w-4" />
            <span className="truncate">{business.name}</span>
            {business.id === currentBusinessId && (
              <Check className="ml-auto h-4 w-4" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
