export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { canEnterInspectionData, isFieldOperatorRole } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ inspectionId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !isFieldOperatorRole(user?.role)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { inspectionId } = await params;

    const inspection = await prisma.inspection.findUnique({
      where: { id: inspectionId },
      include: {
        job: true,
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
        voiceRecordings: true,
        photos: true,
        videoAttachment: true,
        clientSignature: true,
      },
    });

    if (!inspection) {
      return NextResponse.json(
        { success: false, error: "Inspection not found" },
        { status: 404 }
      );
    }

    // Field operators can only access their own inspections; admin roles can review any inspection.
    		if (!canEnterInspectionData(user, inspection.technicianId)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      inspection,
    });
  } catch (error) {
    console.error("Error fetching inspection:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch inspection" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ inspectionId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !isFieldOperatorRole(user?.role)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { inspectionId } = await params;
    const data = await request.json();

    const inspection = await prisma.inspection.findUnique({
      where: { id: inspectionId },
    });

    if (!inspection) {
      return NextResponse.json(
        { success: false, error: "Inspection not found" },
        { status: 404 }
      );
    }

    if (!canEnterInspectionData(user, inspection.technicianId)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Update inspection
    const updated = await prisma.inspection.update({
      where: { id: inspectionId },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      inspection: updated,
    });
  } catch (error) {
    console.error("Error updating inspection:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update inspection" },
      { status: 500 }
    );
  }
}
