import { IsNotEmpty, IsString } from 'class-validator'

export class KbSummaryDto {
  @IsString()
  @IsNotEmpty()
  pageId!: string
}
