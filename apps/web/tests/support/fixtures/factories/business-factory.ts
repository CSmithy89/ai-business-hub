/**
 * Business Factory - Test Business Creation with Auto-Cleanup
 *
 * Multi-tenant aware factory for HYVVE business testing
 * @see docs/sprint-artifacts/tech-spec-epic-08.md
 */

type BusinessIdeaDescription = {
  problemStatement: string;
  targetCustomer: string;
  proposedSolution: string;
};

type BusinessData = {
  name: string;
  description: string;
  hasDocuments: boolean;
  ideaDescription: BusinessIdeaDescription;
};

type CreatedBusiness = {
  id: string;
  workspaceId: string;
  name: string;
  description: string;
  stage: string;
  onboardingStatus: string;
};

// Simple name generator
const generateBusinessName = () =>
  `Test Business ${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

export class BusinessFactory {
  private createdBusinessIds: string[] = [];
  private apiUrl: string;

  constructor() {
    this.apiUrl = process.env.API_URL || 'http://localhost:3000/api';
  }

  /**
   * Create a business via API (requires authenticated user with active workspace)
   * @param authCookie - Authentication cookie for authenticated user
   * @param overrides - Partial business data to override defaults
   */
  async createBusiness(
    authCookie: string,
    overrides: Partial<BusinessData> = {}
  ): Promise<CreatedBusiness> {
    const businessData: BusinessData = {
      name: overrides.name || generateBusinessName(),
      description:
        overrides.description ||
        'A test business created for E2E testing purposes with sufficient description length.',
      hasDocuments: overrides.hasDocuments ?? false,
      ideaDescription: overrides.ideaDescription || {
        problemStatement: 'Test problem statement for E2E testing that meets minimum length.',
        targetCustomer: 'Test target customers for E2E testing.',
        proposedSolution: 'Test proposed solution for E2E testing that meets minimum length.',
      },
    };

    const response = await fetch(`${this.apiUrl}/businesses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: authCookie,
      },
      body: JSON.stringify(businessData),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create business: ${response.status} ${error}`);
    }

    const result = await response.json();
    const createdBusiness: CreatedBusiness = {
      id: result.data?.id || result.id,
      workspaceId: result.data?.workspaceId || '',
      name: businessData.name,
      description: businessData.description,
      stage: result.data?.stage || 'IDEA',
      onboardingStatus: result.data?.onboardingStatus || 'VALIDATION',
    };

    this.createdBusinessIds.push(createdBusiness.id);
    return createdBusiness;
  }

  /**
   * Create a business with documents (wizard flow)
   */
  async createBusinessWithDocuments(
    authCookie: string,
    overrides: Partial<BusinessData> = {}
  ): Promise<CreatedBusiness> {
    return this.createBusiness(authCookie, { ...overrides, hasDocuments: true });
  }

  /**
   * Get all businesses for the current workspace
   */
  async listBusinesses(authCookie: string): Promise<CreatedBusiness[]> {
    const response = await fetch(`${this.apiUrl}/businesses`, {
      method: 'GET',
      headers: {
        Cookie: authCookie,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to list businesses: ${response.status}`);
    }

    const result = await response.json();
    return result.data || [];
  }

  /**
   * Cleanup all created businesses
   * Called automatically by fixture teardown
   */
  async cleanup(): Promise<void> {
    for (const businessId of this.createdBusinessIds) {
      try {
        await fetch(`${this.apiUrl}/test/delete-business/${businessId}`, {
          method: 'DELETE',
        });
      } catch (error) {
        console.warn(`Failed to cleanup business ${businessId}:`, error);
      }
    }
    this.createdBusinessIds = [];
  }
}
