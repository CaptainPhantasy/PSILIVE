export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getCurrentUser, hasRole, hashPassword, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getFileUrl } from "@/lib/s3";
import { passwordSchema } from "@/lib/validations";

// GET: Get current user's profile
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || !hasRole(user, ["TECHNICIAN", "MANAGER", "ADMIN", "OWNER", "SUPER_ADMIN"])) {
    	return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const profile = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        bio: true,
        profilePhotoPath: true,
        profilePhotoUrl: true,
        certifications: true,
        createdAt: true,
      },
    });

    if (!profile) {
      return NextResponse.json({ success: false, error: "Profile not found" }, { status: 404 });
    }

    // Regenerate URL if we have a path but URL might be expired
    let photoUrl = profile.profilePhotoUrl;
    if (profile.profilePhotoPath && !profile.profilePhotoPath.includes('/public/')) {
      photoUrl = await getFileUrl(profile.profilePhotoPath, false);
    }

    return NextResponse.json({
      success: true,
      profile: { ...profile, profilePhotoUrl: photoUrl },
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch profile" }, { status: 500 });
  }
}

// PATCH: Update current user's profile
export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasRole(user, ["TECHNICIAN", "MANAGER", "ADMIN", "OWNER", "SUPER_ADMIN"])) {
    	return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { name, phone, bio, profilePhotoPath, profilePhotoUrl, currentPassword, newPassword } = await request.json();

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (bio !== undefined) updateData.bio = bio;
    if (profilePhotoPath !== undefined) updateData.profilePhotoPath = profilePhotoPath;
    if (profilePhotoUrl !== undefined) updateData.profilePhotoUrl = profilePhotoUrl;

    if (currentPassword !== undefined || newPassword !== undefined) {
    	if (!currentPassword || !newPassword) {
    		return NextResponse.json(
    			{ success: false, error: "Current password and new password are required" },
    			{ status: 400 }
    		);
    	}

    	const parsedPassword = passwordSchema.safeParse(newPassword);
    	if (!parsedPassword.success) {
    		return NextResponse.json(
    			{ success: false, error: parsedPassword.error.issues[0]?.message || "Invalid new password" },
    			{ status: 400 }
    		);
    	}

    	const account = await prisma.user.findUnique({
    		where: { id: user.id },
    		select: { passwordHash: true },
    	});
    	if (!account || !(await verifyPassword(currentPassword, account.passwordHash))) {
    		return NextResponse.json(
    			{ success: false, error: "Current password is incorrect" },
    			{ status: 400 }
    		);
    	}

    	updateData.passwordHash = await hashPassword(parsedPassword.data);
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        bio: true,
        profilePhotoPath: true,
        profilePhotoUrl: true,
        certifications: true,
      },
    });

    return NextResponse.json({ success: true, profile: updated });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json({ success: false, error: "Failed to update profile" }, { status: 500 });
  }
}
