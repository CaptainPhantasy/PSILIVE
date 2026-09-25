/**
 * Admin Service
 * Handles admin operations: overrides, approvals, delivery
 */

import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { Errors, AppError, ErrorCode } from "@/lib/errors";
import type {
  ApprovalInput,
  RejectionInput,
  OverrideApprovalInput,
  CreateDeliveryTokenInput,
} from "@/lib/validations";
import { inspectionService, type InspectionWithRelations } from "./inspection.service";
import { randomBytes, createHmac } from "crypto";

// Admin-only inspection status transitions
const ADMIN_STATUS_TRANSITIONS: Record<string, string[]> = {
  SUBMITTED: ["UNDER_REVIEW", "REJECTED"],
  UNDER_REVIEW: ["APPROVED", "REJECTED"],
  APPROVED: ["DELIVERED"],
  REJECTED: ["SUBMITTED", "UNDER_REVIEW"],
};

interface OverrideRequest {
  id: string;
  inspectionId: string;
  technicianId: string;
  reason: string;
  notes: string | null;
  skipSignature: boolean;
  status: "PENDING" | "APPROVED" | "DENIED";
  createdAt: Date;
  reviewedBy: string | null;
  reviewedAt: Date | null;
  resolution: string | null;
  adminNotes: string | null;
}

