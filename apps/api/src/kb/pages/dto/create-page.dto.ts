import { IsBoolean, IsOptional, IsString, MaxLength, Validate } from 'class-validator'
import { TiptapContentValidator } from '../validators/tiptap-content.validator'

// Type for Tiptap JSON content - compatible with Prisma's JSON type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TiptapContent = any

export class CreatePageDto {
  /**
   * TenantGuard can extract workspaceId from body, params, query, or session.
   * Keep it optional so API can rely on session-based workspace context.
   */
  @IsOptional()
  @IsString()
  workspaceId?: string

  @IsString()
  @MaxLength(500, { message: 'Title must not exceed 500 characters' })
  title!: string

  @IsOptional()
  @IsString()
  parentId?: string

  @IsOptional()
  @Validate(TiptapContentValidator)
  content?: TiptapContent // Tiptap JSON document - validated by custom validator

  @IsOptional()
  @IsBoolean()
  isTemplate?: boolean

  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Template category must not exceed 100 characters' })
  templateCategory?: string
}
