import { IsIn } from 'class-validator'

export class VerifyPageDto {
  @IsIn(['30d', '60d', '90d', 'never'], {
    message: 'expiresIn must be one of: 30d, 60d, 90d, never',
  })
  expiresIn!: '30d' | '60d' | '90d' | 'never'
}
