'use client'

import { useEffect, useRef, useState } from 'react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface OtpCodeInputProps {
  /**
   * Number of digits in the OTP code
   */
  length?: number
  /**
   * Callback when all digits are entered
   */
  onComplete: (code: string) => void
  /**
   * Callback when code changes
   */
  onChange?: (code: string) => void
  /**
   * Disabled state
   */
  disabled?: boolean
  /**
   * Error state
   */
  error?: boolean
  /**
   * Auto-submit when all digits are entered
   */
  autoSubmit?: boolean
}

/**
 * OTP Code Input Component
 *
 * Displays individual input boxes for each digit of the OTP code.
 * Supports auto-advance on input, backspace navigation, and paste handling.
 *
 * Based on the two-factor-verify.tsx pattern but optimized for OTP.
 */
export function OtpCodeInput({
  length = 6,
  onComplete,
  onChange,
  disabled = false,
  error = false,
  autoSubmit = true,
}: OtpCodeInputProps) {
  const [values, setValues] = useState<string[]>(Array(length).fill(''))
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Initialize refs array
  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, length)
  }, [length])

  // Auto-focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus()
  }, [])

  /**
   * Handle input change for a specific digit
   */
  const handleChange = (index: number, value: string) => {
    // Only allow digits
    const digit = value.replace(/\D/g, '').slice(-1)

    const newValues = [...values]
    newValues[index] = digit
    setValues(newValues)

    // Call onChange callback
    const code = newValues.join('')
    onChange?.(code)

    // Auto-advance to next input if digit was entered
    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus()
    }

    // Call onComplete if all digits are filled
    if (newValues.every((v) => v !== '')) {
      const fullCode = newValues.join('')
      if (autoSubmit) {
        onComplete(fullCode)
      }
    }
  }

  /**
   * Handle backspace/delete key
   */
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault()

      const newValues = [...values]

      // If current input has value, clear it
      if (values[index]) {
        newValues[index] = ''
        setValues(newValues)
        onChange?.(newValues.join(''))
      }
      // Otherwise, move to previous input and clear it
      else if (index > 0) {
        newValues[index - 1] = ''
        setValues(newValues)
        onChange?.(newValues.join(''))
        inputRefs.current[index - 1]?.focus()
      }
    }
    // Handle arrow key navigation
    else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault()
      inputRefs.current[index - 1]?.focus()
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      e.preventDefault()
      inputRefs.current[index + 1]?.focus()
    }
    // Handle Enter key
    else if (e.key === 'Enter') {
      e.preventDefault()
      const code = values.join('')
      if (code.length === length) {
        onComplete(code)
      }
    }
  }

  /**
   * Handle paste event - allow pasting full code
   */
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()

    const pastedData = e.clipboardData.getData('text/plain')
    const digits = pastedData.replace(/\D/g, '').slice(0, length)

    if (digits.length > 0) {
      const newValues = digits.split('').concat(Array(length).fill('')).slice(0, length)
      setValues(newValues)
      onChange?.(newValues.join(''))

      // Focus the next empty input or the last input
      const nextEmptyIndex = newValues.findIndex((v) => v === '')
      const focusIndex = nextEmptyIndex === -1 ? length - 1 : nextEmptyIndex
      inputRefs.current[focusIndex]?.focus()

      // Call onComplete if all digits are filled
      if (newValues.every((v) => v !== '')) {
        const fullCode = newValues.join('')
        if (autoSubmit) {
          onComplete(fullCode)
        }
      }
    }
  }

  /**
   * Handle focus - select all content
   */
  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select()
  }

  return (
    <div className="flex gap-2 justify-center">
      {values.map((value, index) => (
        <Input
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el
          }}
          type="text"
          inputMode="numeric"
          pattern="\d*"
          maxLength={1}
          value={value}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          onFocus={handleFocus}
          disabled={disabled}
          className={cn(
            'w-12 h-14 text-center text-2xl font-bold',
            error && 'border-red-500 focus-visible:ring-red-500',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          aria-label={`Digit ${index + 1}`}
        />
      ))}
    </div>
  )
}
