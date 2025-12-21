import { ApiProperty } from '@nestjs/swagger'
import { IsObject, IsOptional, IsString } from 'class-validator'

export class ConnectIntegrationDto {
  @ApiProperty({ description: 'Provider access token' })
  @IsString()
  token: string

  @ApiProperty({ description: 'Optional metadata (e.g., default repo)', required: false })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>
}
