import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      sessionId, pageUrl, pageTitle, referrer,
      utmSource, utmMedium, utmCampaign, utmTerm, utmContent,
      deviceType, browser, os, screenWidth, screenHeight,
      language, isEntryPage,
    } = body

    if (!sessionId || !pageUrl) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const visit = await prisma.siteVisit.create({
      data: {
        sessionId,
        pageUrl,
        pageTitle: pageTitle || null,
        referrer: referrer || null,
        utmSource: utmSource || null,
        utmMedium: utmMedium || null,
        utmCampaign: utmCampaign || null,
        utmTerm: utmTerm || null,
        utmContent: utmContent || null,
        deviceType: deviceType || null,
        browser: browser || null,
        os: os || null,
        screenWidth: screenWidth ? parseInt(screenWidth) : null,
        screenHeight: screenHeight ? parseInt(screenHeight) : null,
        language: language || null,
        isEntryPage: isEntryPage || false,
      },
    })

    return NextResponse.json({ visitId: visit.id })
  } catch (error) {
    console.error('Tracking pageview error:', error)
    return NextResponse.json({ error: 'Failed to record' }, { status: 500 })
  }
}
