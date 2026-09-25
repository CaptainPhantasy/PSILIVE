export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { isFieldOperatorRole } from "@/lib/auth/permissions";
import { completeMultipartUpload, getFileUrl } from "@/lib/s3";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !isFieldOperatorRole(user?.role)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { cloud_storage_path, uploadId, parts, isPublic } = await request.json();

    if (!cloud_storage_path || !uploadId || !parts || !Array.isArray(parts)) {
      return NextResponse.json(
        { success: false, error: "cloud_storage_path, uploadId, and parts are required" },
        { status: 400 }
      );
    }

    await completeMultipartUpload(cloud_storage_path, uploadId, parts);

    const fileUrl = await getFileUrl(cloud_storage_path, isPublic || false);

    return NextResponse.json({
      success: true,
      cloud_storage_path,
      fileUrl,
    });
  } catch (error) {
    console.error("Error completing multipart upload:", error);
    return NextResponse.json(
      { success: false, error: "Failed to complete upload" },
      { status: 500 }
    );
  }
}
