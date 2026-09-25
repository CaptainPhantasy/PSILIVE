export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { isFieldOperatorRole } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !isFieldOperatorRole(user?.role)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const includeCompleted = searchParams.get("includeCompleted") === "true";

    // Get active jobs assigned to this technician
    const activeJobs = await prisma.job.findMany({
      where: {
        technicianId: user.id,
        status: {
          in: ["ASSIGNED", "ACCEPTED", "EN_ROUTE", "ON_SITE", "IN_PROGRESS"],
        },
      },
      include: {
        inspection: {
          select: {
            id: true,
            currentStage: true,
            status: true,
            reviewNotes: true,
            reviewedAt: true,
          },
        },
      },
      orderBy: [
        { scheduledDate: "asc" },
        { createdAt: "asc" },
      ],
    });

    // Get jobs with REJECTED inspections that need attention
    const rejectedJobs = await prisma.job.findMany({
      where: {
        technicianId: user.id,
        inspection: {
          status: "REJECTED",
        },
      },
      include: {
        inspection: {
          select: {
            id: true,
            currentStage: true,
            status: true,
            reviewNotes: true,
            reviewedAt: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    // Optionally get completed jobs for history
    const completedJobs = includeCompleted
      ? await prisma.job.findMany({
          where: {
            technicianId: user.id,
            status: "COMPLETED",
            inspection: {
              status: {
                in: ["APPROVED", "DELIVERED"],
              },
            },
          },
          include: {
            inspection: {
              select: {
                id: true,
                currentStage: true,
                status: true,
                reviewNotes: true,
                reviewedAt: true,
              },
            },
          },
          orderBy: {
            updatedAt: "desc",
          },
          take: 20, // Limit to last 20 completed jobs
        })
      : [];

    return NextResponse.json({
      success: true,
      jobs: activeJobs,
      rejectedJobs,
      completedJobs,
    });
  } catch (error) {
    console.error("Error fetching jobs:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch jobs" },
      { status: 500 }
    );
  }
}
