import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFromTemplateDto {
  @ApiProperty({
    description: 'Template ID to use',
    example: 'task-assignment-on-status',
  })
  @IsString()
  @IsNotEmpty()
  templateId!: string;

  @ApiProperty({
    description: 'Name for the new workflow',
    example: 'My Auto-assignment Workflow',
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({
    description: 'Project ID',
    example: 'proj_123',
  })
  @IsString()
  @IsNotEmpty()
  projectId!: string;

  @ApiProperty({
    description: 'Optional description',
    example: 'Automatically assigns tasks when they move to In Progress',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;
}
