'use client'

import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { CheckCircle, AlertTriangle, Shield, X, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'

interface VerificationBadgeProps {
  page: {
    isVerified: boolean
    verifiedAt: string | null
    verifyExpires: string | null
    verifiedBy?: { name: string } | null
  }
  canVerify: boolean
  onVerify: (expiresIn: string) => Promise<void>
  onUnverify: () => Promise<void>
}

export function VerificationBadge({
  page,
  canVerify,
  onVerify,
  onUnverify,
}: VerificationBadgeProps) {
  const [loading, setLoading] = useState(false)

  const handleVerify = async (expiresIn: string) => {
    setLoading(true)
    try {
      await onVerify(expiresIn)
    } finally {
      setLoading(false)
    }
  }

  const handleUnverify = async () => {
    setLoading(true)
    try {
      await onUnverify()
    } finally {
      setLoading(false)
    }
  }

  if (page.isVerified) {
    const expiresIn = page.verifyExpires
      ? formatDistanceToNow(new Date(page.verifyExpires), { addSuffix: false })
      : null

    const isExpired =
      page.verifyExpires && new Date(page.verifyExpires) < new Date()

    // Show re-verify button for expired pages when user can verify
    if (isExpired && canVerify && page.verifyExpires) {
      return (
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
            <AlertTriangle className="w-4 h-4" />
            <span className="font-medium">Verification Expired</span>
            <span className="text-xs opacity-75">
              Expired {formatDistanceToNow(new Date(page.verifyExpires))} ago
            </span>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" disabled={loading}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Re-verify
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleVerify('30d')}>
                Verify for 30 days
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleVerify('60d')}>
                Verify for 60 days
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleVerify('90d')}>
                Verify for 90 days
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleVerify('never')}>
                Verify permanently
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )
    }

    return (
      <div
        className={cn(
          'inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium',
          isExpired
            ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
            : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
        )}
      >
        {isExpired ? (
          <AlertTriangle className="w-4 h-4" />
        ) : (
          <CheckCircle className="w-4 h-4" />
        )}
        <span>
          {isExpired ? 'Verification Expired' : 'Verified'}
        </span>
        {!isExpired && (
          <span className="text-xs opacity-75">
            {page.verifyExpires
              ? `Expires in ${expiresIn}`
              : 'Never expires'}
          </span>
        )}
        {canVerify && !isExpired && (
          <button
            type="button"
            onClick={handleUnverify}
            disabled={loading}
            className="ml-2 opacity-50 hover:opacity-100 transition-opacity disabled:cursor-not-allowed"
            title="Remove verification"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
    )
  }

  if (!canVerify) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={loading}>
          <Shield className="w-4 h-4 mr-2" />
          Mark as Verified
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleVerify('30d')}>
          Verify for 30 days
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleVerify('60d')}>
          Verify for 60 days
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleVerify('90d')}>
          Verify for 90 days
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleVerify('never')}>
          Verify permanently
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
