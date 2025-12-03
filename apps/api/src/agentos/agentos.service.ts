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
import { Observable, throwError, timer, firstValueFrom } from 'rxjs';
import { catchError, map, retry, timeout, switchMap } from 'rxjs/operators';
import { AxiosError, AxiosResponse } from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { InvokeAgentDto } from './dto/invoke-agent.dto';
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

  // Circuit breaker state
  private circuitState: 'closed' | 'open' | 'half-open' = 'closed';
  private failureCount = 0;
  private readonly failureThreshold = 5;
  private lastFailureTime: number | null = null;
  private readonly circuitResetTimeMs = 30000; // 30 seconds

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
   * Check if AgentOS is healthy and reachable
   *
   * @returns Health status object
   */
  async checkHealth(): Promise<{
    healthy: boolean;
    status: string;
    circuitState: string;
    responseTimeMs: number;
  }> {
    const startTime = Date.now();

    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/health`, { timeout: 5000 }),
      );

      const responseTimeMs = Date.now() - startTime;

      // Reset circuit breaker on successful health check
      if (this.circuitState === 'half-open') {
        this.resetCircuit();
      }

      return {
        healthy: true,
        status: response?.data?.status || 'ok',
        circuitState: this.circuitState,
        responseTimeMs,
      };
    } catch (error) {
      const responseTimeMs = Date.now() - startTime;

      return {
        healthy: false,
        status: error instanceof Error ? error.message : 'unreachable',
        circuitState: this.circuitState,
        responseTimeMs,
      };
    }
  }

  /**
   * Check circuit breaker state before making requests
   * @throws ServiceUnavailableException if circuit is open
   */
  private checkCircuitBreaker(): void {
    if (this.circuitState === 'open') {
      // Check if enough time has passed to try again
      if (
        this.lastFailureTime &&
        Date.now() - this.lastFailureTime > this.circuitResetTimeMs
      ) {
        this.circuitState = 'half-open';
        this.logger.log('Circuit breaker transitioning to half-open state');
      } else {
        const resetInSeconds = Math.ceil(
          (this.circuitResetTimeMs - (Date.now() - this.lastFailureTime!)) /
            1000,
        );
        throw new ServiceUnavailableException(
          'AgentOS circuit breaker is open',
          `Service temporarily unavailable. Retry after ${resetInSeconds} seconds.`,
        );
      }
    }
  }

  /**
   * Record a successful request
   */
  private recordSuccess(): void {
    if (this.circuitState === 'half-open') {
      this.resetCircuit();
    }
    this.failureCount = 0;
  }

  /**
   * Record a failed request and potentially open the circuit
   */
  private recordFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.failureThreshold) {
      this.circuitState = 'open';
      this.logger.warn(
        `Circuit breaker opened after ${this.failureCount} failures`,
      );
    }
  }

  /**
   * Reset the circuit breaker to closed state
   */
  private resetCircuit(): void {
    this.circuitState = 'closed';
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.logger.log('Circuit breaker reset to closed state');
  }

  /**
   * Get circuit breaker status for monitoring/metrics
   *
   * @returns Current circuit breaker state and metrics
   */
  getCircuitStatus(): {
    state: 'closed' | 'open' | 'half-open';
    failureCount: number;
    lastFailureTime: number | null;
    failureThreshold: number;
    resetTimeMs: number;
  } {
    return {
      state: this.circuitState,
      failureCount: this.failureCount,
      lastFailureTime: this.lastFailureTime,
      failureThreshold: this.failureThreshold,
      resetTimeMs: this.circuitResetTimeMs,
    };
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

    // Check circuit breaker before making request
    this.checkCircuitBreaker();

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
      const response = await firstValueFrom(
        this.httpService
          .post<AgentRunResponse>(url, payload, { headers })
          .pipe(
            timeout(this.timeoutMs),
            retry({
              count: this.retryAttempts,
              delay: (error, retryCount) => {
                if (this.shouldRetry(error)) {
                  const delayMs = Math.min(
                    Math.pow(2, retryCount - 1) * 1000,
                    10000,
                  ); // 1s, 2s, 4s, max 10s
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
          ),
      );

      if (!response) {
        throw new Error('No response received from agent');
      }

      const duration = Date.now() - startTime;
      this.logger.log(
        `Agent invoked successfully: runId=${response.runId}, duration=${duration}ms, correlationId=${correlationId}`,
      );

      // Record success for circuit breaker
      this.recordSuccess();

      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(
        `Agent invocation failed: agentId=${agentId}, duration=${duration}ms, correlationId=${correlationId}, error=${error instanceof Error ? error.message : String(error)}`,
      );

      // Record failure for circuit breaker
      this.recordFailure();

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

    // Check circuit breaker before making request
    this.checkCircuitBreaker();

    const headers = this.buildHeaders(workspaceId, token, correlationId);
    const url = `${this.baseUrl}/agents/${agentId}/runs/${runId}`;

    try {
      const response = await firstValueFrom(
        this.httpService.get<AgentRunResponse>(url, { headers }).pipe(
          timeout(this.timeoutMs),
          retry({
            count: this.retryAttempts,
            delay: (error, retryCount) => {
              if (this.shouldRetry(error)) {
                const delayMs = Math.min(
                  Math.pow(2, retryCount - 1) * 1000,
                  10000,
                ); // max 10s
                return timer(delayMs);
              }
              throw error;
            },
          }),
          map((res) => res.data),
          catchError((error) => {
            return throwError(() => this.handleError(error, correlationId));
          }),
        ),
      );

      this.logger.log(
        `Agent run retrieved: runId=${runId}, status=${response.status}, correlationId=${correlationId}`,
      );

      // Record success for circuit breaker
      this.recordSuccess();

      return response;
    } catch (error) {
      this.logger.error(
        `Failed to get agent run: runId=${runId}, correlationId=${correlationId}, error=${error instanceof Error ? error.message : String(error)}`,
      );

      // Record failure for circuit breaker
      this.recordFailure();

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

    // Check circuit breaker before making request
    this.checkCircuitBreaker();

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
                      `Failed to parse SSE event: ${error instanceof Error ? error.message : String(error)}`,
                    );
                  }
                }
              }
            });

            stream.on('end', () => {
              this.logger.log(
                `Stream ended: runId=${runId}, correlationId=${correlationId}`,
              );
              this.recordSuccess();
              observer.complete();
            });

            stream.on('error', (error: Error) => {
              this.logger.error(
                `Stream error: runId=${runId}, correlationId=${correlationId}, error=${error.message}`,
              );
              this.recordFailure();
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
          this.recordFailure();
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
