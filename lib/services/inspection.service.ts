/**
 * Inspection Service
 * Business logic for inspection workflow management
 */

import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { Errors, AppError, ErrorCode } from "@/lib/errors";
import type {
  UpdateStageInput,
  PostInspectionData,
  VideoUploadInput,
  SignatureInput,
} from "@/lib/validations";
import type {
  Inspection,
  InspectionStage,
  InspectionStatus,
  LocationEventType,
} from "@prisma/client";

// Extended type for inspection with relations
export interface InspectionWithRelations extends Inspection {
  job: {
    id: string;
    jobNumber: string;
    clientName: string;
    clientEmail: string;
    clientPhone: string | null;
    clientRole: string;
    propertyAddress: string;
    propertyCity: string;
    propertyState: string;
    propertyZip: string;
    accessType: string;
    hasCrawlSpace: boolean;
    specialNotes: string | null;
    totalPrice: number;
  };
  technician: {
    id: string;
    name: string;
    email: string;
  };
  videoAttachment: {
    id: string;
    cloudPath: string;
    fileName: string;
    fileSize: number;
    uploadStatus: string;
    duration: number | null;
    publicUrl: string | null;
  } | null;
  clientSignature: {
    id: string;
    signerName: string;
    signedAt: Date;
  } | null;
  photos: Array<{
    id: string;
    cloudPath: string;
    publicUrl: string | null;
    caption: string | null;
    photoType: string;
  }>;
}

export interface StageGateRequirement {
  field: string;
  label: string;
  required: boolean;
  validate: (inspection: InspectionWithRelations) => boolean;
}

// Stage gate definitions - what's required to pass each gate
const STAGE_GATES: Record<string, StageGateRequirement[]> = {
  PRE_INSPECTION: [
    {
      field: "confirmedClientName",
      label: "Client Name",
      required: true,
      validate: (i) => !!i.confirmedClientName,
    },
    {
      field: "confirmedAddress",
      label: "Property Address",
      required: true,
      validate: (i) => !!i.confirmedAddress,
    },
    {
      field: "homeAge",
      label: "Home Age",
      required: false,
      validate: (i) => !!i.homeAge,
    },
    {
      field: "knownIssues",
      label: "Known Issues",
      required: false,
      validate: (i) => !!i.knownIssues,
    },
  ],
  INSPECTING: [
    {
      field: "inspectionDuration",
      label: "Inspection time recorded",
      required: false,
      validate: (i) => (i.inspectionDuration || 0) > 0,
    },
    {
      field: "pipeMaterial",
      label: "Pipe Material Identified",
      required: false,
      validate: (i) => !!i.pipeMaterial,
    },
  ],
  POST_INSPECTION: [
    {
      field: "overallCondition",
      label: "Overall Condition Rating",
      required: true,
      validate: (i) => !!i.overallCondition,
    },
    {
      field: "pipeConditionRating",
      label: "Pipe Condition Rating (1-5)",
      required: true,
      validate: (i) => !!i.pipeConditionRating && i.pipeConditionRating >= 1,
    },
    {
      field: "connectionToMain",
      label: "Connection to Main Status",
      required: true,
      validate: (i) => !!i.connectionToMain,
    },
    {
      field: "recommendations",
      label: "Report Notes",
      required: true,
      validate: (i) => !!i.recommendations && i.recommendations.length >= 10,
    },
    {
      field: "urgencyLevel",
      label: "Review Priority",
      required: true,
      validate: (i) => !!i.urgencyLevel,
    },
  ],
  VIDEO_ATTACH: [
    {
      field: "videoAttachment",
      label: "Video Upload",
      required: true,
      validate: (i) => !!i.videoAttachment && i.videoAttachment.uploadStatus === "COMPLETED",
    },
  ],
  CLIENT_SIGNOFF: [
    {
      field: "clientSignature",
      label: "Client Signature",
      required: true,
      validate: (i) => !!i.clientSignature,
    },
  ],
};

