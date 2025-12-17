import { describe, it, expect } from 'vitest'
import { deriveAssignmentType } from './task-assignment'

describe('deriveAssignmentType', () => {
  it('returns HUMAN when neither assignee nor agent is set', () => {
    expect(deriveAssignmentType({ assigneeId: null, agentId: null })).toBe('HUMAN')
  })

  it('returns HUMAN when only assignee is set', () => {
    expect(deriveAssignmentType({ assigneeId: 'user-1', agentId: null })).toBe('HUMAN')
  })

  it('returns AGENT when only agent is set', () => {
    expect(deriveAssignmentType({ assigneeId: null, agentId: 'agent-1' })).toBe('AGENT')
  })

  it('returns HYBRID when both assignee and agent are set', () => {
    expect(deriveAssignmentType({ assigneeId: 'user-1', agentId: 'agent-1' })).toBe('HYBRID')
  })
})

