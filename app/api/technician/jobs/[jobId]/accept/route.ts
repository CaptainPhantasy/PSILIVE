export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { isFieldOperatorRole } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !isFieldOperatorRole(user?.role)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { jobId } = await params;

    // Verify job belongs to this technician
    const job = await prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      return NextResponse.json(
        { success: false, error: "Job not found" },
        { status: 404 }
      );
    }

    if (job.technicianId !== user.id) {
      return NextResponse.json(
        { success: false, error: "This job is not assigned to you" },
        { status: 403 }
      );
    }

    if (job.status !== "ASSIGNED") {
      return NextResponse.json(
        { success: false, error: "Job cannot be accepted in current state" },
        { status: 400 }
      );
    }

    // Generate inspection number
    const date = new Date();
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    const count = await prisma.inspection.count({
      where: {
        createdAt: {
          gte: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
        },
      },
    });
    const inspectionNumber = `PSI-${dateStr}-${String(count + 1).padStart(3, "0")}`;

    // Create inspection record and update job status
    const [updatedJob, inspection] = await prisma.$transaction([
      prisma.job.update({
        where: { id: jobId },
        data: { status: "ACCEPTED" },
      }),
      prisma.inspection.create({
        data: {
          inspectionNumber,
          jobId,
          technicianId: user.id,
          currentStage: "ACCEPTED",
          status: "IN_PROGRESS",
          startedAt: new Date(),
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      job: updatedJob,
      inspection,
    });
  } catch (error) {
    console.error("Error accepting job:", error);
    return NextResponse.json(
      { success: false, error: "Failed to accept job" },
      { status: 500 }
    );
  }
}
