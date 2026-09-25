/**
 * Override Request Service
 * Manages gate override requests from technicians to admins
 */

import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { Errors, AppError, ErrorCode } from "@/lib/errors";
import { inspectionService } from "./inspection.service";

// Override request reasons
export type OverrideReason =
  | "ACCESS_DENIED"
  | "EQUIPMENT_MALFUNCTION"
  | "PIPE_BLOCKED"
  | "SAFETY_CONCERN"
  | "CLIENT_ABSENT"
  | "PROPERTY_ISSUE"
  | "OTHER";

// Override resolutions
export type OverrideResolution =
  | "COMPLETE" // Accept partial data as complete
  | "PARTIAL" // Mark as partial inspection
  | "INCOMPLETE" // Mark as incomplete (may need refund)
  | "RESCHEDULE"; // Reschedule for another visit

export interface OverrideRequest {
  id: string;
  inspectionId: string;
  inspectionNumber: string;
  technicianId: string;
  technicianName: string;
  reason: OverrideReason;
  notes: string;
  skipSignature: boolean;
  photoUrl: string | null;
  status: "PENDING" | "APPROVED" | "DENIED";
  createdAt: Date;
  reviewedBy: string | null;
  reviewedAt: Date | null;
  resolution: OverrideResolution | null;
  adminNotes: string | null;
  // Related data
  propertyAddress: string;
  clientName: string;
  clientPhone: string | null;
  currentStage: string;
  completedSteps: string[];
  missingSteps: string[];
}

export interface CreateOverrideInput {
  inspectionId: string;
  technicianId: string;
  reason: OverrideReason;
  notes: string;
  skipSignature?: boolean;
  photoUrl?: string;
}

export interface ReviewOverrideInput {
  resolution: OverrideResolution;
  skipSignature: boolean;
  adminNotes?: string;
}

// Human-readable reason labels
export const OVERRIDE_REASON_LABELS: Record<OverrideReason, string> = {
  ACCESS_DENIED: "Homeowner denied access to area",
  EQUIPMENT_MALFUNCTION: "Equipment malfunction",
  PIPE_BLOCKED: "Pipe completely blocked - cannot proceed",
  SAFETY_CONCERN: "Safety concern at property",
  CLIENT_ABSENT: "Client not present / No access",
  PROPERTY_ISSUE: "Property condition prevents inspection",
  OTHER: "Other (see notes)",
};

// Resolution labels
export const OVERRIDE_RESOLUTION_LABELS: Record<OverrideResolution, string> = {
  COMPLETE: "Mark Complete - Accept partial data",
  PARTIAL: "Mark Partial - Document what was done",
  INCOMPLETE: "Mark Incomplete - May need refund",
  RESCHEDULE: "Reschedule - Return visit needed",
};

