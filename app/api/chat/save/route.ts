import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { sessionId, messages } = await request.json()

    if (!sessionId || !messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { success: false, error: 'sessionId and messages are required' },
        { status: 400 }
      )
    }

    // Upsert the chat conversation — create if new, update if exists
    await prisma.chatConversation.upsert({
      where: { id: sessionId },
      create: {
        id: sessionId,
        sessionId,
        messages: messages,
      },
      update: {
        messages: messages,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error saving chat transcript:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to save chat transcript' },
      { status: 500 }
    )
  }
}
