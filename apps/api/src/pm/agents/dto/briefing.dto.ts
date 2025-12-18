import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsBoolean, IsInt, IsOptional, Max, Min } from 'class-validator'

export class UpdateBriefingPreferencesDto {
  @ApiPropertyOptional({ description: 'Enable daily briefing' })
  @IsOptional()
  @IsBoolean()
  dailyBriefingEnabled?: boolean

  @ApiPropertyOptional({
    description: 'Hour to send briefing (0-23 UTC)',
    minimum: 0,
    maximum: 23,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(23)
  dailyBriefingHour?: number

  @ApiPropertyOptional({ description: 'Send briefing via email' })
  @IsOptional()
  @IsBoolean()
  emailBriefing?: boolean
}

export class BriefingPreferencesResponseDto {
  @ApiProperty()
  dailyBriefingEnabled!: boolean

  @ApiProperty()
  dailyBriefingHour!: number

  @ApiProperty()
  emailBriefing!: boolean
}

export class BriefingItemDto {
  @ApiProperty()
  id!: string

  @ApiProperty()
  text!: string

  @ApiProperty({ enum: ['task', 'blocker', 'activity', 'recommendation'] })
  type!: 'task' | 'blocker' | 'activity' | 'recommendation'

  @ApiPropertyOptional({ enum: ['high', 'medium', 'low'] })
  priority?: 'high' | 'medium' | 'low'

  @ApiPropertyOptional()
  actionUrl?: string
}

export class BriefingSectionDto {
  @ApiProperty()
  title!: string

  @ApiProperty({ type: [BriefingItemDto] })
  items!: BriefingItemDto[]
}

export class DailyBriefingResponseDto {
  @ApiProperty()
  id!: string

  @ApiProperty()
  generatedAt!: string

  @ApiProperty()
  workspaceId!: string

  @ApiProperty()
  userId!: string

  @ApiProperty()
  sections!: {
    tasksDueToday: BriefingSectionDto
    overdueTasks: BriefingSectionDto
    blockers: BriefingSectionDto
    recentActivity: BriefingSectionDto
    recommendations: BriefingSectionDto
  }

  @ApiProperty()
  summary!: string
}
