// Email notification utilities
// Uses Hostinger SMTP via nodemailer (replaced Abacus notification API)

import nodemailer from "nodemailer";
import { getSiteUrl } from "./site-url";

// Admin email recipients
export const ADMIN_EMAILS = [
  "Ryan@PrecisionSewerInspections.com",
  "Douglas@PrecisionSewerInspections.com",
];

// SMTP transport — lazily created on first use
let _transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (_transporter) return _transporter;

  _transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.hostinger.com",
    port: Number(process.env.SMTP_PORT) || 465,
    secure: true, // port 465 = implicit TLS
    auth: {
      user: process.env.SMTP_USER || "noreply@precisionsewerinspections.com",
      pass: process.env.SMTP_PASSWORD,
    },
  });

  return _transporter;
}

interface NotificationEmailParams {
  recipientEmail: string;
  recipientName?: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
}

/** Send notification email via Hostinger SMTP. */
export async function sendNotificationEmail(
  params: NotificationEmailParams
): Promise<{ success: boolean; error?: string }> {
  try {
    const transporter = getTransporter();

    const fromAddress =
      process.env.SMTP_FROM || process.env.SMTP_USER || "noreply@precisionsewerinspections.com";

    await transporter.sendMail({
      from: `"Precision Sewer Inspections" <${fromAddress}>`,
      to: params.recipientName
        ? `${params.recipientName} <${params.recipientEmail}>`
        : params.recipientEmail,
      subject: params.subject,
      html: params.htmlContent,
      text: params.textContent || undefined,
    });

    return { success: true };
  } catch (error) {
    console.error("Error sending notification email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send email",
    };
  }
}

// Send admin notification to all admin emails
export async function sendAdminNotification(
  params: Omit<NotificationEmailParams, "recipientEmail">
): Promise<{ success: boolean; results: Array<{ email: string; success: boolean; error?: string }> }> {
  const settledResults = await Promise.allSettled(
    ADMIN_EMAILS.map(async (email) => {
      const result = await sendNotificationEmail({
        ...params,
        recipientEmail: email,
      });

      return { email, ...result };
    })
  );

  const results = settledResults.map((result, i) => {
    if (result.status === "rejected") {
      const error = result.reason instanceof Error ? result.reason.message : "Unknown admin notification error";
      console.error(`Failed to send admin notification to ${ADMIN_EMAILS[i]}:`, error);
      return { email: ADMIN_EMAILS[i], success: false, error };
    }

    if (!result.value.success) {
      console.error(`Failed to send admin notification to ${ADMIN_EMAILS[i]}:`, result.value.error);
    }

    return result.value;
  });

  return {
    success: results.every((result) => result.success),
    results,
  };
}

