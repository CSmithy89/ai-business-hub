import { ApiProperty } from '@nestjs/swagger'
import { IsString } from 'class-validator'

export class StartAsanaImportDto {
  @ApiProperty({ description: 'Project ID to import into' })
  @IsString()
  projectId!: string

  @ApiProperty({ description: 'Asana personal access token' })
  @IsString()
  accessToken!: string

  @ApiProperty({ description: 'Asana project GID' })
  @IsString()
  projectGid!: string
}
