import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { sendAdminNotification, sendNotificationEmail, getBookingConfirmationEmail } from '@/lib/notifications'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const data = await request?.json?.()
    
    const { name, email, phone, message, serviceType, source } = data ?? {}

    if (!name || !email || !message) {
      return NextResponse.json(
        { success: false, message: 'Name, email, and message are required' },
        { status: 400 }
      )
    }

    // Save to database
    const submission = await prisma?.contactSubmission?.create?.({
      data: {
        name: name ?? '',
        email: email ?? '',
        phone: phone ?? null,
        message: message ?? '',
        serviceType: serviceType ?? 'general',
        source: source ?? 'website',
        status: 'new',
      },
    })

    // Build admin notification HTML
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0369a1; border-bottom: 2px solid #f97316; padding-bottom: 10px;">
          New Contact Form Submission
        </h2>
        <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 10px 0;"><strong>Name:</strong> ${name ?? ''}</p>
          <p style="margin: 10px 0;"><strong>Email:</strong> <a href="mailto:${email ?? ''}">${email ?? ''}</a></p>
          ${phone ? `<p style="margin: 10px 0;"><strong>Phone:</strong> <a href="tel:${phone}">${phone}</a></p>` : ''}
          <p style="margin: 10px 0;"><strong>Service Interest:</strong> ${serviceType ?? 'General Inquiry'}</p>
          <p style="margin: 10px 0;"><strong>Message:</strong></p>
          <div style="background: white; padding: 15px; border-radius: 4px; border-left: 4px solid #0369a1;">
            ${(message ?? '')?.replace?.(/\n/g, '<br>')}
          </div>
        </div>
        <p style="color: #666; font-size: 12px;">
          Submitted at: ${new Date()?.toLocaleString?.('en-US', { timeZone: 'America/Indiana/Indianapolis' })}
        </p>
      </div>
    `

    // Send admin notification to both Ryan & Douglas
    try {
      await sendAdminNotification({
          subject: `New Contact Form Submission from ${name ?? 'Website Visitor'}`,
          htmlContent: htmlBody,
        }
      )
    } catch (emailError) {
      console.error('Failed to send admin email notification:', emailError)
    }

    // Send booking confirmation to the customer
    try {
      const confirmEmail = getBookingConfirmationEmail({
        customerName: name ?? 'there',
        serviceType: serviceType ?? 'Sewer Inspection',
        phone: phone ?? undefined,
        source: source ?? 'website',
        message: message ?? '',
      })
      await sendNotificationEmail({
          recipientEmail: email,
          recipientName: name,
          subject: confirmEmail.subject,
          htmlContent: confirmEmail.htmlContent,
        }
      )
    } catch (emailError) {
      console.error('Failed to send booking confirmation email:', emailError)
    }

    return NextResponse.json({
      success: true,
      message: 'Thank you for contacting us! We will get back to you within 24 hours.',
      id: submission?.id,
    })
  } catch (error) {
    console.error('Contact form error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to submit form. Please try again or call us directly.' },
      { status: 500 }
    )
  }
}