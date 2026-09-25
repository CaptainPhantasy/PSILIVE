export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { isFieldOperatorRole } from "@/lib/auth/permissions";
import { getPresignedUrlForPart } from "@/lib/s3";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !isFieldOperatorRole(user?.role)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { cloud_storage_path, uploadId, partNumber } = await request.json();

    if (!cloud_storage_path || !uploadId || !partNumber) {
      return NextResponse.json(
        { success: false, error: "cloud_storage_path, uploadId, and partNumber are required" },
        { status: 400 }
      );
    }

    const uploadUrl = await getPresignedUrlForPart(
      cloud_storage_path,
      uploadId,
      partNumber
    );

    return NextResponse.json({
      success: true,
      uploadUrl,
    });
  } catch (error) {
    console.error("Error getting part URL:", error);
    return NextResponse.json(
      { success: false, error: "Failed to get upload URL for part" },
      { status: 500 }
    );
  }
}
