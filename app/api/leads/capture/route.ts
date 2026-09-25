export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * Abuse control: public lead-capture endpoint (contact form + realtor page).
 * Per-IP token bucket plus a per-instance daily ceiling — a deterrent against
 * spam floods, mirroring the /api/translate pattern. Serverless instances
 * carry their own counters, so this is not an exact ledger.
 */
const RATE_WINDOW_MS = 60_000;
const RATE_MAX_PER_IP = 10;
const DAILY_MAX_TOTAL = 500;

const ipHits = new Map<string, { count: number; resetAt: number }>();
let dailyCount = 0;
let dailyResetAt = Date.now() + 86_400_000;

function rateLimitExceeded(ip: string): boolean {
  const now = Date.now();
  if (now >= dailyResetAt) {
    dailyCount = 0;
    dailyResetAt = now + 86_400_000;
  }
  if (dailyCount >= DAILY_MAX_TOTAL) return true;
  const rec = ipHits.get(ip);
  if (!rec || now >= rec.resetAt) {
    ipHits.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }
  rec.count += 1;
  return rec.count > RATE_MAX_PER_IP;
}

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  if (rateLimitExceeded(ip)) {
    return NextResponse.json(
      { error: "Too many submissions. Please call us instead." },
      { status: 429 }
    );
  }
  dailyCount += 1;
  try {
    const body = await request.json();
    const { sessionToken, email, name, phone, address, city, state, zip, source, pageUrl } = body;

    if (!sessionToken) {
      return NextResponse.json({ error: "Session token required" }, { status: 400 });
    }

    // Must have at least an email or phone to be contactable
    const hasContactInfo = email || phone;
    if (!hasContactInfo) {
      return NextResponse.json({ error: "Need at least email or phone" }, { status: 400 });
    }

    // Basic email validation if provided
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    // Build update data - only include fields that have values
    const updateData: Record<string, unknown> = {
      lastActivityAt: new Date(),
    };
    if (email) updateData.email = email;
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (address) updateData.address = address;
    if (city) updateData.city = city;
    if (state) updateData.state = state;
    if (zip) updateData.zip = zip;
    if (source) updateData.source = source;
    if (pageUrl) updateData.pageUrl = pageUrl;

    // Upsert - create if new session, update if existing
    const lead = await prisma.leadCapture.upsert({
      where: { sessionToken },
      create: {
        sessionToken,
        email: email || null,
        name: name || null,
        phone: phone || null,
        address: address || null,
        city: city || null,
        state: state || null,
        zip: zip || null,
        source: source || "website",
        pageUrl: pageUrl || null,
        lastActivityAt: new Date(),
      },
      update: updateData,
    });

    return NextResponse.json({ success: true, id: lead.id });
  } catch (error) {
    console.error("Error capturing lead:", error);
    return NextResponse.json({ error: "Failed to capture lead" }, { status: 500 });
  }
}
