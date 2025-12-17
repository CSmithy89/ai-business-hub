'use client'

import { useState, useCallback } from 'react'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useRouter, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'

const RECENT_SEARCHES_KEY = 'kb-recent-searches'
const MAX_RECENT_SEARCHES = 10

interface KBSearchInputProps {
  className?: string
  autoFocus?: boolean
  onSearch?: (query: string) => void
}

export function KBSearchInput({ className, autoFocus, onSearch }: KBSearchInputProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(searchParams?.get('q') || '')

  // Load recent searches from localStorage
  const getRecentSearches = useCallback((): string[] => {
    if (typeof window === 'undefined') return []
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  }, [])

  // Save search to recent searches
  const saveRecentSearch = useCallback((searchQuery: string) => {
    if (typeof window === 'undefined' || !searchQuery.trim()) return

    try {
      const recent = getRecentSearches()
      const filtered = recent.filter((s) => s !== searchQuery)
      const updated = [searchQuery, ...filtered].slice(0, MAX_RECENT_SEARCHES)
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated))
    } catch (error) {
      console.error('Failed to save recent search:', error)
    }
  }, [getRecentSearches])

  const handleSearch = useCallback((searchQuery: string) => {
    const trimmed = searchQuery.trim()
    if (!trimmed) return

    saveRecentSearch(trimmed)

    if (onSearch) {
      onSearch(trimmed)
    } else {
      router.push(`/kb/search?q=${encodeURIComponent(trimmed)}`)
    }
  }, [router, saveRecentSearch, onSearch])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleSearch(query)
  }

  const handleClear = () => {
    setQuery('')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      handleClear()
    }
  }

  return (
    <form onSubmit={handleSubmit} className={cn('relative', className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search knowledge base..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus={autoFocus}
          className="pl-9 pr-9"
        />
        {query && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleClear}
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Clear search</span>
          </Button>
        )}
      </div>
    </form>
  )
}