// Email templates
export function getInspectionSubmittedEmail(data: {
  inspectionNumber: string;
  technicianName: string;
  propertyAddress: string;
  clientName: string;
  submittedAt: Date;
}): { subject: string; htmlContent: string } {
  return {
    subject: `New Inspection Submitted: ${data.inspectionNumber}`,
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a365d;">New Inspection Ready for Review</h2>
        <div style="background: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Inspection #:</strong> ${data.inspectionNumber}</p>
          <p><strong>Technician:</strong> ${data.technicianName}</p>
          <p><strong>Property:</strong> ${data.propertyAddress}</p>
          <p><strong>Client:</strong> ${data.clientName}</p>
          <p><strong>Submitted:</strong> ${data.submittedAt.toLocaleString()}</p>
        </div>
        <p>Please review this inspection in the admin dashboard.</p>
        <a href="${getSiteUrl()}/admin/inspections" 
           style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; 
                  text-decoration: none; border-radius: 6px; margin-top: 10px;">
          Review Inspection
        </a>
      </div>
    `,
  };
}

export function getVideoReadyEmail(data: {
  clientName: string;
  propertyAddress: string;
  downloadUrl: string;
  expiresAt: Date;
  // Enhanced fields
  videoDuration?: number | null;
  overallCondition?: string | null;
  findingsCount?: number;
  urgencyLevel?: string | null;
  downloadLimit?: number;
}): { subject: string; htmlContent: string } {
  // Format video duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const durationText = data.videoDuration ? formatDuration(data.videoDuration) : "Full length";
  
  // Get condition color
  const getConditionStyle = (condition: string | null) => {
    if (!condition) return "color: #6b7280;";
    switch (condition.toUpperCase()) {
      case "EXCELLENT":
      case "GOOD":
        return "color: #059669; font-weight: bold;";
      case "FAIR":
        return "color: #d97706; font-weight: bold;";
      case "POOR":
      case "CRITICAL":
        return "color: #dc2626; font-weight: bold;";
      default:
        return "color: #6b7280;";
    }
  };

  const urgencyText = data.urgencyLevel 
    ? data.urgencyLevel.replace("_", " ") 
    : "Monitor - No immediate action required";

  return {
    subject: `Your Sewer Inspection Video is Ready - Download Now`,
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
        <!-- Logo Header -->
        <div style="text-align: center; padding: 20px; background: #1e40af;">
          <h1 style="color: white; margin: 0; font-size: 24px;">🔗 Your Sewer Inspection Video Is Ready</h1>
        </div>

        <div style="padding: 30px;">
          <p style="font-size: 16px; color: #374151;">Hi ${data.clientName},</p>
          
          <p style="font-size: 16px; color: #374151;">
            Your sewer inspection at <strong>${data.propertyAddress}</strong> is complete and your video is ready to view.
          </p>
          
          <!-- Main CTA Button -->
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.downloadUrl}" 
               style="display: inline-block; background: #059669; color: white; padding: 18px 40px; 
                      text-decoration: none; border-radius: 8px; font-size: 18px; font-weight: bold;">
              🔗 VIEW YOUR INSPECTION VIDEO
            </a>
          </div>
          
          <!-- What's Included -->
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #374151; margin-top: 0;">What's Included:</h3>
            <ul style="color: #4b5563; margin: 0; padding-left: 20px;">
              <li>✓ Full HD inspection video (${durationText})</li>
              <li>✓ Highlight reel of key findings</li>
              <li>✓ Detailed PDF report</li>
              <li>✓ Clickable chapter markers</li>
            </ul>
          </div>

          <!-- Quick Summary -->
          <div style="background: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb;">
            <h3 style="color: #1e40af; margin-top: 0;">Quick Summary:</h3>
            <table style="width: 100%; color: #374151;">
              <tr>
                <td style="padding: 5px 0;"><strong>Overall Condition:</strong></td>
                <td style="padding: 5px 0; ${getConditionStyle(data.overallCondition || null)}">${data.overallCondition?.replace("_", " ") || "See Report"}</td>
              </tr>
              <tr>
                <td style="padding: 5px 0;"><strong>Findings:</strong></td>
                <td style="padding: 5px 0;">${data.findingsCount || 0} items documented</td>
              </tr>
              <tr>
                <td style="padding: 5px 0;"><strong>Urgency:</strong></td>
                <td style="padding: 5px 0;">${urgencyText}</td>
              </tr>
            </table>
          </div>
          
          <!-- Important Notice -->
          <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
            <p style="margin: 0; color: #92400e; font-size: 14px;">
              <strong>⚠️ IMPORTANT:</strong><br>
              • This link expires: <strong>${data.expiresAt.toLocaleDateString()} at ${data.expiresAt.toLocaleTimeString()}</strong><br>
              • Downloads remaining: <strong>${data.downloadLimit || 3}</strong><br>
              • Videos are removed after 7 days - download promptly!<br>
              • Report issues within 48 hours
            </p>
          </div>
          
          <!-- Footer -->
          <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
            <p style="color: #6b7280; font-size: 14px;">
              Questions? Call <a href="tel:3176203858" style="color: #2563eb;">(317) 620-3858</a> or reply to this email.
            </p>
            <p style="color: #9ca3af; font-size: 12px; margin-top: 20px;">
              Precision Sewer Inspections<br>
              Indianapolis, IN<br>
              <a href="https://precisionsewerinspections.com" style="color: #9ca3af;">precisionsewerinspections.com</a>
            </p>
          </div>
        </div>
      </div>
    `,
  };
}

