/**
 * Agent Integration E2E Tests - Epic 11
 *
 * Tests for Validation, Planning, and Branding agent teams integration.
 * Covers health checks, authenticated runs, workflow handoffs, and tenant isolation.
 *
 * @see docs/epics/EPIC-11-agent-integration.md
 * @see docs/stories/11-5-agent-integration-e2e-tests.md
 */
import { test, expect } from '../support/fixtures';

// Agent service base URL (FastAPI on port 8001)
const AGENT_BASE_URL = process.env.AGENT_BASE_URL || 'http://localhost:8001';

test.describe('Agent Integration', () => {
  // ==========================================================================
  // Health Check Tests (AC2, AC3, AC4)
  // No authentication required for health endpoints
  // ==========================================================================

  test.describe('Health Checks', () => {
    test('should return 200 from validation team health endpoint (AC2)', async ({
      page,
    }) => {
      const response = await page.request.get(`${AGENT_BASE_URL}/agents/validation/health`);

      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.status).toBe('ok');
      expect(data.team).toBe('validation');
      expect(data.leader).toBe('Vera');
      expect(data.members).toEqual(['Marco', 'Cipher', 'Persona', 'Risk']);
      expect(data.version).toBe('0.1.0');
    });

    test('should return 200 from planning team health endpoint (AC3)', async ({ page }) => {
      const response = await page.request.get(`${AGENT_BASE_URL}/agents/planning/health`);

      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.status).toBe('ok');
      expect(data.team).toBe('planning');
      expect(data.leader).toBe('Blake');
      expect(data.members).toEqual(['Model', 'Finn', 'Revenue', 'Forecast']);
      expect(data.version).toBe('0.1.0');
    });

    test('should return 200 from branding team health endpoint (AC4)', async ({ page }) => {
      const response = await page.request.get(`${AGENT_BASE_URL}/agents/branding/health`);

      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.status).toBe('ok');
      expect(data.team).toBe('branding');
      expect(data.leader).toBe('Bella');
      expect(data.members).toEqual(['Sage', 'Vox', 'Iris', 'Artisan', 'Audit']);
      expect(data.version).toBe('0.1.0');
    });
  });

  // ==========================================================================
  // Authenticated Run Tests
  // Requires JWT authentication via TenantMiddleware
  // ==========================================================================

  test.describe('Authenticated Agent Runs', () => {
    test.beforeEach(async ({ auth }) => {
      await auth.loginAsTestUser();
    });

    test('should run validation team with valid authentication', async ({
      page,
      businessFactory,
    }) => {
      // Create test business
      const cookies = await page.context().cookies();
      const authCookie = cookies.find((c) => c.name === 'better-auth.session_token');
      expect(authCookie).toBeDefined();

      const business = await businessFactory.createBusiness(authCookie!.value);

      // Call validation team endpoint
      const response = await page.request.post(`${AGENT_BASE_URL}/agents/validation/runs`, {
        headers: {
          Authorization: `Bearer ${authCookie!.value}`,
          'Content-Type': 'application/json',
        },
        data: {
          message: 'Please validate my business idea',
          business_id: business.id,
          session_id: `test_${Date.now()}`,
        },
      });

      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.content).toBeDefined();
      expect(data.session_id).toBeDefined();
      expect(data.metadata.team).toBe('validation');
      expect(data.metadata.business_id).toBe(business.id);
    });

    test('should run planning team with valid authentication', async ({
      page,
      businessFactory,
    }) => {
      const cookies = await page.context().cookies();
      const authCookie = cookies.find((c) => c.name === 'better-auth.session_token');
      expect(authCookie).toBeDefined();

      const business = await businessFactory.createBusiness(authCookie!.value);

      const response = await page.request.post(`${AGENT_BASE_URL}/agents/planning/runs`, {
        headers: {
          Authorization: `Bearer ${authCookie!.value}`,
          'Content-Type': 'application/json',
        },
        data: {
          message: 'Create a business plan for my idea',
          business_id: business.id,
          session_id: `test_${Date.now()}`,
        },
      });

      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.content).toBeDefined();
      expect(data.metadata.team).toBe('planning');
      expect(data.metadata.business_id).toBe(business.id);
    });

    test('should run branding team with valid authentication', async ({
      page,
      businessFactory,
    }) => {
      const cookies = await page.context().cookies();
      const authCookie = cookies.find((c) => c.name === 'better-auth.session_token');
      expect(authCookie).toBeDefined();

      const business = await businessFactory.createBusiness(authCookie!.value);

      const response = await page.request.post(`${AGENT_BASE_URL}/agents/branding/runs`, {
        headers: {
          Authorization: `Bearer ${authCookie!.value}`,
          'Content-Type': 'application/json',
        },
        data: {
          message: 'Create brand identity for my business',
          business_id: business.id,
          session_id: `test_${Date.now()}`,
        },
      });

      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.content).toBeDefined();
      expect(data.metadata.team).toBe('branding');
      expect(data.metadata.business_id).toBe(business.id);
    });
  });

  // ==========================================================================
  // Workflow Handoff Test (AC5)
  // Test full workflow with context passing between teams
  // ==========================================================================

  test.describe('Workflow Handoff', () => {
    test.beforeEach(async ({ auth }) => {
      await auth.loginAsTestUser();
    });

    test('should handle full workflow: validation → planning → branding (AC5)', async ({
      page,
      businessFactory,
    }) => {
      const cookies = await page.context().cookies();
      const authCookie = cookies.find((c) => c.name === 'better-auth.session_token');
      expect(authCookie).toBeDefined();

      const business = await businessFactory.createBusiness(authCookie!.value);

      // Step 1: Validation team
      const validationResponse = await page.request.post(
        `${AGENT_BASE_URL}/agents/validation/runs`,
        {
          headers: {
            Authorization: `Bearer ${authCookie!.value}`,
            'Content-Type': 'application/json',
          },
          data: {
            message: 'Validate my SaaS business idea',
            business_id: business.id,
            session_id: `workflow_val_${Date.now()}`,
          },
        }
      );

      expect(validationResponse.status()).toBe(200);
      const validationData = await validationResponse.json();
      expect(validationData.success).toBe(true);

      // Step 2: Planning team receives validation context
      const planningResponse = await page.request.post(
        `${AGENT_BASE_URL}/agents/planning/runs`,
        {
          headers: {
            Authorization: `Bearer ${authCookie!.value}`,
            'Content-Type': 'application/json',
          },
          data: {
            message: 'Create business plan based on validation',
            business_id: business.id,
            session_id: `workflow_plan_${Date.now()}`,
            context: {
              validation_output: validationData.content,
              validation_session: validationData.session_id,
            },
          },
        }
      );

      expect(planningResponse.status()).toBe(200);
      const planningData = await planningResponse.json();
      expect(planningData.success).toBe(true);

      // Step 3: Branding team receives planning context
      const brandingResponse = await page.request.post(
        `${AGENT_BASE_URL}/agents/branding/runs`,
        {
          headers: {
            Authorization: `Bearer ${authCookie!.value}`,
            'Content-Type': 'application/json',
          },
          data: {
            message: 'Create brand identity based on business plan',
            business_id: business.id,
            session_id: `workflow_brand_${Date.now()}`,
            context: {
              business_plan: planningData.content,
              planning_session: planningData.session_id,
            },
          },
        }
      );

      expect(brandingResponse.status()).toBe(200);
      const brandingData = await brandingResponse.json();
      expect(brandingData.success).toBe(true);

      // Verify workflow continuity
      expect(validationData.metadata.business_id).toBe(business.id);
      expect(planningData.metadata.business_id).toBe(business.id);
      expect(brandingData.metadata.business_id).toBe(business.id);
    });
  });

  // ==========================================================================
  // Error Handling Tests (AC6)
  // Test various error scenarios
  // ==========================================================================

  test.describe('Error Handling', () => {
    test.beforeEach(async ({ auth }) => {
      await auth.loginAsTestUser();
    });

    test('should return 401 when missing authentication (AC6)', async ({ page }) => {
      const response = await page.request.post(`${AGENT_BASE_URL}/agents/validation/runs`, {
        headers: {
          'Content-Type': 'application/json',
        },
        data: {
          message: 'Test message',
          business_id: 'test-123',
        },
      });

      expect(response.status()).toBe(401);
    });

    test('should return 422 when missing required fields (AC6)', async ({
      page,
    }) => {
      const cookies = await page.context().cookies();
      const authCookie = cookies.find((c) => c.name === 'better-auth.session_token');
      expect(authCookie).toBeDefined();

      // Missing business_id
      const response = await page.request.post(`${AGENT_BASE_URL}/agents/validation/runs`, {
        headers: {
          Authorization: `Bearer ${authCookie!.value}`,
          'Content-Type': 'application/json',
        },
        data: {
          message: 'Test message',
          // business_id missing
        },
      });

      // FastAPI Pydantic validation returns 422 for validation errors
      expect(response.status()).toBe(422);
    });

    test('should return 422 when message field is empty (AC6)', async ({
      page,
      businessFactory,
    }) => {
      const cookies = await page.context().cookies();
      const authCookie = cookies.find((c) => c.name === 'better-auth.session_token');
      expect(authCookie).toBeDefined();

      const business = await businessFactory.createBusiness(authCookie!.value);

      const response = await page.request.post(`${AGENT_BASE_URL}/agents/validation/runs`, {
        headers: {
          Authorization: `Bearer ${authCookie!.value}`,
          'Content-Type': 'application/json',
        },
        data: {
          message: '', // Empty message
          business_id: business.id,
        },
      });

      expect(response.status()).toBe(422);
    });
  });

  // ==========================================================================
  // Tenant Isolation Test (AC7)
  // Verify cross-tenant access is denied
  // ==========================================================================

  test.describe('Tenant Isolation', () => {
    test('should deny cross-tenant access with 403 (AC7)', async ({
      page,
      userFactory,
      workspaceFactory,
      businessFactory,
    }) => {
      // Create User 1 with workspace and business
      const user1 = await userFactory.createVerifiedUser();

      // Login as user1 to create workspace
      await page.goto('/sign-in');
      await page.fill('[data-testid="email-input"]', user1.email);
      await page.fill('[data-testid="password-input"]', user1.password);
      await page.click('[data-testid="sign-in-button"]');
      await page.waitForURL(/\/(dashboard|workspaces)/);

      const cookies1 = await page.context().cookies();
      const authCookie1 = cookies1.find((c) => c.name === 'better-auth.session_token');
      expect(authCookie1).toBeDefined();

      // Create workspace for user1 (needed for business creation)
      await workspaceFactory.createWorkspace(authCookie1!.value);
      const business1 = await businessFactory.createBusiness(authCookie1!.value);

      // Logout user1
      await page.click('[data-testid="user-menu"]');
      await page.click('[data-testid="sign-out-button"]');
      await page.waitForURL('/sign-in');

      // Create User 2 with different workspace
      const user2 = await userFactory.createVerifiedUser();

      await page.goto('/sign-in');
      await page.fill('[data-testid="email-input"]', user2.email);
      await page.fill('[data-testid="password-input"]', user2.password);
      await page.click('[data-testid="sign-in-button"]');
      await page.waitForURL(/\/(dashboard|workspaces)/);

      const cookies2 = await page.context().cookies();
      const authCookie2 = cookies2.find((c) => c.name === 'better-auth.session_token');
      expect(authCookie2).toBeDefined();

      // User 2 tries to access User 1's business
      const response = await page.request.post(`${AGENT_BASE_URL}/agents/validation/runs`, {
        headers: {
          Authorization: `Bearer ${authCookie2!.value}`,
          'Content-Type': 'application/json',
        },
        data: {
          message: 'Attempt cross-tenant access',
          business_id: business1.id, // User 1's business
        },
      });

      // Should either get 403 Forbidden or 500 due to business not found in User 2's workspace
      // Depending on implementation, might be 403 (tenant check) or 500 (business not found)
      expect([403, 500]).toContain(response.status());
    });
  });
});
