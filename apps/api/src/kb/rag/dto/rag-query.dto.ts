import { Type } from 'class-transformer'
import { IsInt, IsNotEmpty, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator'

export class RagQueryDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2, { message: 'Query must be at least 2 characters' })
  @MaxLength(500, { message: 'Query must not exceed 500 characters' })
  q!: string

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  limit?: number = 8

  @IsOptional()
  pageIds?: string[]
}

