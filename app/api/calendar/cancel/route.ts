import { NextRequest, NextResponse } from 'next/server';
import { deleteBookingEvent } from '@/lib/google-calendar';

/**
 * Cancel a calendar booking by deleting the Google Calendar event.
 *
 * Two auth modes:
 * 1. Admin-initiated: Authorization header with CRON_SECRET (same secret used for cron jobs)
 * 2. Future: token-based customer cancellation (not yet implemented)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventId } = body;

    if (!eventId) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: eventId' },
        { status: 400 }
      );
    }

    // Require authorization via CRON_SECRET for admin-initiated cancellations
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      return NextResponse.json(
        { success: false, error: 'Server misconfiguration: missing CRON_SECRET' },
        { status: 503 }
      );
    }

    const providedSecret = authHeader?.startsWith('Bearer ')
      ? authHeader.slice(7)
      : null;

    if (providedSecret !== cronSecret) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await deleteBookingEvent(eventId);

    return NextResponse.json({
      success: true,
      message: 'Booking cancelled and calendar event removed',
    });
  } catch (error) {
    console.error('Error cancelling calendar booking:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to cancel booking. Please contact us directly.' },
      { status: 500 }
    );
  }
}