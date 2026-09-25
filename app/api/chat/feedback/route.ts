import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { sessionId, rating, comment } = await request.json()

    if (!sessionId || !rating) {
      return NextResponse.json(
        { success: false, error: 'sessionId and rating are required' },
        { status: 400 }
      )
    }

    // Find existing conversation and append feedback
    const existing = await prisma.chatConversation.findFirst({
      where: { sessionId },
    })

    if (existing) {
      const messages = (existing.messages as any[]) || []
      // Append feedback as a special message entry
      messages.push({
        role: 'feedback',
        content: JSON.stringify({ rating, comment: comment || '', timestamp: new Date().toISOString() }),
      })
      await prisma.chatConversation.update({
        where: { id: existing.id },
        data: { messages },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error saving chat feedback:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to save feedback' },
      { status: 500 }
    )
  }
}
