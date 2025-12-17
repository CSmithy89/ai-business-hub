import { BmadPhaseType, PhaseStatus } from '@prisma/client'

export type ProjectTemplateId = 'bmad-course' | 'kanban-only' | 'custom'

export type PhaseTemplate = {
  name: string
  phaseNumber: number
  status: PhaseStatus
  bmadPhase?: BmadPhaseType | null
  description?: string | null
}

function formatSuggestedTasks(tasks: string[]): string {
  if (tasks.length === 0) return ''
  return ['Suggested tasks:', '', ...tasks.map((t) => `- ${t}`)].join('\n')
}

export function getPhaseTemplates(templateId: string | undefined | null): PhaseTemplate[] {
  const normalized = (templateId || 'custom') as ProjectTemplateId

  if (normalized === 'kanban-only') {
    return [
      {
        name: 'Backlog',
        phaseNumber: 1,
        status: PhaseStatus.CURRENT,
        bmadPhase: null,
        description: formatSuggestedTasks(['Capture tasks', 'Triage priorities', 'Assign ownership']),
      },
    ]
  }

  if (normalized === 'bmad-course') {
    return [
      {
        name: 'Brief',
        phaseNumber: 1,
        status: PhaseStatus.CURRENT,
        bmadPhase: BmadPhaseType.PHASE_1_BRIEF,
        description: formatSuggestedTasks(['Define goals', 'Identify stakeholders', 'Draft PRD']),
      },
      {
        name: 'Requirements',
        phaseNumber: 2,
        status: PhaseStatus.UPCOMING,
        bmadPhase: BmadPhaseType.PHASE_2_REQUIREMENTS,
        description: formatSuggestedTasks(['Write user stories', 'Define acceptance criteria', 'Validate constraints']),
      },
      {
        name: 'Architecture',
        phaseNumber: 3,
        status: PhaseStatus.UPCOMING,
        bmadPhase: BmadPhaseType.PHASE_3_ARCHITECTURE,
        description: formatSuggestedTasks(['Design architecture', 'Confirm data model', 'Plan integrations']),
      },
      {
        name: 'Implementation',
        phaseNumber: 4,
        status: PhaseStatus.UPCOMING,
        bmadPhase: BmadPhaseType.PHASE_4_IMPLEMENTATION,
        description: formatSuggestedTasks(['Build features', 'Integrate services', 'Handle edge cases']),
      },
      {
        name: 'Testing',
        phaseNumber: 5,
        status: PhaseStatus.UPCOMING,
        bmadPhase: BmadPhaseType.PHASE_5_TESTING,
        description: formatSuggestedTasks(['Add unit tests', 'Run E2E checks', 'Fix regressions']),
      },
      {
        name: 'Deployment',
        phaseNumber: 6,
        status: PhaseStatus.UPCOMING,
        bmadPhase: BmadPhaseType.PHASE_6_DEPLOYMENT,
        description: formatSuggestedTasks(['Prepare release', 'Deploy to production', 'Validate monitoring']),
      },
      {
        name: 'Launch',
        phaseNumber: 7,
        status: PhaseStatus.UPCOMING,
        bmadPhase: BmadPhaseType.PHASE_7_LAUNCH,
        description: formatSuggestedTasks(['Announce release', 'Collect feedback', 'Plan next iteration']),
      },
      {
        name: 'Operate: Maintain',
        phaseNumber: 8,
        status: PhaseStatus.UPCOMING,
        bmadPhase: BmadPhaseType.OPERATE_MAINTAIN,
        description: formatSuggestedTasks(['Monitor health', 'Resolve bugs', 'Maintain docs']),
      },
      {
        name: 'Operate: Iterate',
        phaseNumber: 9,
        status: PhaseStatus.UPCOMING,
        bmadPhase: BmadPhaseType.OPERATE_ITERATE,
        description: formatSuggestedTasks(['Ship improvements', 'Refine UX', 'Tune automation']),
      },
      {
        name: 'Operate: Scale',
        phaseNumber: 10,
        status: PhaseStatus.UPCOMING,
        bmadPhase: BmadPhaseType.OPERATE_SCALE,
        description: formatSuggestedTasks(['Performance tuning', 'Scale operations', 'Expand capabilities']),
      },
    ]
  }

  return []
}

