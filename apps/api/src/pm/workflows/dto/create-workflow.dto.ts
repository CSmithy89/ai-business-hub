import { IsString, IsOptional, IsEnum, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export enum WorkflowTriggerType {
  TASK_CREATED = 'TASK_CREATED',
  TASK_STATUS_CHANGED = 'TASK_STATUS_CHANGED',
  TASK_ASSIGNED = 'TASK_ASSIGNED',
  DUE_DATE_APPROACHING = 'DUE_DATE_APPROACHING',
  TASK_COMPLETED = 'TASK_COMPLETED',
  CUSTOM_SCHEDULE = 'CUSTOM_SCHEDULE',
  MANUAL = 'MANUAL',
}

export class WorkflowDefinitionDto {
  @ApiProperty({
    type: 'array',
    items: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        type: { type: 'string' },
        position: { type: 'object', properties: { x: { type: 'number' }, y: { type: 'number' } } },
        data: { type: 'object', additionalProperties: true },
      },
    },
  })
  nodes!: Array<{
    id: string;
    type: string;
    position: { x: number; y: number };
    data: Record<string, any>;
  }>;

  @ApiProperty({
    type: 'array',
    items: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        source: { type: 'string' },
        target: { type: 'string' },
        label: { type: 'string' },
      },
    },
  })
  edges!: Array<{
    id: string;
    source: string;
    target: string;
    label?: string;
  }>;

  @ApiProperty({ type: 'array', items: { type: 'object', additionalProperties: true } })
  triggers!: Array<Record<string, any>>;

  @ApiProperty({ type: 'object', additionalProperties: true })
  variables!: Record<string, any>;
}

export class CreateWorkflowDto {
  @IsOptional()
  @IsString()
  workspaceId?: string; // TenantGuard extracts from session

  @IsString()
  projectId!: string;

  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsObject()
  @ValidateNested()
  @Type(() => WorkflowDefinitionDto)
  definition!: WorkflowDefinitionDto;

  @IsEnum(WorkflowTriggerType)
  triggerType!: WorkflowTriggerType;

  @IsObject()
  triggerConfig!: Record<string, any>;
}
