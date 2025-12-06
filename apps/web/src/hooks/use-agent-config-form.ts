import { useState, useEffect } from 'react'
import { useAgent, useUpdateAgent } from './use-agent'
import { toast } from 'sonner'
import type { Agent } from '@hyvve/shared'

/**
 * Form state management hook for agent configuration
 *
 * Handles:
 * - Form data initialization from agent
 * - Dirty state tracking
 * - Field updates
 * - Save with mutation
 * - Reset/cancel
 * - Browser warning for unsaved changes
 */
export function useAgentConfigForm(agentId: string) {
  const { data: agent, isLoading } = useAgent(agentId)
  const updateMutation = useUpdateAgent(agentId)

  const [formData, setFormData] = useState<Partial<Agent['config']>>({})
  const [isDirty, setIsDirty] = useState(false)

  // Initialize form data when agent loads
  useEffect(() => {
    if (agent) {
      setFormData(agent.config)
    }
  }, [agent])

  // Check if form is dirty
  useEffect(() => {
    if (agent) {
      const hasChanges = JSON.stringify(formData) !== JSON.stringify(agent.config)
      setIsDirty(hasChanges)
    }
  }, [formData, agent])

  // Warn on unsaved changes when navigating away
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault()
        e.returnValue = ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isDirty])

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync(formData)
      toast.success('Agent configuration saved successfully')
      setIsDirty(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save configuration')
    }
  }

  const handleReset = () => {
    if (agent) {
      setFormData(agent.config)
      setIsDirty(false)
    }
  }

  const updateField = <K extends keyof Agent['config']>(field: K, value: Agent['config'][K]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return {
    agent,
    isLoading,
    formData,
    updateField,
    isDirty,
    handleSave,
    handleReset,
    isSaving: updateMutation.isPending,
  }
}
