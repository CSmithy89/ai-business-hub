'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import {
  AlertTriangle,
  Clock,
  Eye,
  RefreshCw,
  Trash,
  ArrowUp,
  ArrowDown,
} from 'lucide-react'
import { StaleReason } from '@hyvve/shared'
import { useStalPages, useBulkVerify, useBulkDelete } from '@/hooks/use-stale-pages'
import { toast } from 'sonner'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

type SortBy = 'updatedAt' | 'viewCount' | 'verifyExpires'
type SortOrder = 'asc' | 'desc'

export function StaleContentDashboard() {
  const router = useRouter()
  const { data: pages = [], isLoading, error, refetch } = useStalPages()
  const bulkVerifyMutation = useBulkVerify()
  const bulkDeleteMutation = useBulkDelete()

  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [filterReason, setFilterReason] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<SortBy>('updatedAt')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  // Handle permission error
  if (error) {
    if (error.message.includes('Admin access')) {
      toast.error('You need admin permissions to access this page.')
      router.push('/kb')
      return null
    }
  }

  // Filter pages by staleness reason
  const filteredPages = filterReason
    ? pages.filter((p) => p.reasons.includes(filterReason))
    : pages

  // Sort pages
  const sortedPages = [...filteredPages].sort((a, b) => {
    const order = sortOrder === 'asc' ? 1 : -1

    switch (sortBy) {
      case 'updatedAt':
        return order * (new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime())
      case 'viewCount':
        return order * (a.viewCount - b.viewCount)
      case 'verifyExpires': {
        const aExpires = a.verifyExpires ? new Date(a.verifyExpires).getTime() : Infinity
        const bExpires = b.verifyExpires ? new Date(b.verifyExpires).getTime() : Infinity
        return order * (aExpires - bExpires)
      }
      default:
        return 0
    }
  })

  // Selection handlers
  const toggleSelect = (pageId: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(pageId)) {
        next.delete(pageId)
      } else {
        next.add(pageId)
      }
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selected.size === sortedPages.length && sortedPages.length > 0) {
      setSelected(new Set())
    } else {
      setSelected(new Set(sortedPages.map((p) => p.id)))
    }
  }

  const clearSelection = () => setSelected(new Set())

  // Bulk action handlers
  const handleBulkVerify = async (expiresIn: '30d' | '60d' | '90d' | 'never') => {
    try {
      const result = await bulkVerifyMutation.mutateAsync({
        pageIds: Array.from(selected),
        expiresIn,
      })

      toast.success(`${result.success} pages verified successfully${result.failed > 0 ? `, ${result.failed} failed` : ''}`)

      clearSelection()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to verify pages')
    }
  }

  const handleBulkDelete = async () => {
    try {
      const result = await bulkDeleteMutation.mutateAsync({
        pageIds: Array.from(selected),
      })

      toast.success(`${result.success} pages deleted successfully${result.failed > 0 ? `, ${result.failed} failed` : ''}`)

      clearSelection()
      setDeleteDialogOpen(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete pages')
    }
  }

  // Get reason badge styling
  const getReasonBadge = (reason: string) => {
    switch (reason) {
      case StaleReason.EXPIRED_VERIFICATION:
        return (
          <Badge variant="destructive" className="gap-1">
            <AlertTriangle className="h-3 w-3" />
            {reason}
          </Badge>
        )
      case StaleReason.NOT_UPDATED_90_DAYS:
        return (
          <Badge variant="secondary" className="gap-1">
            <Clock className="h-3 w-3" />
            {reason}
          </Badge>
        )
      case StaleReason.LOW_VIEW_COUNT:
        return (
          <Badge variant="outline" className="gap-1">
            <Eye className="h-3 w-3" />
            {reason}
          </Badge>
        )
      default:
        return <Badge variant="outline">{reason}</Badge>
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading stale pages...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-destructive mb-4">{error.message}</p>
          <Button onClick={() => refetch()}>Retry</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Stale Content</h2>
          <p className="text-sm text-muted-foreground">
            Pages needing review: {pages.length}
          </p>
        </div>

        <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Filters and Sort */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Filter:</span>
          <Button
            variant={filterReason === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterReason(null)}
          >
            All
          </Button>
          <Button
            variant={filterReason === StaleReason.EXPIRED_VERIFICATION ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterReason(StaleReason.EXPIRED_VERIFICATION)}
          >
            <AlertTriangle className="h-3 w-3 mr-1" />
            Expired
          </Button>
          <Button
            variant={filterReason === StaleReason.NOT_UPDATED_90_DAYS ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterReason(StaleReason.NOT_UPDATED_90_DAYS)}
          >
            <Clock className="h-3 w-3 mr-1" />
            Old
          </Button>
          <Button
            variant={filterReason === StaleReason.LOW_VIEW_COUNT ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterReason(StaleReason.LOW_VIEW_COUNT)}
          >
            <Eye className="h-3 w-3 mr-1" />
            Low Views
          </Button>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <span className="text-sm text-muted-foreground">Sort:</span>
          <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortBy)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="updatedAt">Last Updated</SelectItem>
              <SelectItem value="viewCount">View Count</SelectItem>
              <SelectItem value="verifyExpires">Verification Expiry</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
          >
            {sortOrder === 'asc' ? (
              <ArrowUp className="h-4 w-4" />
            ) : (
              <ArrowDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-4 p-4 bg-muted rounded-lg border">
          <Badge variant="secondary">{selected.size} selected</Badge>
          <Button variant="ghost" size="sm" onClick={clearSelection}>
            Clear
          </Button>

          <div className="flex items-center gap-2 ml-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={bulkVerifyMutation.isPending}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Bulk Verify
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleBulkVerify('30d')}>
                  Verify for 30 days
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkVerify('60d')}>
                  Verify for 60 days
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkVerify('90d')}>
                  Verify for 90 days
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkVerify('never')}>
                  Verify permanently
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="destructive"
              size="sm"
              onClick={() => setDeleteDialogOpen(true)}
              disabled={bulkDeleteMutation.isPending}
            >
              <Trash className="h-4 w-4 mr-2" />
              Delete Selected
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selected.size === sortedPages.length && sortedPages.length > 0}
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead>Page</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Reasons</TableHead>
              <TableHead>Last Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedPages.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  <div className="text-muted-foreground">
                    {filterReason
                      ? 'No pages match the selected filter'
                      : 'No stale pages found. Your knowledge base is up to date!'}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              sortedPages.map((page) => (
                <TableRow key={page.id} className="hover:bg-muted/50">
                  <TableCell>
                    <Checkbox
                      checked={selected.has(page.id)}
                      onCheckedChange={() => toggleSelect(page.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <a
                      href={`/kb/${page.slug}`}
                      className="font-medium hover:underline"
                    >
                      {page.title}
                    </a>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="w-6 h-6">
                        <AvatarImage
                          src={page.owner.avatarUrl}
                          alt={page.owner.name}
                        />
                        <AvatarFallback className="text-xs bg-primary/10">
                          {page.owner.name[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{page.owner.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {page.reasons.map((reason, i) => (
                        <div key={i}>{getReasonBadge(reason)}</div>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(page.updatedAt), { addSuffix: true })}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push(`/kb/${page.slug}`)}
                    >
                      Review
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to delete {selected.size} page{selected.size > 1 ? 's' : ''}. This action can be undone by
              restoring from the trash.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
