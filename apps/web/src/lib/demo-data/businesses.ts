/**
 * Demo Business Data
 *
 * Provides realistic sample businesses for demo mode
 * when the backend is unavailable or for exploration.
 *
 * Story: 16.8 - Implement Demo Mode Consistency
 */

/**
 * Business type based on Prisma schema
 */
export interface DemoBusiness {
  id: string;
  workspaceId: string;
  userId: string;
  name: string;
  description: string | null;
  industry: string | null;
  stage: 'IDEA' | 'VALIDATION' | 'MVP' | 'GROWTH' | 'SCALE';
  onboardingStatus: 'WIZARD' | 'VALIDATION' | 'PLANNING' | 'BRANDING' | 'COMPLETE';
  onboardingProgress: number;
  validationStatus: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETE';
  planningStatus: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETE';
  brandingStatus: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETE';
  validationScore: number | null;
  validationRecommendation: 'GO' | 'CONDITIONAL_GO' | 'PIVOT' | 'NO_GO' | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Demo businesses with varied statuses and stages
 */
export const DEMO_BUSINESSES: DemoBusiness[] = [
  {
    id: 'demo-biz-1',
    workspaceId: 'demo-workspace',
    userId: 'demo-user',
    name: 'EcoClean Solutions',
    description: 'AI-powered smart cleaning service for busy professionals. On-demand home and office cleaning with eco-friendly products and real-time scheduling.',
    industry: 'Home Services',
    stage: 'VALIDATION',
    onboardingStatus: 'VALIDATION',
    onboardingProgress: 45,
    validationStatus: 'IN_PROGRESS',
    planningStatus: 'NOT_STARTED',
    brandingStatus: 'NOT_STARTED',
    validationScore: null,
    validationRecommendation: null,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7), // 7 days ago
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
  },
  {
    id: 'demo-biz-2',
    workspaceId: 'demo-workspace',
    userId: 'demo-user',
    name: 'FitTrack Pro',
    description: 'Personal fitness tracking app with AI-powered workout recommendations and nutrition guidance. Syncs with all major wearables.',
    industry: 'Health & Fitness',
    stage: 'MVP',
    onboardingStatus: 'PLANNING',
    onboardingProgress: 75,
    validationStatus: 'COMPLETE',
    planningStatus: 'IN_PROGRESS',
    brandingStatus: 'NOT_STARTED',
    validationScore: 82,
    validationRecommendation: 'GO',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 21), // 21 days ago
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 6), // 6 hours ago
  },
  {
    id: 'demo-biz-3',
    workspaceId: 'demo-workspace',
    userId: 'demo-user',
    name: 'TutorConnect',
    description: 'Online tutoring marketplace connecting students with verified tutors across 50+ subjects. Real-time video sessions with whiteboard and screen sharing.',
    industry: 'Education',
    stage: 'GROWTH',
    onboardingStatus: 'COMPLETE',
    onboardingProgress: 100,
    validationStatus: 'COMPLETE',
    planningStatus: 'COMPLETE',
    brandingStatus: 'COMPLETE',
    validationScore: 88,
    validationRecommendation: 'GO',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 45), // 45 days ago
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 12), // 12 hours ago
  },
  {
    id: 'demo-biz-4',
    workspaceId: 'demo-workspace',
    userId: 'demo-user',
    name: 'LocalBites',
    description: 'Food discovery app showcasing hidden gem restaurants in your neighborhood. No delivery fees, just great local food recommendations.',
    industry: 'Food & Beverage',
    stage: 'IDEA',
    onboardingStatus: 'WIZARD',
    onboardingProgress: 15,
    validationStatus: 'NOT_STARTED',
    planningStatus: 'NOT_STARTED',
    brandingStatus: 'NOT_STARTED',
    validationScore: null,
    validationRecommendation: null,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 1), // 1 hour ago
  },
  {
    id: 'demo-biz-5',
    workspaceId: 'demo-workspace',
    userId: 'demo-user',
    name: 'PetCare Plus',
    description: 'Comprehensive pet care platform offering vet appointments, grooming, pet supplies, and health tracking all in one place.',
    industry: 'Pet Services',
    stage: 'VALIDATION',
    onboardingStatus: 'VALIDATION',
    onboardingProgress: 60,
    validationStatus: 'IN_PROGRESS',
    planningStatus: 'NOT_STARTED',
    brandingStatus: 'NOT_STARTED',
    validationScore: 65,
    validationRecommendation: 'CONDITIONAL_GO',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14), // 14 days ago
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
  },
];

/**
 * Get demo businesses filtered by status
 */
export function getDemoBusinesses(filters?: {
  stage?: string;
  onboardingStatus?: string;
}): DemoBusiness[] {
  let businesses = [...DEMO_BUSINESSES];

  if (filters?.stage) {
    businesses = businesses.filter((biz) => biz.stage === filters.stage);
  }

  if (filters?.onboardingStatus) {
    businesses = businesses.filter((biz) => biz.onboardingStatus === filters.onboardingStatus);
  }

  return businesses;
}

/**
 * Get a single demo business by ID
 */
export function getDemoBusiness(id: string): DemoBusiness | undefined {
  return DEMO_BUSINESSES.find((biz) => biz.id === id);
}

/**
 * Demo business statistics
 */
export const DEMO_BUSINESS_STATS = {
  total: DEMO_BUSINESSES.length,
  byStage: {
    IDEA: DEMO_BUSINESSES.filter((b) => b.stage === 'IDEA').length,
    VALIDATION: DEMO_BUSINESSES.filter((b) => b.stage === 'VALIDATION').length,
    MVP: DEMO_BUSINESSES.filter((b) => b.stage === 'MVP').length,
    GROWTH: DEMO_BUSINESSES.filter((b) => b.stage === 'GROWTH').length,
    SCALE: DEMO_BUSINESSES.filter((b) => b.stage === 'SCALE').length,
  },
  byOnboardingStatus: {
    WIZARD: DEMO_BUSINESSES.filter((b) => b.onboardingStatus === 'WIZARD').length,
    VALIDATION: DEMO_BUSINESSES.filter((b) => b.onboardingStatus === 'VALIDATION').length,
    PLANNING: DEMO_BUSINESSES.filter((b) => b.onboardingStatus === 'PLANNING').length,
    BRANDING: DEMO_BUSINESSES.filter((b) => b.onboardingStatus === 'BRANDING').length,
    COMPLETE: DEMO_BUSINESSES.filter((b) => b.onboardingStatus === 'COMPLETE').length,
  },
};
