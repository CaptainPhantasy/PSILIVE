export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendAdminNotification } from "@/lib/notifications";

// This endpoint checks for leads that have been idle for 2+ minutes
// and sends admin notification emails for them.
// Called by the client after their inactivity timer fires.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionToken } = body;

    if (!sessionToken) {
      return NextResponse.json({ error: "Session token required" }, { status: 400 });
    }

    const lead = await prisma.leadCapture.findUnique({
      where: { sessionToken },
    });

    if (!lead) {
      return NextResponse.json({ success: true, message: "No lead found" });
    }

    // Skip if already notified or already converted
    if (lead.notificationSent || lead.converted) {
      return NextResponse.json({ success: true, message: "Already processed" });
    }

    // Must have contactable info
    if (!lead.email && !lead.phone) {
      return NextResponse.json({ success: true, message: "No contact info" });
    }

    // Check that last activity was at least 2 minutes ago
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
    if (lead.lastActivityAt > twoMinutesAgo) {
      return NextResponse.json({ success: true, message: "Still active" });
    }

    // Send admin notification
    {
      const infoRows = [
        lead.email ? `<tr><td style="padding:5px 0;"><strong>Email:</strong></td><td><a href="mailto:${lead.email}">${lead.email}</a></td></tr>` : '',
        lead.name ? `<tr><td style="padding:5px 0;"><strong>Name:</strong></td><td>${lead.name}</td></tr>` : '',
        lead.phone ? `<tr><td style="padding:5px 0;"><strong>Phone:</strong></td><td><a href="tel:${lead.phone}">${lead.phone}</a></td></tr>` : '',
        lead.address ? `<tr><td style="padding:5px 0;"><strong>Address:</strong></td><td>${lead.address}${lead.city ? ', ' + lead.city : ''}${lead.state ? ', ' + lead.state : ''} ${lead.zip || ''}</td></tr>` : '',
        lead.source ? `<tr><td style="padding:5px 0;"><strong>Source:</strong></td><td>${lead.source}</td></tr>` : '',
        lead.pageUrl ? `<tr><td style="padding:5px 0;"><strong>Page:</strong></td><td>${lead.pageUrl}</td></tr>` : '',
      ].filter(Boolean).join('\n');

      await sendAdminNotification({
        subject: `🔔 New Lead Captured: ${lead.email || lead.phone || 'Unknown'}`,
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #f59e0b; padding: 15px; border-radius: 8px 8px 0 0;">
              <h2 style="color: white; margin: 0;">🔔 New Lead — Did Not Complete Purchase</h2>
            </div>
            <div style="background: #fffbeb; padding: 20px; border-radius: 0 0 8px 8px; border: 1px solid #fde68a;">
              <p style="color: #92400e; margin-top: 0;">A visitor entered contact information but did not complete the booking/form. Follow up!</p>
              <table style="width: 100%; color: #374151;">
                ${infoRows}
              </table>
              <p style="color: #6b7280; font-size: 12px; margin-top: 15px;">Captured: ${lead.createdAt.toLocaleString()}</p>
            </div>
          </div>
        `,
      });
    }

    // Mark as notified
    await prisma.leadCapture.update({
      where: { id: lead.id },
      data: { notificationSent: true },
    });

    return NextResponse.json({ success: true, notified: true });
  } catch (error) {
    console.error("Error sending lead notification:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
