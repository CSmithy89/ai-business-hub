import type { AssignmentType } from '@/hooks/use-pm-tasks'

export function deriveAssignmentType(params: { assigneeId: string | null; agentId: string | null }): AssignmentType {
  if (params.assigneeId && params.agentId) return 'HYBRID'
  if (params.agentId) return 'AGENT'
  return 'HUMAN'
}

