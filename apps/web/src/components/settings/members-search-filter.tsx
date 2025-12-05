'use client'

import { useCallback, useRef, useEffect } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'

/**
 * Filter values
 */
export interface MemberFilters {
  search: string
  role: string
  status: string
}

/**
 * Role options for filter
 */
const ROLE_OPTIONS = [
  { value: 'all', label: 'All Roles' },
  { value: 'owner', label: 'Owner' },
  { value: 'admin', label: 'Admin' },
  { value: 'member', label: 'Member' },
  { value: 'viewer', label: 'Viewer' },
  { value: 'guest', label: 'Guest' },
] as const

/**
 * Status options for filter
 */
const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'pending', label: 'Pending' },
] as const

/**
 * MembersSearchFilter Props
 */
interface MembersSearchFilterProps {
  filters: MemberFilters
  onFiltersChange: (filters: MemberFilters) => void
}

/**
 * MembersSearchFilter Component
 *
 * Provides search and filter controls for the team members list:
 * - Search input (debounced, searches name and email)
 * - Role filter dropdown
 * - Status filter dropdown
 * - Clear filters button
 *
 * Filters are persisted in URL query parameters.
 */
export function MembersSearchFilter({ filters, onFiltersChange }: MembersSearchFilterProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  /**
   * Clean up debounce timer on unmount
   */
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  /**
   * Update URL with new filter values
   */
  const updateURL = useCallback(
    (newFilters: MemberFilters) => {
      const params = new URLSearchParams(searchParams.toString())

      // Update or remove search param
      if (newFilters.search) {
        params.set('search', newFilters.search)
      } else {
        params.delete('search')
      }

      // Update or remove role param
      if (newFilters.role && newFilters.role !== 'all') {
        params.set('role', newFilters.role)
      } else {
        params.delete('role')
      }

      // Update or remove status param
      if (newFilters.status && newFilters.status !== 'all') {
        params.set('status', newFilters.status)
      } else {
        params.delete('status')
      }

      // Update URL without page reload
      const queryString = params.toString()
      const newURL = queryString ? `${pathname}?${queryString}` : pathname
      router.replace(newURL as any, { scroll: false })
    },
    [pathname, router, searchParams]
  )

  /**
   * Handle search input change (debounced)
   */
  const handleSearchChange = (value: string) => {
    // Immediately update local state
    const newFilters = { ...filters, search: value }
    onFiltersChange(newFilters)

    // Debounce URL update
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }
    debounceTimerRef.current = setTimeout(() => {
      updateURL(newFilters)
    }, 300) // 300ms debounce delay
  }

  /**
   * Handle role filter change
   */
  const handleRoleChange = (value: string) => {
    const newFilters = { ...filters, role: value }
    onFiltersChange(newFilters)
    updateURL(newFilters)
  }

  /**
   * Handle status filter change
   */
  const handleStatusChange = (value: string) => {
    const newFilters = { ...filters, status: value }
    onFiltersChange(newFilters)
    updateURL(newFilters)
  }

  /**
   * Clear all filters
   */
  const handleClearFilters = () => {
    const newFilters: MemberFilters = {
      search: '',
      role: 'all',
      status: 'all',
    }
    onFiltersChange(newFilters)
    updateURL(newFilters)
  }

  /**
   * Check if any filters are active
   */
  const hasActiveFilters =
    filters.search !== '' || filters.role !== 'all' || filters.status !== 'all'

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by name or email..."
              value={filters.search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-9 pr-4"
            />
          </div>

          {/* Role Filter */}
          <Select value={filters.role} onValueChange={handleRoleChange}>
            <SelectTrigger className="w-full sm:w-[160px]">
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              {ROLE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Status Filter */}
          <Select value={filters.status} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-full sm:w-[160px]">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearFilters}
              className="w-full sm:w-auto"
            >
              <X className="mr-2 h-4 w-4" />
              Clear
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
