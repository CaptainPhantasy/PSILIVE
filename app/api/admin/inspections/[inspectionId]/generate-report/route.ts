export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateReportHTML } from "@/lib/report-template";
import { uploadBuffer, getFileUrl } from "@/lib/s3";
import { pdfService } from "@/lib/services/pdf.service";
import { aiService } from "@/lib/services/ai.service";
import fs from "fs";
import path from "path";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ inspectionId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "OWNER" && user.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { inspectionId } = await params;

    // Fetch complete inspection data
    const inspection = await prisma.inspection.findUnique({
      where: { id: inspectionId },
      include: {
        job: true,
        technician: {
          select: { name: true, email: true },
        },
        clientSignature: true,
        generatedReport: true,
      },
    });

    if (!inspection) {
      return NextResponse.json({ success: false, error: "Inspection not found" }, { status: 404 });
    }

    // Read the blank HTML template
    const templatePath = path.join(process.cwd(), "lib/templates/psi-blank-template-html.html");
    const templateContent = fs.readFileSync(templatePath, "utf-8");

    // Use AI Haiku to populate the HTML template
    const aiResponse = await aiService.populateReportTemplate(templateContent, inspection);
    if (!aiResponse.success || !aiResponse.content) {
      console.error("AI Report generation error:", aiResponse.error);
      return NextResponse.json({ success: false, error: aiResponse.error || "Failed to generate report via AI" }, { status: 500 });
    }

    const clientHTML = aiResponse.content;

    // Generate PDF using Puppeteer/Chromium (Vercel-compatible)
    const pdfResult = await pdfService.generatePDF(clientHTML, {
      format: "A4",
      margin: { top: "20mm", right: "20mm", bottom: "20mm", left: "20mm" },
      printBackground: true,
    });

    if (!pdfResult.success || !pdfResult.buffer) {
      console.error("PDF generation error:", pdfResult.error);
      return NextResponse.json({ success: false, error: pdfResult.error || "Failed to generate PDF" }, { status: 500 });
    }

    // Upload PDF to S3
    const fileName = `inspection-report-${inspection.inspectionNumber}.pdf`;
    const cloudPath = await uploadBuffer(pdfResult.buffer, fileName, "application/pdf", false);

    // Save report record in database
    await prisma.generatedReport.upsert({
      where: { inspectionId },
      create: {
        inspectionId,
        clientReportCloudPath: cloudPath,
      },
      update: {
        clientReportCloudPath: cloudPath,
        updatedAt: new Date(),
      },
    });

    // Get the URL for confirmation
    const reportUrl = await getFileUrl(cloudPath, false);

    return NextResponse.json({
      success: true,
      message: "Report generated successfully",
      cloudPath,
      reportUrl,
    });
  } catch (error) {
    console.error("Error generating report:", error);
    return NextResponse.json({ success: false, error: "Failed to generate report" }, { status: 500 });
  }
}
