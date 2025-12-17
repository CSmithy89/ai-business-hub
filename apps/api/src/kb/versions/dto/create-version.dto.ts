import { IsOptional, IsString, MaxLength } from 'class-validator'
import { ApiPropertyOptional } from '@nestjs/swagger'

export class CreateVersionDto {
  @ApiPropertyOptional({
    description: 'Optional note describing the changes in this version',
    maxLength: 500,
    example: 'Updated deployment instructions and added troubleshooting section',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  changeNote?: string
}
