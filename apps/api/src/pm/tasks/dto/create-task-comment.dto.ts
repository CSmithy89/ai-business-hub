import { IsOptional, IsString, MinLength } from 'class-validator'

export class CreateTaskCommentDto {
  @IsString()
  @MinLength(1)
  content!: string

  @IsOptional()
  @IsString()
  parentId?: string | null
}

