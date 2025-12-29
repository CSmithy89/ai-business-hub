/**
 * KB API Catch-All Route
 *
 * Proxies all Knowledge Base requests to NestJS backend with proper authentication.
 * This avoids CORS issues when browser calls backend directly.
 *
 * @see KB Module (bm-kb)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth-server';
import { NESTJS_API_URL } from '@/lib/api-config';

type RouteContext = { params: Promise<{ path: string[] }> };

async function handleRequest(
  request: NextRequest,
  context: RouteContext,
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
) {
  try {
    const session = await getSession();

    if (!session?.user || !session?.session?.token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { path } = await context.params;
    const pathString = path.join('/');
    const searchParams = request.nextUrl.searchParams;
    const backendUrl = new URL(`${NESTJS_API_URL}/kb/${pathString}`);

    // Forward all query parameters (use append to support multi-valued params)
    searchParams.forEach((value, key) => {
      backendUrl.searchParams.append(key, value);
    });

    // Get workspaceId from header or session
    const workspaceId =
      request.headers.get('x-workspace-id') || session.session.activeWorkspaceId;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.session.token}`,
    };

    if (workspaceId) {
      headers['x-workspace-id'] = workspaceId;
    }

    // Get request body for non-GET requests
    let body: string | undefined;
    if (method !== 'GET' && method !== 'DELETE') {
      try {
        const json = await request.json();
        body = JSON.stringify(json);
      } catch {
        // No body or invalid JSON
      }
    }

    try {
      const response = await fetch(backendUrl.toString(), {
        method,
        headers,
        body,
        cache: 'no-store',
      });

      // Handle different response types
      const contentType = response.headers.get('content-type');

      if (response.ok) {
        if (contentType?.includes('application/json')) {
          const data = await response.json();
          return NextResponse.json(data, {
            status: response.status,
            headers: { 'Cache-Control': 'no-store, max-age=0' },
          });
        }
        const text = await response.text();
        return new NextResponse(text, {
          status: response.status,
          headers: { 'Cache-Control': 'no-store, max-age=0' },
        });
      }

      if (response.status === 401) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401, headers: { 'Cache-Control': 'no-store, max-age=0' } }
        );
      }

      // Forward error response
      console.warn(`[KB API] Backend returned ${response.status} for ${method} /kb/${pathString}`);
      const errorBody = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorBody.message || `Request failed: ${response.statusText}` },
        { status: response.status }
      );
    } catch (backendError) {
      console.warn('[KB API] Backend unavailable:', backendError);
      return NextResponse.json({ error: 'Backend unavailable' }, { status: 503 });
    }
  } catch (error) {
    console.error('[KB API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest, context: RouteContext) {
  return handleRequest(request, context, 'GET');
}

export async function POST(request: NextRequest, context: RouteContext) {
  return handleRequest(request, context, 'POST');
}

export async function PUT(request: NextRequest, context: RouteContext) {
  return handleRequest(request, context, 'PUT');
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  return handleRequest(request, context, 'PATCH');
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  return handleRequest(request, context, 'DELETE');
}
