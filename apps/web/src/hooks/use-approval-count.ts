/**
 * Mock hook for approval count
 *
 * Returns a static count for the Approvals navigation item badge.
 * TODO: Replace with real API call to GET /api/approvals/count in future story
 *
 * @returns The number of pending approvals
 */
export function useApprovalCount(): number {
  // Mock data: 5 pending approvals
  // In production, this would fetch from the approval queue API
  return 5;
}
