import { IsBoolean, IsOptional, IsString } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class LinkProjectDto {
  @ApiProperty({ description: 'Project ID to link to' })
  @IsString()
  projectId!: string

  @ApiProperty({ description: 'Mark as primary doc for project', required: false })
  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean
}

export class UpdateLinkDto {
  @ApiProperty({ description: 'Update primary flag', required: false })
  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean
}
