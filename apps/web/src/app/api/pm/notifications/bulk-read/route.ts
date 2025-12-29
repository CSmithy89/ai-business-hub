/**
 * PM Notifications Bulk Read API Route
 *
 * Proxies bulk mark-as-read requests to NestJS backend.
 *
 * @see Story PM-06.5: In-App Notifications
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth-server';
import { NESTJS_API_URL } from '@/lib/api-config';

/**
 * POST /api/pm/notifications/bulk-read
 *
 * Marks multiple notifications as read.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.user || !session?.session?.token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    try {
      const response = await fetch(
        `${NESTJS_API_URL}/pm/notifications/bulk-read`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.session.token}`,
          },
          body: JSON.stringify(body),
        }
      );

      if (response.ok) {
        const data = await response.json();
        return NextResponse.json(data);
      }

      if (response.status === 401) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      console.warn(`[PM Notifications API] Backend returned ${response.status}`);
      return NextResponse.json(
        { error: 'Failed to mark notifications as read' },
        { status: response.status }
      );
    } catch (backendError) {
      console.warn('[PM Notifications API] Backend unavailable:', backendError);
      return NextResponse.json(
        { error: 'Backend unavailable' },
        { status: 503 }
      );
    }
  } catch (error) {
    console.error('[PM Notifications API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to mark notifications as read' },
      { status: 500 }
    );
  }
}
