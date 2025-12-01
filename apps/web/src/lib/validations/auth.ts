import { z } from 'zod'

/**
 * Email validation schema
 * - Valid email format (RFC 5322)
 * - Will be normalized to lowercase before storage
 */
export const emailSchema = z.string().email('Please enter a valid email address')

/**
 * Password validation schema
 * - Minimum 8 characters
 * - At least one uppercase letter (A-Z)
 * - At least one lowercase letter (a-z)
 * - At least one number (0-9)
 */
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')

/**
 * Name validation schema
 */
export const nameSchema = z.string().min(1, 'Name is required').max(100, 'Name is too long')

/**
 * Sign-up form validation schema
 */
export const signUpSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string().min(1, 'Please confirm your password'),
  termsAccepted: z.boolean().refine((val) => val === true, {
    message: 'You must accept the Terms of Service and Privacy Policy',
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

/**
 * Sign-in form validation schema
 */
export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
})

/**
 * Type exports for form data
 */
export type SignUpFormData = z.infer<typeof signUpSchema>
export type SignInFormData = z.infer<typeof signInSchema>
