import { TaskRelationType } from '@prisma/client'
import { Transform } from 'class-transformer'
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator'

function toBoolean(value: unknown): boolean | undefined {
  if (value === undefined || value === null || value === '') return undefined
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') return value.toLowerCase() === 'true'
  return undefined
}

export class DependenciesQueryDto {
  @IsOptional()
  @IsString()
  projectId?: string

  @IsOptional()
  @IsEnum(TaskRelationType)
  relationType?: TaskRelationType

  @IsOptional()
  @Transform(({ value }) => toBoolean(value), { toClassOnly: true })
  @IsBoolean()
  crossProjectOnly?: boolean
}
