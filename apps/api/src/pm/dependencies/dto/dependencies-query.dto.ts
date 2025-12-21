import { TaskRelationType } from '@prisma/client'
import { Transform, Type } from 'class-transformer'
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator'

function toBoolean(value: unknown): unknown {
  if (value === undefined || value === null || value === '') return undefined
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') {
    const lowered = value.toLowerCase()
    if (lowered === 'true') return true
    if (lowered === 'false') return false
  }
  return value
}

export class DependenciesQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  projectId?: string

  @IsOptional()
  @IsEnum(TaskRelationType)
  relationType?: TaskRelationType

  @IsOptional()
  @Transform(({ value }) => toBoolean(value), { toClassOnly: true })
  @IsBoolean()
  crossProjectOnly?: boolean

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 50

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number = 0
}
