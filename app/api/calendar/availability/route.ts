import { NextResponse } from 'next/server';
import { getAvailableSlots } from '@/lib/google-calendar';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const availability = await getAvailableSlots(7); // 7 days ahead
    
    return NextResponse.json({
      success: true,
      availability,
    });
  } catch (error) {
    console.error('Error fetching calendar availability:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch availability. Please try again or call us directly.' 
      },
      { status: 500 }
    );
  }
}
