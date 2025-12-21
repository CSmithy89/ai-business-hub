type TiptapNode = Record<string, unknown>

type KbTemplateDefinition = {
  id: string
  title: string
  category: string
  description: string
  content: { type: 'doc'; content: TiptapNode[] }
}

const heading = (text: string, level = 2): TiptapNode => ({
  type: 'heading',
  attrs: { level },
  content: [{ type: 'text', text }],
})

const paragraph = (text: string): TiptapNode => ({
  type: 'paragraph',
  content: text ? [{ type: 'text', text }] : [],
})

const bulletList = (items: string[]): TiptapNode => ({
  type: 'bulletList',
  content: items.map((item) => ({
    type: 'listItem',
    content: [paragraph(item)],
  })),
})

const orderedList = (items: string[]): TiptapNode => ({
  type: 'orderedList',
  content: items.map((item) => ({
    type: 'listItem',
    content: [paragraph(item)],
  })),
})

export const DEFAULT_TEMPLATES: KbTemplateDefinition[] = [
  {
    id: 'template-meeting-notes',
    title: 'Meeting Notes',
    category: 'Meeting Notes',
    description: 'Capture discussions, decisions, and action items.',
    content: {
      type: 'doc',
      content: [
        heading('Meeting Notes', 1),
        paragraph('Date: TODO'),
        paragraph('Attendees: TODO'),
        heading('Agenda', 2),
        bulletList(['TODO: Add agenda items']),
        heading('Notes', 2),
        paragraph('TODO: Capture key discussion points.'),
        heading('Decisions', 2),
        bulletList(['TODO: Record decisions']),
        heading('Action Items', 2),
        bulletList(['TODO: Assign follow-ups']),
      ],
    },
  },
  {
    id: 'template-decision-record',
    title: 'Decision Record',
    category: 'Decision Record',
    description: 'Document key decisions with context and impact.',
    content: {
      type: 'doc',
      content: [
        heading('Decision Record', 1),
        paragraph('Status: Proposed'),
        heading('Context', 2),
        paragraph('TODO: Describe the situation and drivers.'),
        heading('Decision', 2),
        paragraph('TODO: State the decision clearly.'),
        heading('Consequences', 2),
        bulletList(['TODO: List implications and trade-offs']),
        heading('Alternatives Considered', 2),
        bulletList(['TODO: Summarize alternatives']),
      ],
    },
  },
  {
    id: 'template-process-doc',
    title: 'Process Doc',
    category: 'Process Doc',
    description: 'Outline repeatable steps, inputs, and outputs.',
    content: {
      type: 'doc',
      content: [
        heading('Process Document', 1),
        paragraph('Purpose: TODO'),
        heading('Scope', 2),
        paragraph('TODO: Describe when this process applies.'),
        heading('Steps', 2),
        orderedList(['TODO: Step 1', 'TODO: Step 2', 'TODO: Step 3']),
        heading('Inputs', 2),
        bulletList(['TODO: Input requirements']),
        heading('Outputs', 2),
        bulletList(['TODO: Expected deliverables']),
        heading('Owners', 2),
        paragraph('TODO: List responsible roles.'),
      ],
    },
  },
  {
    id: 'template-technical-spec',
    title: 'Technical Spec',
    category: 'Technical Spec',
    description: 'Capture requirements, architecture, and risks.',
    content: {
      type: 'doc',
      content: [
        heading('Technical Spec', 1),
        paragraph('Owner: TODO'),
        heading('Overview', 2),
        paragraph('TODO: Summarize the feature or change.'),
        heading('Requirements', 2),
        bulletList(['TODO: Functional requirements', 'TODO: Non-functional requirements']),
        heading('Architecture', 2),
        paragraph('TODO: Describe proposed architecture.'),
        heading('API / Interfaces', 2),
        bulletList(['TODO: Endpoints, events, or contracts']),
        heading('Risks', 2),
        bulletList(['TODO: List risks and mitigations']),
      ],
    },
  },
]
