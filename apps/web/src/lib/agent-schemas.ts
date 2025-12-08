import { z } from 'zod'

export const AgentResponseSchema = z.object({
  success: z.boolean(),
  content: z.string().optional(),
  session_id: z.string(),
  agent_name: z.string().optional(),
  error: z.string().optional(),
  metadata: z
    .object({
      business_id: z.string(),
      team: z.string(),
      workspace_id: z.string().optional(),
    })
    .passthrough(),
})

export type AgentResponseValidated = z.infer<typeof AgentResponseSchema>
