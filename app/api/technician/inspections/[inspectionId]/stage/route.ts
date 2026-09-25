export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { canEnterInspectionData, isFieldOperatorRole } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db";
import { InspectionStage, JobStatus } from "@prisma/client";

const STAGE_ORDER: InspectionStage[] = [
  "ACCEPTED",
  "EN_ROUTE",
  "ARRIVED",
  "PRE_INSPECTION",
  "INSPECTING",
  "POST_INSPECTION",
  "VIDEO_ATTACH",
  "CLIENT_SIGNOFF",
  "SUBMITTED",
];

const STAGE_TO_JOB_STATUS: Record<InspectionStage, JobStatus> = {
  ACCEPTED: "ACCEPTED",
  EN_ROUTE: "EN_ROUTE",
  ARRIVED: "ON_SITE",
  PRE_INSPECTION: "IN_PROGRESS",
  INSPECTING: "IN_PROGRESS",
  POST_INSPECTION: "IN_PROGRESS",
  VIDEO_ATTACH: "IN_PROGRESS",
  CLIENT_SIGNOFF: "IN_PROGRESS",
  SUBMITTED: "COMPLETED",
  UNDER_REVIEW: "COMPLETED",
  APPROVED: "COMPLETED",
  DELIVERED: "COMPLETED",
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ inspectionId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !isFieldOperatorRole(user?.role)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { inspectionId } = await params;
    const { stage, latitude, longitude, accuracy, clearRejection } = await request.json();

    if (!stage || !STAGE_ORDER.includes(stage as InspectionStage)) {
      return NextResponse.json(
        { success: false, error: "Invalid stage" },
        { status: 400 }
      );
    }

    const inspection = await prisma.inspection.findUnique({
      where: { id: inspectionId },
      include: { job: true },
    });

    if (!inspection) {
      return NextResponse.json(
        { success: false, error: "Inspection not found" },
        { status: 404 }
      );
    }

    if (!canEnterInspectionData(user, inspection.technicianId)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Build update data based on stage
    const updateData: Record<string, unknown> = {
      currentStage: stage,
    };

    if (stage === "ARRIVED") {
      updateData.arrivedAt = new Date();
    } else if (stage === "INSPECTING") {
      updateData.inspectionStartedAt = new Date();
    } else if (stage === "POST_INSPECTION") {
      updateData.inspectionEndedAt = new Date();
      // Calculate duration
      if (inspection.inspectionStartedAt) {
        const duration = Math.round(
          (new Date().getTime() - new Date(inspection.inspectionStartedAt).getTime()) / 60000
        );
        updateData.inspectionDuration = duration;
      }
    } else if (stage === "SUBMITTED") {
      updateData.completedAt = new Date();
      updateData.status = "SUBMITTED";
      
      // If resubmitting after correction, clear the rejection
      if (clearRejection && inspection.status === "REJECTED") {
        updateData.rejectedStage = null;
        // Note: reviewNotes is preserved so admin can see the history
      }
    }

    // Update inspection and job status in transaction
    const [updatedInspection] = await prisma.$transaction([
      prisma.inspection.update({
        where: { id: inspectionId },
        data: updateData,
      }),
      prisma.job.update({
        where: { id: inspection.jobId },
        data: { status: STAGE_TO_JOB_STATUS[stage as InspectionStage] },
      }),
    ]);

    // Log location if provided
    if (latitude && longitude) {
      await prisma.locationLog.create({
        data: {
          inspectionId,
          latitude,
          longitude,
          accuracy,
          eventType: stage === "EN_ROUTE" ? "EN_ROUTE" :
                     stage === "ARRIVED" ? "ARRIVED" :
                     stage === "INSPECTING" ? "INSPECTION_START" :
                     stage === "POST_INSPECTION" ? "INSPECTION_END" :
                     stage === "SUBMITTED" ? "CHECKOUT" : "ARRIVED",
        },
      });
    }

    return NextResponse.json({
      success: true,
      inspection: updatedInspection,
    });
  } catch (error) {
    console.error("Error updating stage:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update stage" },
      { status: 500 }
    );
  }
}
