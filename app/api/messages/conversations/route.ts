export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { isFieldOperatorRole } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db";

// GET: List all conversations for the current user
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || !isFieldOperatorRole(user?.role)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const conversations = await prisma.conversation.findMany({
      where: {
        participants: {
          some: { userId: user.id },
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, name: true, role: true, profilePhotoUrl: true },
            },
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: {
            sender: {
              select: { id: true, name: true },
            },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    // Calculate unread counts
    const conversationsWithUnread = await Promise.all(
      conversations.map(async (conv: any) => {
        const participant = conv.participants.find((p: any) => p.userId === user.id);
        const unreadCount = await prisma.message.count({
          where: {
            conversationId: conv.id,
            senderId: { not: user.id },
            createdAt: participant?.lastReadAt
              ? { gt: participant.lastReadAt }
              : undefined,
          },
        });
        return { ...conv, unreadCount };
      })
    );

    return NextResponse.json({ success: true, conversations: conversationsWithUnread });
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch conversations" }, { status: 500 });
  }
}

// POST: Create a new conversation (or find existing DM)
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !isFieldOperatorRole(user?.role)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { participantId, message } = await request.json();

    if (!participantId) {
      return NextResponse.json({ success: false, error: "Participant ID required" }, { status: 400 });
    }

    // Check if a DM conversation already exists between these two users
    const existingConv = await prisma.conversation.findFirst({
      where: {
        isGroup: false,
        AND: [
          { participants: { some: { userId: user.id } } },
          { participants: { some: { userId: participantId } } },
        ],
      },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, name: true, role: true, profilePhotoUrl: true },
            },
          },
        },
      },
    });

    if (existingConv) {
      // If there's an initial message, send it
      if (message) {
        await prisma.message.create({
          data: {
            conversationId: existingConv.id,
            senderId: user.id,
            content: message,
          },
        });
        await prisma.conversation.update({
          where: { id: existingConv.id },
          data: { updatedAt: new Date() },
        });
      }
      return NextResponse.json({ success: true, conversation: existingConv });
    }

    // Create new conversation
    const conversation = await prisma.conversation.create({
      data: {
        participants: {
          create: [
            { userId: user.id },
            { userId: participantId },
          ],
        },
        messages: message
          ? {
              create: {
                senderId: user.id,
                content: message,
              },
            }
          : undefined,
      },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, name: true, role: true, profilePhotoUrl: true },
            },
          },
        },
      },
    });

    return NextResponse.json({ success: true, conversation });
  } catch (error) {
    console.error("Error creating conversation:", error);
    return NextResponse.json({ success: false, error: "Failed to create conversation" }, { status: 500 });
  }
}
