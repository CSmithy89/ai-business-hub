/**
 * Business API Route Integration Tests
 *
 * Tests the business creation and listing API endpoints.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, POST } from './route'

// Mock dependencies
vi.mock('@/lib/auth-server', () => ({
  getSession: vi.fn(),
}))

vi.mock('@hyvve/db', () => ({
  prisma: {
    business: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      count: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}))

import { getSession } from '@/lib/auth-server'
import { prisma } from '@hyvve/db'

const mockedGetSession = vi.mocked(getSession)
// Cast prisma methods to mock functions for better type inference
const mockFindMany = prisma.business.findMany as ReturnType<typeof vi.fn>
const mockCount = prisma.business.count as ReturnType<typeof vi.fn>
const mockTransaction = prisma.$transaction as ReturnType<typeof vi.fn>

// Test data
const mockSession = {
  user: {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    image: null,
    emailVerified: true,
  },
  session: {
    id: 'session-123',
    token: 'token-abc',
    expiresAt: new Date('2025-12-31'),
    activeWorkspaceId: 'workspace-456',
  },
}

const mockBusiness = {
  id: 'business-789',
  workspaceId: 'workspace-456',
  userId: 'user-123',
  name: 'Test Business',
  description: 'A test business description',
  stage: 'IDEA',
  onboardingStatus: 'VALIDATION',
  validationStatus: 'NOT_STARTED',
  planningStatus: 'NOT_STARTED',
  brandingStatus: 'NOT_STARTED',
  onboardingProgress: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
  validationData: {
    id: 'validation-123',
    businessId: 'business-789',
    ideaDescription: '{}',
    problemStatement: 'Test problem',
    targetCustomer: 'Test customers',
    proposedSolution: 'Test solution',
  },
}

// Helper to create mock request
function createRequest(method: string, url: string, body?: object): Request {
  return new Request(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
}

describe('GET /api/businesses', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return 401 when not authenticated', async () => {
    mockedGetSession.mockResolvedValue(null)

    const req = createRequest('GET', 'http://localhost/api/businesses')
    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.success).toBe(false)
    expect(data.error).toBe('UNAUTHORIZED')
  })

  it('should return 400 when no workspace is selected', async () => {
    mockedGetSession.mockResolvedValue({
      ...mockSession,
      session: { ...mockSession.session, activeWorkspaceId: null },
    })

    const req = createRequest('GET', 'http://localhost/api/businesses')
    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error).toBe('NO_WORKSPACE')
  })

  it('should return businesses with offset pagination', async () => {
    mockedGetSession.mockResolvedValue(mockSession)
    mockFindMany.mockResolvedValue([mockBusiness])
    mockCount.mockResolvedValue(1)

    const req = createRequest('GET', 'http://localhost/api/businesses?take=20&skip=0')
    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data).toHaveLength(1)
    expect(data.pagination.paginationType).toBe('offset')
    expect(data.pagination.total).toBe(1)
    expect(data.pagination.hasMore).toBe(false)
  })

  it('should return businesses with cursor pagination', async () => {
    mockedGetSession.mockResolvedValue(mockSession)
    mockFindMany.mockResolvedValue([mockBusiness])

    const req = createRequest(
      'GET',
      'http://localhost/api/businesses?take=20&cursor=prev-business-id'
    )
    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.pagination.paginationType).toBe('cursor')
    expect(data.pagination.hasMore).toBe(false)
  })

  it('should handle cursor pagination with more results', async () => {
    mockedGetSession.mockResolvedValue(mockSession)
    // Return take+1 items to indicate more results
    const manyBusinesses = Array(21)
      .fill(null)
      .map((_, i) => ({
        ...mockBusiness,
        id: `business-${i}`,
      }))
    mockFindMany.mockResolvedValue(manyBusinesses)

    const req = createRequest(
      'GET',
      'http://localhost/api/businesses?take=20&cursor=prev-business-id'
    )
    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.pagination.hasMore).toBe(true)
    expect(data.pagination.nextCursor).toBeDefined()
    expect(data.data).toHaveLength(20)
  })

  it('should respect max page size limit', async () => {
    mockedGetSession.mockResolvedValue(mockSession)
    mockFindMany.mockResolvedValue([])
    mockCount.mockResolvedValue(0)

    const req = createRequest('GET', 'http://localhost/api/businesses?take=500')
    await GET(req)

    // Should cap at 100 (MAX_PAGE_SIZE)
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 100 })
    )
  })

  it('should handle database errors gracefully', async () => {
    mockedGetSession.mockResolvedValue(mockSession)
    mockFindMany.mockRejectedValue(new Error('DB connection failed'))

    const req = createRequest('GET', 'http://localhost/api/businesses')
    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
    expect(data.error).toBe('INTERNAL_ERROR')
  })
})

describe('POST /api/businesses', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const validBusinessData = {
    name: 'My New Business',
    description: 'A description that is long enough to pass validation.',
    hasDocuments: false,
    ideaDescription: {
      problemStatement: 'A problem that needs solving.',
      targetCustomer: 'Target audience here.',
      proposedSolution: 'My solution approach to the problem.',
    },
  }

  it('should return 401 when not authenticated', async () => {
    mockedGetSession.mockResolvedValue(null)

    const req = createRequest('POST', 'http://localhost/api/businesses', validBusinessData)
    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.success).toBe(false)
    expect(data.error).toBe('UNAUTHORIZED')
  })

  it('should return 400 when no workspace is selected', async () => {
    mockedGetSession.mockResolvedValue({
      ...mockSession,
      session: { ...mockSession.session, activeWorkspaceId: null },
    })

    const req = createRequest('POST', 'http://localhost/api/businesses', validBusinessData)
    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error).toBe('NO_WORKSPACE')
  })

  it('should return 400 for invalid data', async () => {
    mockedGetSession.mockResolvedValue(mockSession)

    const invalidData = {
      name: 'AB', // Too short
      description: 'A description that is long enough.',
      hasDocuments: false,
      ideaDescription: {
        problemStatement: 'A problem.',
        targetCustomer: 'Target.',
        proposedSolution: 'Solution.',
      },
    }

    const req = createRequest('POST', 'http://localhost/api/businesses', invalidData)
    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error).toBe('VALIDATION_ERROR')
    expect(data.details).toBeDefined()
  })

  it('should create business successfully', async () => {
    mockedGetSession.mockResolvedValue(mockSession)
    mockTransaction.mockImplementation(async (fn) => {
      // Mock the transaction callback
      const mockTx = {
        business: {
          findUnique: vi.fn().mockResolvedValue(null),
          create: vi.fn().mockResolvedValue(mockBusiness),
        },
      }
      return fn(mockTx as any)
    })

    const req = createRequest('POST', 'http://localhost/api/businesses', validBusinessData)
    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.success).toBe(true)
    expect(data.data).toBeDefined()
    expect(data.data.name).toBe('Test Business')
  })

  it('should return 409 for duplicate business name', async () => {
    mockedGetSession.mockResolvedValue(mockSession)
    mockTransaction.mockImplementation(async () => {
      throw new Error('DUPLICATE_NAME')
    })

    const req = createRequest('POST', 'http://localhost/api/businesses', validBusinessData)
    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(409)
    expect(data.success).toBe(false)
    expect(data.error).toBe('DUPLICATE_NAME')
  })

  it('should return 409 for Prisma P2002 unique constraint violation', async () => {
    mockedGetSession.mockResolvedValue(mockSession)
    const prismaError = new Error('Unique constraint failed') as Error & { code: string }
    prismaError.code = 'P2002'
    mockTransaction.mockRejectedValue(prismaError)

    const req = createRequest('POST', 'http://localhost/api/businesses', validBusinessData)
    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(409)
    expect(data.success).toBe(false)
    expect(data.error).toBe('DUPLICATE_NAME')
  })

  it('should set onboardingStatus to WIZARD when hasDocuments is true', async () => {
    mockedGetSession.mockResolvedValue(mockSession)

    let capturedCreateData: any = null
    mockTransaction.mockImplementation(async (fn) => {
      const mockTx = {
        business: {
          findUnique: vi.fn().mockResolvedValue(null),
          create: vi.fn().mockImplementation((data) => {
            capturedCreateData = data
            return {
              ...mockBusiness,
              onboardingStatus: 'WIZARD',
            }
          }),
        },
      }
      return fn(mockTx as any)
    })

    const dataWithDocuments = { ...validBusinessData, hasDocuments: true }
    const req = createRequest('POST', 'http://localhost/api/businesses', dataWithDocuments)
    await POST(req)

    expect(capturedCreateData.data.onboardingStatus).toBe('WIZARD')
  })

  it('should set onboardingStatus to VALIDATION when hasDocuments is false', async () => {
    mockedGetSession.mockResolvedValue(mockSession)

    let capturedCreateData: any = null
    mockTransaction.mockImplementation(async (fn) => {
      const mockTx = {
        business: {
          findUnique: vi.fn().mockResolvedValue(null),
          create: vi.fn().mockImplementation((data) => {
            capturedCreateData = data
            return mockBusiness
          }),
        },
      }
      return fn(mockTx as any)
    })

    const req = createRequest('POST', 'http://localhost/api/businesses', validBusinessData)
    await POST(req)

    expect(capturedCreateData.data.onboardingStatus).toBe('VALIDATION')
  })

  it('should handle database errors gracefully', async () => {
    mockedGetSession.mockResolvedValue(mockSession)
    mockTransaction.mockRejectedValue(new Error('DB connection failed'))

    const req = createRequest('POST', 'http://localhost/api/businesses', validBusinessData)
    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
    expect(data.error).toBe('INTERNAL_ERROR')
  })

  it('should preserve business name as-is (trimming done by form)', async () => {
    // Note: Whitespace trimming should be handled at form submission layer
    // The API accepts the name as-is from the validated input
    mockedGetSession.mockResolvedValue(mockSession)

    let capturedCreateData: any = null
    mockTransaction.mockImplementation(async (fn) => {
      const mockTx = {
        business: {
          findUnique: vi.fn().mockResolvedValue(null),
          create: vi.fn().mockImplementation((data) => {
            capturedCreateData = data
            return mockBusiness
          }),
        },
      }
      return fn(mockTx as any)
    })

    const dataWithWhitespace = {
      ...validBusinessData,
      name: '  Spaced Business Name  ',
    }
    const req = createRequest('POST', 'http://localhost/api/businesses', dataWithWhitespace)
    await POST(req)

    // Name is passed through as-is - trimming happens at form layer
    expect(capturedCreateData.data.name).toBe('  Spaced Business Name  ')
  })
})
