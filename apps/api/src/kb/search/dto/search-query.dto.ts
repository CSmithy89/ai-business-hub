import { IsString, IsNotEmpty, IsOptional, IsNumber, Min, Max } from 'class-validator'
import { Type } from 'class-transformer'

export class SearchQueryDto {
  @IsString()
  @IsNotEmpty()
  q!: string

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  offset?: number = 0
}
