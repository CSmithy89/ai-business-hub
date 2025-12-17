import { z } from 'zod'

export const ProjectTypeSchema = z.enum([
  'COURSE',
  'PODCAST',
  'BOOK',
  'NEWSLETTER',
  'VIDEO_SERIES',
  'COMMUNITY',
  'SOFTWARE',
  'WEBSITE',
  'CUSTOM',
])

export const ProjectStatusSchema = z.enum([
  'PLANNING',
  'ACTIVE',
  'ON_HOLD',
  'COMPLETED',
  'ARCHIVED',
])

export const CreateProjectSchema = z.object({
  workspaceId: z.string().optional(),
  businessId: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  type: ProjectTypeSchema.optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  icon: z.string().optional(),
  bmadTemplateId: z.string().optional(),
  leadUserId: z.string().optional(),
})

export const UpdateProjectSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  type: ProjectTypeSchema.optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  icon: z.string().optional(),
  bmadTemplateId: z.string().optional(),
  status: ProjectStatusSchema.optional(),
  startDate: z.string().datetime().optional(),
  targetDate: z.string().datetime().optional(),
  autoApprovalThreshold: z.number().min(0).max(1).optional(),
  suggestionMode: z.boolean().optional(),
})

export const ListProjectsQuerySchema = z.object({
  status: ProjectStatusSchema.optional(),
  type: ProjectTypeSchema.optional(),
  businessId: z.string().optional(),
  search: z.string().optional(),
  page: z.number().int().min(1).optional(),
  limit: z.number().int().min(1).max(100).optional(),
})

export type CreateProjectInput = z.infer<typeof CreateProjectSchema>
export type UpdateProjectInput = z.infer<typeof UpdateProjectSchema>
export type ListProjectsQuery = z.infer<typeof ListProjectsQuerySchema>
