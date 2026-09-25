export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { canManageJobs } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db";

// GET: List all jobs with filters
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!canManageJobs(user)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const where: Record<string, unknown> = {};
    if (status && status !== "ALL") {
      where.status = status;
    }

    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where,
        include: {
          technician: {
            select: { id: true, name: true, email: true },
          },
          inspection: {
            select: { id: true, inspectionNumber: true, status: true, currentStage: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.job.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      jobs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching jobs:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch jobs" },
      { status: 500 }
    );
  }
}

// POST: Create a real operations job without Stripe checkout
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!canManageJobs(user)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const data = await request.json();
    const {
      clientName,
      clientEmail,
      clientPhone,
      propertyAddress,
      propertyCity = "Indianapolis",
      propertyState = "IN",
      propertyZip,
      scheduledDate,
      scheduledTime,
      accessType = "CLEANOUT",
      specialNotes,
      technicianId,
    } = data;

    // Validate required fields
    if (!clientName || !clientEmail || !propertyAddress || !propertyZip || !scheduledDate) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: clientName, clientEmail, propertyAddress, propertyZip, scheduledDate" },
        { status: 400 }
      );
    }

    // Generate job number
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");
    const count = await prisma.job.count({
      where: {
        createdAt: {
          gte: new Date(today.setHours(0, 0, 0, 0)),
        },
      },
    });
    const jobNumber = `PSI-${dateStr}-${String(count + 1).padStart(3, "0")}`;

    // Create the job
    const job = await prisma.job.create({
      data: {
        jobNumber,
        clientName,
        clientEmail,
        clientPhone: clientPhone || null,
        propertyAddress,
        propertyCity,
        propertyState,
        propertyZip,
        scheduledDate: new Date(scheduledDate),
        scheduledTime: scheduledTime || null,
        accessType,
        specialNotes: specialNotes || null,
        technicianId: technicianId || null,
        basePrice: 159,
        totalPrice: 159,
        status: technicianId ? "ASSIGNED" : "PENDING",
      },
      include: {
        technician: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      job,
      message: `Job ${jobNumber} created successfully`,
    });
  } catch (error) {
    console.error("Error creating job:", error);
    		return NextResponse.json(
    			{ success: false, error: "Failed to create job" },
      { status: 500 }
    );
  }
}
