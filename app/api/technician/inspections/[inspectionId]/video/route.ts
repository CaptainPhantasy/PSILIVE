export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { canEnterInspectionData, isFieldOperatorRole } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db";

export async function POST(
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
    const { cloudPath, fileName, fileSize, duration, mimeType, checksum, uploadId, uploadStatus } = await request.json();

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

    // Upsert video attachment
    const video = await prisma.videoAttachment.upsert({
      where: { inspectionId },
      create: {
        inspectionId,
        cloudPath: cloudPath || "",
        fileName: fileName || "inspection-video.mp4",
        fileSize: fileSize || 0,
        duration,
        mimeType: mimeType || "video/mp4",
        checksum,
        uploadId,
        uploadStatus: uploadStatus || "PENDING",
      },
      update: {
        cloudPath: cloudPath || undefined,
        fileName: fileName || undefined,
        fileSize: fileSize || undefined,
        duration: duration || undefined,
        checksum: checksum || undefined,
        uploadId: uploadId || undefined,
        uploadStatus: uploadStatus || undefined,
        uploadedAt: uploadStatus === "COMPLETED" ? new Date() : undefined,
      },
    });

    return NextResponse.json({
      success: true,
      video,
    });
  } catch (error) {
    console.error("Error saving video attachment:", error);
    return NextResponse.json(
      { success: false, error: "Failed to save video attachment" },
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
    const { uploadProgress, uploadStatus } = await request.json();

    const video = await prisma.videoAttachment.update({
      where: { inspectionId },
      data: {
        uploadProgress: uploadProgress !== undefined ? uploadProgress : undefined,
        uploadStatus: uploadStatus || undefined,
        uploadedAt: uploadStatus === "COMPLETED" ? new Date() : undefined,
      },
    });

    return NextResponse.json({
      success: true,
      video,
    });
  } catch (error) {
    console.error("Error updating video attachment:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update video attachment" },
      { status: 500 }
    );
  }
}
