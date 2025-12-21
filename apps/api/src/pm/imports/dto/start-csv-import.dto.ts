import { ApiProperty } from '@nestjs/swagger'
import { IsBoolean, IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator'

export class StartCsvImportDto {
  @ApiProperty({ description: 'Project ID to import tasks into' })
  @IsString()
  projectId: string

  @ApiProperty({ description: 'Default phase ID for imported tasks', required: false })
  @IsOptional()
  @IsString()
  phaseId?: string

  @ApiProperty({ description: 'Raw CSV text including header row' })
  @IsString()
  @IsNotEmpty()
  csvText: string

  @ApiProperty({
    description: 'Mapping of task fields to CSV column headers',
    example: { title: 'Title', description: 'Description', status: 'Status' },
  })
  @IsObject()
  mapping: Record<string, string>

  @ApiProperty({ description: 'Skip invalid rows instead of failing', required: false, default: true })
  @IsOptional()
  @IsBoolean()
  skipInvalidRows?: boolean = true
}
