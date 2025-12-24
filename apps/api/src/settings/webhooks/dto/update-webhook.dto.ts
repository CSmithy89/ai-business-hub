import { IsString, IsArray, IsOptional, IsUrl, IsBoolean, MinLength } from 'class-validator'

export class UpdateWebhookDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string

  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  @IsUrl()
  url?: string

  @IsOptional()
  @IsString()
  @MinLength(16)
  secret?: string

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  events?: string[]

  @IsOptional()
  @IsBoolean()
  enabled?: boolean
}
