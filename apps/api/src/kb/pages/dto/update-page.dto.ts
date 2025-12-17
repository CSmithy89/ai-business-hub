import { IsOptional, IsString, IsObject } from 'class-validator'

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
}
