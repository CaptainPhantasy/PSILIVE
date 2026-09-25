export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Called when a form is fully submitted or payment completed
// to mark the lead as converted (no notification needed)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionToken, email } = body;

    if (!sessionToken && !email) {
      return NextResponse.json({ error: "Need sessionToken or email" }, { status: 400 });
    }

    // Try to find by session token first, then by email
    if (sessionToken) {
      await prisma.leadCapture.updateMany({
        where: { sessionToken },
        data: { converted: true },
      });
    }
    if (email) {
      await prisma.leadCapture.updateMany({
        where: { email, converted: false },
        data: { converted: true },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error marking lead as converted:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
