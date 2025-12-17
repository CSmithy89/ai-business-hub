import { IsDefined, IsNotEmpty, IsString, MinLength } from 'class-validator'

export class UpdateTaskCommentDto {
  @IsDefined()
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  content!: string
}
