export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { isFieldOperatorRole } from "@/lib/auth/permissions";
import { errorResponse } from "@/lib/errors";
import { aiService } from "@/lib/services/ai.service";
import { inspectionService } from "@/lib/services/inspection.service";

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
    const { message, conversationHistory } = body;

    if (!message) {
      return NextResponse.json(
        { success: false, error: "Message is required" },
        { status: 400 }
      );
    }

    // Get inspection context
    const inspection = await inspectionService.getById(inspectionId, user.id);

    // Build context from inspection data
    const context: Record<string, unknown> = {
      propertyAddress: inspection.job.propertyAddress,
      clientName: inspection.job.clientName,
      homeAge: (inspection as any).homeAge,
      pipeMaterial: (inspection as any).pipeMaterial,
      knownIssues: (inspection as any).knownIssues,
      backupHistory: (inspection as any).backupHistory,
      overallCondition: (inspection as any).overallCondition,
      pipeConditionRating: (inspection as any).pipeConditionRating,
      rootIntrusion: (inspection as any).rootIntrusion,
      cracks: (inspection as any).cracks,
      bellies: (inspection as any).bellies,
      offsetJoints: (inspection as any).offsetJoints,
      blockages: (inspection as any).blockages,
      connectionToMain: (inspection as any).connectionToMain,
      recommendations: (inspection as any).recommendations,
      urgencyLevel: (inspection as any).urgencyLevel,
      technicianName: inspection.technician.name,
      inspectionDuration: (inspection as any).inspectionDuration,
    };

    // Get AI response
    const response = await aiService.chat(
      message,
      context,
      (inspection as any).currentStage,
      conversationHistory || []
    );

    return NextResponse.json({
      success: true,
      response: response.content,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
