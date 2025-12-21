import { ArrayMaxSize, IsArray, IsIn, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'

export class KbAskMessageDto {
  @IsString()
  @IsIn(['user', 'assistant'])
  role!: 'user' | 'assistant'

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(4000)
  content!: string
}

export class KbAskDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2, { message: 'Question must be at least 2 characters' })
  @MaxLength(500, { message: 'Question must not exceed 500 characters' })
  question!: string

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(12)
  @ValidateNested({ each: true })
  @Type(() => KbAskMessageDto)
  history?: KbAskMessageDto[]
}
