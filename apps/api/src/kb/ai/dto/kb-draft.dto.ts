import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator'

export class KbDraftDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3, { message: 'Prompt must be at least 3 characters' })
  @MaxLength(2000, { message: 'Prompt must not exceed 2000 characters' })
  prompt!: string
}
