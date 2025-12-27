import {
  IsString,
  IsArray,
  IsOptional,
  IsDate,
  IsNumber,
  Min,
  Max,
  Length,
  ArrayMinSize,
  MinDate,
  IsIn,
} from 'class-validator'
import { Type } from 'class-transformer'
import { ApiScope, API_SCOPE_VALUES } from '@hyvve/shared'

export class CreateApiKeyDto {
  @IsString()
  @Length(1, 100)
  name!: string

  @IsArray()
  @ArrayMinSize(1)
  @IsIn(API_SCOPE_VALUES as unknown as string[], { each: true })
  scopes!: ApiScope[]

  @IsOptional()
  @IsDate()
  @MinDate(() => new Date(), { message: 'expiresAt must be in the future' })
  @Type(() => Date)
  expiresAt?: Date

  @IsOptional()
  @IsNumber()
  @Min(100)
  @Max(100000)
  rateLimit?: number
}
