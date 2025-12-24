import { TaskStatus } from '@prisma/client'
import { IsEnum } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class TransitionTaskDto {
  @ApiProperty({ description: 'New task status', enum: TaskStatus })
  @IsEnum(TaskStatus)
  status!: TaskStatus
}
