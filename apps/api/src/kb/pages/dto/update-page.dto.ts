import { IsOptional, IsString, IsBoolean, MaxLength, Validate } from 'class-validator'
import { TiptapContentValidator } from '../validators/tiptap-content.validator'

// Type for Tiptap JSON content - compatible with Prisma's JSON type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TiptapContent = any

export class UpdatePageDto {
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Title must not exceed 500 characters' })
  title?: string

  @IsOptional()
  @Validate(TiptapContentValidator)
  content?: TiptapContent // Tiptap JSON document - validated by custom validator

  @IsOptional()
  @IsString()
  parentId?: string | null

  @IsOptional()
  @IsBoolean()
  createVersion?: boolean // If true, create a new version snapshot

  @IsOptional()
  @IsString()
  @MaxLength(500)
  changeNote?: string // Optional note for version history

  @IsOptional()
  @IsBoolean()
  processMentions?: boolean // If true, extract and process @mentions
}
