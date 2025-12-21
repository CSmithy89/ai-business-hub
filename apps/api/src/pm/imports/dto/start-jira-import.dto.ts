import { ApiProperty } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator'

export class StartJiraImportDto {
  @ApiProperty({ description: 'Project ID to import into' })
  @IsString()
  projectId!: string

  @ApiProperty({ description: 'Jira base URL (e.g., https://your-domain.atlassian.net)' })
  @IsString()
  baseUrl!: string

  @ApiProperty({ description: 'Jira user email for API token' })
  @IsString()
  email!: string

  @ApiProperty({ description: 'Jira API token' })
  @IsString()
  apiToken!: string

  @ApiProperty({ description: 'Optional JQL filter', required: false })
  @IsOptional()
  @IsString()
  jql?: string

  @ApiProperty({ description: 'Max results to import', required: false, default: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  maxResults?: number
}
