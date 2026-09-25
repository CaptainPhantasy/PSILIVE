import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(request: Request) {
  try {
    let body: Record<string, unknown>
    const contentType = request.headers.get('content-type') || ''
    if (contentType.includes('text/plain') || contentType === '') {
      const text = await request.text()
      body = JSON.parse(text)
    } else {
      body = await request.json()
    }

    const { sessionId, eventType, eventTarget, pageUrl, metadata } = body as {
      sessionId: string
      eventType: string
      eventTarget?: string
      pageUrl?: string
      metadata?: string
    }

    if (!sessionId || !eventType) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    await prisma.siteEvent.create({
      data: {
        sessionId,
        eventType,
        eventTarget: eventTarget || null,
        pageUrl: pageUrl || null,
        metadata: metadata || null,
      },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Tracking event error:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
