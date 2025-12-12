/**
 * Demo Settings Data
 *
 * Provides pre-filled settings for demo mode
 * to showcase the platform's configuration options.
 *
 * Story: 16.8 - Implement Demo Mode Consistency
 */

/**
 * Demo user profile data
 */
export const DEMO_USER_PROFILE = {
  id: 'demo-user',
  name: 'Alex Thompson',
  email: 'alex.thompson@demo.hyvve.ai',
  emailVerified: true,
  image: null,
  createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 90), // 90 days ago
  updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1), // 1 day ago
};

/**
 * Demo workspace data
 */
export const DEMO_WORKSPACE = {
  id: 'demo-workspace',
  name: 'Thompson Ventures',
  slug: 'thompson-ventures',
  ownerId: 'demo-user',
  plan: 'pro' as const,
  createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 90), // 90 days ago
  updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7), // 7 days ago
};

/**
 * Demo AI provider configurations
 */
export const DEMO_AI_PROVIDERS = [
  {
    id: 'demo-provider-claude',
    workspaceId: 'demo-workspace',
    provider: 'anthropic',
    apiKey: '••••••••••••••••••••••••••••••••sk-ant-demo',
    isDefault: true,
    enabled: true,
    config: {
      defaultModel: 'claude-3-5-sonnet-20241022',
      maxTokens: 4096,
      temperature: 0.7,
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 85),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10),
  },
  {
    id: 'demo-provider-openai',
    workspaceId: 'demo-workspace',
    provider: 'openai',
    apiKey: '••••••••••••••••••••••••••••••••sk-demo',
    isDefault: false,
    enabled: true,
    config: {
      defaultModel: 'gpt-4-turbo-preview',
      maxTokens: 4096,
      temperature: 0.7,
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 80),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15),
  },
];

/**
 * Demo token usage data (30-day summary)
 */
export const DEMO_TOKEN_USAGE = {
  period: '30d',
  totalTokens: 2847691,
  totalCost: 28.47,
  byProvider: {
    anthropic: {
      tokens: 1923456,
      cost: 19.23,
      percentage: 67.5,
    },
    openai: {
      tokens: 924235,
      cost: 9.24,
      percentage: 32.5,
    },
  },
  byAgent: {
    vera: { tokens: 856234, cost: 8.56 },
    paul: { tokens: 723456, cost: 7.23 },
    bella: { tokens: 612389, cost: 6.12 },
    alex: { tokens: 445612, cost: 4.46 },
    oracle: { tokens: 210000, cost: 2.10 },
  },
  dailyLimit: 150000,
  dailyUsed: 94562,
  dailyRemaining: 55438,
  monthlyBudget: 100.0,
  monthlySpent: 28.47,
};

/**
 * Demo workspace members
 */
export const DEMO_WORKSPACE_MEMBERS = [
  {
    id: 'demo-member-1',
    userId: 'demo-user',
    workspaceId: 'demo-workspace',
    role: 'owner',
    user: {
      id: 'demo-user',
      name: 'Alex Thompson',
      email: 'alex.thompson@demo.hyvve.ai',
      image: null,
    },
    joinedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 90),
  },
  {
    id: 'demo-member-2',
    userId: 'demo-user-2',
    workspaceId: 'demo-workspace',
    role: 'admin',
    user: {
      id: 'demo-user-2',
      name: 'Sarah Chen',
      email: 'sarah.chen@demo.hyvve.ai',
      image: null,
    },
    joinedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 75),
  },
  {
    id: 'demo-member-3',
    userId: 'demo-user-3',
    workspaceId: 'demo-workspace',
    role: 'member',
    user: {
      id: 'demo-user-3',
      name: 'Michael Rodriguez',
      email: 'michael.rodriguez@demo.hyvve.ai',
      image: null,
    },
    joinedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60),
  },
];

/**
 * Demo notification preferences
 */
export const DEMO_NOTIFICATION_PREFERENCES = {
  email: {
    approvalRequired: true,
    weeklyDigest: true,
    agentActivity: false,
    systemUpdates: true,
  },
  inApp: {
    approvalRequired: true,
    agentActivity: true,
    mentions: true,
    systemAlerts: true,
  },
  slack: {
    enabled: false,
    webhookUrl: null,
  },
};

/**
 * Demo appearance preferences
 */
export const DEMO_APPEARANCE_PREFERENCES = {
  theme: 'system' as 'light' | 'dark' | 'system',
  accentColor: 'violet' as const,
  fontSize: 'medium' as 'small' | 'medium' | 'large',
  reducedMotion: false,
};

/**
 * Demo security settings
 */
export const DEMO_SECURITY_SETTINGS = {
  twoFactorEnabled: true,
  backupCodesGenerated: true,
  backupCodesRemaining: 8,
  trustedDevices: [
    {
      id: 'demo-device-1',
      name: 'Chrome on MacBook Pro',
      lastUsed: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30),
    },
    {
      id: 'demo-device-2',
      name: 'Safari on iPhone 15',
      lastUsed: new Date(Date.now() - 1000 * 60 * 60 * 6), // 6 hours ago
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 45),
    },
  ],
  activeSessions: [
    {
      id: 'demo-session-1',
      device: 'Chrome on MacBook Pro',
      location: 'San Francisco, CA',
      ipAddress: '192.168.1.100',
      lastActive: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    },
  ],
};

/**
 * Get all demo settings as a single object
 */
export function getAllDemoSettings() {
  return {
    user: DEMO_USER_PROFILE,
    workspace: DEMO_WORKSPACE,
    aiProviders: DEMO_AI_PROVIDERS,
    tokenUsage: DEMO_TOKEN_USAGE,
    members: DEMO_WORKSPACE_MEMBERS,
    notifications: DEMO_NOTIFICATION_PREFERENCES,
    appearance: DEMO_APPEARANCE_PREFERENCES,
    security: DEMO_SECURITY_SETTINGS,
  };
}
