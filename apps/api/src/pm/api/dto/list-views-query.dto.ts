import { IsNotEmpty, IsString } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class ListViewsQueryDto {
  @ApiProperty({ description: 'Filter views by project ID (required)' })
  @IsNotEmpty()
  @IsString()
  projectId!: string
}
