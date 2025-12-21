import { IsOptional, IsString, MaxLength, Validate } from 'class-validator'
import { TiptapContentValidator } from '../../pages/validators/tiptap-content.validator'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TiptapContent = any

export class CreateTemplateDto {
  @IsString()
  @MaxLength(200, { message: 'Title must not exceed 200 characters' })
  title!: string

  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Category must not exceed 100 characters' })
  category?: string

  @Validate(TiptapContentValidator)
  content!: TiptapContent
}