class InspectionService {
  /**
   * Get an inspection by ID with all relations
   */
  async getById(inspectionId: string, userId: string): Promise<InspectionWithRelations> {
    const inspection = await prisma.inspection.findUnique({
      where: { id: inspectionId },
      include: {
        job: true,
        technician: {
          select: { id: true, name: true, email: true },
        },
        videoAttachment: {
          select: {
            id: true,
            cloudPath: true,
            fileName: true,
            fileSize: true,
            uploadStatus: true,
            duration: true,
            publicUrl: true,
          },
        },
        clientSignature: {
          select: { id: true, signerName: true, signedAt: true },
        },
        photos: {
          select: {
            id: true,
            cloudPath: true,
            publicUrl: true,
            caption: true,
            photoType: true,
          },
        },
      },
    });

    if (!inspection) {
      throw Errors.notFound("Inspection", inspectionId);
    }

    // Verify access - technician must be assigned or user must be admin
    if (inspection.technicianId !== userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });
      if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
        throw Errors.forbidden("You are not assigned to this inspection");
      }
    }

    return inspection as InspectionWithRelations;
  }

  /**
   * Get inspection without auth check (for admin/system use)
   */
  async getByIdUnsafe(inspectionId: string): Promise<InspectionWithRelations | null> {
    return prisma.inspection.findUnique({
      where: { id: inspectionId },
      include: {
        job: true,
        technician: {
          select: { id: true, name: true, email: true },
        },
        videoAttachment: {
          select: {
            id: true,
            cloudPath: true,
            fileName: true,
            fileSize: true,
            uploadStatus: true,
            duration: true,
            publicUrl: true,
          },
        },
        clientSignature: {
          select: { id: true, signerName: true, signedAt: true },
        },
        photos: {
          select: {
            id: true,
            cloudPath: true,
            publicUrl: true,
            caption: true,
            photoType: true,
          },
        },
      },
    }) as Promise<InspectionWithRelations | null>;
  }

  /**
   * Update inspection stage with validation
   */
  async updateStage(
    inspectionId: string,
    userId: string,
    input: UpdateStageInput,
    isAdminOverride = false
  ): Promise<Inspection> {
    const inspection = await this.getById(inspectionId, userId);

    // Validate stage transition
    const currentStageIndex = this.getStageIndex(inspection.currentStage);
    const newStageIndex = this.getStageIndex(input.stage);

    // Can only go forward by 1 (unless admin override)
    if (!isAdminOverride && newStageIndex !== currentStageIndex + 1) {
      throw Errors.invalidStage(inspection.currentStage, input.stage);
    }

    // Check gate requirements (unless override)
    if (!isAdminOverride) {
      const gateResult = this.checkStageGate(inspection, inspection.currentStage);
      if (!gateResult.passed && gateResult.requiredMissing.length > 0) {
        throw Errors.gateBlocked(inspection.currentStage, gateResult.requiredMissing);
      }
    }

    // Prepare stage-specific updates
    const updates: Record<string, unknown> = {
      currentStage: input.stage,
    };

    // Handle location updates
    if (input.latitude && input.longitude) {
      await this.logLocation(inspectionId, input.latitude, input.longitude, input.accuracy);
    }

    // Handle stage-specific timestamps
    if (input.stage === "EN_ROUTE") {
      updates.startedAt = new Date();
    } else if (input.stage === "ARRIVED") {
      updates.arrivedAt = new Date();
    } else if (input.stage === "INSPECTING") {
      updates.inspectionStartedAt = new Date();
    } else if (input.stage === "POST_INSPECTION") {
      updates.inspectionEndedAt = new Date();
      // Calculate duration in minutes
      if (inspection.inspectionStartedAt) {
        const duration = Math.round(
          (Date.now() - inspection.inspectionStartedAt.getTime()) / 60000
        );
        updates.inspectionDuration = Math.max(duration, 1);
      }
    } else if (input.stage === "SUBMITTED") {
      updates.completedAt = new Date();
      updates.status = "SUBMITTED";
    }

    const updated = await prisma.inspection.update({
      where: { id: inspectionId },
      data: updates,
    });

    logger.info("Inspection stage updated", {
      inspectionId,
      previousStage: inspection.currentStage,
      newStage: input.stage,
      userId,
      isAdminOverride,
    });

    return updated;
  }

  /**
   * Update inspection data (partial update)
   */
  async updateData(
    inspectionId: string,
    userId: string,
    data: Partial<PostInspectionData>
  ): Promise<Inspection> {
    await this.getById(inspectionId, userId);

    const updated = await prisma.inspection.update({
      where: { id: inspectionId },
      data: data as Record<string, unknown>,
    });

    logger.debug("Inspection data updated", { inspectionId, fields: Object.keys(data) });

    return updated;
  }

  /**
   * Check if inspection can proceed to next stage
   */
  checkStageGate(
    inspection: InspectionWithRelations,
    currentStage: string
  ): {
    passed: boolean;
    requiredMissing: string[];
    recommendedMissing: string[];
    allRequirements: StageGateRequirement[];
  } {
    const requirements = STAGE_GATES[currentStage] || [];
    const requiredMissing: string[] = [];
    const recommendedMissing: string[] = [];

    for (const req of requirements) {
      if (!req.validate(inspection)) {
        if (req.required) {
          requiredMissing.push(req.label);
        } else {
          recommendedMissing.push(req.label);
        }
      }
    }

    return {
      passed: requiredMissing.length === 0,
      requiredMissing,
      recommendedMissing,
      allRequirements: requirements,
    };
  }

  /**
   * Get all missing requirements for current stage
   */
  getMissingRequirements(inspection: InspectionWithRelations): {
    stage: string;
    required: string[];
    recommended: string[];
  } {
    const result = this.checkStageGate(inspection, inspection.currentStage);
    return {
      stage: inspection.currentStage,
      required: result.requiredMissing,
      recommended: result.recommendedMissing,
    };
  }

  /**
   * Handle video upload
   */
  async handleVideoUpload(
    inspectionId: string,
    userId: string,
    input: VideoUploadInput
  ): Promise<void> {
    await this.getById(inspectionId, userId);

    const existing = await prisma.videoAttachment.findUnique({
      where: { inspectionId },
    });

    if (existing) {
      await prisma.videoAttachment.update({
        where: { inspectionId },
        data: {
          cloudPath: input.cloudPath,
          fileName: input.fileName,
          fileSize: input.fileSize,
          mimeType: input.mimeType,
          uploadStatus: input.uploadStatus,
          uploadProgress: input.uploadProgress || 0,
          uploadId: input.uploadId,
        },
      });
    } else {
      await prisma.videoAttachment.create({
        data: {
          inspectionId,
          cloudPath: input.cloudPath,
          fileName: input.fileName,
          fileSize: input.fileSize,
          mimeType: input.mimeType,
          uploadStatus: input.uploadStatus,
          uploadProgress: input.uploadProgress || 0,
          uploadId: input.uploadId,
        },
      });
    }

    logger.info("Video upload recorded", {
      inspectionId,
      fileName: input.fileName,
      fileSize: input.fileSize,
      uploadStatus: input.uploadStatus,
    });
  }

  /**
   * Update video upload progress/status
   */
  async updateVideoProgress(
    inspectionId: string,
    userId: string,
    data: { uploadProgress?: number; uploadStatus?: string; duration?: number }
  ): Promise<void> {
    await this.getById(inspectionId, userId);

    await prisma.videoAttachment.update({
      where: { inspectionId },
      data: {
        ...(data.uploadProgress !== undefined && { uploadProgress: data.uploadProgress }),
        ...(data.uploadStatus && { uploadStatus: data.uploadStatus as any }),
        ...(data.duration !== undefined && { duration: data.duration }),
        ...(data.uploadStatus === "COMPLETED" && { uploadedAt: new Date() }),
      },
    });
  }

  /**
   * Handle client signature
   */
  async handleSignature(
    inspectionId: string,
    userId: string,
    input: SignatureInput
  ): Promise<void> {
    await this.getById(inspectionId, userId);

    const existing = await prisma.clientSignature.findUnique({
      where: { inspectionId },
    });

    if (existing) {
      throw new AppError(ErrorCode.ALREADY_EXISTS, "Signature already captured", 400);
    }

    await prisma.clientSignature.create({
      data: {
        inspectionId,
        signatureData: input.signatureData,
        signerName: input.signerName,
        signerRole: input.signerRole,
        latitude: input.latitude,
        longitude: input.longitude,
      },
    });

    logger.info("Client signature captured", {
      inspectionId,
      signerName: input.signerName,
      signerRole: input.signerRole,
    });
  }

  /**
   * Submit inspection for review
   */
  async submitForReview(inspectionId: string, userId: string): Promise<Inspection> {
    const inspection = await this.getById(inspectionId, userId);

    // Verify all requirements are met
    const missing = this.getMissingRequirements(inspection);
    if (missing.required.length > 0) {
      throw Errors.gateBlocked(inspection.currentStage, missing.required);
    }

    // Verify video is uploaded
    if (!inspection.videoAttachment || inspection.videoAttachment.uploadStatus !== "COMPLETED") {
      throw Errors.gateBlocked(inspection.currentStage, ["Video upload"]);
    }

    // Verify signature is captured
    if (!inspection.clientSignature) {
      throw Errors.gateBlocked(inspection.currentStage, ["Client signature"]);
    }

    const updated = await prisma.inspection.update({
      where: { id: inspectionId },
      data: {
        currentStage: "SUBMITTED",
        status: "SUBMITTED",
        completedAt: new Date(),
      },
    });

    logger.info("Inspection submitted for review", { inspectionId, userId });

    return updated;
  }

  /**
   * Log location update
   */
  private async logLocation(
    inspectionId: string,
    latitude: number,
    longitude: number,
    accuracy?: number
  ): Promise<void> {
    const inspection = await prisma.inspection.findUnique({
      where: { id: inspectionId },
      select: { currentStage: true },
    });

    const eventType = this.getEventTypeFromStage(inspection?.currentStage);

    await prisma.locationLog.create({
      data: {
        inspectionId,
        latitude,
        longitude,
        accuracy,
        eventType,
      },
    });
  }

  /**
   * Get stage index for ordering
   */
  private getStageIndex(stage: string): number {
    const stages = [
      "ACCEPTED",
      "EN_ROUTE",
      "ARRIVED",
      "PRE_INSPECTION",
      "INSPECTING",
      "POST_INSPECTION",
      "VIDEO_ATTACH",
      "CLIENT_SIGNOFF",
      "SUBMITTED",
      "UNDER_REVIEW",
      "APPROVED",
      "DELIVERED",
    ];
    const index = stages.indexOf(stage);
    return index >= 0 ? index : 1; // Default to EN_ROUTE if unknown
  }

  /**
   * Map stage to location event type
   */
  private getEventTypeFromStage(stage: string | undefined): LocationEventType {
    switch (stage) {
      case "EN_ROUTE":
        return "EN_ROUTE";
      case "ARRIVED":
        return "ARRIVED";
      case "INSPECTING":
        return "INSPECTION_START";
      case "POST_INSPECTION":
        return "INSPECTION_END";
      case "CLIENT_SIGNOFF":
        return "SIGNATURE";
      default:
        return "CHECKOUT";
    }
  }
}

// Export singleton instance
export const inspectionService = new InspectionService();
export { InspectionService };