export function getExpirationReminderEmail(data: {
  clientName: string;
  propertyAddress: string;
  downloadUrl: string;
  hoursRemaining: number;
}): { subject: string; htmlContent: string } {
  return {
    subject: `⏰ Your Inspection Download Expires Soon - ${data.hoursRemaining} Hours Left`,
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Your Download Link Expires Soon!</h2>
        <p>Dear ${data.clientName},</p>
        <p>This is a reminder that your sewer inspection download for <strong>${data.propertyAddress}</strong> will expire in <strong>${data.hoursRemaining} hours</strong>.</p>
        
        <a href="${data.downloadUrl}" 
           style="display: inline-block; background: #dc2626; color: white; padding: 16px 32px; 
                  text-decoration: none; border-radius: 8px; font-size: 18px; margin: 20px 0;">
          Download Now Before It Expires
        </a>
        
        <p style="color: #6b7280;">Once expired, you will need to contact us to request a new download link.</p>
        
        <p style="color: #6b7280; margin-top: 30px;">Questions? Call us at <a href="tel:3176203858">(317) 620-3858</a></p>
      </div>
    `,
  };
}

export function getInspectionReturnedEmail(data: {
  technicianName: string;
  inspectionNumber: string;
  propertyAddress: string;
  reason: string;
  rejectedStage?: string;
}): { subject: string; htmlContent: string } {
  const stageSection = data.rejectedStage 
    ? `<p><strong>Section to Redo:</strong> <span style="color: #dc2626; font-weight: bold;">${data.rejectedStage}</span></p>`
    : '';
  
  return {
    subject: `Inspection ${data.inspectionNumber} Returned - ${data.rejectedStage || 'Corrections Needed'}`,
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Inspection Returned for Corrections</h2>
        <p>Hi ${data.technicianName},</p>
        <p>Your inspection submission has been returned for corrections:</p>
        
        <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
          <p><strong>Inspection #:</strong> ${data.inspectionNumber}</p>
          <p><strong>Property:</strong> ${data.propertyAddress}</p>
          ${stageSection}
          <p><strong>Reason:</strong> ${data.reason}</p>
        </div>
        
        ${data.rejectedStage ? `
        <p style="background: #fef9c3; padding: 12px; border-radius: 6px; border-left: 4px solid #ca8a04;">
          <strong>Note:</strong> Only the "${data.rejectedStage}" section has been unlocked for editing. 
          Please make the necessary corrections and resubmit.
        </p>
        ` : '<p>Please address the issues and resubmit when ready.</p>'}
      </div>
    `,
  };
}

