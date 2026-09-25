export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, hasRole } from "@/lib/auth";
import { errorResponse } from "@/lib/errors";
import { overrideService } from "@/lib/services/override.service";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasRole(user, ["ADMIN", "OWNER", "SUPER_ADMIN"])) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const requests = await overrideService.getPendingRequests();

    return NextResponse.json({
      success: true,
      requests,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
