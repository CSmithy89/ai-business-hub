import { Type } from 'class-transformer'
import { IsDefined, IsInt, IsNotEmpty, IsString, Matches, Min } from 'class-validator'

export class CreateTaskAttachmentDto {
  @IsDefined()
  @IsString()
  @IsNotEmpty()
  fileName!: string

  @IsDefined()
  @IsString()
  @IsNotEmpty()
  @Matches(/^(https?:\/\/|\/)/, { message: 'fileUrl must be an http(s) URL or an absolute path' })
  fileUrl!: string

  @IsDefined()
  @IsString()
  @IsNotEmpty()
  fileType!: string

  @IsDefined()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  fileSize!: number
}
