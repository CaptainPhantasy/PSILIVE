import { google, calendar_v3 } from 'googleapis';

// Calendar configuration
const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || '';
const SLOT_DURATION_HOURS = 2.5; // 2.5 hour slots
const BUSINESS_START_HOUR = 7; // 7 AM
const BUSINESS_END_HOUR = 19.5; // 7:30 PM (last slot starts at 5 PM)
const MIN_BOOKING_DAYS_AHEAD = 1; // At least 1 day advance booking
const MAX_BOOKING_DAYS_AHEAD = 7; // Up to 7 days ahead

// Time zone
const TIMEZONE = 'America/Indianapolis';

// Service account credentials from environment
const SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || '';
const SERVICE_ACCOUNT_PRIVATE_KEY = (process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || '').replace(/\\n/g, '\n');

/**
 * Initialize Google Calendar client with service account credentials
 */
function getCalendarClient(): calendar_v3.Calendar {
  const auth = new google.auth.JWT({
    email: SERVICE_ACCOUNT_EMAIL,
    key: SERVICE_ACCOUNT_PRIVATE_KEY,
    scopes: ['https://www.googleapis.com/auth/calendar'],
  });

  return google.calendar({ version: 'v3', auth });
}

/**
 * Generate all possible time slots for a given date
 * Creates times in Indianapolis timezone (Eastern Time)
 */
function generateDaySlots(date: Date): Date[] {
  const slots: Date[] = [];
  
  // Get the date string in YYYY-MM-DD format
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  // Define time slots in local Indianapolis time
  // 7:00 AM, 9:30 AM, 12:00 PM, 2:30 PM, 5:00 PM
  const slotTimes = [
    { hour: 7, minute: 0 },
    { hour: 9, minute: 30 },
    { hour: 12, minute: 0 },
    { hour: 14, minute: 30 },
    { hour: 17, minute: 0 },
  ];
  
  for (const time of slotTimes) {
    // Create date string in Indianapolis timezone format
    const hourStr = String(time.hour).padStart(2, '0');
    const minuteStr = String(time.minute).padStart(2, '0');
    
    // Parse as a date in America/Indianapolis timezone
    // We'll use a workaround: create the date and adjust for timezone offset
    const dateTimeStr = `${year}-${month}-${day}T${hourStr}:${minuteStr}:00`;
    
    // Create date assuming it's in local time (server time)
    // Then we need to interpret it as Indianapolis time
    const localDate = new Date(dateTimeStr);
    
    // Get Indianapolis offset for this date (handles DST)
    const indianapolisDate = new Date(localDate.toLocaleString('en-US', { timeZone: TIMEZONE }));
    const offset = localDate.getTime() - indianapolisDate.getTime();
    
    // Adjust to get the correct UTC time for the Indianapolis local time
    const adjustedDate = new Date(localDate.getTime() + offset);
    
    slots.push(adjustedDate);
  }
  
  return slots;
}

/**
 * Format a Date to ISO string while preserving local timezone
 */
function toLocalISOString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
}

export interface TimeSlot {
  start: string; // ISO date string
  end: string; // ISO date string
  display: string; // Human readable like "7:00 AM - 9:30 AM"
  available: boolean;
}

export interface DayAvailability {
  date: string; // YYYY-MM-DD
  dayName: string;
  displayDate: string; // "March 13th, 2026"
  slots: TimeSlot[];
  hasAvailableSlots: boolean;
}

/**
 * Format time for display
 */
function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: TIMEZONE,
  });
}

/**
 * Format date for display
 */
function formatDisplayDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: TIMEZONE,
  });
}

/**
 * Get available time slots for the next N days
 */
