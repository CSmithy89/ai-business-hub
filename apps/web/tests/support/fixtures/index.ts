/**
 * HYVVE Test Fixtures - Composable Test Infrastructure
 *
 * Pattern: Pure function -> Fixture -> mergeTests composition
 * @see .bmad/bmm/testarch/knowledge/fixture-architecture.md
 */
import { test as base, mergeTests } from '@playwright/test';
import { UserFactory } from './factories/user-factory';
import { WorkspaceFactory } from './factories/workspace-factory';

// Auth fixture type definition
type AuthFixture = {
  loginAs: (email: string, password: string) => Promise<void>;
  loginAsTestUser: () => Promise<{ email: string }>;
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
      await page.waitForURL(/\/(dashboard|workspaces)/);
    };

    const loginAsTestUser = async () => {
      const email = process.env.TEST_USER_EMAIL || 'test@example.com';
      await loginAs(email, process.env.TEST_USER_PASSWORD || 'Test1234!');
      return { email };
    };

    const logout = async () => {
      await page.click('[data-testid="user-menu"]');
      await page.click('[data-testid="sign-out-button"]');
      await page.waitForURL('/sign-in');
    };

    await use({ loginAs, loginAsTestUser, logout });
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

// Merged test export - compose all fixtures
export const test = mergeTests(base, authFixture, userFactoryFixture, workspaceFactoryFixture);

// Re-export expect for convenience
export { expect } from '@playwright/test';
