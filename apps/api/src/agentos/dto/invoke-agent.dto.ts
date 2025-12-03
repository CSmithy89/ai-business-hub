import { IsString, IsObject, IsOptional } from 'class-validator';

/**
 * DTO for invoking an agent
 *
 * Represents the request payload to invoke an agent in AgentOS.
 */
export class InvokeAgentDto {
  /**
   * Message or instruction for the agent
   */
  @IsString()
  message!: string;

  /**
   * Additional parameters for the agent
   */
  @IsObject()
  @IsOptional()
  params?: Record<string, any>;

  /**
   * User ID making the request (for audit logging)
   */
  @IsString()
  @IsOptional()
  userId?: string;

  /**
   * Session ID for continuing a conversation (optional)
   */
  @IsString()
  @IsOptional()
  sessionId?: string;

  /**
   * Whether to stream the response (default: false)
   */
  @IsOptional()
  stream?: boolean;
}

/**
 * Metadata for agent invocation
 */
export class AgentInvocationMetadata {
  /**
   * Workspace/tenant ID
   */
  @IsString()
  workspaceId!: string;

  /**
   * User ID making the request
   */
  @IsString()
  userId!: string;

  /**
   * Correlation ID for tracking across services
   */
  @IsString()
  @IsOptional()
  correlationId?: string;

  /**
   * JWT token for authentication
   */
  @IsString()
  @IsOptional()
  token?: string;
}
