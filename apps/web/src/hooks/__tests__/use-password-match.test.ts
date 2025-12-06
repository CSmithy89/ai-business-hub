import { describe, expect, it } from 'vitest'
import { getPasswordMatchState } from '../use-password-match'

describe('getPasswordMatchState', () => {
  it('does not show indicator until both fields meet minimum length', () => {
    const result = getPasswordMatchState('abc', 'aaaa', 4)
    expect(result.showMatchIndicator).toBe(false)
    expect(result.passwordsMatch).toBe(false)
  })

  it('shows indicator when both fields exceed min length, even if they do not match', () => {
    const result = getPasswordMatchState('password', 'different', 4)
    expect(result.showMatchIndicator).toBe(true)
    expect(result.passwordsMatch).toBe(false)
  })

  it('marks passwordsMatch true only when both values equal', () => {
    const result = getPasswordMatchState('secure', 'secure', 4)
    expect(result.passwordsMatch).toBe(true)
    expect(result.showMatchIndicator).toBe(true)
  })

  it('hides indicator if confirmPassword is empty even when password has value', () => {
    const result = getPasswordMatchState('strongpass', '', 1)
    expect(result.showMatchIndicator).toBe(false)
  })

  it('respects minLength default when not passed', () => {
    const result = getPasswordMatchState('1234', '1234')
    expect(result.showMatchIndicator).toBe(true)
    expect(result.passwordsMatch).toBe(true)
  })

  it('returns false for all flags when minLength is zero and values empty', () => {
    const result = getPasswordMatchState('', '', 0)
    expect(result.showMatchIndicator).toBe(true)
    expect(result.passwordsMatch).toBe(false)
  })
})
