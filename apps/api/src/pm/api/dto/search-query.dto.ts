import { Type } from 'class-transformer'
import { IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class SearchQueryDto {
  @ApiProperty({ description: 'Search query string' })
  @IsNotEmpty()
  @IsString()
  q!: string

  @ApiProperty({ required: false, default: 50, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 50

  @ApiProperty({ required: false, default: 0, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number = 0
}
