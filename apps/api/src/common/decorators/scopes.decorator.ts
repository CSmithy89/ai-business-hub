import { SetMetadata } from '@nestjs/common'
import { ApiScope } from '@hyvve/shared'

export const SCOPES_KEY = 'scopes'
export const Scopes = (...scopes: ApiScope[]) => SetMetadata(SCOPES_KEY, scopes)
