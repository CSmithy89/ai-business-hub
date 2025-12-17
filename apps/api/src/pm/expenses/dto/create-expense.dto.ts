import { Type } from 'class-transformer'
import { IsDate, IsNumber, IsOptional, IsString, Min } from 'class-validator'

export class CreateExpenseDto {
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  amount!: number

  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  spentAt?: Date
}

