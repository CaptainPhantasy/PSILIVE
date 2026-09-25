export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getCurrentUser, hasRole, generateSecureToken } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendNotificationEmail, getVideoReadyEmail } from "@/lib/notifications";
import { DOWNLOAD_LINK_HOURS, DOWNLOAD_LINK_GRACE_HOURS, MAX_DOWNLOADS } from "@/lib/inspection-constants";
import { generateReportHTML } from "@/lib/report-template";
import { uploadBuffer } from "@/lib/s3";
import { pdfService } from "@/lib/services/pdf.service";

// Helper function to generate PDF using Puppeteer/Chromium
async function generateInspectionPDF(inspectionId: string): Promise<string | null> {
  try {
    const inspection = await prisma.inspection.findUnique({
      where: { id: inspectionId },
      include: {
        job: true,
        technician: {
          select: { name: true, email: true },
        },
        clientSignature: true,
      },
    });

    if (!inspection) return null;

    const clientHTML = generateReportHTML(inspection as Parameters<typeof generateReportHTML>[0], true);

    const pdfResult = await pdfService.generatePDF(clientHTML, {
      format: "A4",
      margin: { top: "20mm", right: "20mm", bottom: "20mm", left: "20mm" },
      printBackground: true,
    });

    if (!pdfResult.success || !pdfResult.buffer) {
      console.error("PDF generation failed:", pdfResult.error);
      return null;
    }

    const fileName = `inspection-report-${inspection.inspectionNumber}.pdf`;
    const cloudPath = await uploadBuffer(pdfResult.buffer, fileName, "application/pdf", false);

    await prisma.generatedReport.upsert({
      where: { inspectionId },
      create: { inspectionId, clientReportCloudPath: cloudPath },
      update: { clientReportCloudPath: cloudPath, updatedAt: new Date() },
    });

    return cloudPath;
  } catch (error) {
    console.error("Error generating PDF:", error);
    return null;
  }
}

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
    const { reviewNotes } = await request.json();

    const inspection = await prisma.inspection.findUnique({
      where: { id: inspectionId },
      include: { 
        job: true,
        videoAttachment: {
          include: {
            chapters: true,
          },
        },
      },
    });

    if (!inspection) {
      return NextResponse.json(
        { success: false, error: "Inspection not found" },
        { status: 404 }
      );
    }

    if (inspection.status !== "SUBMITTED" && inspection.status !== "UNDER_REVIEW") {
      return NextResponse.json(
        { success: false, error: "Inspection cannot be approved in current state" },
        { status: 400 }
      );
    }

    // Calculate expiration times
    const now = new Date();
    const displayExpiresAt = new Date(now.getTime() + DOWNLOAD_LINK_HOURS * 60 * 60 * 1000);
    const actualExpiresAt = new Date(now.getTime() + (DOWNLOAD_LINK_HOURS + DOWNLOAD_LINK_GRACE_HOURS) * 60 * 60 * 1000);

    // Generate secure token
    const token = generateSecureToken(
      inspectionId,
      inspection.job.clientEmail,
      actualExpiresAt
    );

    // Update inspection and create delivery token
    const [updatedInspection, deliveryToken] = await prisma.$transaction([
      prisma.inspection.update({
        where: { id: inspectionId },
        data: {
          status: "APPROVED",
          currentStage: "APPROVED",
          reviewedBy: user.id,
          reviewedAt: new Date(),
          reviewNotes,
        },
      }),
      prisma.deliveryToken.create({
        data: {
          inspectionId,
          token,
          clientEmail: inspection.job.clientEmail,
          displayExpiresAt,
          actualExpiresAt,
          downloadLimit: MAX_DOWNLOADS,
        },
      }),
    ]);

    // Generate download URL
    const baseUrl = process.env.NEXTAUTH_URL || "https://precisionsewerinspections.com";
    const downloadUrl = `${baseUrl}/download/${inspectionId}?token=${token}`;

    // Count findings for the email summary
    const countFindings = () => {
      let count = 0;
      const checkFinding = (field: unknown) => {
        if (field && typeof field === "object" && "detected" in field && (field as { detected: boolean }).detected) {
          count++;
        }
      };
      checkFinding(inspection.rootIntrusion);
      checkFinding(inspection.cracks);
      checkFinding(inspection.bellies);
      checkFinding(inspection.offsetJoints);
      checkFinding(inspection.blockages);
      // Also count chapters that are findings
      if (inspection.videoAttachment?.chapters) {
        count += inspection.videoAttachment.chapters.filter(
          (ch: any) => ch.chapterType === "FINDING" || ch.chapterType === "DEFECT" || ch.chapterType === "REPAIR_NEEDED"
        ).length;
      }
      return count;
    };

    // Send email to client
    const emailContent = getVideoReadyEmail({
      clientName: inspection.job.clientName,
      propertyAddress: `${inspection.job.propertyAddress}, ${inspection.job.propertyCity}, ${inspection.job.propertyState}`,
      downloadUrl,
      expiresAt: displayExpiresAt,
      // Enhanced fields
      videoDuration: inspection.videoAttachment?.duration || null,
      overallCondition: inspection.overallCondition,
      findingsCount: countFindings(),
      urgencyLevel: inspection.urgencyLevel,
      downloadLimit: MAX_DOWNLOADS,
    });

    await sendNotificationEmail({
        recipientEmail: inspection.job.clientEmail,
        recipientName: inspection.job.clientName,
        subject: emailContent.subject,
        htmlContent: emailContent.htmlContent,
      }
    );

    // Generate PDF report in the background (don't block approval)
    generateInspectionPDF(inspectionId).then((cloudPath) => {
      if (cloudPath) {
        console.log(`PDF report generated for inspection ${inspectionId}: ${cloudPath}`);
      } else {
        console.warn(`Failed to generate PDF report for inspection ${inspectionId}`);
      }
    });

    return NextResponse.json({
      success: true,
      inspection: updatedInspection,
      deliveryToken,
      downloadUrl,
    });
  } catch (error) {
    console.error("Error approving inspection:", error);
    return NextResponse.json(
      { success: false, error: "Failed to approve inspection" },
      { status: 500 }
    );
  }
}
