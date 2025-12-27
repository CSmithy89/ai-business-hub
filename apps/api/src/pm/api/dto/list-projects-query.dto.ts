import { ProjectStatus } from '@prisma/client'
import { Type } from 'class-transformer'
import {
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class ListProjectsQueryDto {
  @ApiProperty({ required: false, description: 'Project status filter' })
  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus

  @ApiProperty({ required: false, description: 'Search by project name' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  search?: string

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

  @ApiProperty({
    required: false,
    enum: ['name', 'createdAt', 'updatedAt'],
    default: 'createdAt',
  })
  @IsOptional()
  @IsIn(['name', 'createdAt', 'updatedAt'])
  sortBy?: 'name' | 'createdAt' | 'updatedAt' = 'createdAt'

  @ApiProperty({ required: false, enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc'
}
