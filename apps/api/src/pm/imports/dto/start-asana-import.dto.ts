import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsString, Matches } from 'class-validator'

export class StartAsanaImportDto {
  @ApiProperty({ description: 'Project ID to import into' })
  @IsString()
  @IsNotEmpty()
  projectId!: string

  @ApiProperty({ description: 'Asana personal access token' })
  @IsString()
  @IsNotEmpty()
  accessToken!: string

  @ApiProperty({ description: 'Asana project GID' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d+$/, { message: 'projectGid must be a numeric Asana GID' })
  projectGid!: string
}
