import { PhaseStatus } from '@prisma/client'
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class UpdatePhaseDto {
  @ApiProperty({ required: false, description: 'Phase name', example: 'Sprint 1' })
  @IsOptional()
  @IsString()
  name?: string

  @ApiProperty({ required: false, description: 'Phase description' })
  @IsOptional()
  @IsString()
  description?: string

  @ApiProperty({ required: false, description: 'Phase number/order', minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  phaseNumber?: number

  @ApiProperty({ required: false, enum: PhaseStatus, description: 'Phase status' })
  @IsOptional()
  @IsEnum(PhaseStatus)
  status?: PhaseStatus
}

