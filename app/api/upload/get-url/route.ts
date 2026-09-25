export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { isFieldOperatorRole } from "@/lib/auth/permissions";
import { getFileUrl } from "@/lib/s3";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !isFieldOperatorRole(user?.role)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { cloud_storage_path, isPublic } = await request.json();
    if (!cloud_storage_path) {
      return NextResponse.json({ success: false, error: "cloud_storage_path required" }, { status: 400 });
    }

    const fileUrl = await getFileUrl(cloud_storage_path, isPublic ?? false);
    return NextResponse.json({ success: true, fileUrl });
  } catch (error) {
    console.error("Error getting file URL:", error);
    return NextResponse.json({ success: false, error: "Failed to get URL" }, { status: 500 });
  }
}
