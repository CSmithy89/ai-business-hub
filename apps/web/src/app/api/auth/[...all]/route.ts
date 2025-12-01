import { auth } from '@/lib/auth'

// Export GET and POST handlers for Next.js App Router
// better-auth provides a single handler function that we expose for both methods
export async function GET(request: Request) {
  return auth.handler(request)
}

export async function POST(request: Request) {
  return auth.handler(request)
}
