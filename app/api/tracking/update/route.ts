import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(request: Request) {
  try {
    let body: Record<string, unknown>
    const contentType = request.headers.get('content-type') || ''
    if (contentType.includes('text/plain') || contentType === '') {
      // sendBeacon sends as text/plain
      const text = await request.text()
      body = JSON.parse(text)
    } else {
      body = await request.json()
    }

    const { visitId, timeOnPage, scrollDepth, isExitPage } = body as {
      visitId: string
      timeOnPage?: number
      scrollDepth?: number
      isExitPage?: boolean
    }

    if (!visitId) {
      return NextResponse.json({ error: 'Missing visitId' }, { status: 400 })
    }

    await prisma.siteVisit.update({
      where: { id: visitId },
      data: {
        timeOnPage: timeOnPage != null ? timeOnPage : undefined,
        scrollDepth: scrollDepth != null ? scrollDepth : undefined,
        isExitPage: isExitPage || undefined,
      },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Tracking update error:', error)
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}
