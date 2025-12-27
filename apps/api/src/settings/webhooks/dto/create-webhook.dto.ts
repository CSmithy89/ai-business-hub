import {
  IsString,
  IsArray,
  IsOptional,
  IsUrl,
  MinLength,
  ArrayMinSize,
  IsIn,
} from 'class-validator'
import { WebhookEventType, WEBHOOK_EVENT_TYPE_VALUES } from '@hyvve/shared'

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
  @ArrayMinSize(1)
  @IsIn(WEBHOOK_EVENT_TYPE_VALUES as unknown as string[], { each: true })
  events!: WebhookEventType[]
}
