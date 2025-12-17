import { IsOptional, IsString, IsObject } from 'class-validator'

export class CreatePageDto {
  /**
   * TenantGuard can extract workspaceId from body, params, query, or session.
   * Keep it optional so API can rely on session-based workspace context.
   */
  @IsOptional()
  @IsString()
  workspaceId?: string

  @IsString()
  title!: string

  @IsOptional()
  @IsString()
  parentId?: string

  @IsOptional()
  @IsObject()
  content?: any // Tiptap JSON document
}
