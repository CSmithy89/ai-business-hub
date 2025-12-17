import { IsOptional, IsString, Matches, MinLength } from 'class-validator'

export class UpsertTaskLabelDto {
  @IsString()
  @MinLength(1)
  name!: string

  @IsOptional()
  @IsString()
  @Matches(/^#[0-9a-fA-F]{6}$/, { message: 'color must be a hex value like #6B7280' })
  color?: string
}

