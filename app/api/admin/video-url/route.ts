export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getCurrentUser, hasRole } from "@/lib/auth";
import { getFileUrl } from "@/lib/s3";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasRole(user, ["ADMIN", "OWNER", "SUPER_ADMIN"])) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { cloudPath } = await request.json();

    if (!cloudPath) {
      return NextResponse.json(
        { success: false, error: "Cloud path is required" },
        { status: 400 }
      );
    }

    // Generate signed URL for the video (private file)
    const url = await getFileUrl(cloudPath, false);

    return NextResponse.json({
      success: true,
      url,
    });
  } catch (error) {
    console.error("Error generating video URL:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate video URL" },
      { status: 500 }
    );
  }
}