// --- Payment Received (Admin) ---
export function getPaymentReceivedEmail(data: {
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  amount: number;
  propertyAddress: string;
  accessMethod: string;
  promoCode?: string;
  stripeSessionId: string;
  appointmentDisplay?: string;
  occupancy?: string;
  cleanoutLocation?: string;
  buyersAgent?: string;
  listingAgent?: string;
  howHeardAboutUs?: string;
  directions?: string;
}): { subject: string; htmlContent: string } {
  const optionalRows = [
    data.customerPhone ? `<tr><td style="padding: 5px 0;"><strong>Phone:</strong></td><td><a href="tel:${data.customerPhone}">${data.customerPhone}</a></td></tr>` : '',
    `<tr><td style="padding: 5px 0;"><strong>Property:</strong></td><td>${data.propertyAddress}</td></tr>`,
    `<tr><td style="padding: 5px 0;"><strong>Access Method:</strong></td><td>${data.accessMethod}</td></tr>`,
    data.occupancy ? `<tr><td style="padding: 5px 0;"><strong>Occupancy:</strong></td><td>${data.occupancy}</td></tr>` : '',
    data.cleanoutLocation ? `<tr><td style="padding: 5px 0;"><strong>Cleanout Location:</strong></td><td>${data.cleanoutLocation}</td></tr>` : '',
    data.appointmentDisplay ? `<tr><td style="padding: 5px 0;"><strong>Appointment:</strong></td><td>${data.appointmentDisplay}</td></tr>` : '',
    data.buyersAgent ? `<tr><td style="padding: 5px 0;"><strong>Buyer's Agent:</strong></td><td>${data.buyersAgent}</td></tr>` : '',
    data.listingAgent ? `<tr><td style="padding: 5px 0;"><strong>Listing Agent:</strong></td><td>${data.listingAgent}</td></tr>` : '',
    data.howHeardAboutUs ? `<tr><td style="padding: 5px 0;"><strong>How They Heard:</strong></td><td>${data.howHeardAboutUs}</td></tr>` : '',
    data.promoCode ? `<tr><td style="padding: 5px 0;"><strong>Promo Code:</strong></td><td>${data.promoCode}</td></tr>` : '',
    data.directions ? `<tr><td style="padding: 5px 0;"><strong>Directions/Notes:</strong></td><td>${data.directions}</td></tr>` : '',
  ].filter(Boolean).join('\n            ');

  return {
    subject: `💰 Payment Received: $${data.amount.toFixed(2)} from ${data.customerName}`,
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #059669; padding: 15px; border-radius: 8px 8px 0 0;">
          <h2 style="color: white; margin: 0;">💰 Payment Received</h2>
        </div>
        <div style="background: #f0fdf4; padding: 20px; border-radius: 0 0 8px 8px; border: 1px solid #bbf7d0;">
          <p style="font-size: 24px; font-weight: bold; color: #059669; margin: 0 0 15px;">$${data.amount.toFixed(2)}</p>
          <table style="width: 100%; color: #374151;">
            <tr><td style="padding: 5px 0;"><strong>Customer:</strong></td><td>${data.customerName}</td></tr>
            <tr><td style="padding: 5px 0;"><strong>Email:</strong></td><td><a href="mailto:${data.customerEmail}">${data.customerEmail}</a></td></tr>
            ${optionalRows}
          </table>
          <p style="color: #6b7280; font-size: 12px; margin-top: 15px;">Stripe Session: ${data.stripeSessionId}</p>
        </div>
      </div>
    `,
  };
}

// --- Booking Confirmation (Client) ---
export function getBookingConfirmationEmail(data: {
  customerName: string;
  serviceType: string;
  propertyAddress?: string;
  message?: string;
  phone?: string;
  source?: string;
}): { subject: string; htmlContent: string } {
  const optionalRows: string[] = [];
  if (data.propertyAddress) optionalRows.push(`<p><strong>Property:</strong> ${data.propertyAddress}</p>`);
  if (data.phone) optionalRows.push(`<p><strong>Phone on file:</strong> ${data.phone}</p>`);
  if (data.source && data.source !== 'website') optionalRows.push(`<p><strong>Request Type:</strong> ${data.source.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</p>`);

  return {
    subject: `Booking Request Received — Precision Sewer Inspections`,
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
        <div style="text-align: center; padding: 20px; background: #1e40af;">
          <h1 style="color: white; margin: 0; font-size: 22px;">Thanks for Reaching Out, ${data.customerName}!</h1>
        </div>
        <div style="padding: 30px;">
          <p style="font-size: 16px; color: #374151;">We've received your inspection request and will get back to you within <strong>a few hours</strong> (typically much faster).</p>
          
          <div style="background: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb;">
            <h3 style="color: #1e40af; margin-top: 0;">What You Requested:</h3>
            <p><strong>Service:</strong> ${data.serviceType}</p>
            ${optionalRows.join('\n            ')}
          </div>

          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #374151; margin-top: 0;">What Happens Next:</h3>
            <ol style="color: #4b5563; margin: 0; padding-left: 20px;">
              <li>We review your request and confirm availability</li>
              <li>We'll reach out to finalize scheduling</li>
              <li>An inspector performs your inspection</li>
              <li>You receive HD video + detailed report</li>
            </ol>
          </div>

          <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
            <p style="color: #6b7280; font-size: 14px;">
              Questions in the meantime? Call <a href="tel:3176203858" style="color: #2563eb;">(317) 620-3858</a> or reply to this email.
            </p>
            <p style="color: #9ca3af; font-size: 12px; margin-top: 20px;">
              Precision Sewer Inspections · Indianapolis, IN<br>
              <a href="https://precisionsewerinspections.com" style="color: #9ca3af;">precisionsewerinspections.com</a>
            </p>
          </div>
        </div>
      </div>
    `,
  };
}

// --- Payment Receipt (Client) ---
export function getPaymentReceiptEmail(data: {
  customerName: string;
  amount: number;
  propertyAddress: string;
  accessMethod: string;
  appointmentDisplay?: string;
  promoCode?: string;
  discountAmount?: number;
}): { subject: string; htmlContent: string } {
  return {
    subject: `Payment Confirmed — $${data.amount.toFixed(2)} | Precision Sewer Inspections`,
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
        <div style="text-align: center; padding: 20px; background: #1e40af;">
          <h1 style="color: white; margin: 0; font-size: 22px;">Payment Confirmed ✓</h1>
        </div>
        <div style="padding: 30px;">
          <p style="font-size: 16px; color: #374151;">Hi ${data.customerName},</p>
          <p style="font-size: 16px; color: #374151;">Your payment has been processed successfully. Here's your receipt:</p>

          <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #bbf7d0;">
            <table style="width: 100%; color: #374151;">
              <tr><td style="padding: 8px 0;"><strong>Amount Paid:</strong></td><td style="font-size: 20px; font-weight: bold; color: #059669;">$${data.amount.toFixed(2)}</td></tr>
              ${data.promoCode && data.discountAmount ? `<tr><td style="padding: 5px 0;"><strong>Discount Applied:</strong></td><td style="color: #059669;">-$${data.discountAmount.toFixed(2)} (${data.promoCode})</td></tr>` : ''}
              <tr><td style="padding: 5px 0;"><strong>Property:</strong></td><td>${data.propertyAddress}</td></tr>
              <tr><td style="padding: 5px 0;"><strong>Access Method:</strong></td><td>${data.accessMethod}</td></tr>
              ${data.appointmentDisplay ? `<tr><td style="padding: 5px 0;"><strong>Appointment:</strong></td><td>${data.appointmentDisplay}</td></tr>` : ''}
            </table>
          </div>

          <div style="background: #eff6ff; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb;">
            <p style="margin: 0; color: #1e40af; font-size: 14px;">
              <strong>Next Step:</strong> We'll confirm your appointment and our inspector will arrive at the scheduled time with professional HD camera equipment.
            </p>
          </div>

          <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
            <p style="color: #6b7280; font-size: 14px;">
              Questions? Call <a href="tel:3176203858" style="color: #2563eb;">(317) 620-3858</a> or reply to this email.
            </p>
            <p style="color: #9ca3af; font-size: 12px; margin-top: 20px;">
              Precision Sewer Inspections · Indianapolis, IN<br>
              <a href="https://precisionsewerinspections.com" style="color: #9ca3af;">precisionsewerinspections.com</a>
            </p>
          </div>
        </div>
      </div>
    `,
  };
}
