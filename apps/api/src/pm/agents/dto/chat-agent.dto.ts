import { IsString, IsIn, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChatAgentDto {
  @ApiProperty({
    description: 'Project ID for context',
    example: 'clw123456789',
  })
  @IsString()
  @IsNotEmpty()
  projectId!: string;

  @ApiProperty({
    description: 'Agent name to chat with',
    enum: ['navi', 'sage', 'chrono'],
    example: 'navi',
  })
  @IsString()
  @IsIn(['navi', 'sage', 'chrono'])
  agentName!: 'navi' | 'sage' | 'chrono';

  @ApiProperty({
    description: 'User message to the agent',
    example: 'What tasks are due today?',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  message!: string;
}

export class GetConversationsDto {
  @ApiProperty({
    description: 'Optional agent name filter',
    enum: ['navi', 'sage', 'chrono'],
    required: false,
  })
  @IsString()
  @IsIn(['navi', 'sage', 'chrono'])
  agentName?: 'navi' | 'sage' | 'chrono';

  @ApiProperty({
    description: 'Limit number of results',
    default: 50,
    required: false,
  })
  limit?: number;
}
