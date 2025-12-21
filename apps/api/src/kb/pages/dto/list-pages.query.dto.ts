import { IsOptional, IsString, IsBoolean, IsInt, Min, Max } from 'class-validator'
import { Transform, Type } from 'class-transformer'

// Transform that properly validates boolean query params
const transformBoolean = ({ value }: { value: unknown }) => {
  if (value === 'true' || value === true) return true
  if (value === 'false' || value === false) return false
  return value // Let @IsBoolean() reject invalid values
}

export class ListPagesQueryDto {
  @IsOptional()
  @IsString()
  parentId?: string

  @IsOptional()
  @IsBoolean()
  @Transform(transformBoolean)
  flat?: boolean

  @IsOptional()
  @IsBoolean()
  @Transform(transformBoolean)
  includeDeleted?: boolean

  @IsOptional()
  @IsBoolean()
  @Transform(transformBoolean)
  includeTemplates?: boolean

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 50
}
