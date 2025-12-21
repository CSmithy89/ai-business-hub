import { Transform } from 'class-transformer'
import { IsOptional, IsString } from 'class-validator'

export class ExportTasksQueryDto {
  @IsOptional()
  @IsString()
  projectId?: string

  @IsOptional()
  @IsString()
  phaseId?: string

  @IsOptional()
  @IsString()
  status?: string

  @IsOptional()
  @IsString()
  type?: string

  @IsOptional()
  @IsString()
  priority?: string

  @IsOptional()
  @IsString()
  assigneeId?: string

  @IsOptional()
  @IsString()
  search?: string

  @IsOptional()
  @IsString()
  labels?: string

  @IsOptional()
  @IsString()
  dueDateFrom?: string

  @IsOptional()
  @IsString()
  dueDateTo?: string

  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string'
      ? value.split(',').map((field) => field.trim()).filter(Boolean)
      : Array.isArray(value)
        ? value
        : [],
  )
  fields?: string[]
}
