/**
 * Password strength criteria
 */
export interface PasswordCriteria {
  minLength: boolean
  hasUppercase: boolean
  hasLowercase: boolean
  hasNumber: boolean
}

/**
 * Password strength levels
 */
export type PasswordStrength = 'weak' | 'medium' | 'strong'

/**
 * Password strength result
 */
export interface PasswordStrengthResult {
  strength: PasswordStrength
  score: number
  criteria: PasswordCriteria
  label: string
  color: string
  percentage: number
}

/**
 * Calculate password strength based on criteria
 *
 * Scoring:
 * - 0-2 criteria met: Weak (red)
 * - 3 criteria met: Medium (yellow)
 * - All 4 criteria met: Strong (green)
 *
 * @param password - The password to evaluate
 * @returns Password strength result with score, label, and color
 */
export function calculatePasswordStrength(password: string): PasswordStrengthResult {
  const criteria: PasswordCriteria = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
  }

  // Calculate score (0-4)
  const score = Object.values(criteria).filter(Boolean).length

  // Determine strength level
  let strength: PasswordStrength
  let label: string
  let color: string

  if (score <= 2) {
    strength = 'weak'
    label = 'Weak'
    color = 'bg-red-500'
  } else if (score === 3) {
    strength = 'medium'
    label = 'Medium'
    color = 'bg-yellow-500'
  } else {
    strength = 'strong'
    label = 'Strong'
    color = 'bg-green-500'
  }

  // Calculate percentage for progress bar (0-100%)
  const percentage = (score / 4) * 100

  return {
    strength,
    score,
    criteria,
    label,
    color,
    percentage,
  }
}

/**
 * Get password strength color class for text
 * @param strength - Password strength level
 * @returns Tailwind CSS text color class
 */
export function getPasswordStrengthTextColor(strength: PasswordStrength): string {
  switch (strength) {
    case 'weak':
      return 'text-red-600'
    case 'medium':
      return 'text-yellow-600'
    case 'strong':
      return 'text-green-600'
  }
}
