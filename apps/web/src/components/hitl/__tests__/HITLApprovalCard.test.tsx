/**
 * HITLApprovalCard Unit Tests
 *
 * Tests for HITL approval card components and utilities.
 *
 * @see docs/modules/bm-dm/stories/dm-05-2-frontend-hitl-handlers.md
 * Epic: DM-05 | Story: DM-05.2
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import { HITLApprovalCard } from '../HITLApprovalCard';
import { ContractApprovalCard } from '../ContractApprovalCard';
import { DeleteConfirmCard } from '../DeleteConfirmCard';
import type { HITLActionArgs, HITLConfig } from '@/lib/hitl/types';
import {
  isHITLPending,
  parseHITLResult,
  formatKey,
  formatValue,
  formatConfidence,
  getConfidenceLevel,
  getRiskBadgeVariant,
} from '@/lib/hitl/utils';

// =============================================================================
// TEST FIXTURES
// =============================================================================

const createMockConfig = (overrides: Partial<HITLConfig> = {}): HITLConfig => ({
  autoThreshold: 85,
  quickThreshold: 60,
  approvalType: 'general',
  riskLevel: 'medium',
  requiresReason: false,
  approveLabel: 'Approve',
  rejectLabel: 'Reject',
  ...overrides,
});

const createMockArgs = (overrides: Partial<HITLActionArgs> = {}): HITLActionArgs => ({
  toolName: 'test_action',
  toolArgs: { key1: 'value1', amount: 1000 },
  confidenceScore: 75,
  approvalLevel: 'quick',
  config: createMockConfig(),
  requestId: 'test-request-123',
  ...overrides,
});

// =============================================================================
// UTILITY TESTS
// =============================================================================

describe('HITL Utilities', () => {
  describe('isHITLPending', () => {
    it('returns true for valid HITL marker', () => {
      const marker = {
        __hitl_pending__: true,
        hitl_result: {
          requires_approval: true,
          approval_level: 'quick',
          confidence_score: 75,
          tool_name: 'test',
          tool_args: {},
          config: {
            auto_threshold: 85,
            quick_threshold: 60,
            approval_type: 'general',
            risk_level: 'medium',
            requires_reason: false,
            approve_label: 'Approve',
            reject_label: 'Reject',
          },
          request_id: '123',
        },
      };
      expect(isHITLPending(marker)).toBe(true);
    });

    it('returns false for non-marker objects', () => {
      expect(isHITLPending({})).toBe(false);
      expect(isHITLPending(null)).toBe(false);
      expect(isHITLPending(undefined)).toBe(false);
      expect(isHITLPending({ __hitl_pending__: false })).toBe(false);
      expect(isHITLPending({ __hitl_pending__: true })).toBe(false); // missing hitl_result
    });

    it('returns false for primitive values', () => {
      expect(isHITLPending('string')).toBe(false);
      expect(isHITLPending(123)).toBe(false);
      expect(isHITLPending(true)).toBe(false);
    });
  });

  describe('parseHITLResult', () => {
    it('extracts HITLActionArgs from marker', () => {
      const marker = {
        __hitl_pending__: true,
        hitl_result: {
          requires_approval: true,
          approval_level: 'quick',
          confidence_score: 75,
          tool_name: 'sign_contract',
          tool_args: { contract_id: 'C123', amount: 5000 },
          config: {
            auto_threshold: 95,
            quick_threshold: 70,
            approval_type: 'contract',
            risk_level: 'high',
            requires_reason: true,
            approve_label: 'Sign Contract',
            reject_label: 'Cancel',
            description_template: 'Sign contract {contract_id}',
          },
          request_id: 'req-456',
        },
      };

      const result = parseHITLResult(marker);

      expect(result).not.toBeNull();
      expect(result?.toolName).toBe('sign_contract');
      expect(result?.confidenceScore).toBe(75);
      expect(result?.approvalLevel).toBe('quick');
      expect(result?.toolArgs).toEqual({ contract_id: 'C123', amount: 5000 });
      expect(result?.config.autoThreshold).toBe(95);
      expect(result?.config.riskLevel).toBe('high');
      expect(result?.config.approveLabel).toBe('Sign Contract');
      expect(result?.requestId).toBe('req-456');
    });

    it('returns null for non-marker input', () => {
      expect(parseHITLResult({})).toBeNull();
      expect(parseHITLResult(null)).toBeNull();
      expect(parseHITLResult({ something: 'else' })).toBeNull();
    });
  });

  describe('formatKey', () => {
    it('converts camelCase to Title Case', () => {
      expect(formatKey('contractId')).toBe('Contract Id');
      expect(formatKey('firstName')).toBe('First Name');
    });

    it('converts snake_case to Title Case', () => {
      expect(formatKey('contract_id')).toBe('Contract Id');
      expect(formatKey('first_name')).toBe('First Name');
    });

    it('handles single words', () => {
      expect(formatKey('amount')).toBe('Amount');
      expect(formatKey('name')).toBe('Name');
    });
  });

  describe('formatValue', () => {
    it('formats currency for amount fields', () => {
      expect(formatValue(1000, 'amount')).toBe('$1,000');
      // formatCurrency uses minimumFractionDigits: 0, so trailing zeros are optional
      expect(formatValue(5000.5, 'totalPrice')).toBe('$5,000.5');
    });

    it('formats booleans', () => {
      expect(formatValue(true)).toBe('Yes');
      expect(formatValue(false)).toBe('No');
    });

    it('handles null and undefined', () => {
      expect(formatValue(null)).toBe('-');
      expect(formatValue(undefined)).toBe('-');
    });

    it('formats arrays', () => {
      expect(formatValue([])).toBe('None');
      expect(formatValue([1, 2])).toBe('1, 2');
      expect(formatValue([1, 2, 3, 4, 5])).toBe('5 items');
    });

    it('returns strings as-is', () => {
      expect(formatValue('hello')).toBe('hello');
    });
  });

  describe('formatConfidence', () => {
    it('formats confidence score', () => {
      expect(formatConfidence(75)).toBe('75%');
      expect(formatConfidence(100)).toBe('100%');
      expect(formatConfidence(0)).toBe('0%');
    });

    it('clamps values to 0-100', () => {
      expect(formatConfidence(-10)).toBe('0%');
      expect(formatConfidence(150)).toBe('100%');
    });

    it('rounds decimal values', () => {
      expect(formatConfidence(75.6)).toBe('76%');
      expect(formatConfidence(75.4)).toBe('75%');
    });
  });

  describe('getConfidenceLevel', () => {
    it('returns high for scores >= autoThreshold', () => {
      const config = createMockConfig({ autoThreshold: 85 });
      expect(getConfidenceLevel(85, config)).toBe('high');
      expect(getConfidenceLevel(90, config)).toBe('high');
      expect(getConfidenceLevel(100, config)).toBe('high');
    });

    it('returns medium for scores >= quickThreshold and < autoThreshold', () => {
      const config = createMockConfig({ autoThreshold: 85, quickThreshold: 60 });
      expect(getConfidenceLevel(60, config)).toBe('medium');
      expect(getConfidenceLevel(70, config)).toBe('medium');
      expect(getConfidenceLevel(84, config)).toBe('medium');
    });

    it('returns low for scores < quickThreshold', () => {
      const config = createMockConfig({ quickThreshold: 60 });
      expect(getConfidenceLevel(59, config)).toBe('low');
      expect(getConfidenceLevel(30, config)).toBe('low');
      expect(getConfidenceLevel(0, config)).toBe('low');
    });

    it('uses default thresholds when config not provided', () => {
      expect(getConfidenceLevel(85)).toBe('high');
      expect(getConfidenceLevel(70)).toBe('medium');
      expect(getConfidenceLevel(50)).toBe('low');
    });
  });

  describe('getRiskBadgeVariant', () => {
    it('returns correct variants', () => {
      expect(getRiskBadgeVariant('high')).toBe('destructive');
      expect(getRiskBadgeVariant('medium')).toBe('secondary');
      expect(getRiskBadgeVariant('low')).toBe('outline');
    });
  });
});

// =============================================================================
// COMPONENT TESTS
// =============================================================================

describe('HITLApprovalCard', () => {
  const onApprove = vi.fn();
  const onReject = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with all required elements', () => {
    const args = createMockArgs();
    render(
      <HITLApprovalCard
        args={args}
        onApprove={onApprove}
        onReject={onReject}
      />
    );

    // Should show risk badge
    expect(screen.getByText(/medium risk/i)).toBeInTheDocument();

    // Should show confidence score
    expect(screen.getByText('75%')).toBeInTheDocument();

    // Should show approve/reject buttons
    expect(screen.getByRole('button', { name: /approve/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reject/i })).toBeInTheDocument();
  });

  it('shows rejection reason input when requiresReason=true and reject clicked', () => {
    const args = createMockArgs({
      config: createMockConfig({ requiresReason: true }),
    });

    render(
      <HITLApprovalCard
        args={args}
        onApprove={onApprove}
        onReject={onReject}
      />
    );

    // Click reject button
    fireEvent.click(screen.getByRole('button', { name: /reject/i }));

    // Should show textarea
    expect(screen.getByPlaceholderText(/please provide a reason/i)).toBeInTheDocument();
  });

  it('calls onApprove when approve button clicked', () => {
    const args = createMockArgs();

    render(
      <HITLApprovalCard
        args={args}
        onApprove={onApprove}
        onReject={onReject}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /approve/i }));

    expect(onApprove).toHaveBeenCalledTimes(1);
  });

  it('calls onReject when reject confirmed (no reason required)', () => {
    const args = createMockArgs();

    render(
      <HITLApprovalCard
        args={args}
        onApprove={onApprove}
        onReject={onReject}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /reject/i }));

    expect(onReject).toHaveBeenCalledTimes(1);
  });

  it('disables buttons when isExecuting=true', () => {
    const args = createMockArgs();

    render(
      <HITLApprovalCard
        args={args}
        isExecuting={true}
        onApprove={onApprove}
        onReject={onReject}
      />
    );

    const approveButton = screen.getByRole('button', { name: /approv/i });
    const rejectButton = screen.getByRole('button', { name: /reject/i });

    expect(approveButton).toBeDisabled();
    expect(rejectButton).toBeDisabled();
  });

  it('uses custom labels from config', () => {
    const args = createMockArgs({
      config: createMockConfig({
        approveLabel: 'Sign Contract',
        rejectLabel: 'Cancel',
      }),
    });

    render(
      <HITLApprovalCard
        args={args}
        onApprove={onApprove}
        onReject={onReject}
      />
    );

    expect(screen.getByRole('button', { name: /sign contract/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('displays tool arguments preview', () => {
    const args = createMockArgs({
      toolArgs: { projectName: 'Test Project', status: 'active' },
    });

    render(
      <HITLApprovalCard
        args={args}
        onApprove={onApprove}
        onReject={onReject}
      />
    );

    expect(screen.getByText('Project Name')).toBeInTheDocument();
    expect(screen.getByText('Test Project')).toBeInTheDocument();
  });
});

describe('ContractApprovalCard', () => {
  const onApprove = vi.fn();
  const onReject = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('displays contract-specific details', () => {
    const args = createMockArgs({
      config: createMockConfig({ approvalType: 'contract', riskLevel: 'high' }),
    });

    render(
      <ContractApprovalCard
        args={args}
        contractId="C-2024-001"
        amount={50000}
        signatoryName="John Doe"
        onApprove={onApprove}
        onReject={onReject}
      />
    );

    expect(screen.getByText('C-2024-001')).toBeInTheDocument();
    expect(screen.getByText('$50,000')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('extracts values from toolArgs if not provided as props', () => {
    const args = createMockArgs({
      toolArgs: {
        contract_id: 'C-AUTO-001',
        amount: 25000,
        signatory_name: 'Jane Smith',
      },
    });

    render(
      <ContractApprovalCard
        args={args}
        onApprove={onApprove}
        onReject={onReject}
      />
    );

    expect(screen.getByText('C-AUTO-001')).toBeInTheDocument();
    expect(screen.getByText('$25,000')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });
});

describe('DeleteConfirmCard', () => {
  const onApprove = vi.fn();
  const onReject = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('displays deletion warning', () => {
    const args = createMockArgs({
      config: createMockConfig({ approvalType: 'deletion', riskLevel: 'high' }),
      toolArgs: { project_name: 'Test Project' },
    });

    render(
      <DeleteConfirmCard
        args={args}
        itemName="Test Project"
        itemType="project"
        onApprove={onApprove}
        onReject={onReject}
      />
    );

    expect(screen.getByText(/you are about to delete/i)).toBeInTheDocument();
    // Use getAllByText since "cannot be undone" appears in both header and warning message
    const undoneElements = screen.getAllByText(/cannot be undone/i);
    expect(undoneElements.length).toBeGreaterThanOrEqual(1);
  });

  it('requires name confirmation when requireNameConfirmation=true', () => {
    const args = createMockArgs({
      toolArgs: { project_name: 'MyProject' },
      // Use custom approve label for deletion
      config: createMockConfig({ approveLabel: 'Confirm Delete' }),
    });

    render(
      <DeleteConfirmCard
        args={args}
        itemName="MyProject"
        requireNameConfirmation={true}
        onApprove={onApprove}
        onReject={onReject}
      />
    );

    // Confirm button should be disabled initially (look for approve button with Confirm Delete label)
    const confirmButton = screen.getByRole('button', { name: /confirm delete/i });
    expect(confirmButton).toBeDisabled();

    // Type the project name
    const input = screen.getByPlaceholderText('MyProject');
    fireEvent.change(input, { target: { value: 'MyProject' } });

    // Now button should be enabled
    expect(confirmButton).not.toBeDisabled();
  });

  it('shows error when confirmation name does not match', () => {
    const args = createMockArgs();

    render(
      <DeleteConfirmCard
        args={args}
        itemName="MyProject"
        requireNameConfirmation={true}
        onApprove={onApprove}
        onReject={onReject}
      />
    );

    const input = screen.getByPlaceholderText('MyProject');
    fireEvent.change(input, { target: { value: 'WrongName' } });

    expect(screen.getByText(/name doesn't match/i)).toBeInTheDocument();
  });
});
