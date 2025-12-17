import { IsOptional, IsString, IsBoolean } from 'class-validator'
import { Transform } from 'class-transformer'

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
}
