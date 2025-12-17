import { IsOptional, IsString, IsBoolean } from 'class-validator'
import { Transform } from 'class-transformer'

export class ListPagesQueryDto {
  @IsOptional()
  @IsString()
  parentId?: string

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  flat?: boolean

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  includeDeleted?: boolean
}
