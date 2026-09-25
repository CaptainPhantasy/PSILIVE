export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, hasRole } from "@/lib/auth";
import { errorResponse } from "@/lib/errors";
import { overrideService } from "@/lib/services/override.service";
import { z } from "zod";

const ApproveOverrideSchema = z.object({
  resolution: z.enum(["INCOMPLETE", "PARTIAL", "COMPLETE", "RESCHEDULE"]),
  skipSignature: z.boolean().default(false),
  adminNotes: z.string().max(2000).optional(),
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

    const validationResult = ApproveOverrideSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: "Invalid input", details: validationResult.error.errors },
        { status: 400 }
      );
    }

    await overrideService.approveRequest(
      requestId,
      user.id,
      validationResult.data
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}
