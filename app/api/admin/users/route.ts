export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser, hashPassword } from "@/lib/auth";
import { getDefaultInitialPassword } from "@/lib/password-policy";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !["ADMIN", "OWNER", "SUPER_ADMIN"].includes(user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role");
    const active = searchParams.get("active");

    const where: Record<string, unknown> = {};
    if (role) where.role = role;
    if (active !== null) where.isActive = active === "true";

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        isActive: true,
        certifications: true,
        createdAt: true,
        _count: {
          select: {
            inspections: true,
            assignedJobs: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, users });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !["ADMIN", "OWNER", "SUPER_ADMIN"].includes(user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { email, password, name, phone, role, certifications } = body;

    if (!email || !name) {
    	return NextResponse.json(
    		{ error: "Email and name are required" },
    		{ status: 400 }
    	);
    }

    // Check if email already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 400 }
      );
    }

    // Role hierarchy enforcement: can only create users below own level
    const roleLevel: Record<string, number> = { TECHNICIAN: 1, MANAGER: 2, ADMIN: 3, OWNER: 4, SUPER_ADMIN: 5 };
    if ((roleLevel[role] || 0) >= (roleLevel[user.role] || 0)) {
      return NextResponse.json(
        { error: "You can only create users with a role below your own" },
        { status: 403 }
      );
    }

    const initialPassword = typeof password === "string" && password.length > 0
    	? password
    	: getDefaultInitialPassword();
    const passwordHash = await hashPassword(initialPassword);

    const newUser = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        phone: phone || null,
        role: role || "TECHNICIAN",
        certifications: certifications || [],
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        isActive: true,
        certifications: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ success: true, user: newUser });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}
