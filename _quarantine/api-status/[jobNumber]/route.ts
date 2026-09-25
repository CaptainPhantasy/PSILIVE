import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobNumber: string }> }
) {
  try {
    const { jobNumber } = await params;
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { success: false, error: "Email is required for verification" },
        { status: 400 }
      );
    }

    // Find the job by job number and verify email
    const job = await prisma.job.findFirst({
      where: {
        jobNumber: jobNumber.toUpperCase(),
        clientEmail: email.toLowerCase(),
      },
      include: {
        inspection: {
          select: {
            id: true,
            inspectionNumber: true,
            status: true,
            currentStage: true,
            completedAt: true,
            reviewedAt: true,
            deliveryToken: {
              select: {
                displayExpiresAt: true,
                downloadsUsed: true,
                downloadLimit: true,
              },
            },
          },
        },
      },
    });

    if (!job) {
      return NextResponse.json(
        { success: false, error: "Job not found or email does not match" },
        { status: 404 }
      );
    }

    // Build status response
    const statusInfo = getStatusInfo(job);

    return NextResponse.json({
      success: true,
      status: statusInfo,
      job: {
        jobNumber: job.jobNumber,
        propertyAddress: job.propertyAddress,
        propertyCity: job.propertyCity,
        propertyState: job.propertyState,
        scheduledDate: job.scheduledDate,
        scheduledTime: job.scheduledTime,
      },
    });
  } catch (error) {
    console.error("Error fetching status:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch status" },
      { status: 500 }
    );
  }
}

interface JobWithInspection {
  status: string;
  scheduledDate: Date;
  inspection: {
    id: string;
    inspectionNumber: string;
    status: string;
    currentStage: string;
    completedAt: Date | null;
    reviewedAt: Date | null;
    deliveryToken: {
      displayExpiresAt: Date;
      downloadsUsed: number;
      downloadLimit: number;
    } | null;
  } | null;
}

function getStatusInfo(job: JobWithInspection) {
  const stages = [
    { id: "SCHEDULED", label: "Scheduled", description: "Your inspection is scheduled" },
    { id: "ASSIGNED", label: "Technician Assigned", description: "A technician has been assigned" },
    { id: "EN_ROUTE", label: "Technician En Route", description: "Your technician is on the way" },
    { id: "ON_SITE", label: "Inspection in Progress", description: "Inspection is currently being performed" },
    { id: "SUBMITTED", label: "Under Review", description: "Inspection complete, pending review" },
    { id: "APPROVED", label: "Report Ready", description: "Your report is ready for download" },
  ];

  let currentStageIndex = 0;
  let statusMessage = "";
  let downloadAvailable = false;
  let downloadExpires: Date | null = null;

  // Determine current stage based on job and inspection status
  if (!job.inspection) {
    // No inspection yet - scheduled or assigned
    if (job.status === "ASSIGNED") {
      currentStageIndex = 1;
      statusMessage = `Your inspection is scheduled for ${new Date(job.scheduledDate).toLocaleDateString()}. A technician has been assigned.`;
    } else {
      currentStageIndex = 0;
      statusMessage = `Your inspection is scheduled for ${new Date(job.scheduledDate).toLocaleDateString()}.`;
    }
  } else {
    const inspection = job.inspection;

    switch (inspection.status) {
      case "IN_PROGRESS":
        // Check the current stage
        if (inspection.currentStage === "EN_ROUTE") {
          currentStageIndex = 2;
          statusMessage = "Your technician is on the way to the property.";
        } else if (
          ["ARRIVED", "PRE_INSPECTION", "INSPECTING", "POST_INSPECTION", "VIDEO_ATTACH", "CLIENT_SIGNOFF"].includes(
            inspection.currentStage
          )
        ) {
          currentStageIndex = 3;
          statusMessage = "The inspection is currently in progress at your property.";
        } else {
          currentStageIndex = 1;
          statusMessage = "A technician has accepted your job and will begin soon.";
        }
        break;

      case "SUBMITTED":
      case "UNDER_REVIEW":
        currentStageIndex = 4;
        statusMessage = "The inspection has been completed and is currently under review by our team.";
        break;

      case "APPROVED":
        currentStageIndex = 5;
        downloadAvailable = true;
        if (inspection.deliveryToken) {
          downloadExpires = inspection.deliveryToken.displayExpiresAt;
          const remaining = inspection.deliveryToken.downloadLimit - inspection.deliveryToken.downloadsUsed;
          statusMessage = `Your inspection report is ready! You have ${remaining} download${remaining !== 1 ? "s" : ""} remaining.`;
        } else {
          statusMessage = "Your inspection report is ready for download.";
        }
        break;

      case "REJECTED":
        currentStageIndex = 4;
        statusMessage = "Your inspection is being revised. We'll notify you when the updated report is ready.";
        break;

      default:
        currentStageIndex = 1;
        statusMessage = "Your inspection is in progress.";
    }
  }

  return {
    stages: stages.map((stage, index) => ({
      ...stage,
      status:
        index < currentStageIndex
          ? "completed"
          : index === currentStageIndex
          ? "current"
          : "pending",
    })),
    currentStageIndex,
    message: statusMessage,
    downloadAvailable,
    downloadExpires,
    inspectionId: job.inspection?.id || null,
  };
}
