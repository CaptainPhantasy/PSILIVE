import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ inspectionId: string }> }
) {
  try {
    const { inspectionId } = await params;
    const { email, token } = await request.json();

    if (!email || !token) {
      return NextResponse.json(
        { success: false, error: "Email and token are required" },
        { status: 400 }
      );
    }

    // Find delivery token
    const deliveryToken = await prisma.deliveryToken.findFirst({
      where: {
        inspectionId,
        token,
      },
      include: {
        inspection: {
          include: {
            job: true,
            videoAttachment: {
              include: {
                chapters: {
                  orderBy: { timestamp: "asc" },
                },
              },
            },
            generatedReport: true,
          },
        },
      },
    });

    if (!deliveryToken) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired download link" },
        { status: 404 }
      );
    }

    // Check if expired (use actual expiration, not display)
    if (new Date() > deliveryToken.actualExpiresAt) {
      return NextResponse.json(
        { success: false, error: "This download link has expired" },
        { status: 410 }
      );
    }

    // Verify email matches
    if (email.toLowerCase() !== deliveryToken.clientEmail.toLowerCase()) {
      // Log failed attempt
      const headersList = await headers();
      const ip = headersList.get("x-forwarded-for") || "unknown";
      
      await prisma.deliveryToken.update({
        where: { id: deliveryToken.id },
        data: {
          accessLogs: {
            push: {
              timestamp: new Date().toISOString(),
              ip,
              action: "VERIFY_FAILED",
              email,
            },
          },
        },
      });

      return NextResponse.json(
        { success: false, error: "Email address does not match" },
        { status: 403 }
      );
    }

    // Check download limit
    if (deliveryToken.downloadsUsed >= deliveryToken.downloadLimit) {
      return NextResponse.json(
        { success: false, error: "Download limit reached" },
        { status: 403 }
      );
    }

    // Mark as verified and log
    const headersList = await headers();
    const ip = headersList.get("x-forwarded-for") || "unknown";

    await prisma.deliveryToken.update({
      where: { id: deliveryToken.id },
      data: {
        emailVerified: true,
        accessLogs: {
          push: {
            timestamp: new Date().toISOString(),
            ip,
            action: "VERIFY_SUCCESS",
          },
        },
      },
    });

    // Calculate time remaining (show display expiration)
    const hoursRemaining = Math.max(
      0,
      Math.round((deliveryToken.displayExpiresAt.getTime() - Date.now()) / (1000 * 60 * 60))
    );

    const insp = deliveryToken.inspection;

    return NextResponse.json({
      success: true,
      inspection: {
        id: insp.id,
        inspectionNumber: insp.inspectionNumber,
        propertyAddress: `${insp.job.propertyAddress}, ${insp.job.propertyCity}, ${insp.job.propertyState}`,
        inspectionDate: insp.completedAt,
        clientName: insp.job.clientName,
        // Findings summary
        overallCondition: insp.overallCondition,
        pipeConditionRating: insp.pipeConditionRating,
        recommendations: insp.recommendations,
        urgencyLevel: insp.urgencyLevel,
        // Detailed findings
        rootIntrusion: insp.rootIntrusion,
        cracks: insp.cracks,
        bellies: insp.bellies,
        offsetJoints: insp.offsetJoints,
        blockages: insp.blockages,
        connectionToMain: insp.connectionToMain,
        // Video info
        hasVideo: !!insp.videoAttachment,
        videoDuration: insp.videoAttachment?.duration || null,
        hasHighlightReel: !!insp.videoAttachment?.highlightReelPath,
        highlightDuration: insp.videoAttachment?.highlightDuration || null,
        // Chapters
        chapters: insp.videoAttachment?.chapters?.map((ch: any) => ({
          id: ch.id,
          timestamp: ch.timestamp,
          endTimestamp: ch.endTimestamp,
          title: ch.title,
          description: ch.description,
          chapterType: ch.chapterType,
          severity: ch.severity,
        })) || [],
        // Report
        hasReport: !!insp.generatedReport?.clientReportCloudPath,
      },
      downloads: {
        remaining: deliveryToken.downloadLimit - deliveryToken.downloadsUsed,
        total: deliveryToken.downloadLimit,
      },
      expiresAt: deliveryToken.displayExpiresAt,
      hoursRemaining,
    });
  } catch (error) {
    console.error("Error verifying download:", error);
    return NextResponse.json(
      { success: false, error: "Failed to verify download" },
      { status: 500 }
    );
  }
}
