import { ApiProperty } from '@nestjs/swagger'

export class PaginationMeta {
  @ApiProperty({ description: 'Total number of items' })
  total!: number

  @ApiProperty({ description: 'Number of items per page' })
  limit!: number

  @ApiProperty({ description: 'Number of items skipped' })
  offset!: number
}

export class PaginatedResponse<T> {
  @ApiProperty({ description: 'Array of data items', isArray: true })
  data: T[]

  @ApiProperty({ description: 'Pagination metadata', type: PaginationMeta })
  pagination: PaginationMeta

  constructor(data: T[], total: number, limit: number, offset: number) {
    this.data = data
    this.pagination = {
      total,
      limit,
      offset,
    }
  }
}
