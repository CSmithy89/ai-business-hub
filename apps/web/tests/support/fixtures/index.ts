/**
 * HYVVE Test Fixtures - Composable Test Infrastructure
 *
 * Pattern: Pure function -> Fixture -> mergeTests composition
 * @see .bmad/bmm/testarch/knowledge/fixture-architecture.md
 * @see docs/modules/bm-dm/stories/dm-09-3-e2e-infrastructure.md
 */
import { test as base, mergeTests } from '@playwright/test';
import { UserFactory } from './factories/user-factory';
import { WorkspaceFactory } from './factories/workspace-factory';
import { BusinessFactory } from './factories/business-factory';
import { ProjectFactory } from './factories/project-factory';
import { SuggestionFactory } from './factories/suggestion-factory';
import { DashboardPage, ApprovalPage } from '../pages';

// Auth fixture type definition
type AuthFixture = {
  loginAs: (email: string, password: string) => Promise<void>;
  loginAsTestUser: () => Promise<{ email: string; password: string }>;
  createAndLoginUser: () => Promise<{ email: string; password: string }>;
  logout: () => Promise<void>;
};

// Auth fixture - handles authentication flows
const authFixture = base.extend<{ auth: AuthFixture }>({
  auth: async ({ page }, use) => {
    const loginAs = async (email: string, password: string) => {
      await page.goto('/sign-in');
      await page.fill('[data-testid="email-input"]', email);
      await page.fill('[data-testid="password-input"]', password);
      await page.click('[data-testid="sign-in-button"]');
      // Wait for redirect after sign-in - could be businesses, onboarding, or dashboard
      await page.waitForURL(/\/(businesses|dashboard|onboarding)/);
    };

    const createAndLoginUser = async () => {
      const factory = new UserFactory();
      const user = await factory.createVerifiedUser();

      await loginAs(user.email, user.password);
      return { email: user.email, password: user.password };
    };

    const loginAsTestUser = async () => {
      // Try env vars first, fall back to creating a user
      const email = process.env.TEST_USER_EMAIL;
      const password = process.env.TEST_USER_PASSWORD;

      if (email && password) {
        try {
          await loginAs(email, password);
          return { email, password };
        } catch {
          // Fall back to creating a new user
          console.warn('Failed to login with env test user, creating new user');
        }
      }

      return createAndLoginUser();
    };

    const logout = async () => {
      await page.click('[data-testid="user-menu"]');
      await page.click('[data-testid="sign-out-button"]');
      await page.waitForURL('/sign-in');
    };

    await use({ loginAs, loginAsTestUser, createAndLoginUser, logout });
  },
});

// User factory fixture - creates test users with auto-cleanup
const userFactoryFixture = base.extend<{ userFactory: UserFactory }>({
  userFactory: async ({}, use) => {
    const factory = new UserFactory();
    await use(factory);
    await factory.cleanup();
  },
});

// Workspace factory fixture - creates test workspaces with auto-cleanup
const workspaceFactoryFixture = base.extend<{ workspaceFactory: WorkspaceFactory }>({
  workspaceFactory: async ({}, use) => {
    const factory = new WorkspaceFactory();
    await use(factory);
    await factory.cleanup();
  },
});

// Business factory fixture - creates test businesses with auto-cleanup
const businessFactoryFixture = base.extend<{ businessFactory: BusinessFactory }>({
  businessFactory: async ({}, use) => {
    const factory = new BusinessFactory();
    await use(factory);
    await factory.cleanup();
  },
});

// Project factory fixture - creates test PM projects with auto-cleanup
const projectFactoryFixture = base.extend<{ projectFactory: ProjectFactory }>({
  projectFactory: async ({}, use) => {
    const factory = new ProjectFactory();
    await use(factory);
    await factory.cleanup();
  },
});

// Suggestion factory fixture - creates test agent suggestions with auto-cleanup
const suggestionFactoryFixture = base.extend<{ suggestionFactory: SuggestionFactory }>({
  suggestionFactory: async ({}, use) => {
    const factory = new SuggestionFactory();
    await use(factory);
    await factory.cleanup();
  },
});

// Page object fixtures - provides page objects for common pages
// DM-09.3: E2E Test Infrastructure Setup
interface PageObjectFixtures {
  /** DashboardPage object for dashboard interactions */
  dashboardPage: DashboardPage;
  /** ApprovalPage object for approval queue interactions */
  approvalPage: ApprovalPage;
  /** Navigate to dashboard and return page object */
  gotoDashboard: () => Promise<DashboardPage>;
  /** Navigate to approvals and return page object */
  gotoApprovals: () => Promise<ApprovalPage>;
}

const pageObjectFixture = base.extend<PageObjectFixtures>({
  dashboardPage: async ({ page }, use) => {
    const dashboard = new DashboardPage(page);
    await use(dashboard);
  },

  approvalPage: async ({ page }, use) => {
    const approval = new ApprovalPage(page);
    await use(approval);
  },

  gotoDashboard: async ({ page }, use) => {
    const navigate = async (): Promise<DashboardPage> => {
      const dashboard = new DashboardPage(page);
      await dashboard.goto();
      return dashboard;
    };
    await use(navigate);
  },

  gotoApprovals: async ({ page }, use) => {
    const navigate = async (): Promise<ApprovalPage> => {
      const approval = new ApprovalPage(page);
      await approval.goto();
      return approval;
    };
    await use(navigate);
  },
});

// Merged test export - compose all fixtures
export const test = mergeTests(
  base,
  authFixture,
  userFactoryFixture,
  workspaceFactoryFixture,
  businessFactoryFixture,
  projectFactoryFixture,
  suggestionFactoryFixture,
  pageObjectFixture
);

// Re-export expect for convenience
export { expect } from '@playwright/test';

// Re-export page objects for direct use
export { DashboardPage, ApprovalPage } from '../pages';
export { BasePage } from '../pages/base.page';

// Re-export API mock utilities
export {
  mockDashboardWidgets,
  mockApprovals,
  mockAgentHealth,
  mockError,
  mockNetworkFailure,
  mockSlowNetwork,
} from './api-mock.fixture';

// Re-export dashboard fixture helpers
export {
  waitForDashboardReady,
  verifyDashboardStructure,
  waitForWidgets,
  testQuickAction,
  waitForApprovalsReady,
  testApprovalCardExpansion,
  testApprovalFilter,
  scenarioDashboardLoads,
  scenarioDashboardOffline,
  scenarioApprovalBulkOperations,
} from './dashboard.fixture';