class OverrideService {
  /**
   * Create a new override request
   */
  async createRequest(input: CreateOverrideInput): Promise<OverrideRequest> {
    // Get inspection with all details
    const inspection = await inspectionService.getById(input.inspectionId, input.technicianId);

    // Check if there's already a pending request
    const existingRequest = await this.getPendingRequestForInspection(input.inspectionId);
    if (existingRequest) {
      throw new AppError(
        ErrorCode.ALREADY_EXISTS,
        "An override request is already pending for this inspection",
        400
      );
    }

    // Determine completed and missing steps
    const gateResult = inspectionService.checkStageGate(inspection, inspection.currentStage);
    const completedSteps = gateResult.allRequirements
      .filter((r) => r.validate(inspection))
      .map((r) => r.label);
    const missingSteps = gateResult.requiredMissing;

    // Create the override request
    const requestId = `override_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const overrideRequest: OverrideRequest = {
      id: requestId,
      inspectionId: input.inspectionId,
      inspectionNumber: inspection.inspectionNumber,
      technicianId: input.technicianId,
      technicianName: inspection.technician.name,
      reason: input.reason,
      notes: input.notes,
      skipSignature: input.skipSignature ?? false,
      photoUrl: input.photoUrl || null,
      status: "PENDING",
      createdAt: new Date(),
      reviewedBy: null,
      reviewedAt: null,
      resolution: null,
      adminNotes: null,
      propertyAddress: inspection.job.propertyAddress,
      clientName: inspection.job.clientName,
      clientPhone: inspection.job.clientPhone,
      currentStage: inspection.currentStage,
      completedSteps,
      missingSteps,
    };

    // Store in the inspection's special instructions
    // In production, this should be a dedicated OverrideRequest table
    await prisma.inspection.update({
      where: { id: input.inspectionId },
      data: {
        specialInstructions: JSON.stringify({
          type: "OVERRIDE_REQUEST",
          request: overrideRequest,
        }),
      },
    });

    logger.info("Override request created", {
      inspectionId: input.inspectionId,
      technicianId: input.technicianId,
      reason: input.reason,
      currentStage: inspection.currentStage,
    });

    return overrideRequest;
  }

  /**
   * Get all pending override requests
   */
  async getPendingRequests(): Promise<OverrideRequest[]> {
    const inspections = await prisma.inspection.findMany({
      where: {
        specialInstructions: { contains: '"type":"OVERRIDE_REQUEST"' },
      },
      include: {
        technician: { select: { name: true } },
        job: { select: { propertyAddress: true, clientName: true, clientPhone: true } },
      },
    });

    const requests: OverrideRequest[] = [];

    for (const inspection of inspections) {
      try {
        const data = JSON.parse(inspection.specialInstructions || "{}");
        if (data.type === "OVERRIDE_REQUEST" && data.request?.status === "PENDING") {
          requests.push(data.request as OverrideRequest);
        }
      } catch {
        // Skip invalid entries
      }
    }

    // Sort by creation date (oldest first - most urgent)
    return requests.sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }

  /**
   * Get pending request for a specific inspection
   */
  async getPendingRequestForInspection(inspectionId: string): Promise<OverrideRequest | null> {
    const inspection = await prisma.inspection.findUnique({
      where: { id: inspectionId },
    });

    if (!inspection?.specialInstructions) return null;

    try {
      const data = JSON.parse(inspection.specialInstructions);
      if (data.type === "OVERRIDE_REQUEST" && data.request?.status === "PENDING") {
        return data.request as OverrideRequest;
      }
    } catch {
      return null;
    }

    return null;
  }

  /**
   * Get override request by ID
   */
  async getRequestById(requestId: string): Promise<OverrideRequest | null> {
    const inspections = await prisma.inspection.findMany({
      where: {
        specialInstructions: { contains: requestId },
      },
    });

    for (const inspection of inspections) {
      try {
        const data = JSON.parse(inspection.specialInstructions || "{}");
        if (data.type === "OVERRIDE_REQUEST" && data.request?.id === requestId) {
          return data.request as OverrideRequest;
        }
      } catch {
        continue;
      }
    }

    return null;
  }

  /**
   * Approve override request
   */
  async approveRequest(
    requestId: string,
    adminId: string,
    input: ReviewOverrideInput
  ): Promise<OverrideRequest> {
    const request = await this.getRequestById(requestId);
    if (!request) {
      throw Errors.notFound("Override request", requestId);
    }

    if (request.status !== "PENDING") {
      throw new AppError(
        ErrorCode.VALIDATION_ERROR,
        "This request has already been reviewed",
        400
      );
    }

    // Get admin info
    const admin = await prisma.user.findUnique({
      where: { id: adminId },
      select: { name: true },
    });

    // Update the request
    const updatedRequest: OverrideRequest = {
      ...request,
      status: "APPROVED",
      reviewedBy: adminId,
      reviewedAt: new Date(),
      resolution: input.resolution,
      adminNotes: input.adminNotes || null,
      skipSignature: input.skipSignature,
    };

    // Determine new stage based on resolution
    let newStage = request.currentStage;
    let newStatus: "IN_PROGRESS" | "SUBMITTED" | "REJECTED" = "IN_PROGRESS";

    if (input.resolution === "COMPLETE" || input.resolution === "PARTIAL") {
      newStage = "SUBMITTED";
      newStatus = "SUBMITTED";
    } else if (input.resolution === "RESCHEDULE") {
      newStage = "ARRIVED"; // Reset to allow re-do
      newStatus = "IN_PROGRESS";
    } else if (input.resolution === "INCOMPLETE") {
      newStage = request.currentStage;
      newStatus = "REJECTED";
    }

    // Update inspection with override result
    const updateData: Record<string, unknown> = {
      currentStage: newStage,
      status: newStatus,
      specialInstructions: JSON.stringify({
        type: "OVERRIDE_REQUEST",
        request: updatedRequest,
      }),
      reviewedBy: adminId,
      reviewedAt: new Date(),
      reviewNotes: `Override approved: ${input.resolution}. ${input.adminNotes || ""}`,
    };

    // Create placeholder signature if skipping
    if (input.skipSignature) {
      const existingSignature = await prisma.clientSignature.findUnique({
        where: { inspectionId: request.inspectionId },
      });

      if (!existingSignature) {
        // Get technician name
        const inspection = await prisma.inspection.findUnique({
          where: { id: request.inspectionId },
          include: { technician: { select: { name: true } } },
        });

        await prisma.clientSignature.create({
          data: {
            inspectionId: request.inspectionId,
            signatureData: "ADMIN_BYPASS",
            signerName: `${inspection?.technician.name || "Technician"} (Admin Override)`,
            signerRole: "OTHER",
          },
        });
      }
    }

    await prisma.inspection.update({
      where: { id: request.inspectionId },
      data: updateData,
    });

    logger.info("Override request approved", {
      requestId,
      inspectionId: request.inspectionId,
      adminId,
      resolution: input.resolution,
      skipSignature: input.skipSignature,
    });

    return updatedRequest;
  }

  /**
   * Deny override request
   */
  async denyRequest(
    requestId: string,
    adminId: string,
    reason: string
  ): Promise<OverrideRequest> {
    const request = await this.getRequestById(requestId);
    if (!request) {
      throw Errors.notFound("Override request", requestId);
    }

    if (request.status !== "PENDING") {
      throw new AppError(
        ErrorCode.VALIDATION_ERROR,
        "This request has already been reviewed",
        400
      );
    }

    // Update the request
    const updatedRequest: OverrideRequest = {
      ...request,
      status: "DENIED",
      reviewedBy: adminId,
      reviewedAt: new Date(),
      adminNotes: reason,
    };

    // Update inspection
    await prisma.inspection.update({
      where: { id: request.inspectionId },
      data: {
        specialInstructions: JSON.stringify({
          type: "OVERRIDE_REQUEST",
          request: updatedRequest,
        }),
        reviewNotes: `Override denied: ${reason}`,
      },
    });

    logger.info("Override request denied", {
      requestId,
      inspectionId: request.inspectionId,
      adminId,
      reason,
    });

    return updatedRequest;
  }

  /**
   * Cancel override request (by technician)
   */
  async cancelRequest(inspectionId: string, technicianId: string): Promise<void> {
    const request = await this.getPendingRequestForInspection(inspectionId);

    if (!request) {
      throw Errors.notFound("Pending override request", inspectionId);
    }

    if (request.technicianId !== technicianId) {
      throw Errors.forbidden("You can only cancel your own requests");
    }

    // Clear the override request
    await prisma.inspection.update({
      where: { id: inspectionId },
      data: {
        specialInstructions: null,
      },
    });

    logger.info("Override request cancelled", {
      inspectionId,
      technicianId,
    });
  }

  /**
   * Get override history for an inspection
   */
  async getOverrideHistory(inspectionId: string): Promise<OverrideRequest[]> {
    const inspection = await prisma.inspection.findUnique({
      where: { id: inspectionId },
    });

    if (!inspection?.specialInstructions) return [];

    try {
      const data = JSON.parse(inspection.specialInstructions);
      if (data.type === "OVERRIDE_REQUEST") {
        return [data.request as OverrideRequest];
      }
    } catch {
      return [];
    }

    return [];
  }

  /**
   * Check if technician has an active override request
   */
  async hasActiveOverrideRequest(inspectionId: string): Promise<boolean> {
    const request = await this.getPendingRequestForInspection(inspectionId);
    return request !== null;
  }

  /**
   * Get stats about override requests
   */
  async getStats(): Promise<{
    pending: number;
    approvedToday: number;
    deniedToday: number;
    avgResponseTime: number | null;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const pending = await this.getPendingRequests();

    // Get all resolved today from inspection review data
    const inspections = await prisma.inspection.findMany({
      where: {
        reviewedAt: { gte: today },
        specialInstructions: { contains: "OVERRIDE_REQUEST" },
      },
    });

    let approvedToday = 0;
    let deniedToday = 0;
    const responseTimes: number[] = [];

    for (const inspection of inspections) {
      try {
        const data = JSON.parse(inspection.specialInstructions || "{}");
        if (data.type === "OVERRIDE_REQUEST" && data.request) {
          const req = data.request as OverrideRequest;
          if (req.reviewedAt && req.createdAt) {
            const responseTime =
              new Date(req.reviewedAt).getTime() - new Date(req.createdAt).getTime();
            responseTimes.push(responseTime);
          }
          if (req.status === "APPROVED") approvedToday++;
          if (req.status === "DENIED") deniedToday++;
        }
      } catch {
        continue;
      }
    }

    const avgResponseTime =
      responseTimes.length > 0
        ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
        : null;

    return {
      pending: pending.length,
      approvedToday,
      deniedToday,
      avgResponseTime: avgResponseTime ? Math.round(avgResponseTime / 60000) : null, // in minutes
    };
  }
}

// Export singleton instance
export const overrideService = new OverrideService();
export { OverrideService };