class AdminService {
  /**
   * Get all inspections pending review
   */
  async getPendingReviewInspections(options?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<{
    inspections: InspectionWithRelations[];
    total: number;
  }> {
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const status = options?.status || "SUBMITTED";

    const where = {
      status: status as "SUBMITTED" | "UNDER_REVIEW" | "APPROVED" | "REJECTED",
    };

    const [inspections, total] = await Promise.all([
      prisma.inspection.findMany({
        where,
        include: {
          job: true,
          technician: {
            select: { id: true, name: true, email: true, phone: true },
          },
          videoAttachment: true,
          clientSignature: true,
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
        orderBy: { completedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.inspection.count({ where }),
    ]);

    return {
      inspections: inspections as InspectionWithRelations[],
      total,
    };
  }

  /**
   * Get all technicians with active jobs
   */
  async getActiveTechnicians(): Promise<
    Array<{
      id: string;
      name: string;
      email: string;
      phone: string | null;
      activeInspection: {
        id: string;
        inspectionNumber: string;
        currentStage: string;
        job: {
          propertyAddress: string;
          propertyCity: string;
          clientName: string;
          clientPhone: string | null;
        };
      } | null;
    }>
  > {
    const technicians = await prisma.user.findMany({
      where: {
        role: "TECHNICIAN",
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        inspections: {
          where: {
            status: "IN_PROGRESS",
          },
          orderBy: { createdAt: "desc" },
          take: 1,
          include: {
            job: {
              select: {
                propertyAddress: true,
                propertyCity: true,
                clientName: true,
                clientPhone: true,
              },
            },
          },
        },
      },
    });

    return technicians.map((tech) => ({
      id: tech.id,
      name: tech.name,
      email: tech.email,
      phone: tech.phone,
      activeInspection: tech.inspections[0]
        ? {
            id: tech.inspections[0].id,
            inspectionNumber: tech.inspections[0].inspectionNumber,
            currentStage: tech.inspections[0].currentStage,
            job: tech.inspections[0].job,
          }
        : null,
    }));
  }

  /**
   * Get inspection for admin review
   */
  async getInspectionForReview(
    inspectionId: string,
    adminId: string
  ): Promise<InspectionWithRelations> {
    const inspection = await prisma.inspection.findUnique({
      where: { id: inspectionId },
      include: {
        job: true,
        technician: {
          select: { id: true, name: true, email: true, phone: true },
        },
        videoAttachment: true,
        clientSignature: true,
        photos: true,
        voiceRecordings: true,
        locationLogs: {
          orderBy: { timestamp: "asc" },
        },
        generatedReport: true,
      },
    });

    if (!inspection) {
      throw Errors.notFound("Inspection", inspectionId);
    }

    logger.info("Admin viewing inspection", {
      inspectionId,
      adminId,
      status: inspection.status,
    });

    return inspection as InspectionWithRelations;
  }

  /**
   * Approve inspection
   */
  async approveInspection(
    inspectionId: string,
    adminId: string,
    input: ApprovalInput
  ): Promise<{ inspection: InspectionWithRelations; deliveryToken: string }> {
    const inspection = await this.getInspectionForReview(inspectionId, adminId);

    // Validate status transition
    if (!ADMIN_STATUS_TRANSITIONS[inspection.status]?.includes("APPROVED")) {
      throw new AppError(
        ErrorCode.INVALID_STAGE,
        `Cannot approve inspection in status: ${inspection.status}`,
        400
      );
    }

    // Verify video is uploaded
    if (!inspection.videoAttachment || inspection.videoAttachment.uploadStatus !== "COMPLETED") {
      throw Errors.gateBlocked(inspection.currentStage, ["Video upload"]);
    }

    // Update inspection
    const updated = await prisma.inspection.update({
      where: { id: inspectionId },
      data: {
        status: "APPROVED",
        currentStage: "APPROVED",
        reviewedBy: adminId,
        reviewedAt: new Date(),
        reviewNotes: input.reviewNotes,
      },
      include: {
        job: true,
        technician: { select: { id: true, name: true, email: true } },
        videoAttachment: true,
        clientSignature: true,
        photos: true,
      },
    });

    // Create delivery token
    const deliveryInput: CreateDeliveryTokenInput = {
      inspectionId,
      clientEmail: inspection.job.clientEmail,
      expiresInHours: 72, // 3 days
      downloadLimit: 3,
    };
    const deliveryToken = await this.createDeliveryToken(deliveryInput);

    logger.info("Inspection approved", {
      inspectionId,
      adminId,
      deliveryTokenId: deliveryToken.id,
    });

    return {
      inspection: updated as InspectionWithRelations,
      deliveryToken: deliveryToken.token,
    };
  }

  /**
   * Reject inspection (return to technician)
   */
  async rejectInspection(
    inspectionId: string,
    adminId: string,
    input: RejectionInput
  ): Promise<InspectionWithRelations> {
    const inspection = await this.getInspectionForReview(inspectionId, adminId);

    // Update inspection - return to POST_INSPECTION stage
    const updated = await prisma.inspection.update({
      where: { id: inspectionId },
      data: {
        status: "REJECTED",
        currentStage: "POST_INSPECTION",
        reviewedBy: adminId,
        reviewedAt: new Date(),
        reviewNotes: input.reason,
      },
      include: {
        job: true,
        technician: { select: { id: true, name: true, email: true } },
        videoAttachment: true,
        clientSignature: true,
        photos: true,
      },
    });

    // TODO: Send notification to technician

    logger.info("Inspection rejected", {
      inspectionId,
      adminId,
      reason: input.reason,
    });

    return updated as InspectionWithRelations;
  }

  /**
   * Request gate override (from technician)
   */
  async requestOverride(
    inspectionId: string,
    technicianId: string,
    data: {
      reason: string;
      notes?: string;
      skipSignature?: boolean;
      photoUrl?: string;
    }
  ): Promise<OverrideRequest> {
    const inspection = await inspectionService.getById(inspectionId, technicianId);

    // Create override request in a simple format
    // In production, this would be a proper OverrideRequest table
    const overrideRequest = {
      id: `override_${Date.now()}`,
      inspectionId,
      technicianId,
      reason: data.reason,
      notes: data.notes || null,
      skipSignature: data.skipSignature || false,
      status: "PENDING" as const,
      createdAt: new Date(),
      reviewedBy: null,
      reviewedAt: null,
      resolution: null,
      adminNotes: null,
    };

    // Store in inspection's special notes or a JSON field
    await prisma.inspection.update({
      where: { id: inspectionId },
      data: {
        specialInstructions: `OVERRIDE REQUEST: ${JSON.stringify(overrideRequest)}`,
      },
    });

    logger.info("Override requested", {
      inspectionId,
      technicianId,
      reason: data.reason,
    });

    return overrideRequest;
  }

  /**
   * Get pending override requests
   */
  async getPendingOverrides(): Promise<
    Array<{
      id: string;
      inspectionId: string;
      inspectionNumber: string;
      technicianName: string;
      reason: string;
      notes: string | null;
      createdAt: Date;
      propertyAddress: string;
      clientName: string;
    }>
  > {
    // Find inspections with override requests
    const inspections = await prisma.inspection.findMany({
      where: {
        specialInstructions: { contains: "OVERRIDE REQUEST:" },
      },
      include: {
        technician: { select: { name: true } },
        job: { select: { propertyAddress: true, clientName: true } },
      },
    });

    return inspections.map((insp) => {
      const requestJson = insp.specialInstructions?.replace("OVERRIDE REQUEST: ", "") || "{}";
      let request;
      try {
        request = JSON.parse(requestJson);
      } catch {
        request = {};
      }

      return {
        id: request.id || `override_${insp.id}`,
        inspectionId: insp.id,
        inspectionNumber: insp.inspectionNumber,
        technicianName: insp.technician.name,
        reason: request.reason || "Unknown",
        notes: request.notes || null,
        createdAt: new Date(request.createdAt || insp.updatedAt),
        propertyAddress: insp.job.propertyAddress,
        clientName: insp.job.clientName,
      };
    });
  }

  /**
   * Approve override request
   */
  async approveOverride(
    inspectionId: string,
    adminId: string,
    input: OverrideApprovalInput
  ): Promise<InspectionWithRelations> {
    const inspection = await prisma.inspection.findUnique({
      where: { id: inspectionId },
      include: {
        job: true,
        technician: { select: { id: true, name: true, email: true } },
        videoAttachment: true,
        clientSignature: true,
        photos: true,
      },
    });

    if (!inspection) {
      throw Errors.notFound("Inspection", inspectionId);
    }

    // Clear the override request and allow progression
    let newStage = inspection.currentStage;
    let newStatus = inspection.status;

    if (input.resolution === "COMPLETE") {
      newStage = "SUBMITTED";
      newStatus = "SUBMITTED";
    } else if (input.resolution === "PARTIAL") {
      newStage = "SUBMITTED";
      newStatus = "SUBMITTED";
    } else if (input.resolution === "INCOMPLETE" || input.resolution === "RESCHEDULE") {
      newStage = "POST_INSPECTION";
      newStatus = "IN_PROGRESS";
    }

    const updated = await prisma.inspection.update({
      where: { id: inspectionId },
      data: {
        currentStage: newStage,
        status: newStatus,
        specialInstructions: `OVERRIDE APPROVED: ${input.resolution}. ${input.adminNotes || ""}`,
        reviewedBy: adminId,
        reviewedAt: new Date(),
        // If skipping signature, create a placeholder
        ...(input.skipSignature &&
          !inspection.clientSignature && {
            clientSignature: {
              create: {
                signatureData: "ADMIN_BYPASS",
                signerName: `${inspection.technician.name} (Admin Override)`,
                signerRole: "OTHER",
              },
            },
          }),
      },
      include: {
        job: true,
        technician: { select: { id: true, name: true, email: true } },
        videoAttachment: true,
        clientSignature: true,
        photos: true,
      },
    });

    logger.info("Override approved", {
      inspectionId,
      adminId,
      resolution: input.resolution,
      skipSignature: input.skipSignature,
    });

    return updated as InspectionWithRelations;
  }

  /**
   * Create delivery token for client access
   */
  private async createDeliveryToken(input: CreateDeliveryTokenInput): Promise<{
    id: string;
    token: string;
  }> {
    // Generate secure token
    const tokenValue = randomBytes(32).toString("base64url");
    const expiresAt = new Date(Date.now() + input.expiresInHours * 60 * 60 * 1000);

    const deliveryToken = await prisma.deliveryToken.create({
      data: {
        inspectionId: input.inspectionId,
        token: tokenValue,
        clientEmail: input.clientEmail,
        displayExpiresAt: expiresAt,
        actualExpiresAt: expiresAt,
        downloadLimit: input.downloadLimit,
      },
    });

    return {
      id: deliveryToken.id,
      token: deliveryToken.token,
    };
  }

  /**
   * Verify and get delivery token
   */
  async verifyDeliveryToken(
    token: string,
    email: string
  ): Promise<{
    valid: boolean;
    inspection?: InspectionWithRelations;
    downloadsRemaining?: number;
    error?: string;
  }> {
    const deliveryToken = await prisma.deliveryToken.findUnique({
      where: { token },
      include: {
        inspection: {
          include: {
            job: true,
            technician: { select: { id: true, name: true, email: true } },
            videoAttachment: true,
            clientSignature: true,
            photos: true,
          },
        },
      },
    });

    if (!deliveryToken) {
      return { valid: false, error: "Invalid link" };
    }

    // Check email match
    if (deliveryToken.clientEmail.toLowerCase() !== email.toLowerCase()) {
      return { valid: false, error: "Email does not match" };
    }

    // Check expiration
    if (new Date() > deliveryToken.actualExpiresAt) {
      return { valid: false, error: "Link has expired" };
    }

    // Check download limit
    if (deliveryToken.downloadsUsed >= deliveryToken.downloadLimit) {
      return { valid: false, error: "Download limit reached" };
    }

    // Mark email as verified
    if (!deliveryToken.emailVerified) {
      await prisma.deliveryToken.update({
        where: { id: deliveryToken.id },
        data: { emailVerified: true },
      });
    }

    return {
      valid: true,
      inspection: deliveryToken.inspection as InspectionWithRelations,
      downloadsRemaining: deliveryToken.downloadLimit - deliveryToken.downloadsUsed,
    };
  }

  /**
   * Record download and increment counter
   */
  async recordDownload(
    token: string,
    fileType: "video" | "report",
    ipAddress?: string
  ): Promise<{ downloadUrl: string; fileName: string }> {
    const deliveryToken = await prisma.deliveryToken.findUnique({
      where: { token },
      include: {
        inspection: {
          include: {
            videoAttachment: true,
            generatedReport: true,
          },
        },
      },
    });

    if (!deliveryToken || !deliveryToken.emailVerified) {
      throw Errors.unauthorized("Invalid or unverified token");
    }

    // Increment download count
    await prisma.deliveryToken.update({
      where: { id: deliveryToken.id },
      data: {
        downloadsUsed: { increment: 1 },
        firstDownloadIp: ipAddress || deliveryToken.firstDownloadIp,
        firstDownloadAt: deliveryToken.firstDownloadAt || new Date(),
        accessLogs: {
          push: {
            timestamp: new Date().toISOString(),
            fileType,
            ip: ipAddress,
          },
        },
      },
    });

    // Return appropriate URL
    if (fileType === "video" && deliveryToken.inspection.videoAttachment) {
      return {
        downloadUrl: deliveryToken.inspection.videoAttachment.publicUrl || "",
        fileName: deliveryToken.inspection.videoAttachment.fileName,
      };
    }

    if (fileType === "report" && deliveryToken.inspection.generatedReport) {
      return {
        downloadUrl: deliveryToken.inspection.generatedReport.clientReportUrl || "",
        fileName: `inspection-report-${deliveryToken.inspection.inspectionNumber}.pdf`,
      };
    }

    throw Errors.notFound("File", fileType);
  }

  /**
   * Get admin dashboard stats
   */
  async getDashboardStats(): Promise<{
    pendingReview: number;
    approvedToday: number;
    deliveredToday: number;
    activeTechnicians: number;
    pendingOverrides: number;
    todayBookings: number;
    totalPaidRevenue: number;
    pendingSubmissions: number;
    totalChats: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [pendingReview, approvedToday, deliveredToday, activeTechnicians, pendingOverrides, todayBookings, revenueResult, pendingSubmissions, totalChats] =
      await Promise.all([
        prisma.inspection.count({
          where: { status: { in: ["SUBMITTED", "UNDER_REVIEW"] } },
        }),
        prisma.inspection.count({
          where: {
            status: "APPROVED",
            reviewedAt: { gte: today },
          },
        }),
        prisma.inspection.count({
          where: {
            status: "DELIVERED",
            updatedAt: { gte: today },
          },
        }),
        prisma.user.count({
          where: { role: "TECHNICIAN", isActive: true },
        }),
        prisma.inspection.count({
          where: {
            specialInstructions: { contains: "OVERRIDE REQUEST:" },
          },
        }),
        // Today's bookings (paid)
        prisma.contactSubmission.count({
          where: { status: "paid", paidAt: { gte: today } },
        }),
        // Total paid revenue
        prisma.contactSubmission.aggregate({
          _sum: { amountPaid: true },
          where: { status: "paid" },
        }),
        // Pending / new submissions
        prisma.contactSubmission.count({
          where: { status: { in: ["new", "pending-payment"] } },
        }),
        // Total chat conversations
        prisma.chatConversation.count(),
      ]);

    return {
      pendingReview,
      approvedToday,
      deliveredToday,
      activeTechnicians,
      pendingOverrides,
      todayBookings,
      totalPaidRevenue: revenueResult._sum.amountPaid ?? 0,
      pendingSubmissions,
      totalChats,
    };
  }
}

// Export singleton instance
export const adminService = new AdminService();
export { AdminService };
