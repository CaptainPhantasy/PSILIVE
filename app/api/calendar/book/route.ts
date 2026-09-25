import { NextRequest, NextResponse } from 'next/server';
import { createBookingEvent, isSlotAvailable } from '@/lib/google-calendar';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      customerName,
      customerEmail,
      customerPhone,
      propertyAddress,
      serviceType,
      accessMethod,
      notes,
      startTime,
    } = body;

    // Validate required fields
    if (!customerName || !customerEmail || !customerPhone || !propertyAddress || !startTime) {
      return NextResponse.json(
        { success: false, error: 'Missing required booking information' },
        { status: 400 }
      );
    }

    // Double-check slot is still available (prevent race conditions)
    const stillAvailable = await isSlotAvailable(startTime);
    if (!stillAvailable) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'This time slot is no longer available. Please select another time.' 
        },
        { status: 409 } // Conflict
      );
    }

    // Create the calendar event
    const eventId = await createBookingEvent({
      customerName,
      customerEmail,
      customerPhone,
      propertyAddress,
      serviceType: serviceType || 'Residential Inspection',
      accessMethod: accessMethod || 'Standard Cleanout',
      notes,
      startTime,
    });

    return NextResponse.json({
      success: true,
      eventId,
      message: 'Booking confirmed and added to calendar',
    });
  } catch (error) {
    console.error('Error creating calendar booking:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create booking. Please contact us directly.' 
      },
      { status: 500 }
    );
  }
}
