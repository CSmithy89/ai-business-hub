'use client'

import { createAuthClient } from 'better-auth/react'

/**
 * Better Auth client for React components
 *
 * This client provides type-safe methods for authentication:
 * - signUp.email() - Register with email/password
 * - signIn.email() - Sign in with email/password
 * - signIn.social() - OAuth sign in
 * - signOut() - Sign out
 * - useSession() - Get current session
 */
export const authClient = createAuthClient({
  baseURL: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000',
})

/**
 * Sign up with email and password
 *
 * @param data - Registration data
 * @returns Promise with user data or error
 */
export async function signUp(data: {
  email: string
  password: string
  name: string
}) {
  return authClient.signUp.email({
    email: data.email,
    password: data.password,
    name: data.name,
  })
}

/**
 * Sign in with email and password
 *
 * @param data - Sign in credentials
 * @returns Promise with session data or error
 */
export async function signIn(data: {
  email: string
  password: string
  rememberMe?: boolean
}) {
  return authClient.signIn.email({
    email: data.email,
    password: data.password,
    rememberMe: data.rememberMe,
  })
}

/**
 * Sign out current user
 */
export async function signOut() {
  return authClient.signOut()
}

/**
 * Get current session hook
 * Use in React components to access session data
 */
export const useSession = authClient.useSession
