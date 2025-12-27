import { IsInt, IsOptional, IsString, Min } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class CreatePhaseDto {
  @ApiProperty({ description: 'Phase name', example: 'Sprint 1' })
  @IsString()
  name!: string

  @ApiProperty({ description: 'Phase number/order', example: 1, minimum: 1 })
  @IsInt()
  @Min(1)
  phaseNumber!: number

  @ApiProperty({
    required: false,
    description: 'Phase description',
    example: 'Initial development sprint focusing on core features'
  })
  @IsOptional()
  @IsString()
  description?: string
}

