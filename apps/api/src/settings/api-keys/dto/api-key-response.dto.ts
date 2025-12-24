export class ApiKeyResponseDto {
  id!: string
  name!: string
  keyPrefix!: string
  permissions!: {
    scopes: string[]
    rateLimit: number
  }
  lastUsedAt?: Date
  expiresAt?: Date
  createdAt!: Date
  createdBy!: {
    id: string
    name: string | null
    email: string
  }
}
