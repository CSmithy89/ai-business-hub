/**
 * Demo Approval Data
 *
 * Provides realistic sample approval items for demo mode
 * when the NestJS backend is unavailable.
 *
 * Story: 15.5 - Fix Approvals Page Data Loading
 */

import type { ApprovalItem, ConfidenceFactor } from '@hyvve/shared';

/**
 * Demo approval items with realistic data
 */
export const DEMO_APPROVALS: ApprovalItem[] = [
  {
    id: 'demo-approval-1',
    workspaceId: 'demo-workspace',
    type: 'content',
    title: 'Blog Post: AI Automation Trends 2025',
    description: 'Nova drafted a blog post about emerging AI automation trends and their impact on SMB operations. The content aligns with your brand voice and includes relevant statistics.',
    confidenceScore: 92,
    confidenceLevel: 'high',
    factors: [
      { factor: 'historical_accuracy', score: 95, weight: 0.3, explanation: 'Similar content has performed well' },
      { factor: 'data_completeness', score: 90, weight: 0.2, explanation: 'All required fields present' },
      { factor: 'business_rules', score: 88, weight: 0.2, explanation: 'Follows brand guidelines' },
      { factor: 'pattern_match', score: 94, weight: 0.3, explanation: 'Matches successful post patterns' },
    ] as ConfidenceFactor[],
    aiRecommendation: 'approve',
    status: 'pending',
    data: {
      wordCount: 1250,
      keywords: ['AI automation', 'SMB', 'efficiency', 'productivity'],
      scheduledDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2).toISOString(),
    },
    sourceModule: 'content',
    createdBy: 'nova',
    createdAt: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    priority: 1,
  },
  {
    id: 'demo-approval-2',
    workspaceId: 'demo-workspace',
    type: 'email',
    title: 'Follow-up email to John Smith',
    description: 'Maya prepared a follow-up email for the sales lead who showed interest in the Enterprise plan. Includes personalized touches based on previous interactions.',
    confidenceScore: 75,
    confidenceLevel: 'medium',
    factors: [
      { factor: 'historical_accuracy', score: 82, weight: 0.3, explanation: 'Previous emails to this contact had good engagement' },
      { factor: 'data_completeness', score: 70, weight: 0.2, explanation: 'Contact preferences partially known' },
      { factor: 'time_sensitivity', score: 68, weight: 0.2, explanation: 'Follow-up timing is within optimal window' },
      { factor: 'value_impact', score: 78, weight: 0.3, explanation: 'High-value lead, moderate risk' },
    ] as ConfidenceFactor[],
    aiRecommendation: 'review',
    status: 'pending',
    data: {
      recipientEmail: 'john.smith@example.com',
      subject: 'Following up on our Enterprise plan discussion',
      leadValue: '$45,000',
    },
    sourceModule: 'crm',
    sourceId: 'lead-12345',
    createdBy: 'maya',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    priority: 2,
  },
  {
    id: 'demo-approval-3',
    workspaceId: 'demo-workspace',
    type: 'deal',
    title: 'Discount approval: TechStart Inc.',
    description: 'Hub is requesting approval for a 20% discount on the annual plan for TechStart Inc. The discount exceeds the standard 15% threshold.',
    confidenceScore: 58,
    confidenceLevel: 'low',
    factors: [
      { factor: 'business_rules', score: 45, weight: 0.3, explanation: 'Discount exceeds standard limits', concerning: true },
      { factor: 'value_impact', score: 72, weight: 0.3, explanation: 'Potential for long-term relationship' },
      { factor: 'historical_accuracy', score: 55, weight: 0.2, explanation: 'Similar discounts have mixed results', concerning: true },
      { factor: 'pattern_match', score: 60, weight: 0.2, explanation: 'Customer profile matches target segment' },
    ] as ConfidenceFactor[],
    aiRecommendation: 'full_review',
    aiReasoning: 'The requested discount of 20% exceeds the standard 15% threshold. While TechStart Inc. shows potential as a long-term customer, similar discounts have had mixed results historically. Recommend reviewing the customer lifetime value projection before approval.',
    status: 'pending',
    data: {
      discountPercent: 20,
      originalAmount: '$12,000',
      discountedAmount: '$9,600',
      customerSince: null,
    },
    sourceModule: 'sales',
    sourceId: 'deal-67890',
    createdBy: 'hub',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
    priority: 1,
  },
  {
    id: 'demo-approval-4',
    workspaceId: 'demo-workspace',
    type: 'task',
    title: 'Schedule meeting with Acme Corp',
    description: 'Atlas wants to schedule a product demo meeting with Acme Corp for next Tuesday. Calendar availability has been confirmed on both sides.',
    confidenceScore: 88,
    confidenceLevel: 'high',
    factors: [
      { factor: 'data_completeness', score: 95, weight: 0.25, explanation: 'All attendees and calendar info confirmed' },
      { factor: 'business_rules', score: 85, weight: 0.25, explanation: 'Meeting follows standard scheduling protocol' },
      { factor: 'time_sensitivity', score: 90, weight: 0.25, explanation: 'Optimal timing for sales cycle stage' },
      { factor: 'pattern_match', score: 82, weight: 0.25, explanation: 'Similar meetings have high conversion rate' },
    ] as ConfidenceFactor[],
    aiRecommendation: 'approve',
    status: 'pending',
    data: {
      meetingDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5).toISOString(),
      duration: '45 minutes',
      attendees: ['sarah@acmecorp.com', 'mike@acmecorp.com'],
      meetingType: 'Product Demo',
    },
    sourceModule: 'projects',
    createdBy: 'atlas',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6), // 6 hours ago
    priority: 2,
  },
  {
    id: 'demo-approval-5',
    workspaceId: 'demo-workspace',
    type: 'agent_action',
    title: 'Campaign budget reallocation',
    description: 'Echo detected underperforming ad sets and wants to reallocate $500 from Facebook Ads to Google Ads for better ROI.',
    confidenceScore: 45,
    confidenceLevel: 'low',
    factors: [
      { factor: 'historical_accuracy', score: 62, weight: 0.3, explanation: 'Similar reallocations have had variable results' },
      { factor: 'value_impact', score: 35, weight: 0.3, explanation: 'Significant budget change with uncertain outcome', concerning: true },
      { factor: 'data_completeness', score: 48, weight: 0.2, explanation: 'Limited data on Google Ads performance for this segment', concerning: true },
      { factor: 'pattern_match', score: 42, weight: 0.2, explanation: 'Unusual pattern for current market conditions', concerning: true },
    ] as ConfidenceFactor[],
    aiRecommendation: 'full_review',
    aiReasoning: 'While Echo detected underperforming Facebook Ads, the recommendation to reallocate $500 to Google Ads is based on limited performance data for your target segment on that platform. The current market conditions also show unusual patterns. Recommend a smaller test allocation first.',
    status: 'pending',
    data: {
      currentPlatform: 'Facebook Ads',
      targetPlatform: 'Google Ads',
      amount: '$500',
      currentROI: '1.2x',
      projectedROI: '1.8x',
    },
    sourceModule: 'analytics',
    createdBy: 'echo',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8), // 8 hours ago
    priority: 2,
  },
];

/**
 * Get demo approvals filtered by status
 */
export function getDemoApprovals(status?: string): ApprovalItem[] {
  if (!status || status === 'all') {
    return DEMO_APPROVALS;
  }
  return DEMO_APPROVALS.filter((approval) => approval.status === status);
}

/**
 * Get a single demo approval by ID
 */
export function getDemoApproval(id: string): ApprovalItem | undefined {
  return DEMO_APPROVALS.find((approval) => approval.id === id);
}

/**
 * Demo approval statistics
 */
export const DEMO_APPROVAL_STATS = {
  total: DEMO_APPROVALS.length,
  pending: DEMO_APPROVALS.filter((a) => a.status === 'pending').length,
  approved: 0,
  rejected: 0,
  autoApproved: 0,
  highConfidence: DEMO_APPROVALS.filter((a) => a.confidenceLevel === 'high').length,
  mediumConfidence: DEMO_APPROVALS.filter((a) => a.confidenceLevel === 'medium').length,
  lowConfidence: DEMO_APPROVALS.filter((a) => a.confidenceLevel === 'low').length,
};
