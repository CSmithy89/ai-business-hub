import { ProjectStatus } from '@prisma/client'
import { Type } from 'class-transformer'
import { IsDate, IsEnum, IsOptional, IsString, Matches, MaxLength } from 'class-validator'

export class PortfolioQueryDto {
  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus

  @IsOptional()
  @IsString()
  @MaxLength(100)
  teamLeadId?: string

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Matches(/^[a-zA-Z0-9\s\-_]+$/)
  search?: string

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  from?: Date

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  to?: Date
}
