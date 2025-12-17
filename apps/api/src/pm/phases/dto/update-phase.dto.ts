import { PhaseStatus } from '@prisma/client'
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator'

export class UpdatePhaseDto {
  @IsOptional()
  @IsString()
  name?: string

  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  @IsInt()
  @Min(1)
  phaseNumber?: number

  @IsOptional()
  @IsEnum(PhaseStatus)
  status?: PhaseStatus
}

