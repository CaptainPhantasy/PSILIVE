export const dynamic = "force-dynamic";
/**
 * Live Inspections API
 * Returns real-time data about all active inspections for admin monitoring
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, hasRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { errorResponse } from "@/lib/errors";

// Define the inspection stages in order for progress calculation
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

const STAGE_LABELS: Record<string, string> = {
  ACCEPTED: "Job Accepted",
  EN_ROUTE: "En Route",
  ARRIVED: "On Site",
  PRE_INSPECTION: "Interview",
  INSPECTING: "Camera Inspection",
  POST_INSPECTION: "Findings Review",
  VIDEO_ATTACH: "Video Upload",
  CLIENT_SIGNOFF: "Client Signature",
  SUBMITTED: "Submitted",
};

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasRole(user, ["ADMIN", "OWNER", "SUPER_ADMIN"])) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Get all active (IN_PROGRESS) inspections with full details
    const inspections = await prisma.inspection.findMany({
      where: {
        status: "IN_PROGRESS",
      },
      include: {
        job: {
          select: {
            id: true,
            jobNumber: true,
            clientName: true,
            clientEmail: true,
            clientPhone: true,
            clientRole: true,
            propertyAddress: true,
            propertyCity: true,
            propertyState: true,
            propertyZip: true,
            propertyLat: true,
            propertyLng: true,
            scheduledDate: true,
            scheduledTime: true,
            accessType: true,
            specialNotes: true,
          },
        },
        technician: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        locationLogs: {
          orderBy: { timestamp: "desc" },
          take: 10,
        },
        videoAttachment: {
          select: {
            id: true,
            fileName: true,
            uploadStatus: true,
            uploadProgress: true,
            duration: true,
          },
        },
        clientSignature: {
          select: {
            id: true,
            signerName: true,
            signerRole: true,
            signedAt: true,
          },
        },
        photos: {
          select: {
            id: true,
            photoType: true,
            caption: true,
          },
        },
        voiceRecordings: {
          select: {
            id: true,
            transcription: true,
            section: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    // Transform data for admin view
    const liveInspections = inspections.map((inspection: any) => {
      const currentStageIndex = STAGE_ORDER.indexOf(inspection.currentStage as typeof STAGE_ORDER[number]);
      const progressPercent = Math.round((currentStageIndex / (STAGE_ORDER.length - 1)) * 100);
      
      // Get latest location
      const latestLocation = inspection.locationLogs[0] || null;
      
      // Calculate time gates
      const now = new Date();
      const inspectionStartedAt = inspection.inspectionStartedAt ? new Date(inspection.inspectionStartedAt) : null;
      const inspectionDurationMinutes = inspectionStartedAt 
        ? Math.floor((now.getTime() - inspectionStartedAt.getTime()) / 60000)
        : 0;
      const meetsTimeMinimum = inspectionDurationMinutes >= 15;

      // Build stages status
      const stages = STAGE_ORDER.map((stage, index) => ({
        id: stage,
        label: STAGE_LABELS[stage],
        status: index < currentStageIndex ? "completed" : index === currentStageIndex ? "current" : "pending",
      }));

      // Parse any override request from specialInstructions
      let overrideRequest = null;
      if (inspection.specialInstructions?.includes("OVERRIDE REQUEST:")) {
        try {
          const json = inspection.specialInstructions.replace("OVERRIDE REQUEST: ", "");
          overrideRequest = JSON.parse(json);
        } catch {
          // Ignore parse errors
        }
      }

      return {
        id: inspection.id,
        inspectionNumber: inspection.inspectionNumber,
        currentStage: inspection.currentStage,
        currentStageLabel: STAGE_LABELS[inspection.currentStage] || inspection.currentStage,
        progressPercent,
        stages,
        
        // Time tracking
        startedAt: inspection.startedAt,
        arrivedAt: inspection.arrivedAt,
        inspectionStartedAt: inspection.inspectionStartedAt,
        inspectionEndedAt: inspection.inspectionEndedAt,
        inspectionDurationMinutes,
        meetsTimeMinimum,
        
        // Location
        location: latestLocation ? {
          latitude: latestLocation.latitude,
          longitude: latestLocation.longitude,
          accuracy: latestLocation.accuracy,
          eventType: latestLocation.eventType,
          timestamp: latestLocation.timestamp,
          isOverride: latestLocation.isOverride,
        } : null,
        locationHistory: inspection.locationLogs.map((log: any) => ({
          latitude: log.latitude,
          longitude: log.longitude,
          eventType: log.eventType,
          timestamp: log.timestamp,
        })),
        
        // Collected data
        collectedData: {
          confirmedClientName: inspection.confirmedClientName,
          confirmedAddress: inspection.confirmedAddress,
          homeAge: inspection.homeAge,
          pipeMaterial: inspection.pipeMaterial,
          knownIssues: inspection.knownIssues,
          backupHistory: inspection.backupHistory,
          recentWork: inspection.recentWork,
          overallCondition: inspection.overallCondition,
          rootIntrusion: inspection.rootIntrusion,
          cracks: inspection.cracks,
          bellies: inspection.bellies,
          offsetJoints: inspection.offsetJoints,
          blockages: inspection.blockages,
          pipeConditionRating: inspection.pipeConditionRating,
          connectionToMain: inspection.connectionToMain,
          recommendations: inspection.recommendations,
          urgencyLevel: inspection.urgencyLevel,
        },
        
        // Attachments
        video: inspection.videoAttachment,
        signature: inspection.clientSignature,
        photoCount: inspection.photos.length,
        voiceNoteCount: inspection.voiceRecordings.length,
        
        // Job and technician info
        job: inspection.job,
        technician: inspection.technician,
        
        // Override request if any
        overrideRequest,
        
        // Timestamps
        createdAt: inspection.createdAt,
        updatedAt: inspection.updatedAt,
      };
    });

    return NextResponse.json({
      success: true,
      inspections: liveInspections,
      count: liveInspections.length,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
