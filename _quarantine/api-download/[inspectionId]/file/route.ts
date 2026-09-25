import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getFileUrl } from "@/lib/s3";
import { headers } from "next/headers";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ inspectionId: string }> }
) {
  try {
    const { inspectionId } = await params;
    const { token, fileType, streamOnly } = await request.json();

    if (!token || !fileType) {
      return NextResponse.json(
        { success: false, error: "Token and fileType are required" },
        { status: 400 }
      );
    }

    // Valid file types
    const validTypes = ["video", "report", "highlight"];
    if (!validTypes.includes(fileType)) {
      return NextResponse.json(
        { success: false, error: "Invalid file type" },
        { status: 400 }
      );
    }

    // Find delivery token
    const deliveryToken = await prisma.deliveryToken.findFirst({
      where: {
        inspectionId,
        token,
        emailVerified: true,
      },
      include: {
        inspection: {
          include: {
            videoAttachment: true,
            generatedReport: true,
          },
        },
      },
    });

    if (!deliveryToken) {
      return NextResponse.json(
        { success: false, error: "Invalid or unverified download link" },
        { status: 404 }
      );
    }

    // Check expiration
    if (new Date() > deliveryToken.actualExpiresAt) {
      return NextResponse.json(
        { success: false, error: "This download link has expired" },
        { status: 410 }
      );
    }

    // Check download limit (only for actual downloads, not streaming)
    if (!streamOnly && deliveryToken.downloadsUsed >= deliveryToken.downloadLimit) {
      return NextResponse.json(
        { success: false, error: "Download limit reached" },
        { status: 403 }
      );
    }

    // Get file URL based on type
    let cloudPath: string | null = null;
    let fileName: string = "download";

    if (fileType === "video") {
      if (!deliveryToken.inspection.videoAttachment?.cloudPath) {
        return NextResponse.json(
          { success: false, error: "Video not available" },
          { status: 404 }
        );
      }
      cloudPath = deliveryToken.inspection.videoAttachment.cloudPath;
      fileName = deliveryToken.inspection.videoAttachment.fileName;
    } else if (fileType === "report") {
      if (!deliveryToken.inspection.generatedReport?.clientReportCloudPath) {
        return NextResponse.json(
          { success: false, error: "Report not available" },
          { status: 404 }
        );
      }
      cloudPath = deliveryToken.inspection.generatedReport.clientReportCloudPath;
      fileName = `inspection-report-${deliveryToken.inspection.inspectionNumber}.pdf`;
    } else if (fileType === "highlight") {
      if (!deliveryToken.inspection.videoAttachment?.highlightReelPath) {
        return NextResponse.json(
          { success: false, error: "Highlight reel not available" },
          { status: 404 }
        );
      }
      cloudPath = deliveryToken.inspection.videoAttachment.highlightReelPath;
      fileName = `highlight-${deliveryToken.inspection.inspectionNumber}.mp4`;
    }

    if (!cloudPath) {
      return NextResponse.json(
        { success: false, error: "File not found" },
        { status: 404 }
      );
    }

    // Get signed URL
    const downloadUrl = await getFileUrl(cloudPath, false);

    // Update download count and log (only for actual downloads, not streaming)
    const headersList = await headers();
    const ip = headersList.get("x-forwarded-for") || "unknown";

    if (!streamOnly) {
      await prisma.deliveryToken.update({
        where: { id: deliveryToken.id },
        data: {
          downloadsUsed: { increment: 1 },
          firstDownloadAt: deliveryToken.firstDownloadAt || new Date(),
          firstDownloadIp: deliveryToken.firstDownloadIp || ip,
          accessLogs: {
            push: {
              timestamp: new Date().toISOString(),
              ip,
              action: `DOWNLOAD_${fileType.toUpperCase()}`,
            },
          },
        },
      });
    } else {
      // Log streaming access (doesn't count toward limit)
      await prisma.deliveryToken.update({
        where: { id: deliveryToken.id },
        data: {
          accessLogs: {
            push: {
              timestamp: new Date().toISOString(),
              ip,
              action: `STREAM_${fileType.toUpperCase()}`,
            },
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      downloadUrl,
      fileName,
      isStream: streamOnly || false,
    });
  } catch (error) {
    console.error("Error getting download URL:", error);
    return NextResponse.json(
      { success: false, error: "Failed to get download URL" },
      { status: 500 }
    );
  }
}
