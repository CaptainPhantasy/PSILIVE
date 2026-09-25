export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { isFieldOperatorRole } from "@/lib/auth/permissions";
import { initiateMultipartUpload } from "@/lib/s3";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !isFieldOperatorRole(user?.role)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { fileName, contentType, isPublic } = await request.json();

    if (!fileName) {
      return NextResponse.json(
        { success: false, error: "fileName is required" },
        { status: 400 }
      );
    }

    const { uploadId, cloud_storage_path } = await initiateMultipartUpload(
      fileName,
      contentType || "video/mp4",
      isPublic || false
    );

    return NextResponse.json({
      success: true,
      uploadId,
      cloud_storage_path,
    });
  } catch (error) {
    console.error("Error initiating multipart upload:", error);
    return NextResponse.json(
      { success: false, error: "Failed to initiate upload" },
      { status: 500 }
    );
  }
}
