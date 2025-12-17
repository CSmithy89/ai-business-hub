import { IsOptional, IsString, IsObject, IsBoolean, MaxLength } from 'class-validator'

export class UpdatePageDto {
  @IsOptional()
  @IsString()
  title?: string

  @IsOptional()
  @IsObject()
  content?: any // Tiptap JSON document

  @IsOptional()
  @IsString()
  parentId?: string

  @IsOptional()
  @IsBoolean()
  createVersion?: boolean // If true, create a new version snapshot

  @IsOptional()
  @IsString()
  @MaxLength(500)
  changeNote?: string // Optional note for version history
}
