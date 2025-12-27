export class WebhookResponseDto {
  id!: string
  workspaceId!: string
  name!: string
  description?: string | null
  url!: string
  events!: string[]
  enabled!: boolean
  deliveryCount!: number
  lastDeliveredAt?: Date | null
  failureCount!: number
  createdAt!: Date
  updatedAt!: Date
  createdBy!: string
}

export class WebhookDeliveryResponseDto {
  id!: string
  webhookId!: string
  workspaceId!: string
  eventType!: string
  eventId!: string
  status!: string
  attempts!: number
  maxAttempts!: number
  httpStatus?: number | null
  errorMessage?: string | null
  createdAt!: Date
  nextRetryAt?: Date | null
  deliveredAt?: Date | null
  failedAt?: Date | null
}
