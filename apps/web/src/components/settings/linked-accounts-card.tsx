'use client'

/**
 * Linked Accounts Card
 * Story 09-7: Card component for managing linked OAuth accounts
 */

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Link2, Unlink, Github } from 'lucide-react'
import { useSession } from '@/lib/auth-client'
import { toast } from 'sonner'

interface LinkedAccount {
  provider: string
  providerId: string
  linkedAt: string
}

interface LinkedAccountsData {
  accounts: LinkedAccount[]
  hasPassword: boolean
  supportedProviders: string[]
}

interface ProviderConfig {
  name: string
  icon: React.ReactNode
  color: string
  bgColor: string
}

const providerConfigs: Record<string, ProviderConfig> = {
  google: {
    name: 'Google',
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24">
        <path
          fill="currentColor"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
          fill="currentColor"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
          fill="currentColor"
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        />
        <path
          fill="currentColor"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        />
      </svg>
    ),
    color: 'text-red-600',
    bgColor: 'bg-red-50',
  },
  microsoft: {
    name: 'Microsoft',
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24">
        <path fill="#F25022" d="M1 1h10v10H1z" />
        <path fill="#00A4EF" d="M13 1h10v10H13z" />
        <path fill="#7FBA00" d="M1 13h10v10H1z" />
        <path fill="#FFB900" d="M13 13h10v10H13z" />
      </svg>
    ),
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  github: {
    name: 'GitHub',
    icon: <Github className="h-5 w-5" />,
    color: 'text-gray-800',
    bgColor: 'bg-gray-50',
  },
}

export function LinkedAccountsCard() {
  const [linkedAccountsData, setLinkedAccountsData] = useState<LinkedAccountsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [unlinkingProvider, setUnlinkingProvider] = useState<string | null>(null)
  const { data: session } = useSession()

  // Fetch linked accounts from API
  const fetchLinkedAccounts = useCallback(async () => {
    if (!session?.user?.id) {
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/linked-accounts')
      if (response.ok) {
        const data = await response.json()
        setLinkedAccountsData(data)
      } else {
        toast.error('Failed to fetch linked accounts')
      }
    } catch (error) {
      console.error('Failed to fetch linked accounts:', error)
      toast.error('Failed to fetch linked accounts')
    } finally {
      setLoading(false)
    }
  }, [session?.user?.id])

  useEffect(() => {
    fetchLinkedAccounts()
  }, [fetchLinkedAccounts]) // Only re-fetch when user changes

  const handleLinkProvider = (provider: string) => {
    // Redirect to OAuth provider
    window.location.href = `/api/auth/signin/${provider}?callbackUrl=/settings/linked-accounts`
  }

  const handleUnlinkProvider = async (provider: string) => {
    if (!linkedAccountsData) return

    // Prevent unlinking if it's the last auth method
    const otherLinkedProviders = linkedAccountsData.accounts.filter(
      acc => acc.provider !== provider
    )
    if (!linkedAccountsData.hasPassword && otherLinkedProviders.length === 0) {
      toast.error('You must have at least one authentication method. Please set a password or link another provider first.')
      return
    }

    setUnlinkingProvider(provider)

    try {
      const response = await fetch('/api/auth/unlink-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ provider }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(data.message || 'Account unlinked successfully')
        // Refresh linked accounts
        await fetchLinkedAccounts()
      } else {
        toast.error(data.error?.message || 'Failed to unlink account')
      }
    } catch (error) {
      console.error('Unlink account error:', error)
      toast.error('Failed to unlink account')
    } finally {
      setUnlinkingProvider(null)
    }
  }

  const isProviderLinked = (provider: string) => {
    return linkedAccountsData?.accounts.some(acc => acc.provider === provider) || false
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Linked Accounts</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (!linkedAccountsData) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link2 className="h-5 w-5 text-blue-600" />
          Linked Accounts
        </CardTitle>
        <CardDescription>
          Connect your account with OAuth providers for easier sign-in
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {linkedAccountsData.supportedProviders.map(provider => {
            const config = providerConfigs[provider]
            const linked = isProviderLinked(provider)
            const account = linkedAccountsData.accounts.find(acc => acc.provider === provider)

            return (
              <div
                key={provider}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${config.bgColor}`}>
                    <div className={config.color}>{config.icon}</div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{config.name}</p>
                      {linked && (
                        <Badge variant="secondary" className="text-xs">
                          Linked
                        </Badge>
                      )}
                    </div>
                    {linked && account && (
                      <p className="text-sm text-gray-500">
                        Connected on {formatDate(account.linkedAt)}
                      </p>
                    )}
                  </div>
                </div>
                <div>
                  {linked ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUnlinkProvider(provider)}
                      disabled={unlinkingProvider === provider}
                    >
                      <Unlink className="h-4 w-4 mr-2" />
                      {unlinkingProvider === provider ? 'Unlinking...' : 'Unlink'}
                    </Button>
                  ) : (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleLinkProvider(provider)}
                    >
                      <Link2 className="h-4 w-4 mr-2" />
                      Link Account
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {linkedAccountsData.accounts.length === 0 && !linkedAccountsData.hasPassword && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              You don&apos;t have any authentication methods set up. Please link at least one OAuth
              provider or set a password.
            </p>
          </div>
        )}

        {!linkedAccountsData.hasPassword && linkedAccountsData.accounts.length === 1 && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              You only have one authentication method. Consider setting a password or linking
              another provider as a backup.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
