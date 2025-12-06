'use client'

import { useParams, useRouter } from 'next/navigation'
import { useAgentConfigForm } from '@/hooks/use-agent-config-form'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ConfigSidebar } from '@/components/agents/config/ConfigSidebar'
import { GeneralSettings } from '@/components/agents/config/GeneralSettings'
import { AIModelSettings } from '@/components/agents/config/AIModelSettings'
import { BehaviorSettings } from '@/components/agents/config/BehaviorSettings'
import { MemorySettings } from '@/components/agents/config/MemorySettings'
import { IntegrationsSettings } from '@/components/agents/config/IntegrationsSettings'
import { NotificationsSettings } from '@/components/agents/config/NotificationsSettings'
import { AdvancedSettings } from '@/components/agents/config/AdvancedSettings'
import { DangerZone } from '@/components/agents/config/DangerZone'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { useState, useEffect } from 'react'

/**
 * Agent Configuration Page
 *
 * Full-page configuration interface for individual agent settings.
 * Features:
 * - 8-section sidebar navigation
 * - Form validation with unsaved changes detection
 * - Sticky footer for save/cancel actions
 */
export default function AgentConfigurePage() {
  const params = useParams()
  const router = useRouter()
  const agentId = params.id as string

  const { agent, isLoading, formData, updateField, isDirty, handleSave, handleReset, isSaving } =
    useAgentConfigForm(agentId)

  const [activeSectionId, setActiveSectionId] = useState('general')

  // Update active section based on scroll position
  useEffect(() => {
    const sections = [
      'general',
      'ai-model',
      'behavior',
      'memory',
      'integrations',
      'notifications',
      'advanced',
      'danger',
    ]

    const handleScroll = () => {
      const scrollPosition = window.scrollY + 100

      for (const sectionId of sections) {
        const element = document.getElementById(sectionId)
        if (element) {
          const { offsetTop, offsetHeight } = element
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSectionId(sectionId)
            break
          }
        }
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Handle cancel with confirmation if dirty
  const handleCancel = () => {
    if (isDirty) {
      const confirmed = window.confirm('You have unsaved changes. Are you sure you want to cancel?')
      if (!confirmed) return
    }
    handleReset()
    router.back()
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="flex gap-8">
          <Skeleton className="w-64 h-96" />
          <div className="flex-1 space-y-6">
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
          </div>
        </div>
      </div>
    )
  }

  if (!agent) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-2">Agent Not Found</h2>
          <p className="text-muted-foreground mb-6">
            The agent you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.
          </p>
          <Button onClick={() => window.location.href = '/agents'}>
            Back to Agents
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <button
          type="button"
          onClick={() => window.location.href = '/agents'}
          className="hover:text-foreground transition-colors"
        >
          Agents
        </button>
        <span>/</span>
        <button
          type="button"
          onClick={() => router.back()}
          className="hover:text-foreground transition-colors"
        >
          {agent.name}
        </button>
        <span>/</span>
        <span className="text-foreground">Configure</span>
      </div>

      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-2xl">
            {agent.avatar}
          </div>
          <div>
            <h1 className="text-3xl font-bold">{agent.name} Configuration</h1>
            <p className="text-muted-foreground">{agent.role}</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex gap-8">
        {/* Sidebar */}
        <ConfigSidebar activeSectionId={activeSectionId} />

        {/* Settings Sections */}
        <div className="flex-1 space-y-8 pb-32">
          <GeneralSettings
            formData={formData}
            onChange={(field, value) => updateField(field as keyof typeof formData, value as string | number | null)}
          />
          <AIModelSettings
            formData={formData}
            onChange={(field, value) => updateField(field, value ?? null)}
          />
          <BehaviorSettings
            formData={formData}
            onChange={(field, value) => updateField(field, value ?? null)}
          />
          <MemorySettings />
          <IntegrationsSettings />
          <NotificationsSettings />
          <AdvancedSettings />
          <DangerZone agentId={agent.id} agentName={agent.name} />
        </div>
      </div>

      {/* Sticky Footer */}
      {isDirty && (
        <div className="fixed bottom-0 left-0 right-0 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
          <div className="container mx-auto p-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <div className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse" />
              <span className="font-medium">You have unsaved changes</span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
