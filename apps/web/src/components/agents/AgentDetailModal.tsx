'use client'

import { useState } from 'react'
import { useAgent } from '@/hooks/use-agent'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { AgentAvatar } from './AgentAvatar'
import { AgentStatusBadge } from './AgentStatusBadge'
import { OverviewTab } from './tabs/OverviewTab'
import { ActivityTab } from './tabs/ActivityTab'
import { ConfigurationTab } from './tabs/ConfigurationTab'
import { PermissionsTab } from './tabs/PermissionsTab'
import { AnalyticsTab } from './tabs/AnalyticsTab'
import { Pencil, Loader2 } from 'lucide-react'

interface AgentDetailModalProps {
  agentId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * AgentDetailModal Component
 *
 * Comprehensive agent detail modal with 5-tab interface.
 * Displays agent information, activity, configuration, permissions, and analytics.
 */
export function AgentDetailModal({
  agentId,
  open,
  onOpenChange,
}: AgentDetailModalProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [isEditing, setIsEditing] = useState(false)

  // Fetch agent data
  const { data: agent, isLoading, error } = useAgent(agentId || '')

  // Reset state when modal closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setActiveTab('overview')
      setIsEditing(false)
    }
    onOpenChange(newOpen)
  }

  // Handle edit mode toggle
  const handleEditToggle = () => {
    // Only allow editing on Configuration tab
    if (activeTab !== 'configuration') {
      setActiveTab('configuration')
    }
    setIsEditing(!isEditing)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-hidden max-sm:h-screen max-sm:w-screen max-sm:max-w-none">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
            Failed to load agent details. Please try again.
          </div>
        ) : agent ? (
          <>
            {/* Modal Header with Agent Info */}
            <DialogHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <AgentAvatar agent={agent} size="lg" showStatus />
                  <div>
                    <DialogTitle className="text-2xl">{agent.name}</DialogTitle>
                    <p className="text-sm text-muted-foreground">{agent.role}</p>
                    <div className="mt-2">
                      <AgentStatusBadge status={agent.status} />
                    </div>
                  </div>
                </div>

                {/* Edit Button */}
                <Button
                  variant={isEditing ? 'default' : 'outline'}
                  size="sm"
                  onClick={handleEditToggle}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  {isEditing ? 'Editing' : 'Edit'}
                </Button>
              </div>
            </DialogHeader>

            {/* Tab Interface */}
            <Tabs
              value={activeTab}
              onValueChange={value => {
                setActiveTab(value)
                // Exit edit mode when switching tabs
                if (value !== 'configuration') {
                  setIsEditing(false)
                }
              }}
              className="mt-6"
            >
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
                <TabsTrigger value="configuration">Configuration</TabsTrigger>
                <TabsTrigger value="permissions">Permissions</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
              </TabsList>

              {/* Scrollable Content Area */}
              <div className="mt-6 max-h-[60vh] overflow-y-auto pr-2">
                <TabsContent value="overview" className="mt-0">
                  <OverviewTab agent={agent} />
                </TabsContent>

                <TabsContent value="activity" className="mt-0">
                  <ActivityTab agentId={agent.id} />
                </TabsContent>

                <TabsContent value="configuration" className="mt-0">
                  <ConfigurationTab
                    agent={agent}
                    isEditing={isEditing}
                    onEditChange={setIsEditing}
                  />
                </TabsContent>

                <TabsContent value="permissions" className="mt-0">
                  <PermissionsTab agent={agent} isEditing={isEditing} />
                </TabsContent>

                <TabsContent value="analytics" className="mt-0">
                  <AnalyticsTab agentId={agent.id} />
                </TabsContent>
              </div>
            </Tabs>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
