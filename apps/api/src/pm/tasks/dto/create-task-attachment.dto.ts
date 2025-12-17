import { Type } from 'class-transformer'
import { IsInt, IsString, Min } from 'class-validator'

export class CreateTaskAttachmentDto {
  @IsString()
  fileName!: string

  @IsString()
  fileUrl!: string

  @IsString()
  fileType!: string

  @Type(() => Number)
  @IsInt()
  @Min(1)
  fileSize!: number
}

