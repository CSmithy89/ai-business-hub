import {
  Injectable,
  Logger,
  ServiceUnavailableException,
  GatewayTimeoutException,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { Observable, throwError, timer } from 'rxjs';
import { catchError, map, retry, timeout, switchMap } from 'rxjs/operators';
import { AxiosError, AxiosResponse } from 'axios';
import { v4 as uuidv4 } from 'uuid';
import {
  InvokeAgentDto,
  AgentInvocationMetadata,
} from './dto/invoke-agent.dto';
import {
  AgentRunResponse,
  AgentStreamEvent,
  AgentErrorResponse,
} from './dto/agent-response.dto';

/**
 * AgentOSService - HTTP client for communicating with AgentOS (Python FastAPI)
 *
 * Provides methods to:
 * - Invoke agents with parameters
 * - Get agent run status
 * - Stream agent responses (SSE)
 *
 * Features:
 * - Automatic retry with exponential backoff
 * - Timeout handling
 * - JWT passthrough for authentication
 * - Correlation ID tracking
 * - Comprehensive error handling
 * - Request/response logging
 */
@Injectable()
export class AgentOSService {
  private readonly logger = new Logger(AgentOSService.name);
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly retryAttempts: number;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.baseUrl = this.configService.get<string>(
      'AGENTOS_URL',
      'http://localhost:7777',
    );
    this.timeoutMs = this.configService.get<number>(
      'AGENTOS_TIMEOUT_MS',
      60000,
    );
    this.retryAttempts = this.configService.get<number>(
      'AGENTOS_RETRY_ATTEMPTS',
      3,
    );

    this.logger.log(
      `AgentOSService initialized: baseUrl=${this.baseUrl}, timeout=${this.timeoutMs}ms, retries=${this.retryAttempts}`,
    );
  }

  /**
   * Invoke an agent with the given parameters
   *
   * @param agentId - Agent identifier (e.g., 'approval')
   * @param params - Agent invocation parameters
   * @param workspaceId - Workspace/tenant ID
   * @param userId - User ID making the request
   * @param token - Optional JWT token for authentication
   * @returns Agent run response with runId and initial status
   */
  async invokeAgent(
    agentId: string,
    params: InvokeAgentDto,
    workspaceId: string,
    userId: string,
    token?: string,
  ): Promise<AgentRunResponse> {
    const correlationId = uuidv4();
    const startTime = Date.now();

    this.logger.log(
      `Invoking agent: agentId=${agentId}, workspaceId=${workspaceId}, userId=${userId}, correlationId=${correlationId}`,
    );

    const headers = this.buildHeaders(workspaceId, token, correlationId);
    const url = `${this.baseUrl}/agents/${agentId}/runs`;

    const payload = {
      ...params,
      userId,
      metadata: {
        workspaceId,
        correlationId,
      },
    };

    try {
      const response = await this.httpService
        .post<AgentRunResponse>(url, payload, { headers })
        .pipe(
          timeout(this.timeoutMs),
          retry({
            count: this.retryAttempts,
            delay: (error, retryCount) => {
              if (this.shouldRetry(error)) {
                const delayMs = Math.pow(2, retryCount - 1) * 1000; // 1s, 2s, 4s
                this.logger.warn(
                  `Retrying agent invocation (attempt ${retryCount}/${this.retryAttempts}) after ${delayMs}ms`,
                );
                return timer(delayMs);
              }
              throw error;
            },
          }),
          map((res) => res.data),
          catchError((error) => {
            return throwError(() => this.handleError(error, correlationId));
          }),
        )
        .toPromise();

      const duration = Date.now() - startTime;
      this.logger.log(
        `Agent invoked successfully: runId=${response.runId}, duration=${duration}ms, correlationId=${correlationId}`,
      );

      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(
        `Agent invocation failed: agentId=${agentId}, duration=${duration}ms, correlationId=${correlationId}, error=${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Get the status and result of an agent run
   *
   * @param agentId - Agent identifier
   * @param runId - Run identifier
   * @param workspaceId - Workspace/tenant ID
   * @param token - Optional JWT token for authentication
   * @returns Current agent run status and response
   */
  async getAgentRun(
    agentId: string,
    runId: string,
    workspaceId: string,
    token?: string,
  ): Promise<AgentRunResponse> {
    const correlationId = uuidv4();

    this.logger.log(
      `Getting agent run: agentId=${agentId}, runId=${runId}, workspaceId=${workspaceId}, correlationId=${correlationId}`,
    );

    const headers = this.buildHeaders(workspaceId, token, correlationId);
    const url = `${this.baseUrl}/agents/${agentId}/runs/${runId}`;

    try {
      const response = await this.httpService
        .get<AgentRunResponse>(url, { headers })
        .pipe(
          timeout(this.timeoutMs),
          retry({
            count: this.retryAttempts,
            delay: (error, retryCount) => {
              if (this.shouldRetry(error)) {
                const delayMs = Math.pow(2, retryCount - 1) * 1000;
                return timer(delayMs);
              }
              throw error;
            },
          }),
          map((res) => res.data),
          catchError((error) => {
            return throwError(() => this.handleError(error, correlationId));
          }),
        )
        .toPromise();

      this.logger.log(
        `Agent run retrieved: runId=${runId}, status=${response.status}, correlationId=${correlationId}`,
      );

      return response;
    } catch (error) {
      this.logger.error(
        `Failed to get agent run: runId=${runId}, correlationId=${correlationId}, error=${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Stream agent response events (SSE)
   *
   * @param agentId - Agent identifier
   * @param runId - Run identifier
   * @param workspaceId - Workspace/tenant ID
   * @param token - Optional JWT token for authentication
   * @returns Observable stream of agent events
   */
  streamAgentResponse(
    agentId: string,
    runId: string,
    workspaceId: string,
    token?: string,
  ): Observable<AgentStreamEvent> {
    const correlationId = uuidv4();

    this.logger.log(
      `Streaming agent response: agentId=${agentId}, runId=${runId}, workspaceId=${workspaceId}, correlationId=${correlationId}`,
    );

    const headers = this.buildHeaders(workspaceId, token, correlationId);
    const url = `${this.baseUrl}/agents/${agentId}/runs/${runId}/stream`;

    return this.httpService
      .get<AgentStreamEvent>(url, {
        headers: {
          ...headers,
          Accept: 'text/event-stream',
        },
        responseType: 'stream',
      })
      .pipe(
        timeout(this.timeoutMs * 2), // Longer timeout for streams
        switchMap((response: AxiosResponse) => {
          return new Observable<AgentStreamEvent>((observer) => {
            const stream = response.data;
            let buffer = '';

            stream.on('data', (chunk: Buffer) => {
              buffer += chunk.toString();
              const lines = buffer.split('\n');
              buffer = lines.pop() || '';

              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  try {
                    const data = JSON.parse(line.slice(6));
                    observer.next(data);

                    if (data.type === 'end' || data.type === 'error') {
                      observer.complete();
                    }
                  } catch (error) {
                    this.logger.error(
                      `Failed to parse SSE event: ${error.message}`,
                    );
                  }
                }
              }
            });

            stream.on('end', () => {
              this.logger.log(
                `Stream ended: runId=${runId}, correlationId=${correlationId}`,
              );
              observer.complete();
            });

            stream.on('error', (error: Error) => {
              this.logger.error(
                `Stream error: runId=${runId}, correlationId=${correlationId}, error=${error.message}`,
              );
              observer.error(
                new InternalServerErrorException(
                  'Stream connection failed',
                  error.message,
                ),
              );
            });
          });
        }),
        catchError((error) => {
          return throwError(() => this.handleError(error, correlationId));
        }),
      );
  }

  /**
   * Build HTTP headers for AgentOS requests
   */
  private buildHeaders(
    workspaceId: string,
    token?: string,
    correlationId?: string,
  ): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-workspace-id': workspaceId,
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    if (correlationId) {
      headers['x-correlation-id'] = correlationId;
    }

    return headers;
  }

  /**
   * Determine if an error should be retried
   */
  private shouldRetry(error: any): boolean {
    // Retry on network errors
    if (!error.response) {
      return true;
    }

    // Retry on 5xx server errors
    const status = error.response?.status;
    if (status >= 500 && status < 600) {
      return true;
    }

    // Retry on 429 (rate limit)
    if (status === 429) {
      return true;
    }

    // Don't retry on 4xx client errors
    return false;
  }

  /**
   * Handle and transform errors into NestJS exceptions
   */
  private handleError(error: any, correlationId: string): Error {
    if (error.name === 'TimeoutError') {
      this.logger.error(
        `Request timeout: correlationId=${correlationId}, timeout=${this.timeoutMs}ms`,
      );
      return new GatewayTimeoutException(
        'AgentOS request timed out',
        `Request exceeded ${this.timeoutMs}ms timeout`,
      );
    }

    const axiosError = error as AxiosError<AgentErrorResponse>;

    // No response - service unavailable
    if (!axiosError.response) {
      this.logger.error(
        `AgentOS unavailable: correlationId=${correlationId}, message=${error.message}`,
      );
      return new ServiceUnavailableException(
        'AgentOS is currently unavailable',
        'Please try again later',
      );
    }

    const { status, data } = axiosError.response;

    // Authentication/authorization errors
    if (status === 401 || status === 403) {
      this.logger.error(
        `Authentication failed: correlationId=${correlationId}, status=${status}`,
      );
      return new UnauthorizedException(
        data?.message || 'Authentication failed',
      );
    }

    // Service unavailable
    if (status === 503) {
      this.logger.error(
        `AgentOS unavailable: correlationId=${correlationId}, status=${status}`,
      );
      return new ServiceUnavailableException(
        data?.message || 'AgentOS is currently unavailable',
      );
    }

    // Gateway timeout
    if (status === 504) {
      this.logger.error(
        `Gateway timeout: correlationId=${correlationId}, status=${status}`,
      );
      return new GatewayTimeoutException(
        data?.message || 'AgentOS request timed out',
      );
    }

    // Generic server error
    this.logger.error(
      `AgentOS error: correlationId=${correlationId}, status=${status}, message=${data?.message}`,
    );
    return new InternalServerErrorException(
      data?.message || 'An error occurred while communicating with AgentOS',
      data?.error,
    );
  }
}
