export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { canEnterInspectionData, isFieldOperatorRole } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db";
import { sendAdminNotification, getInspectionSubmittedEmail } from "@/lib/notifications";

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
    const { latitude, longitude } = await request.json();

    const inspection = await prisma.inspection.findUnique({
      where: { id: inspectionId },
      include: {
        job: true,
        videoAttachment: true,
        clientSignature: true,
        technician: true,
      },
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

    // Validate required fields
    const errors: string[] = [];

    if (!inspection.overallCondition) {
      errors.push("Overall condition rating is required");
    }

    if (!inspection.recommendations) {
      errors.push("Recommendations are required");
    }

    if (!inspection.videoAttachment || inspection.videoAttachment.uploadStatus !== "COMPLETED") {
      errors.push("Video attachment is required");
    }

    if (!inspection.clientSignature) {
      errors.push("Client signature is required");
    }

    if (errors.length > 0) {
      return NextResponse.json(
        { success: false, error: "Validation failed", errors },
        { status: 400 }
      );
    }

    // Update inspection status
    const [updatedInspection] = await prisma.$transaction([
      prisma.inspection.update({
        where: { id: inspectionId },
        data: {
          currentStage: "SUBMITTED",
          status: "SUBMITTED",
          completedAt: new Date(),
        },
      }),
      prisma.job.update({
        where: { id: inspection.jobId },
        data: { status: "COMPLETED" },
      }),
    ]);

    // Log checkout location
    if (latitude && longitude) {
      await prisma.locationLog.create({
        data: {
          inspectionId,
          latitude,
          longitude,
          eventType: "CHECKOUT",
        },
      });
    }

    // Send notification email to admin
    const emailContent = getInspectionSubmittedEmail({
      inspectionNumber: inspection.inspectionNumber,
      technicianName: inspection.technician.name,
      propertyAddress: `${inspection.job.propertyAddress}, ${inspection.job.propertyCity}, ${inspection.job.propertyState}`,
      clientName: inspection.job.clientName,
      submittedAt: new Date(),
    });

    await sendAdminNotification({
        subject: emailContent.subject,
        htmlContent: emailContent.htmlContent,
      }
    );

    return NextResponse.json({
      success: true,
      inspection: updatedInspection,
    });
  } catch (error) {
    console.error("Error submitting inspection:", error);
    return NextResponse.json(
      { success: false, error: "Failed to submit inspection" },
      { status: 500 }
    );
  }
}
