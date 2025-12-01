'use client'

interface PasswordRequirementsProps {
  password: string
}

/**
 * Check if password meets specific requirement
 */
function checkRequirements(password: string) {
  return {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*()_+\-=\[\]{}|;:,."<>?]/.test(password),
  }
}

/**
 * Password Requirements Checklist Component
 *
 * Interactive checklist showing which password requirements are met.
 * Updates in real-time as the user types.
 *
 * Requirements:
 * - At least 8 characters
 * - One uppercase letter
 * - One lowercase letter
 * - One number
 * - One special character
 */
export function PasswordRequirements({ password }: PasswordRequirementsProps) {
  const requirements = checkRequirements(password)

  const items = [
    { key: 'length', label: 'At least 8 characters', met: requirements.length },
    { key: 'uppercase', label: 'One uppercase letter', met: requirements.uppercase },
    { key: 'lowercase', label: 'One lowercase letter', met: requirements.lowercase },
    { key: 'number', label: 'One number', met: requirements.number },
    { key: 'special', label: 'One special character', met: requirements.special },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
      {items.map((item) => (
        <div
          key={item.key}
          className={`flex items-center gap-2 ${
            item.met ? 'text-success' : 'text-text-secondary'
          }`}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
            {item.met ? 'check_circle' : 'radio_button_unchecked'}
          </span>
          <p>{item.label}</p>
        </div>
      ))}
    </div>
  )
}

/**
 * Check if all password requirements are met
 */
export function allRequirementsMet(password: string): boolean {
  const requirements = checkRequirements(password)
  return Object.values(requirements).every(Boolean)
}
