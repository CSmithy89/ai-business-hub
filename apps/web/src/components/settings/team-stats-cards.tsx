'use client'

import { useQuery } from '@tanstack/react-query'
import { Users, Shield, Mail, Armchair, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useSession } from '@/lib/auth-client'

/**
 * Stat card configuration
 */
interface StatCardConfig {
  id: string
  title: string
  value: string | number
  icon: React.ComponentType<{ className?: string }>
  color: string
}

/**
 * Member data from API
 */
interface Member {
  id: string
  userId: string
  role: string
}

/**
 * Invitation data from API
 */
interface Invitation {
  id: string
  email: string
  role: string
  expiresAt: string
}

/**
 * Fetch workspace members
 */
async function fetchMembers(workspaceId: string): Promise<Member[]> {
  const response = await fetch(`/api/workspaces/${workspaceId}/members`)
  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch members')
  }

  return data.data
}

/**
 * Fetch pending invitations
 */
async function fetchInvitations(workspaceId: string): Promise<Invitation[]> {
  const response = await fetch(`/api/workspaces/${workspaceId}/invitations`)
  const data = await response.json()

  if (!response.ok) {
    // If user doesn't have permission, return empty array
    if (response.status === 403) {
      return []
    }
    throw new Error(data.message || 'Failed to fetch invitations')
  }

  return data.data
}

/**
 * TeamStatsCards Component
 *
 * Displays workspace team statistics in a responsive grid:
 * - Total Members: Count of active workspace members
 * - Admins: Count of members with OWNER or ADMIN role
 * - Pending Invitations: Count of pending invitations
 * - Seats: "Unlimited" (MVP has no seat limits)
 */
export function TeamStatsCards() {
  const { data: session } = useSession()
  const workspaceId = (session?.session as { activeWorkspaceId?: string } | undefined)?.activeWorkspaceId

  // Fetch members
  const {
    data: members,
    isLoading: isLoadingMembers,
    error: membersError,
  } = useQuery({
    queryKey: ['workspace-members', workspaceId],
    queryFn: () => fetchMembers(workspaceId!),
    enabled: !!workspaceId,
  })

  // Fetch invitations
  const {
    data: invitations,
    isLoading: isLoadingInvitations,
  } = useQuery({
    queryKey: ['workspace-invitations', workspaceId],
    queryFn: () => fetchInvitations(workspaceId!),
    enabled: !!workspaceId,
  })

  // Calculate stats
  const totalMembers = members?.length ?? 0
  const adminCount =
    members?.filter((m) => m.role === 'owner' || m.role === 'admin').length ?? 0
  const pendingInvitations = invitations?.length ?? 0

  // Stat cards configuration
  const stats: StatCardConfig[] = [
    {
      id: 'total-members',
      title: 'Total Members',
      value: totalMembers,
      icon: Users,
      color: 'text-blue-600',
    },
    {
      id: 'admins',
      title: 'Admins',
      value: adminCount,
      icon: Shield,
      color: 'text-purple-600',
    },
    {
      id: 'pending-invitations',
      title: 'Pending Invitations',
      value: pendingInvitations,
      icon: Mail,
      color: 'text-amber-600',
    },
    {
      id: 'seats',
      title: 'Seats',
      value: 'Unlimited',
      icon: Armchair,
      color: 'text-green-600',
    },
  ]

  // Loading state
  const isLoading = isLoadingMembers || isLoadingInvitations

  if (!workspaceId) {
    return null
  }

  if (membersError) {
    return (
      <Card>
        <CardContent className="py-6">
          <p className="text-center text-sm text-red-500">
            Failed to load team statistics
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.id} className="transition-shadow hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              {stat.title}
            </CardTitle>
            <stat.icon className={`h-5 w-5 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                <span className="text-sm text-gray-400">Loading...</span>
              </div>
            ) : (
              <div className="text-2xl font-bold">{stat.value}</div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
