export const dynamic = "force-dynamic";
/**
 * Admin Override API
 * Allows admins to override workflow gates including time minimums
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, hasRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { errorResponse, Errors } from "@/lib/errors";
import { logger } from "@/lib/logger";

const STAGE_ORDER = [
  "ACCEPTED",
  "EN_ROUTE",
  "ARRIVED",
  "PRE_INSPECTION",
  "INSPECTING",
  "POST_INSPECTION",
  "VIDEO_ATTACH",
  "CLIENT_SIGNOFF",
  "SUBMITTED",
] as const;

type StageType = typeof STAGE_ORDER[number];

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ inspectionId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasRole(user, ["ADMIN", "OWNER", "SUPER_ADMIN"])) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { inspectionId } = await params;
    const body = await request.json();
    const { 
      action, // 'override_time_gate' | 'force_stage' | 'skip_signature' | 'clear_override_request'
      targetStage,
      adminNotes,
    } = body;

    // Get current inspection
    const inspection = await prisma.inspection.findUnique({
      where: { id: inspectionId },
      include: {
        job: true,
        technician: { select: { id: true, name: true } },
        clientSignature: true,
      },
    });

    if (!inspection) {
      throw Errors.notFound("Inspection", inspectionId);
    }

    let updateData: Record<string, any> = {
      reviewedBy: user.id,
      reviewedAt: new Date(),
    };

    switch (action) {
      case "override_time_gate":
        // Override the 15-minute minimum inspection time
        // Set inspectionEndedAt to allow progression even if < 15 min
        if (!inspection.inspectionStartedAt) {
          return NextResponse.json(
            { success: false, error: "Inspection has not started camera inspection yet" },
            { status: 400 }
          );
        }
        
        updateData = {
          ...updateData,
          // Mark as if 15+ minutes passed
          inspectionDuration: 15,
          inspectionEndedAt: new Date(),
          specialInstructions: `TIME GATE OVERRIDDEN by ${user.name} at ${new Date().toISOString()}. ${adminNotes || ""} Previous: ${inspection.specialInstructions || "none"}`,
        };
        
        logger.info("Admin overrode time gate", {
          inspectionId,
          adminId: user.id,
          adminName: user.name,
        });
        break;

      case "force_stage":
        // Force inspection to a specific stage
        if (!targetStage || !STAGE_ORDER.includes(targetStage as StageType)) {
          return NextResponse.json(
            { success: false, error: "Invalid target stage" },
            { status: 400 }
          );
        }
        
        updateData = {
          ...updateData,
          currentStage: targetStage,
          specialInstructions: `STAGE FORCED to ${targetStage} by ${user.name} at ${new Date().toISOString()}. ${adminNotes || ""} Previous: ${inspection.specialInstructions || "none"}`,
        };
        
        // Update timestamps based on the new stage
        if (targetStage === "ARRIVED" && !inspection.arrivedAt) {
          updateData.arrivedAt = new Date();
        }
        if (targetStage === "INSPECTING" && !inspection.inspectionStartedAt) {
          updateData.inspectionStartedAt = new Date();
        }
        if (targetStage === "POST_INSPECTION" && !inspection.inspectionEndedAt) {
          updateData.inspectionEndedAt = new Date();
          updateData.inspectionDuration = 15; // Set minimum duration
        }
        if (targetStage === "SUBMITTED") {
          updateData.status = "SUBMITTED";
          updateData.completedAt = new Date();
        }
        
        logger.info("Admin forced stage change", {
          inspectionId,
          adminId: user.id,
          fromStage: inspection.currentStage,
          toStage: targetStage,
        });
        break;

      case "skip_signature":
        // Create admin bypass signature
        if (!inspection.clientSignature) {
          await prisma.clientSignature.create({
            data: {
              inspectionId,
              signatureData: "ADMIN_BYPASS",
              signerName: `Admin Override (${user.name})`,
              signerRole: "OTHER",
              signedAt: new Date(),
              latitude: 0,
              longitude: 0,
            },
          });
        }
        
        updateData = {
          ...updateData,
          currentStage: "SUBMITTED",
          status: "SUBMITTED",
          completedAt: new Date(),
          specialInstructions: `SIGNATURE SKIPPED by ${user.name} at ${new Date().toISOString()}. ${adminNotes || ""} Previous: ${inspection.specialInstructions || "none"}`,
        };
        
        logger.info("Admin skipped signature requirement", {
          inspectionId,
          adminId: user.id,
        });
        break;

      case "clear_override_request":
        // Clear pending override request from technician
        updateData = {
          ...updateData,
          specialInstructions: `OVERRIDE REQUEST CLEARED by ${user.name} at ${new Date().toISOString()}. ${adminNotes || ""}`,
        };
        
        logger.info("Admin cleared override request", {
          inspectionId,
          adminId: user.id,
        });
        break;

      default:
        return NextResponse.json(
          { success: false, error: "Invalid action" },
          { status: 400 }
        );
    }

    // Apply the update
    const updated = await prisma.inspection.update({
      where: { id: inspectionId },
      data: updateData,
      include: {
        job: true,
        technician: { select: { id: true, name: true, email: true } },
        clientSignature: true,
        videoAttachment: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Override action '${action}' completed successfully`,
      inspection: {
        id: updated.id,
        inspectionNumber: updated.inspectionNumber,
        currentStage: updated.currentStage,
        status: updated.status,
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
