import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsString, Matches } from 'class-validator'

export class StartTrelloImportDto {
  @ApiProperty({ description: 'Project ID to import into' })
  @IsString()
  @IsNotEmpty()
  projectId!: string

  @ApiProperty({ description: 'Trello API key' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-f0-9]{32}$/, { message: 'apiKey must be a valid 32-character Trello API key' })
  apiKey!: string

  @ApiProperty({ description: 'Trello API token' })
  @IsString()
  @IsNotEmpty()
  token!: string

  @ApiProperty({ description: 'Trello board ID' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-zA-Z0-9]+$/, { message: 'boardId must be a valid Trello board ID' })
  boardId!: string
}
