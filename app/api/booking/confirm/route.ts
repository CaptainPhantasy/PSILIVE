import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createBookingEvent, isSlotAvailable } from '@/lib/google-calendar';

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Retrieve the Stripe session to get booking metadata
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      return NextResponse.json(
        { success: false, error: 'Payment not completed' },
        { status: 400 }
      );
    }

    const metadata = session.metadata || {};
    const {
      customerName,
      customerPhone,
      propertyAddress,
      accessMethod,
      sewerAccessMethod,
      message,
      appointmentStart,
      appointmentDisplay,
      serviceType,
    } = metadata;

    // If no appointment was selected, skip calendar booking
    if (!appointmentStart) {
      return NextResponse.json({
        success: true,
        message: 'Payment confirmed. No appointment time was selected - we will contact you to schedule.',
        calendarBooked: false,
      });
    }

    // Double-check the slot is still available
    const stillAvailable = await isSlotAvailable(appointmentStart);
    if (!stillAvailable) {
      // Slot was taken - we'll need to contact customer to reschedule
      return NextResponse.json({
        success: true,
        message: 'Payment confirmed! However, the selected time slot is no longer available. We will contact you shortly to reschedule.',
        calendarBooked: false,
        needsReschedule: true,
      });
    }

    // Create the calendar event
    const eventId = await createBookingEvent({
      customerName: customerName || 'Customer',
      customerEmail: session.customer_email || '',
      customerPhone: customerPhone || '',
      propertyAddress: propertyAddress || '',
      serviceType: serviceType || 'Sewer Inspection',
      accessMethod: accessMethod || sewerAccessMethod || 'Standard',
      notes: message,
      startTime: appointmentStart,
    });

    return NextResponse.json({
      success: true,
      message: 'Booking confirmed and added to calendar',
      calendarBooked: true,
      eventId,
      appointment: {
        date: appointmentStart,
        display: appointmentDisplay,
      },
    });
  } catch (error) {
    console.error('Error confirming booking:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to confirm booking' },
      { status: 500 }
    );
  }
}
