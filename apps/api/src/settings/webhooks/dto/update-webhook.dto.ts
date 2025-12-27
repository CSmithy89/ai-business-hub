import {
  IsString,
  IsArray,
  IsOptional,
  IsUrl,
  IsBoolean,
  MinLength,
  ArrayMinSize,
  IsIn,
} from 'class-validator'
import { WebhookEventType, WEBHOOK_EVENT_TYPE_VALUES } from '@hyvve/shared'

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
  @ArrayMinSize(1)
  @IsIn(WEBHOOK_EVENT_TYPE_VALUES as unknown as string[], { each: true })
  events?: WebhookEventType[]

  @IsOptional()
  @IsBoolean()
  enabled?: boolean
}
