import { IsString, IsNotEmpty, IsOptional, IsInt, Min, Max, MinLength, MaxLength } from 'class-validator'
import { Type } from 'class-transformer'

export class SearchQueryDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2, { message: 'Search query must be at least 2 characters' })
  @MaxLength(200, { message: 'Search query must not exceed 200 characters' })
  q!: string

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(10000, { message: 'Offset cannot exceed 10000' })
  offset?: number = 0
}
