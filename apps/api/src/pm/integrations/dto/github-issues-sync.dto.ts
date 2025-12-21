import { ApiProperty } from '@nestjs/swagger'
import { IsIn, IsOptional, IsString } from 'class-validator'

export class GithubIssuesSyncDto {
  @ApiProperty({ description: 'Project ID to import issues into' })
  @IsString()
  projectId: string

  @ApiProperty({ description: 'GitHub owner or organization' })
  @IsString()
  owner: string

  @ApiProperty({ description: 'GitHub repository name' })
  @IsString()
  repo: string

  @ApiProperty({ description: 'Issue state to sync', required: false, default: 'open' })
  @IsOptional()
  @IsIn(['open', 'closed', 'all'])
  state?: 'open' | 'closed' | 'all'
}
