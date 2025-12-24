import { IsString, IsArray, IsOptional, IsUrl, MinLength } from 'class-validator'

export class CreateWebhookDto {
  @IsString()
  @MinLength(1)
  name!: string

  @IsOptional()
  @IsString()
  description?: string

  @IsUrl()
  url!: string

  @IsString()
  @MinLength(16)
  secret!: string

  @IsArray()
  @IsString({ each: true })
  events!: string[]
}
