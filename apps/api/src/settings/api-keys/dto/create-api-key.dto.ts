import {
  IsString,
  IsArray,
  IsOptional,
  IsDate,
  IsNumber,
  Min,
  Max,
} from 'class-validator'
import { Type } from 'class-transformer'
import { ApiScope } from '@hyvve/shared'

export class CreateApiKeyDto {
  @IsString()
  name!: string

  @IsArray()
  @IsString({ each: true })
  scopes!: ApiScope[]

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  expiresAt?: Date

  @IsOptional()
  @IsNumber()
  @Min(100)
  @Max(100000)
  rateLimit?: number
}
