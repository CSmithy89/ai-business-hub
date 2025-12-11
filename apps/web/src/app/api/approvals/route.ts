/**
 * Approvals API Route
 *
 * Provides approval items with demo data fallback when NestJS backend
 * is unavailable or mock mode is enabled.
 *
 * Story: 15.5 - Fix Approvals Page Data Loading
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth-server';
import { IS_MOCK_DATA_ENABLED, NESTJS_API_URL } from '@/lib/api-config';
import { getDemoApprovals, DEMO_APPROVAL_STATS } from '@/lib/demo-data/approvals';

interface ApprovalQueryParams {
  status?: string;
  type?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

/**
 * GET /api/approvals
 *
 * Fetches approval items with filtering and pagination.
 * Falls back to demo data when NestJS backend is unavailable.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const params: ApprovalQueryParams = {
      status: searchParams.get('status') || undefined,
      type: searchParams.get('type') || undefined,
      sortBy: searchParams.get('sortBy') || 'createdAt',
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
      page: parseInt(searchParams.get('page') || '1', 10),
      limit: parseInt(searchParams.get('limit') || '20', 10),
    };

    // Try to fetch from NestJS backend first (unless mock mode is explicitly enabled)
    if (!IS_MOCK_DATA_ENABLED) {
      try {
        const backendUrl = new URL(`${NESTJS_API_URL}/api/approvals`);

        // Forward query parameters
        if (params.status) backendUrl.searchParams.set('status', params.status);
        if (params.type) backendUrl.searchParams.set('type', params.type);
        if (params.sortBy) backendUrl.searchParams.set('sortBy', params.sortBy);
        if (params.sortOrder) backendUrl.searchParams.set('sortOrder', params.sortOrder);
        if (params.page) backendUrl.searchParams.set('page', params.page.toString());
        if (params.limit) backendUrl.searchParams.set('limit', params.limit.toString());

        const response = await fetch(backendUrl.toString(), {
          headers: {
            'Content-Type': 'application/json',
            // Forward auth headers if available
            ...(request.headers.get('cookie') && {
              Cookie: request.headers.get('cookie')!,
            }),
          },
          // Don't cache backend responses
          cache: 'no-store',
        });

        if (response.ok) {
          const data = await response.json();
          return NextResponse.json(data, {
            headers: { 'Cache-Control': 'no-store, max-age=0' },
          });
        }

        // If backend returns error but we can fall back to demo data
        if (response.status !== 401) {
          console.warn(
            `[Approvals API] Backend returned ${response.status}, falling back to demo data`
          );
        } else {
          // 401 from backend should be passed through
          return NextResponse.json(
            { error: 'Unauthorized' },
            { status: 401, headers: { 'Cache-Control': 'no-store, max-age=0' } }
          );
        }
      } catch (backendError) {
        console.warn('[Approvals API] Backend unavailable, falling back to demo data:', backendError);
      }
    }

    // Use demo data as fallback
    console.info('[Approvals API] Using demo data');

    let approvals = getDemoApprovals(params.status);

    // Apply type filter
    if (params.type) {
      approvals = approvals.filter((a) => a.type === params.type);
    }

    // Apply sorting
    approvals.sort((a, b) => {
      const aVal = a[params.sortBy as keyof typeof a];
      const bVal = b[params.sortBy as keyof typeof b];

      if (aVal instanceof Date && bVal instanceof Date) {
        return params.sortOrder === 'asc'
          ? aVal.getTime() - bVal.getTime()
          : bVal.getTime() - aVal.getTime();
      }

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return params.sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
      }

      return 0;
    });

    // Apply pagination
    const total = approvals.length;
    const startIndex = (params.page! - 1) * params.limit!;
    const endIndex = startIndex + params.limit!;
    const paginatedApprovals = approvals.slice(startIndex, endIndex);

    return NextResponse.json(
      {
        data: paginatedApprovals,
        meta: {
          total,
          page: params.page!,
          limit: params.limit!,
          totalPages: Math.ceil(total / params.limit!),
        },
        _demo: true, // Flag to indicate demo data is being used
      },
      {
        headers: { 'Cache-Control': 'no-store, max-age=0' },
      }
    );
  } catch (error) {
    console.error('[Approvals API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch approvals' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/approvals/stats
 *
 * Returns approval statistics summary.
 */
export async function POST() {
  try {
    const session = await getSession();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // This endpoint is not needed for demo, but included for completeness
    return NextResponse.json(
      { data: DEMO_APPROVAL_STATS },
      {
        headers: { 'Cache-Control': 'no-store, max-age=0' },
      }
    );
  } catch (error) {
    console.error('[Approvals API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to get stats' },
      { status: 500 }
    );
  }
}
