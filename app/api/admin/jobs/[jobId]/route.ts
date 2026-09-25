export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getCurrentUser, hasRole } from "@/lib/auth";
import { canManageJobs } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db";

// GET: Get single job details
export async function GET(
  request: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!canManageJobs(user)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { jobId } = await params;

    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        technician: {
          select: { id: true, name: true, email: true, phone: true },
        },
        inspection: {
          include: {
            videoAttachment: true,
            clientSignature: true,
            generatedReport: true,
          },
        },
      },
    });

    if (!job) {
      return NextResponse.json(
        { success: false, error: "Job not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, job });
  } catch (error) {
    console.error("Error fetching job:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch job" },
      { status: 500 }
    );
  }
}

// PATCH: Update job details
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!canManageJobs(user)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { jobId } = await params;
    const data = await request.json();

    // Verify job exists
    const existingJob = await prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!existingJob) {
      return NextResponse.json(
        { success: false, error: "Job not found" },
        { status: 404 }
      );
    }

    // Allowed fields for update
    const allowedFields = [
      "clientName",
      "clientEmail",
      "clientPhone",
      "propertyAddress",
      "propertyCity",
      "propertyState",
      "propertyZip",
      "scheduledDate",
      "scheduledTime",
      "accessType",
      "specialNotes",
      "technicianId",
      "status",
    ];

    const updateData: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        if (field === "scheduledDate" && data[field]) {
          updateData[field] = new Date(data[field]);
        } else {
          updateData[field] = data[field];
        }
      }
    }

    // Auto-set status to ASSIGNED if technician is assigned
    if (data.technicianId && existingJob.status === "PENDING") {
      updateData.status = "ASSIGNED";
    }

    const job = await prisma.job.update({
      where: { id: jobId },
      data: updateData,
      include: {
        technician: {
          select: { id: true, name: true, email: true },
        },
        inspection: {
          select: { id: true, inspectionNumber: true, status: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      job,
      message: "Job updated successfully",
    });
  } catch (error) {
    console.error("Error updating job:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update job" },
      { status: 500 }
    );
  }
}

// DELETE: Delete a job (only if no inspection started)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasRole(user, ["SUPER_ADMIN"])) {
      return NextResponse.json(
        { success: false, error: "Only super admins can delete jobs" },
        { status: 403 }
      );
    }

    const { jobId } = await params;

    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: { inspection: true },
    });

    if (!job) {
      return NextResponse.json(
        { success: false, error: "Job not found" },
        { status: 404 }
      );
    }

    if (job.inspection) {
      return NextResponse.json(
        { success: false, error: "Cannot delete job with associated inspection. Delete inspection first." },
        { status: 400 }
      );
    }

    await prisma.job.delete({
      where: { id: jobId },
    });

    return NextResponse.json({
      success: true,
      message: "Job deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting job:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete job" },
      { status: 500 }
    );
  }
}
