import { ApiProperty } from '@nestjs/swagger'
import { IsString } from 'class-validator'

export class StartTrelloImportDto {
  @ApiProperty({ description: 'Project ID to import into' })
  @IsString()
  projectId!: string

  @ApiProperty({ description: 'Trello API key' })
  @IsString()
  apiKey!: string

  @ApiProperty({ description: 'Trello API token' })
  @IsString()
  token!: string

  @ApiProperty({ description: 'Trello board ID' })
  @IsString()
  boardId!: string
}
