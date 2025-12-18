import { IsDefined, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator'

export class CreateTaskCommentDto {
  @IsDefined()
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  content!: string

  @IsOptional()
  @IsString()
  parentId?: string | null
}
