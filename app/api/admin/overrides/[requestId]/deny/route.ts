export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, hasRole } from "@/lib/auth";
import { errorResponse } from "@/lib/errors";
import { overrideService } from "@/lib/services/override.service";
import { z } from "zod";

const DenyOverrideSchema = z.object({
  adminNotes: z.string().min(1, "Reason is required").max(2000),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasRole(user, ["ADMIN", "OWNER", "SUPER_ADMIN"])) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { requestId } = await params;
    const body = await request.json();

    const validationResult = DenyOverrideSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: "Invalid input", details: validationResult.error.errors },
        { status: 400 }
      );
    }

    await overrideService.denyRequest(
      requestId,
      user.id,
      validationResult.data.adminNotes
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}
