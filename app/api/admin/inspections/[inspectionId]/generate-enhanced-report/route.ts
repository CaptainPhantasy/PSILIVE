export const dynamic = "force-dynamic";
/**
 * Enhanced Report Generation API Route
 * POST: Triggers the ReportForge agent to generate an enhanced inspection report.
 * GET: Returns generation status (for future async polling support).
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, hasRole } from "@/lib/auth";
import { reportAgentService } from "@/lib/services/report-agent.service";

export async function POST(
  request: NextRequest,
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

    if (!inspectionId) {
      return NextResponse.json(
        { success: false, error: "Inspection ID is required" },
        { status: 400 }
      );
    }

    // Trigger the ReportForge agent
    const result = await reportAgentService.generateEnhancedReport(inspectionId);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Report generation failed",
          sectionsGenerated: result.sectionsGenerated,
          processingTimeMs: result.processingTimeMs,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Enhanced report generated successfully",
      cloudPath: result.cloudPath,
      reportUrl: result.reportUrl,
      processingTimeMs: result.processingTimeMs,
      sectionsGenerated: result.sectionsGenerated,
    });
  } catch (error) {
    console.error("Error generating enhanced report:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate enhanced report" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
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

    // For now, return a simple status. In the future, this could track
    // async generation progress via a status table.
    return NextResponse.json({
      success: true,
      status: "ready",
      message: "Use POST to generate an enhanced report",
    });
  } catch (error) {
    console.error("Error checking report status:", error);
    return NextResponse.json(
      { success: false, error: "Failed to check report status" },
      { status: 500 }
    );
  }
}
