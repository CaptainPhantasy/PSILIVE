export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, hasRole } from "@/lib/auth";
import { errorResponse } from "@/lib/errors";
import { adminService } from "@/lib/services/admin.service";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasRole(user, ["ADMIN", "OWNER", "SUPER_ADMIN"])) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const stats = await adminService.getDashboardStats();

    return NextResponse.json({
      success: true,
      stats,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
