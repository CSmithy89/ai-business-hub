export const DEFAULT_PASSWORD_MIN_LENGTH_FOR_MATCH = 4

export interface PasswordMatchState {
  passwordsMatch: boolean
  showMatchIndicator: boolean
}

export function getPasswordMatchState(
  password: string,
  confirmPassword: string,
  minLengthForMatch = DEFAULT_PASSWORD_MIN_LENGTH_FOR_MATCH
): PasswordMatchState {
  const normalizedMinLength = Math.max(0, minLengthForMatch)
  const hasPassword = password.length >= normalizedMinLength
  const hasConfirmPassword = confirmPassword.length >= normalizedMinLength

  const showMatchIndicator = hasPassword && hasConfirmPassword
  const passwordsMatch =
    showMatchIndicator && password.length > 0 && confirmPassword.length > 0 && password === confirmPassword

  return {
    passwordsMatch,
    showMatchIndicator,
  }
}
