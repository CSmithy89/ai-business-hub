import { ApiProperty } from '@nestjs/swagger'
import { IsIn, IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator'

export class GithubIssuesSyncDto {
  @ApiProperty({ description: 'Project ID to import issues into' })
  @IsString()
  @IsNotEmpty()
  projectId!: string

  @ApiProperty({ description: 'GitHub owner or organization' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?$/, {
    message: 'owner must be a valid GitHub username or organization',
  })
  owner!: string

  @ApiProperty({ description: 'GitHub repository name' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-zA-Z0-9._-]+$/, {
    message: 'repo must be a valid GitHub repository name',
  })
  repo!: string

  @ApiProperty({ description: 'Issue state to sync', required: false, default: 'open' })
  @IsOptional()
  @IsIn(['open', 'closed', 'all'])
  state?: 'open' | 'closed' | 'all'
}