export async function getAvailableSlots(daysAhead: number = MAX_BOOKING_DAYS_AHEAD): Promise<DayAvailability[]> {
  const calendar = getCalendarClient();
  
  // Calculate date range
  const now = new Date();
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() + MIN_BOOKING_DAYS_AHEAD);
  startDate.setHours(0, 0, 0, 0);
  
  const endDate = new Date(now);
  endDate.setDate(endDate.getDate() + daysAhead);
  endDate.setHours(23, 59, 59, 999);
  
  try {
    // Query freebusy to get all busy periods
    const freebusyResponse = await calendar.freebusy.query({
      requestBody: {
        timeMin: startDate.toISOString(),
        timeMax: endDate.toISOString(),
        timeZone: TIMEZONE,
        items: [{ id: CALENDAR_ID }],
      },
    });
    
    const busyPeriods = freebusyResponse.data.calendars?.[CALENDAR_ID]?.busy || [];
    
    // Generate availability for each day
    const availability: DayAvailability[] = [];
    
    const currentDay = new Date(startDate);
    while (currentDay <= endDate) {
      const daySlots = generateDaySlots(currentDay);
      
      const slotsWithAvailability: TimeSlot[] = daySlots.map(slotStart => {
        const slotEnd = new Date(slotStart);
        slotEnd.setMinutes(slotEnd.getMinutes() + SLOT_DURATION_HOURS * 60);
        
        // Check if this slot conflicts with any busy period
        const isAvailable = !busyPeriods.some(busy => {
          if (!busy.start || !busy.end) return false;
          const busyStart = new Date(busy.start);
          const busyEnd = new Date(busy.end);
          
          // Slot conflicts if it overlaps with busy period
          return slotStart < busyEnd && slotEnd > busyStart;
        });
        
        return {
          start: slotStart.toISOString(),
          end: slotEnd.toISOString(),
          display: `${formatTime(slotStart)} - ${formatTime(slotEnd)}`,
          available: isAvailable,
        };
      });
      
      // Format date in Indianapolis timezone
      const year = currentDay.getFullYear();
      const month = String(currentDay.getMonth() + 1).padStart(2, '0');
      const day = String(currentDay.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      
      availability.push({
        date: dateStr,
        dayName: currentDay.toLocaleDateString('en-US', { weekday: 'long' }),
        displayDate: currentDay.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        }),
        slots: slotsWithAvailability,
        hasAvailableSlots: slotsWithAvailability.some(s => s.available),
      });
      
      // Move to next day
      currentDay.setDate(currentDay.getDate() + 1);
    }
    
    return availability;
  } catch (error) {
    console.error('Error fetching calendar availability:', error);
    throw error;
  }
}

export interface BookingDetails {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  propertyAddress: string;
  serviceType: string;
  accessMethod: string;
  notes?: string;
  startTime: string; // ISO date string
}

/**
 * Create a calendar event for a booking
 */
export async function createBookingEvent(booking: BookingDetails): Promise<string> {
  const calendar = getCalendarClient();
  
  const startDate = new Date(booking.startTime);
  const endDate = new Date(startDate);
  endDate.setMinutes(endDate.getMinutes() + SLOT_DURATION_HOURS * 60);
  
  // Build event description with all customer details
  const description = `
**SEWER INSPECTION BOOKING**

📋 Customer Information:
• Name: ${booking.customerName}
• Phone: ${booking.customerPhone}
• Email: ${booking.customerEmail}

🏠 Service Address:
${booking.propertyAddress}

🔧 Service Details:
• Service Type: ${booking.serviceType}
• Access Method: ${booking.accessMethod}

📝 Notes:
${booking.notes || 'No additional notes'}

---
Booked via: precisionsewerinspections.com
`.trim();
  
  try {
    const event = await calendar.events.insert({
      calendarId: CALENDAR_ID,
      requestBody: {
        summary: `🔍 Sewer Inspection - ${booking.customerName}`,
        description,
        location: booking.propertyAddress,
        start: {
          dateTime: startDate.toISOString(),
          timeZone: TIMEZONE,
        },
        end: {
          dateTime: endDate.toISOString(),
          timeZone: TIMEZONE,
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 }, // 1 day before
            { method: 'popup', minutes: 60 }, // 1 hour before
          ],
        },
        // Add color for visibility (tomato = 11 for urgent/booked)
        colorId: '11',
      },
    });
    
    return event.data.id || '';
  } catch (error) {
    console.error('Error creating calendar event:', error);
    throw error;
  }
}

/**
 * Delete a calendar event (for cancellations)
 */
export async function deleteBookingEvent(eventId: string): Promise<void> {
  const calendar = getCalendarClient();
  
  try {
    await calendar.events.delete({
      calendarId: CALENDAR_ID,
      eventId,
    });
  } catch (error) {
    console.error('Error deleting calendar event:', error);
    throw error;
  }
}

/**
 * Check if a specific time slot is still available (double-check before booking)
 */
export async function isSlotAvailable(startTime: string): Promise<boolean> {
  const calendar = getCalendarClient();
  
  const startDate = new Date(startTime);
  const endDate = new Date(startDate);
  endDate.setMinutes(endDate.getMinutes() + SLOT_DURATION_HOURS * 60);
  
  try {
    const freebusyResponse = await calendar.freebusy.query({
      requestBody: {
        timeMin: startDate.toISOString(),
        timeMax: endDate.toISOString(),
        timeZone: TIMEZONE,
        items: [{ id: CALENDAR_ID }],
      },
    });
    
    const busyPeriods = freebusyResponse.data.calendars?.[CALENDAR_ID]?.busy || [];
    
    // Slot is available if no busy periods overlap
    return !busyPeriods.some(busy => {
      if (!busy.start || !busy.end) return false;
      const busyStart = new Date(busy.start);
      const busyEnd = new Date(busy.end);
      return startDate < busyEnd && endDate > busyStart;
    });
  } catch (error) {
    console.error('Error checking slot availability:', error);
    return false;
  }
}
