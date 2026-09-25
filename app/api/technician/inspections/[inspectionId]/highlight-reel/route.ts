export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { isFieldOperatorRole } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db";
import { getFileUrl } from "@/lib/s3";

// GET - Check highlight reel status
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

    const video = await prisma.videoAttachment.findUnique({
      where: { inspectionId },
      select: {
        id: true,
        highlightReelPath: true,
        highlightReelUrl: true,
        highlightDuration: true,
        publicUrl: true,
        cloudPath: true,
        chapters: {
          where: { includeInHighlight: true },
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
      hasHighlightReel: !!video.highlightReelUrl,
      highlightReelUrl: video.highlightReelUrl,
      highlightDuration: video.highlightDuration,
      chaptersForHighlight: video.chapters.length,
    });
  } catch (error) {
    console.error("Error checking highlight reel:", error);
    return NextResponse.json(
      { success: false, error: "Failed to check highlight reel" },
      { status: 500 }
    );
  }
}

// POST - Generate highlight reel from chapters
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
    const { clipDuration = 10 } = body; // Default 10 seconds per clip

    // Get video with chapters
    const video = await prisma.videoAttachment.findUnique({
      where: { inspectionId },
      include: {
        chapters: {
          where: { includeInHighlight: true },
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

    if (video.chapters.length === 0) {
      return NextResponse.json(
        { success: false, error: "No chapters marked for highlight reel" },
        { status: 400 }
      );
    }

    // Get public URL for the video
    const videoUrl = video.publicUrl || await getFileUrl(video.cloudPath, true);

    if (!videoUrl) {
      return NextResponse.json(
        { success: false, error: "Could not get video URL" },
        { status: 500 }
      );
    }

    // Build FFmpeg filter complex for concatenating clips
    // Each chapter becomes a clip starting at timestamp for clipDuration seconds
    const clips = video.chapters.map((chapter, index) => {
      const startTime = chapter.timestamp;
      const endTime = chapter.endTimestamp || (startTime + clipDuration);
      const duration = Math.min(endTime - startTime, clipDuration);
      return {
        index,
        start: startTime,
        duration,
        title: chapter.title,
      };
    });

    // Calculate total duration
    const totalDuration = clips.reduce((sum, clip) => sum + clip.duration, 0);

    // Build FFmpeg command
    // Using filter_complex to extract and concatenate clips
    let filterComplex = "";
    let concatInputs = "";
    
    clips.forEach((clip, i) => {
      // Trim each segment
      filterComplex += `[0:v]trim=start=${clip.start}:duration=${clip.duration},setpts=PTS-STARTPTS[v${i}]; `;
      filterComplex += `[0:a]atrim=start=${clip.start}:duration=${clip.duration},asetpts=PTS-STARTPTS[a${i}]; `;
      concatInputs += `[v${i}][a${i}]`;
    });

    // Concatenate all clips
    filterComplex += `${concatInputs}concat=n=${clips.length}:v=1:a=1[outv][outa]`;

    const ffmpegCommand = `-i {{in_1}} -filter_complex "${filterComplex}" -map "[outv]" -map "[outa]" -c:v libx264 -preset fast -crf 23 -c:a aac -b:a 128k -movflags +faststart {{out_1}}`;

    // Create FFmpeg request
    const createResponse = await fetch("https://apps.abacus.ai/api/createRunFfmpegCommandRequest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        deployment_token: process.env.ABACUSAI_API_KEY,
        input_files: { in_1: videoUrl },
        output_files: { out_1: `highlight_${inspectionId}.mp4` },
        ffmpeg_command: ffmpegCommand,
        max_command_run_seconds: 600, // 10 minutes max
      }),
    });

    if (!createResponse.ok) {
      const error = await createResponse.json().catch(() => ({ error: "Failed to create FFmpeg request" }));
      console.error("FFmpeg create error:", error);
      return NextResponse.json(
        { success: false, error: error.error || "Failed to start highlight reel generation" },
        { status: 500 }
      );
    }

    const { request_id } = await createResponse.json();
    if (!request_id) {
      return NextResponse.json(
        { success: false, error: "No request ID returned from FFmpeg API" },
        { status: 500 }
      );
    }

    // Return immediately with request_id - client will poll for status
    return NextResponse.json({
      success: true,
      requestId: request_id,
      estimatedDuration: totalDuration,
      clipCount: clips.length,
      message: "Highlight reel generation started",
    });
  } catch (error) {
    console.error("Error generating highlight reel:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate highlight reel" },
      { status: 500 }
    );
  }
}

// PATCH - Poll FFmpeg status and save result
export async function PATCH(
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
    const { requestId, estimatedDuration } = body;

    if (!requestId) {
      return NextResponse.json(
        { success: false, error: "Request ID is required" },
        { status: 400 }
      );
    }

    // Check FFmpeg status
    const statusResponse = await fetch("https://apps.abacus.ai/api/getRunFfmpegCommandStatus", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        request_id: requestId,
        deployment_token: process.env.ABACUSAI_API_KEY,
      }),
    });

    const statusResult = await statusResponse.json();
    const status = statusResult?.status || "FAILED";
    const result = statusResult?.result || null;

    if (status === "SUCCESS" && result?.result?.out_1) {
      // FFmpeg processing complete - save the URL
      const highlightUrl = result.result.out_1;

      await prisma.videoAttachment.update({
        where: { inspectionId },
        data: {
          highlightReelUrl: highlightUrl,
          highlightReelPath: `highlight_${inspectionId}.mp4`,
          highlightDuration: estimatedDuration || null,
        },
      });

      return NextResponse.json({
        success: true,
        status: "SUCCESS",
        highlightReelUrl: highlightUrl,
      });
    } else if (status === "FAILED") {
      const errorMsg = result?.error || "FFmpeg processing failed";
      return NextResponse.json({
        success: false,
        status: "FAILED",
        error: errorMsg,
      });
    } else {
      // Still processing
      return NextResponse.json({
        success: true,
        status: "PROCESSING",
      });
    }
  } catch (error) {
    console.error("Error checking highlight reel status:", error);
    return NextResponse.json(
      { success: false, error: "Failed to check status" },
      { status: 500 }
    );
  }
}
