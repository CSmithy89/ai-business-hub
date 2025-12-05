/**
 * Encryption Key Validation
 * Story 09-3: Ensure BETTER_AUTH_SECRET has sufficient entropy for secure encryption
 *
 * This module validates that the encryption key used for TOTP secret storage
 * meets minimum security requirements.
 */

/** Minimum key length for AES-256 encryption */
const MIN_KEY_LENGTH = 32

/** Minimum unique character ratio for entropy check */
const MIN_UNIQUE_CHAR_RATIO = 0.3

/** Minimum entropy bits for cryptographic security */
const MIN_ENTROPY_BITS = 128

export interface KeyValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
  entropy: number
}

/**
 * Calculate Shannon entropy of a string in bits per character
 */
function calculateShannonEntropy(str: string): number {
  if (!str || str.length === 0) return 0

  const len = str.length
  const frequencies = new Map<string, number>()

  // Count character frequencies
  for (const char of str) {
    frequencies.set(char, (frequencies.get(char) || 0) + 1)
  }

  // Calculate entropy using Shannon formula
  let entropy = 0
  for (const count of frequencies.values()) {
    const probability = count / len
    entropy -= probability * Math.log2(probability)
  }

  return entropy
}

/**
 * Calculate total entropy bits of a string
 */
function calculateTotalEntropyBits(str: string): number {
  const entropyPerChar = calculateShannonEntropy(str)
  return entropyPerChar * str.length
}

/**
 * Check if string contains common weak patterns
 */
function hasWeakPatterns(str: string): string[] {
  const patterns: string[] = []

  // Check for sequential characters
  if (/(.)\1{3,}/.test(str)) {
    patterns.push('Contains 4+ repeated characters')
  }

  // Check for common weak patterns
  const weakPatterns = ['password', 'secret', 'key', '12345', 'abcdef', 'qwerty']
  for (const pattern of weakPatterns) {
    if (str.toLowerCase().includes(pattern)) {
      patterns.push(`Contains weak pattern: ${pattern}`)
    }
  }

  // Check for incremental sequences
  if (/0123|1234|2345|3456|4567|5678|6789|abcd|bcde|cdef/.test(str.toLowerCase())) {
    patterns.push('Contains sequential characters')
  }

  return patterns
}

/**
 * Validate encryption key meets security requirements
 *
 * @param key - The encryption key to validate
 * @returns Validation result with errors and warnings
 */
export function validateEncryptionKey(key: string | undefined): KeyValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  let entropy = 0

  // Check if key exists
  if (!key) {
    errors.push('BETTER_AUTH_SECRET environment variable is not set')
    return { valid: false, errors, warnings, entropy }
  }

  // Check minimum length
  if (key.length < MIN_KEY_LENGTH) {
    errors.push(
      `Key length (${key.length}) is less than minimum required (${MIN_KEY_LENGTH}). ` +
        'Use at least 32 characters for AES-256 encryption.'
    )
  }

  // Calculate entropy
  entropy = calculateTotalEntropyBits(key)
  if (entropy < MIN_ENTROPY_BITS) {
    errors.push(
      `Key entropy (${entropy.toFixed(1)} bits) is below minimum required (${MIN_ENTROPY_BITS} bits). ` +
        'Use a more random key with varied characters.'
    )
  }

  // Check unique character ratio
  const uniqueChars = new Set(key).size
  const uniqueRatio = uniqueChars / key.length
  if (uniqueRatio < MIN_UNIQUE_CHAR_RATIO) {
    warnings.push(
      `Low character diversity: only ${uniqueChars} unique characters out of ${key.length}. ` +
        'Consider using a more varied key.'
    )
  }

  // Check for weak patterns
  const weakPatterns = hasWeakPatterns(key)
  for (const pattern of weakPatterns) {
    warnings.push(pattern)
  }

  // Recommend better key generation if there are warnings
  if (warnings.length > 0) {
    warnings.push(
      'Recommended: Generate a secure key with: openssl rand -base64 48'
    )
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    entropy,
  }
}

/**
 * Validate and log encryption key status at startup
 * Throws error in production if key is invalid
 */
export function validateEncryptionKeyOnStartup(): void {
  const key = process.env.BETTER_AUTH_SECRET
  const result = validateEncryptionKey(key)

  const isProduction = process.env.NODE_ENV === 'production'

  // Log validation result
  if (!result.valid) {
    const errorMessage = `Encryption key validation failed:\n${result.errors.map((e) => `  - ${e}`).join('\n')}`

    if (isProduction) {
      // In production, fail fast with clear error
      throw new Error(errorMessage)
    } else {
      // In development, log error but continue
      console.error('⚠️  SECURITY WARNING:', errorMessage)
      console.error('⚠️  This would cause a startup failure in production!')
    }
  } else if (result.warnings.length > 0) {
    console.warn(
      'Encryption key validation warnings:\n' +
        result.warnings.map((w) => `  - ${w}`).join('\n')
    )
  }

  // Log entropy info in development
  if (!isProduction && result.valid) {
    console.log(`✓ Encryption key validated (${result.entropy.toFixed(1)} bits entropy)`)
  }
}
