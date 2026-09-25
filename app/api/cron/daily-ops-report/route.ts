import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendAdminNotification } from "@/lib/notifications";
import { getSiteUrl } from "@/lib/site-url";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CountMap = Record<string, number>;
type CheckStatus = "ok" | "warn" | "fail";

interface OpsMonitorCheck {
  id: string;
  title: string;
  status: CheckStatus;
  summary: string;
  evidence: string[];
}

interface OpsMonitorResponse {
  success: boolean;
  checkedAt?: string;
  overallStatus?: CheckStatus;
  checks?: OpsMonitorCheck[];
  recentBookings?: Array<{ issues?: string[]; monitorIssues?: string[]; handoffIssues?: string[] }>;
  error?: string;
}

interface OpsMonitorSnapshot {
  success: boolean;
  status: CheckStatus;
  checkedAt: string | null;
  checks: OpsMonitorCheck[];
  recentBookingCount: number;
  issueCount: number;
  monitorIssueCount: number;
  handoffIssueCount: number;
  error?: string;
}

function countBy<T extends string | null | undefined>(values: T[]): CountMap {
  return values.reduce<CountMap>((acc, value) => {
    const key = value || "unknown";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

function renderMap(map: CountMap): string {
  const entries = Object.entries(map).sort((a, b) => b[1] - a[1]);
  if (entries.length === 0) return "<li>None</li>";
  return entries
    .slice(0, 10)
    .map(([key, value]) => `<li><strong>${escapeHtml(key)}</strong>: ${value}</li>`)
    .join("");
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function statusColor(status: CheckStatus): string {
  switch (status) {
    case "ok":
      return "#166534";
    case "warn":
      return "#92400e";
    case "fail":
      return "#991b1b";
  }
}

async function fetchOpsMonitorSnapshot(cronSecret: string): Promise<OpsMonitorSnapshot> {
  const monitorUrl = `${getSiteUrl()}/api/admin/ops-monitor`;

  try {
    const response = await fetch(monitorUrl, {
      cache: "no-store",
      headers: { authorization: `Bearer ${cronSecret}` },
    });
    const body = (await response.json().catch(() => null)) as OpsMonitorResponse | null;

    if (!response.ok || !body?.success || !body.overallStatus) {
      return {
        success: false,
        status: "fail",
        checkedAt: null,
        checks: [],
        recentBookingCount: 0,
        issueCount: 0,
        monitorIssueCount: 0,
        handoffIssueCount: 0,
        error: body?.error || `Monitor returned HTTP ${response.status}`,
      };
    }

    const recentBookings = body.recentBookings || [];
    return {
      success: true,
      status: body.overallStatus,
      checkedAt: body.checkedAt || null,
      checks: body.checks || [],
      recentBookingCount: recentBookings.length,
      issueCount: recentBookings.reduce((sum, booking) => sum + (booking.issues || []).length, 0),
      monitorIssueCount: recentBookings.reduce((sum, booking) => sum + (booking.monitorIssues || []).length, 0),
      handoffIssueCount: recentBookings.reduce((sum, booking) => sum + (booking.handoffIssues || []).length, 0),
    };
  } catch (error) {
    return {
      success: false,
      status: "fail",
      checkedAt: null,
      checks: [],
      recentBookingCount: 0,
      issueCount: 0,
      monitorIssueCount: 0,
      handoffIssueCount: 0,
      error: error instanceof Error ? error.message : "Unknown monitor fetch error",
    };
  }
}

function renderOpsMonitor(snapshot: OpsMonitorSnapshot): string {
  const failedChecks = snapshot.checks.filter((check) => check.status === "fail");
  const warningChecks = snapshot.checks.filter((check) => check.status === "warn");
  const borderColor = statusColor(snapshot.status);

  return `
    <div style="border: 2px solid ${borderColor}; background: ${snapshot.status === "fail" ? "#fef2f2" : snapshot.status === "warn" ? "#fffbeb" : "#f0fdf4"}; padding: 16px; border-radius: 8px; margin: 24px 0;">
      <h2 style="margin-top: 0; color: ${borderColor};">Operations Monitor: ${snapshot.status.toUpperCase()}</h2>
      ${
        snapshot.status === "ok"
          ? "<p><strong>Clear:</strong> monitored systems and monitor instrumentation are reporting clean.</p>"
          : "<p><strong>ACTION REQUIRED:</strong> at least one monitored system or monitor-instrumentation path is failing.</p>"
      }
      ${snapshot.error ? `<p><strong>Monitor error:</strong> ${escapeHtml(snapshot.error)}</p>` : ""}
      <ul>
        <li><strong>Checked at:</strong> ${escapeHtml(snapshot.checkedAt || "not available")}</li>
        <li><strong>Recent bookings checked:</strong> ${snapshot.recentBookingCount}</li>
        <li><strong>Total booking issues:</strong> ${snapshot.issueCount}</li>
        <li><strong>Monitor instrumentation issues:</strong> ${snapshot.monitorIssueCount}</li>
        <li><strong>Field PWA dispatch issues:</strong> ${snapshot.handoffIssueCount}</li>
      </ul>
      ${
        failedChecks.length
          ? `<h3 style="color: #991b1b;">Failing checks</h3><ul>${failedChecks
              .map((check) => `<li><strong>${escapeHtml(check.title)}:</strong> ${escapeHtml(check.summary)}</li>`)
              .join("")}</ul>`
          : ""
      }
      ${
        warningChecks.length
          ? `<h3 style="color: #92400e;">Warnings</h3><ul>${warningChecks
              .map((check) => `<li><strong>${escapeHtml(check.title)}:</strong> ${escapeHtml(check.summary)}</li>`)
              .join("")}</ul>`
          : ""
      }
    </div>
  `;
}

function requireCronSecret(request: NextRequest): NextResponse | null {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json(
      { success: false, error: "CRON_SECRET is not configured" },
      { status: 503 }
    );
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  return null;
}

export async function GET(request: NextRequest) {
  const authError = requireCronSecret(request);
  if (authError) return authError;
  const cronSecret = process.env.CRON_SECRET || "";

  const now = new Date();
  const since = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const expiringBy = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const [
    contacts,
    leadCaptures,
    siteVisits,
    siteEvents,
    chatConversations,
    jobs,
    inspectionsAwaitingReview,
    expiringDeliveryTokens,
    opsMonitor,
  ] = await Promise.all([
    prisma.contactSubmission.findMany({
      where: { createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
      take: 25,
    }),
    prisma.leadCapture.findMany({
      where: { lastActivityAt: { gte: since } },
      orderBy: { lastActivityAt: "desc" },
      take: 25,
    }),
    prisma.siteVisit.findMany({
      where: { visitedAt: { gte: since } },
      select: { pageUrl: true, utmSource: true, referrer: true },
      take: 500,
    }),
    prisma.siteEvent.findMany({
      where: { createdAt: { gte: since } },
      select: { eventType: true, eventTarget: true, pageUrl: true },
      take: 500,
    }),
    prisma.chatConversation.findMany({
      where: { updatedAt: { gte: since } },
      orderBy: { updatedAt: "desc" },
      take: 20,
    }),
    prisma.job.findMany({
      where: { createdAt: { gte: since } },
      select: { jobNumber: true, clientName: true, propertyAddress: true, status: true, totalPrice: true },
      orderBy: { createdAt: "desc" },
      take: 25,
    }),
    prisma.inspection.findMany({
      where: { status: { in: ["SUBMITTED", "UNDER_REVIEW"] } },
      select: {
        inspectionNumber: true,
        status: true,
        updatedAt: true,
        job: { select: { propertyAddress: true, clientName: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 25,
    }),
    prisma.deliveryToken.findMany({
      where: {
        actualExpiresAt: { gte: now, lte: expiringBy },
      },
      select: {
        clientEmail: true,
        displayExpiresAt: true,
        downloadsUsed: true,
        downloadLimit: true,
        inspection: {
          select: {
            inspectionNumber: true,
            job: { select: { propertyAddress: true, clientName: true } },
          },
        },
      },
      orderBy: { actualExpiresAt: "asc" },
      take: 25,
    }),
    fetchOpsMonitorSnapshot(cronSecret),
  ]);

  const pageCounts = countBy(siteVisits.map((visit) => visit.pageUrl));
  const sourceCounts = countBy(siteVisits.map((visit) => visit.utmSource || visit.referrer));
  const eventCounts = countBy(siteEvents.map((event) => event.eventType));
  const jobStatusCounts = countBy(jobs.map((job) => job.status));
  const contactStatusCounts = countBy(contacts.map((contact) => contact.status));

  const subjectPrefix =
    opsMonitor.status === "fail" ? "PSI OPS ALERT - " : opsMonitor.status === "warn" ? "PSI OPS WARNING - " : "";
  const subject = `${subjectPrefix}PSI Daily Ops Digest — ${now.toLocaleDateString("en-US", { timeZone: "America/Indianapolis" })}`;
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 720px; margin: 0 auto; color: #1f2937;">
      <h1>PSI Daily Ops Digest</h1>
      <p>Window: ${since.toISOString()} through ${now.toISOString()}</p>

      ${renderOpsMonitor(opsMonitor)}

      <h2>Summary</h2>
      <ul>
        <li><strong>New contact submissions:</strong> ${contacts.length}</li>
        <li><strong>Lead captures active:</strong> ${leadCaptures.length}</li>
        <li><strong>Chat conversations updated:</strong> ${chatConversations.length}</li>
        <li><strong>Site visits tracked:</strong> ${siteVisits.length}</li>
        <li><strong>Site events tracked:</strong> ${siteEvents.length}</li>
        <li><strong>New jobs:</strong> ${jobs.length}</li>
        <li><strong>Inspections awaiting review:</strong> ${inspectionsAwaitingReview.length}</li>
        <li><strong>Delivery links expiring within 24 hours:</strong> ${expiringDeliveryTokens.length}</li>
      </ul>

      <h2>Contact Status</h2>
      <ul>${renderMap(contactStatusCounts)}</ul>

      <h2>Job Status</h2>
      <ul>${renderMap(jobStatusCounts)}</ul>

      <h2>Top Pages</h2>
      <ul>${renderMap(pageCounts)}</ul>

      <h2>Traffic Sources</h2>
      <ul>${renderMap(sourceCounts)}</ul>

      <h2>Event Types</h2>
      <ul>${renderMap(eventCounts)}</ul>

      <h2>Inspections Awaiting Review</h2>
      <ul>
        ${inspectionsAwaitingReview.length === 0 ? "<li>None</li>" : inspectionsAwaitingReview.map((inspection) => `
          <li><strong>${escapeHtml(inspection.inspectionNumber)}</strong> — ${escapeHtml(inspection.job.clientName)} — ${escapeHtml(inspection.job.propertyAddress)} — ${inspection.status}</li>
        `).join("")}
      </ul>

      <h2>Delivery Links Expiring Soon</h2>
      <ul>
        ${expiringDeliveryTokens.length === 0 ? "<li>None</li>" : expiringDeliveryTokens.map((token) => `
          <li><strong>${escapeHtml(token.inspection.inspectionNumber)}</strong> — ${escapeHtml(token.inspection.job.clientName)} — ${escapeHtml(token.inspection.job.propertyAddress)} — ${token.downloadsUsed}/${token.downloadLimit} downloads used — display expiry ${token.displayExpiresAt.toISOString()}</li>
        `).join("")}
      </ul>

      <p style="color: #6b7280; font-size: 12px;">Generated by the first-party PSI Vercel Cron route. No Abacus notification IDs were used.</p>
    </div>
  `;

  const emailResult = await sendAdminNotification({ subject, htmlContent });
  const responseBody = {
    success: emailResult.success,
    sent: emailResult.success,
    emailResult,
    window: { since: since.toISOString(), until: now.toISOString() },
    counts: {
      opsMonitorStatus: opsMonitor.status,
      opsMonitorIssueCount: opsMonitor.issueCount,
      opsMonitorInstrumentationIssueCount: opsMonitor.monitorIssueCount,
      opsMonitorHandoffIssueCount: opsMonitor.handoffIssueCount,
      contacts: contacts.length,
      leadCaptures: leadCaptures.length,
      chatConversations: chatConversations.length,
      siteVisits: siteVisits.length,
      siteEvents: siteEvents.length,
      jobs: jobs.length,
      inspectionsAwaitingReview: inspectionsAwaitingReview.length,
      expiringDeliveryTokens: expiringDeliveryTokens.length,
    },
  };

  return NextResponse.json(responseBody, { status: emailResult.success ? 200 : 502 });
}
