/**
 * PM Notification Mark as Read API Route
 *
 * Proxies mark-as-read requests to NestJS backend.
 *
 * @see Story PM-06.5: In-App Notifications
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth-server';
import { NESTJS_API_URL } from '@/lib/api-config';

/**
 * POST /api/pm/notifications/:id/read
 *
 * Marks a notification as read.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();

    if (!session?.user || !session?.session?.token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
      const response = await fetch(
        `${NESTJS_API_URL}/pm/notifications/${id}/read`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.session.token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        return NextResponse.json(data);
      }

      if (response.status === 401) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      if (response.status === 404) {
        return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
      }

      console.warn(`[PM Notifications API] Backend returned ${response.status}`);
      return NextResponse.json(
        { error: 'Failed to mark notification as read' },
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
      { error: 'Failed to mark notification as read' },
      { status: 500 }
    );
  }
}
