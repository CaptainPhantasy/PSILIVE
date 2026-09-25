export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getCurrentUser, hasRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendNotificationEmail, getInspectionReturnedEmail } from "@/lib/notifications";

// Valid stages that can be rejected/reopened for technician to redo
const REJECTABLE_STAGES: string[] = [
  "PRE_INSPECTION",
  "INSPECTING", 
  "POST_INSPECTION",
  "VIDEO_ATTACH",
  "CLIENT_SIGNOFF",
];

const STAGE_LABELS: Record<string, string> = {
  PRE_INSPECTION: "Property Details",
  INSPECTING: "Findings & Defects",
  POST_INSPECTION: "Summary & Recommendations",
  VIDEO_ATTACH: "Video & Chapters",
  CLIENT_SIGNOFF: "Client Signature",
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ inspectionId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasRole(user, ["ADMIN", "OWNER", "SUPER_ADMIN"])) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { inspectionId } = await params;
    const { reason, rejectedStage } = await request.json();

    if (!reason) {
      return NextResponse.json(
        { success: false, error: "Rejection reason is required" },
        { status: 400 }
      );
    }

    if (!rejectedStage || !REJECTABLE_STAGES.includes(rejectedStage)) {
      return NextResponse.json(
        { success: false, error: "A valid stage must be selected for rejection" },
        { status: 400 }
      );
    }

    const inspection = await prisma.inspection.findUnique({
      where: { id: inspectionId },
      include: { job: true, technician: true },
    });

    if (!inspection) {
      return NextResponse.json(
        { success: false, error: "Inspection not found" },
        { status: 404 }
      );
    }

    // Update inspection status with the specific rejected stage
    const updatedInspection = await prisma.inspection.update({
      where: { id: inspectionId },
      data: {
        status: "REJECTED",
        currentStage: rejectedStage, // Set to the rejected stage so technician can redo it
        rejectedStage: rejectedStage, // Track which stage was rejected
        reviewedBy: user.id,
        reviewedAt: new Date(),
        reviewNotes: reason,
      },
    });

    // Send email to technician with specific stage info
    const stageLabel = STAGE_LABELS[rejectedStage] || rejectedStage;
    const emailContent = getInspectionReturnedEmail({
      technicianName: inspection.technician.name,
      inspectionNumber: inspection.inspectionNumber,
      propertyAddress: `${inspection.job.propertyAddress}, ${inspection.job.propertyCity}`,
      reason,
      rejectedStage: stageLabel,
    });

    await sendNotificationEmail({
        recipientEmail: inspection.technician.email,
        recipientName: inspection.technician.name,
        subject: emailContent.subject,
        htmlContent: emailContent.htmlContent,
      }
    );

    return NextResponse.json({
      success: true,
      inspection: updatedInspection,
    });
  } catch (error) {
    console.error("Error rejecting inspection:", error);
    return NextResponse.json(
      { success: false, error: "Failed to reject inspection" },
      { status: 500 }
    );
  }
}
