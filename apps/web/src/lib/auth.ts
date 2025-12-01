import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { organization } from 'better-auth/plugins'
import { prisma } from '@hyvve/db'

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

  // Plugins for multi-tenant organization support
  plugins: [
    organization({
      allowUserToCreateOrganization: true,
      // Role definitions will be fully implemented in Epic 02
    }),
  ],

  // Advanced options
  advanced: {
    cookiePrefix: 'hyvve',
    crossSubDomainCookies: {
      enabled: false,                 // Single domain for MVP
    },
  },

  // Email configuration (will be added in Story 01.2)
  // emailAndPassword: { ... }

  // OAuth configuration (will be added in Story 01.5)
  // socialProviders: {
  //   google: { ... }
  // }
})

// Export type-safe auth client
export type Auth = typeof auth
