export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { isFieldOperatorRole } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db";
import { ChapterType, FindingSeverity } from "@prisma/client";

// GET - Fetch all chapters for an inspection's video
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ inspectionId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !isFieldOperatorRole(user?.role)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { inspectionId } = await params;

    // Get the video attachment with chapters
    const video = await prisma.videoAttachment.findUnique({
      where: { inspectionId },
      include: {
        chapters: {
          orderBy: { timestamp: "asc" },
        },
      },
    });

    if (!video) {
      return NextResponse.json(
        { success: false, error: "Video not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      chapters: video.chapters,
      videoId: video.id,
      videoDuration: video.duration,
    });
  } catch (error) {
    console.error("Error fetching chapters:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch chapters" },
      { status: 500 }
    );
  }
}

// POST - Add a new chapter marker
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ inspectionId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !isFieldOperatorRole(user?.role)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { inspectionId } = await params;
    const body = await request.json();
    const {
      timestamp,
      endTimestamp,
      title,
      description,
      chapterType,
      severity,
      includeInHighlight,
    } = body;

    if (timestamp === undefined || !title) {
      return NextResponse.json(
        { success: false, error: "Timestamp and title are required" },
        { status: 400 }
      );
    }

    // Get the video attachment
    const video = await prisma.videoAttachment.findUnique({
      where: { inspectionId },
    });

    if (!video) {
      return NextResponse.json(
        { success: false, error: "Video not found" },
        { status: 404 }
      );
    }

    // Create the chapter
    const chapter = await prisma.videoChapter.create({
      data: {
        videoId: video.id,
        timestamp: Math.floor(timestamp),
        endTimestamp: endTimestamp ? Math.floor(endTimestamp) : null,
        title,
        description: description || null,
        chapterType: (chapterType as ChapterType) || "FINDING",
        severity: severity ? (severity as FindingSeverity) : null,
        includeInHighlight: includeInHighlight !== false,
      },
    });

    return NextResponse.json({
      success: true,
      chapter,
    });
  } catch (error) {
    console.error("Error creating chapter:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create chapter" },
      { status: 500 }
    );
  }
}

// DELETE - Remove a chapter marker
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ inspectionId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !isFieldOperatorRole(user?.role)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await params; // Ensure params are resolved

    const { searchParams } = new URL(request.url);
    const chapterId = searchParams.get("chapterId");

    if (!chapterId) {
      return NextResponse.json(
        { success: false, error: "Chapter ID is required" },
        { status: 400 }
      );
    }

    await prisma.videoChapter.delete({
      where: { id: chapterId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting chapter:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete chapter" },
      { status: 500 }
    );
  }
}

// PATCH - Update a chapter marker
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ inspectionId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !isFieldOperatorRole(user?.role)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await params; // Ensure params are resolved

    const body = await request.json();
    const { chapterId, ...updateData } = body;

    if (!chapterId) {
      return NextResponse.json(
        { success: false, error: "Chapter ID is required" },
        { status: 400 }
      );
    }

    // Clean up update data
    const cleanData: Record<string, unknown> = {};
    if (updateData.timestamp !== undefined) cleanData.timestamp = Math.floor(updateData.timestamp);
    if (updateData.endTimestamp !== undefined) cleanData.endTimestamp = updateData.endTimestamp ? Math.floor(updateData.endTimestamp) : null;
    if (updateData.title !== undefined) cleanData.title = updateData.title;
    if (updateData.description !== undefined) cleanData.description = updateData.description;
    if (updateData.chapterType !== undefined) cleanData.chapterType = updateData.chapterType;
    if (updateData.severity !== undefined) cleanData.severity = updateData.severity;
    if (updateData.includeInHighlight !== undefined) cleanData.includeInHighlight = updateData.includeInHighlight;

    const chapter = await prisma.videoChapter.update({
      where: { id: chapterId },
      data: cleanData,
    });

    return NextResponse.json({
      success: true,
      chapter,
    });
  } catch (error) {
    console.error("Error updating chapter:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update chapter" },
      { status: 500 }
    );
  }
}
