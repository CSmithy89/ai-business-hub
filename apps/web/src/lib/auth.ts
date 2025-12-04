import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { organization } from 'better-auth/plugins'
import { prisma } from '@hyvve/db'
import { sendVerificationEmail, sendPasswordResetEmail } from './email'

export const auth = betterAuth({
  // Database adapter using Prisma
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),

  // Session configuration
  session: {
    expiresIn: 60 * 60 * 24 * 7,      // 7 days (default)
    updateAge: 60 * 60 * 24,          // Refresh daily
    cookieCache: {
      enabled: true,
      maxAge: 60 * 15,                // 15 minutes (access token lifetime)
    },
  },

  // Security settings
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL!,

  // Plugins for multi-tenant organization support and email/password auth
  plugins: [
    organization({
      allowUserToCreateOrganization: true,
      // Role definitions will be fully implemented in Epic 02
    }),
  ],

  // Email and password authentication
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Set to false for easier testing; can be enabled later
    sendVerificationEmail: async ({ user, token }: { user: any; url: string; token: string }) => {
      await sendVerificationEmail(user.email, token, user.name)
    },
    // Password reset configuration (Story 01.6)
    sendResetPassword: async ({ user, token }: { user: any; token: string; url: string }) => {
      await sendPasswordResetEmail(user.email, token)
    },
    resetPasswordExpiresIn: 3600, // 1 hour expiry for reset tokens
  },

  // Advanced options
  advanced: {
    cookiePrefix: 'hyvve',
    crossSubDomainCookies: {
      enabled: false,                 // Single domain for MVP
    },
  },

  // OAuth configuration - Google OAuth (Story 01.5), Microsoft OAuth (Story 09.1), GitHub OAuth (Story 09.2)
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      redirectURI: `${process.env.BETTER_AUTH_URL}/api/auth/callback/google`,
    },
    microsoft: {
      clientId: process.env.MICROSOFT_CLIENT_ID!,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
      redirectURI: `${process.env.BETTER_AUTH_URL}/api/auth/callback/microsoft`,
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      redirectURI: `${process.env.BETTER_AUTH_URL}/api/auth/callback/github`,
    },
  },
})

// Export type-safe auth client
export type Auth = typeof auth
