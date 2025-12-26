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
} from 'class-validator'
import { Type } from 'class-transformer'
import { ApiScope } from '@hyvve/shared'

export class CreateApiKeyDto {
  @IsString()
  @Length(1, 100)
  name!: string

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
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
