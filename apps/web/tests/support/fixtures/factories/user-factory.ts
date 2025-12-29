/**
 * User Factory - Test Data Creation with Auto-Cleanup
 *
 * Pattern: Factories with overrides + auto-cleanup
 * @see .bmad/bmm/testarch/knowledge/data-factories.md
 */

type UserData = {
  email: string;
  name: string;
  password: string;
};

type CreatedUser = UserData & {
  id: string;
};

// Simple faker-like utilities (avoiding external dependency)
const generateEmail = () => `test-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
const generateName = () => `Test User ${Math.random().toString(36).slice(2, 8)}`;
const generatePassword = () => `TestPass${Math.random().toString(36).slice(2)}!`;

export class UserFactory {
  private createdUserIds: string[] = [];
  private apiUrl: string;

  constructor() {
    this.apiUrl = process.env.API_URL || 'http://localhost:3000/api';
  }

  /**
   * Create a user via API
   * @param overrides - Partial user data to override defaults
   * @returns Created user with ID
   */
  async createUser(overrides: Partial<UserData> = {}): Promise<CreatedUser> {
    const userData: UserData = {
      email: overrides.email || generateEmail(),
      name: overrides.name || generateName(),
      password: overrides.password || generatePassword(),
    };

    const response = await fetch(`${this.apiUrl}/auth/sign-up/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create user: ${response.status} ${error}`);
    }

    const result = await response.json();
    const createdUser: CreatedUser = {
      ...userData,
      id: result.user?.id || result.id,
    };

    this.createdUserIds.push(createdUser.id);
    return createdUser;
  }

  /**
   * Create a verified user (email already verified)
   */
  async createVerifiedUser(overrides: Partial<UserData> = {}): Promise<CreatedUser> {
    const user = await this.createUser(overrides);

    // In test environment, auto-verify via test API endpoint
    const verifyResponse = await fetch(`${this.apiUrl}/test/verify-user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, email: user.email }),
    });

    if (!verifyResponse.ok) {
      console.warn('Failed to verify user via API, user may need manual verification');
    }

    return user;
  }

  /**
   * Cleanup all created users
   * Called automatically by fixture teardown
   */
  async cleanup(): Promise<void> {
    for (const userId of this.createdUserIds) {
      try {
        await fetch(`${this.apiUrl}/test/delete-user/${userId}`, {
          method: 'DELETE',
        });
      } catch (error) {
        console.warn(`Failed to cleanup user ${userId}:`, error);
      }
    }
    this.createdUserIds = [];
  }
}
