/**
 * Suggestion Factory - Test Suggestion Creation with Auto-Cleanup
 *
 * Factory for creating PM agent suggestions for E2E testing
 * @see docs/modules/bm-pm/stories/pm-12-4-integration-e2e-tests.md
 */

type SuggestionType =
  | 'TASK_COMPLETE'
  | 'PRIORITY_CHANGE'
  | 'DUE_DATE_CHANGE'
  | 'ASSIGNMENT'
  | 'PHASE_MOVE'
  | 'BLOCKER_ALERT';

type SuggestionData = {
  type: SuggestionType;
  title?: string;
  description?: string;
  confidence?: number;
  payload?: Record<string, unknown>;
  expiresInHours?: number;
  agentName?: string;
};

type CreatedSuggestion = {
  id: string;
  projectId: string;
  type: SuggestionType;
  title: string;
  description: string;
  confidence: number;
  status: string;
  agentName: string;
  expiresAt: string;
};

export class SuggestionFactory {
  private createdSuggestionIds: string[] = [];
  private apiUrl: string;

  constructor() {
    this.apiUrl = process.env.API_URL || 'http://localhost:3000/api';
  }

  /**
   * Create a pending suggestion via API
   * @param authCookie - Authentication cookie for authenticated user
   * @param projectId - Project ID to create suggestion for
   * @param overrides - Partial suggestion data to override defaults
   */
  async createPendingSuggestion(
    authCookie: string,
    projectId: string,
    overrides: Partial<SuggestionData> = {}
  ): Promise<CreatedSuggestion> {
    const suggestionType = overrides.type || 'TASK_COMPLETE';
    const expiresInHours = overrides.expiresInHours ?? 24;
    const expiresAt = new Date(
      Date.now() + expiresInHours * 60 * 60 * 1000
    ).toISOString();

    const suggestionData = {
      projectId,
      type: suggestionType,
      title:
        overrides.title || this.getDefaultTitle(suggestionType),
      description:
        overrides.description || this.getDefaultDescription(suggestionType),
      confidence: overrides.confidence ?? 0.85,
      payload: overrides.payload || {},
      expiresAt,
      agentName: overrides.agentName || this.getDefaultAgent(suggestionType),
      status: 'PENDING',
    };

    const response = await fetch(
      `${this.apiUrl}/test/create-suggestion`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: authCookie,
        },
        body: JSON.stringify(suggestionData),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create suggestion: ${response.status} ${error}`);
    }

    const result = await response.json();
    const createdSuggestion: CreatedSuggestion = {
      id: result.data?.id || result.id,
      projectId,
      type: suggestionType,
      title: suggestionData.title,
      description: suggestionData.description,
      confidence: suggestionData.confidence,
      status: 'PENDING',
      agentName: suggestionData.agentName,
      expiresAt,
    };

    this.createdSuggestionIds.push(createdSuggestion.id);
    return createdSuggestion;
  }

  /**
   * Create an expired suggestion (for testing expired handling)
   * @param authCookie - Authentication cookie
   * @param projectId - Project ID
   */
  async createExpiredSuggestion(
    authCookie: string,
    projectId: string
  ): Promise<CreatedSuggestion> {
    return this.createPendingSuggestion(authCookie, projectId, {
      expiresInHours: -1, // Already expired
      title: 'Expired Suggestion',
      description: 'This suggestion has already expired',
    });
  }

  /**
   * Create a high-confidence suggestion
   * @param authCookie - Authentication cookie
   * @param projectId - Project ID
   */
  async createHighConfidenceSuggestion(
    authCookie: string,
    projectId: string
  ): Promise<CreatedSuggestion> {
    return this.createPendingSuggestion(authCookie, projectId, {
      confidence: 0.95,
      title: 'High Confidence Suggestion',
      description:
        'This suggestion has very high confidence and should be auto-executed',
    });
  }

  /**
   * Create a low-confidence suggestion (requires full review)
   * @param authCookie - Authentication cookie
   * @param projectId - Project ID
   */
  async createLowConfidenceSuggestion(
    authCookie: string,
    projectId: string
  ): Promise<CreatedSuggestion> {
    return this.createPendingSuggestion(authCookie, projectId, {
      confidence: 0.45,
      title: 'Low Confidence Suggestion',
      description:
        'This suggestion requires full review due to low confidence',
    });
  }

  /**
   * Create multiple suggestions for testing lists
   * @param authCookie - Authentication cookie
   * @param projectId - Project ID
   * @param count - Number of suggestions to create
   */
  async createMultipleSuggestions(
    authCookie: string,
    projectId: string,
    count: number = 5
  ): Promise<CreatedSuggestion[]> {
    const suggestions: CreatedSuggestion[] = [];
    const types: SuggestionType[] = [
      'TASK_COMPLETE',
      'PRIORITY_CHANGE',
      'DUE_DATE_CHANGE',
      'ASSIGNMENT',
      'BLOCKER_ALERT',
    ];

    for (let i = 0; i < count; i++) {
      const suggestion = await this.createPendingSuggestion(
        authCookie,
        projectId,
        {
          type: types[i % types.length],
          title: `Suggestion ${i + 1}`,
          confidence: 0.6 + Math.random() * 0.35, // 0.60 - 0.95
        }
      );
      suggestions.push(suggestion);
    }

    return suggestions;
  }

  /**
   * Get default title based on suggestion type
   */
  private getDefaultTitle(type: SuggestionType): string {
    const titles: Record<SuggestionType, string> = {
      TASK_COMPLETE: 'Mark task as complete',
      PRIORITY_CHANGE: 'Increase task priority',
      DUE_DATE_CHANGE: 'Adjust due date',
      ASSIGNMENT: 'Reassign task',
      PHASE_MOVE: 'Move task to next phase',
      BLOCKER_ALERT: 'Blocker detected',
    };
    return titles[type];
  }

  /**
   * Get default description based on suggestion type
   */
  private getDefaultDescription(type: SuggestionType): string {
    const descriptions: Record<SuggestionType, string> = {
      TASK_COMPLETE:
        'This task appears to be complete based on recent activity and comments.',
      PRIORITY_CHANGE:
        'This task is blocking other work and should be prioritized.',
      DUE_DATE_CHANGE:
        'The current due date may not be achievable given the remaining work.',
      ASSIGNMENT:
        'Consider reassigning this task to balance team workload.',
      PHASE_MOVE:
        'This task is ready to move to the next phase of development.',
      BLOCKER_ALERT:
        'A potential blocker has been detected that may impact delivery.',
    };
    return descriptions[type];
  }

  /**
   * Get default agent based on suggestion type
   */
  private getDefaultAgent(type: SuggestionType): string {
    const agents: Record<SuggestionType, string> = {
      TASK_COMPLETE: 'navi',
      PRIORITY_CHANGE: 'scope',
      DUE_DATE_CHANGE: 'chrono',
      ASSIGNMENT: 'scope',
      PHASE_MOVE: 'navi',
      BLOCKER_ALERT: 'pulse',
    };
    return agents[type];
  }

  /**
   * List suggestions for a project
   */
  async listSuggestions(
    authCookie: string,
    projectId: string
  ): Promise<CreatedSuggestion[]> {
    const response = await fetch(
      `${this.apiUrl}/pm/agents/suggestions?projectId=${projectId}`,
      {
        method: 'GET',
        headers: {
          Cookie: authCookie,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to list suggestions: ${response.status}`);
    }

    const result = await response.json();
    return result.data || [];
  }

  /**
   * Cleanup all created suggestions
   * Called automatically by fixture teardown
   * @param authCookie - Optional authentication cookie for authenticated cleanup
   */
  async cleanup(authCookie?: string): Promise<void> {
    for (const suggestionId of this.createdSuggestionIds) {
      try {
        await fetch(`${this.apiUrl}/test/delete-suggestion/${suggestionId}`, {
          method: 'DELETE',
          headers: authCookie ? { Cookie: authCookie } : undefined,
        });
      } catch (error) {
        console.warn(`Failed to cleanup suggestion ${suggestionId}:`, error);
      }
    }
    this.createdSuggestionIds = [];
  }
}
