export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, hasRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { aiService } from "@/lib/services/ai.service";
import { inspectionService } from "@/lib/services/inspection.service";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ inspectionId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasRole(user, ["TECHNICIAN", "ADMIN", "SUPER_ADMIN", "OWNER"])) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { inspectionId } = await params;
    const { transcript } = await request.json();

    if (!transcript) {
      return NextResponse.json({ success: false, error: "Transcript is required" }, { status: 400 });
    }

    // Save to VoiceRecording model
    const recording = await prisma.voiceRecording.create({
      data: {
        inspectionId,
        transcription: transcript,
        section: "GENERAL_NOTES",
        isProcessed: true,
      },
    });

    // Automatically attempt to extract inspection data from the transcript using Haiku
    const inspection = await inspectionService.getById(inspectionId, user.id);
    const extractionResult = await aiService.extractDataFromTranscript(transcript, inspection as any);

    if (extractionResult.success && extractionResult.extractedData) {
      await inspectionService.updateData(inspectionId, user.id, extractionResult.extractedData as any);
      return NextResponse.json({ 
        success: true, 
        recording, 
        extractedData: extractionResult.extractedData,
        message: "Transcript saved and data automatically extracted."
      });
    }

    return NextResponse.json({ success: true, recording });
  } catch (error) {
    console.error("Error saving voice note:", error);
    return NextResponse.json({ success: false, error: "Failed to save voice note" }, { status: 500 });
  }
}
