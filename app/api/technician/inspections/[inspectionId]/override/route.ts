export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { isFieldOperatorRole } from "@/lib/auth/permissions";
import { errorResponse } from "@/lib/errors";
import { overrideService } from "@/lib/services/override.service";
import { z } from "zod";

const CreateOverrideSchema = z.object({
  reason: z.enum([
    "ACCESS_DENIED",
    "EQUIPMENT_MALFUNCTION",
    "PIPE_BLOCKED",
    "SAFETY_CONCERN",
    "CLIENT_ABSENT",
    "PROPERTY_ISSUE",
    "OTHER",
  ]),
  notes: z.string().optional(),
  skipSignature: z.boolean().optional().default(false),
  photoUrl: z.string().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ inspectionId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !isFieldOperatorRole(user?.role)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { inspectionId } = await params;
    const body = await request.json();

    const validationResult = CreateOverrideSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: "Invalid input", details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { reason, notes, skipSignature, photoUrl } = validationResult.data;

    const overrideRequest = await overrideService.createRequest({
      inspectionId,
      technicianId: user.id,
      reason,
      notes: notes || "",
      skipSignature,
      photoUrl,
    });

    return NextResponse.json({
      success: true,
      request: overrideRequest,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
