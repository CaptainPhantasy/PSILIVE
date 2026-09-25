export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { canEnterInspectionData, isFieldOperatorRole } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db";
import { ClientRole } from "@prisma/client";

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
    const { signatureData, signerName, signerRole, latitude, longitude } = await request.json();

    if (!signatureData || !signerName) {
      return NextResponse.json(
        { success: false, error: "Signature data and signer name are required" },
        { status: 400 }
      );
    }

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

    // Upsert signature (allow re-signing)
    const signature = await prisma.clientSignature.upsert({
      where: { inspectionId },
      create: {
        inspectionId,
        signatureData,
        signerName,
        signerRole: signerRole as ClientRole || "HOMEOWNER",
        latitude,
        longitude,
      },
      update: {
        signatureData,
        signerName,
        signerRole: signerRole as ClientRole || "HOMEOWNER",
        latitude,
        longitude,
        signedAt: new Date(),
      },
    });

    // Log location
    if (latitude && longitude) {
      await prisma.locationLog.create({
        data: {
          inspectionId,
          latitude,
          longitude,
          eventType: "SIGNATURE",
        },
      });
    }

    return NextResponse.json({
      success: true,
      signature,
    });
  } catch (error) {
    console.error("Error saving signature:", error);
    return NextResponse.json(
      { success: false, error: "Failed to save signature" },
      { status: 500 }
    );
  }
}
