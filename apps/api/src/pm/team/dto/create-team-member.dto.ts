import { TeamRole } from '@prisma/client'
import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator'

export class CreateTeamMemberDto {
  @IsString()
  userId!: string

  @IsOptional()
  @IsEnum(TeamRole)
  role?: TeamRole

  @IsOptional()
  @IsString()
  customRoleName?: string

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(168)
  hoursPerWeek?: number

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  productivity?: number

  @IsOptional()
  @IsBoolean()
  canAssignTasks?: boolean

  @IsOptional()
  @IsBoolean()
  canApproveAgents?: boolean

  @IsOptional()
  @IsBoolean()
  canModifyPhases?: boolean
}

