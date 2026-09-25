export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getCurrentUser, hasRole } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasRole(user, ["ADMIN", "OWNER", "SUPER_ADMIN"])) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const where = status ? { status: status as "SUBMITTED" | "UNDER_REVIEW" | "APPROVED" | "REJECTED" } : {};

    const [inspections, total] = await Promise.all([
      prisma.inspection.findMany({
        where,
        include: {
          job: true,
          technician: {
            select: { id: true, name: true, email: true },
          },
          videoAttachment: true,
          clientSignature: true,
        },
        orderBy: { completedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.inspection.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      inspections,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching inspections:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch inspections" },
      { status: 500 }
    );
  }
}
