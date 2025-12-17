import { IsInt, IsOptional, IsString, Min } from 'class-validator'

export class CreatePhaseDto {
  @IsString()
  name!: string

  @IsInt()
  @Min(1)
  phaseNumber!: number

  @IsOptional()
  @IsString()
  description?: string
}

