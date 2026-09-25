import { NextResponse } from "next/server";
import { google, type calendar_v3 } from "googleapis";
import { getCurrentUser, hasRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getSiteUrl } from "@/lib/site-url";
import { stripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type CheckStatus = "ok" | "warn" | "fail";
type BookingLifecycleKind = "active" | "refunded" | "canceled" | "partially_refunded" | "needs_review";

interface MonitorCheck {
  id: string;
  title: string;
  status: CheckStatus;
  summary: string;
  evidence: string[];
  durationMs?: number;
}

interface RecentBooking {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  propertyAddress: string | null;
  appointmentDate: string | null;
  appointmentTime: string | null;
  amountPaid: number | null;
  stripeSessionId: string | null;
  createdAt: string;
  status: string;
  serviceType: string | null;
  stripe?: {
    paymentStatus: string;
    checkoutStatus: string | null;
    paymentIntentId: string | null;
    amountTotal: number | null;
    refundedAmount: number;
  };
  calendar?: {
    eventId: string;
    status: string;
    summary: string | null;
    start: string | null;
    end: string | null;
    description: string | null;
    hasPhone: boolean;
    hasAddress: boolean;
  };
  job?: {
    id: string;
    jobNumber: string;
    status: string;
    technicianId: string | null;
  };
  lifecycle: {
    kind: BookingLifecycleKind;
    label: string;
    summary: string;
    requiresOperationalHandoff: boolean;
  };
  monitorIssues: string[];
  paymentIssues: string[];
  calendarIssues: string[];
  handoffIssues: string[];
  issues: string[];
}

const STATUS_WEIGHT: Record<CheckStatus, number> = {
  ok: 0,
  warn: 1,
  fail: 2,
};

function overallStatus(checks: MonitorCheck[]): CheckStatus {
  return checks.reduce<CheckStatus>((worst, check) => {
    return STATUS_WEIGHT[check.status] > STATUS_WEIGHT[worst] ? check.status : worst;
  }, "ok");
}

function hasMonitorBearerAccess(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return false;

  const authHeader = request.headers.get("authorization");
  const providedSecret = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : "";
  return providedSecret === cronSecret;
}

async function timedCheck(
  id: string,
  title: string,
  fn: () => Promise<Omit<MonitorCheck, "id" | "title" | "durationMs">>
): Promise<MonitorCheck> {
  const started = Date.now();
  try {
    const result = await fn();
    return { id, title, durationMs: Date.now() - started, ...result };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return {
      id,
      title,
      status: "fail",
      summary: message,
      evidence: [`Exception: ${message}`],
      durationMs: Date.now() - started,
    };
  }
}

async function fetchWithTimeout(url: string, timeoutMs = 10000): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      cache: "no-store",
      redirect: "follow",
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

function calendarClient(): calendar_v3.Calendar {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!email || !key || !process.env.GOOGLE_CALENDAR_ID) {
    throw new Error("Missing Google Calendar service-account configuration");
  }

  const auth = new google.auth.JWT({
    email,
    key,
    scopes: ["https://www.googleapis.com/auth/calendar"],
  });

  return google.calendar({ version: "v3", auth });
}

function addDays(date: string, days: number): string {
  const parsed = new Date(`${date}T12:00:00.000Z`);
  parsed.setUTCDate(parsed.getUTCDate() + days);
  return parsed.toISOString().slice(0, 10);
}

function normalize(value: string | null | undefined): string {
  return (value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function includesMeaningfulAddress(description: string | null | undefined, propertyAddress: string | null): boolean {
  if (!description || !propertyAddress) return false;
  const firstAddressPart = normalize(propertyAddress.split(",")[0]);
  return firstAddressPart.length > 3 && normalize(description).includes(firstAddressPart);
}

function includesPhone(description: string | null | undefined, phone: string | null): boolean {
  if (!description || !phone) return false;
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 7 && description.replace(/\D/g, "").includes(digits.slice(-7));
}

function bookingNeedsCalendar(booking: { appointmentDate: string | null; appointmentTime: string | null }): boolean {
  return Boolean(booking.appointmentDate && booking.appointmentTime);
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown error";
}

function classifyLifecycle(
  stripeData: RecentBooking["stripe"] | undefined,
  calendarEvent: calendar_v3.Schema$Event | null
): RecentBooking["lifecycle"] {
  if (!stripeData) {
    return {
      kind: "needs_review",
      label: "Needs review",
      summary: "Stripe payment state was not readable for this paid booking.",
      requiresOperationalHandoff: false,
    };
  }

  const amountTotal = stripeData.amountTotal || 0;
  const refundedAmount = stripeData.refundedAmount || 0;
  const fullyRefunded = amountTotal > 0 && refundedAmount >= amountTotal;
  const partiallyRefunded = refundedAmount > 0 && !fullyRefunded;
  const calendarCanceled = calendarEvent?.status === "cancelled";

  if (fullyRefunded) {
    return {
      kind: "refunded",
      label: "Refunded",
      summary: "Stripe shows the payment has been fully refunded.",
      requiresOperationalHandoff: false,
    };
  }

  if (partiallyRefunded) {
    return {
      kind: "partially_refunded",
      label: "Partial refund",
      summary: "Stripe shows a partial refund; operator review is required.",
      requiresOperationalHandoff: false,
    };
  }

  if (calendarCanceled) {
    return {
      kind: "canceled",
      label: "Calendar canceled",
      summary: "Google Calendar marks this booking as canceled.",
      requiresOperationalHandoff: false,
    };
  }

  return {
    kind: "active",
    label: "Active paid booking",
    summary: "Paid booking still requires downstream operational handoff.",
    requiresOperationalHandoff: true,
  };
}

function countIssues(
  bookings: RecentBooking[],
  key: "monitorIssues" | "paymentIssues" | "calendarIssues" | "handoffIssues"
): number {
  return bookings.reduce((sum, booking) => sum + booking[key].length, 0);
}

function issueEvidence(
  bookings: RecentBooking[],
  key: "monitorIssues" | "paymentIssues" | "calendarIssues" | "handoffIssues"
): string[] {
  const relevantBookings = bookings.filter((booking) => booking[key].length > 0);
  if (!relevantBookings.length) return ["No issues found in this layer."];

  return relevantBookings.slice(0, 3).map((booking) => {
    return `${booking.lifecycle.label}: ${booking.name} / ${booking.appointmentDate || "no date"} / ${booking[key].join(" | ")}`;
  });
}

function unavailableLayerCheck(id: string, title: string, error: string): MonitorCheck {
  return {
    id,
    title,
    status: "fail",
    summary: `${title} could not be evaluated because the booking monitor failed.`,
    evidence: [`Recent booking monitor exception: ${error}`],
  };
}

async function findCalendarEvent(
  calendar: calendar_v3.Calendar,
  booking: { name: string; appointmentDate: string | null }
): Promise<calendar_v3.Schema$Event | null> {
  const calendarId = process.env.GOOGLE_CALENDAR_ID;
  if (!calendarId || !booking.appointmentDate) return null;

  const timeMin = `${addDays(booking.appointmentDate, -1)}T00:00:00.000Z`;
  const timeMax = `${addDays(booking.appointmentDate, 2)}T23:59:59.999Z`;
  const response = await calendar.events.list({
    calendarId,
    timeMin,
    timeMax,
    q: booking.name,
    singleEvents: true,
    showDeleted: true,
    orderBy: "startTime",
    maxResults: 10,
  });

  const bookingName = normalize(booking.name);
  return (
    response.data.items?.find((event) => {
      const haystack = normalize(`${event.summary || ""} ${event.description || ""}`);
      return haystack.includes(bookingName);
    }) || null
  );
}

async function buildRecentBookings(): Promise<RecentBooking[]> {
  const bookings = await prisma.contactSubmission.findMany({
    where: {
      source: "stripe-booking",
      status: "paid",
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  if (!bookings.length) return [];

  let calendar: calendar_v3.Calendar | null = null;
  let calendarSetupError: string | null = null;
  try {
    calendar = calendarClient();
  } catch (error) {
    calendarSetupError = errorMessage(error);
  }

  return Promise.all(
    bookings.map(async (booking): Promise<RecentBooking> => {
      const monitorIssues: string[] = [];
      const paymentIssues: string[] = [];
      const calendarIssues: string[] = [];
      const handoffIssues: string[] = [];
      let stripeReadError: string | null = null;
      let calendarReadError: string | null = calendarSetupError;

      const [job, calendarEvent, stripeData] = await Promise.all([
        prisma.job.findFirst({
          where: {
            OR: [
              { clientEmail: booking.email },
              ...(booking.propertyAddress ? [{ propertyAddress: booking.propertyAddress }] : []),
            ],
          },
          orderBy: { createdAt: "desc" },
          select: { id: true, jobNumber: true, status: true, technicianId: true },
        }),
        bookingNeedsCalendar(booking) && calendar
          ? findCalendarEvent(calendar, {
              name: booking.name,
              appointmentDate: booking.appointmentDate,
            }).catch((error) => {
              calendarReadError = errorMessage(error);
              return null;
            })
          : Promise.resolve(null),
        booking.stripeSessionId
          ? stripe.checkout.sessions
              .retrieve(booking.stripeSessionId, { expand: ["payment_intent"] })
              .then(async (session) => {
                const paymentIntent =
                  typeof session.payment_intent === "string" ? null : session.payment_intent;
                const refunds = paymentIntent
                  ? await stripe.refunds.list({ payment_intent: paymentIntent.id, limit: 20 })
                  : { data: [] };
                return {
                  paymentStatus: session.payment_status,
                  checkoutStatus: session.status || null,
                  paymentIntentId: paymentIntent?.id || null,
                  amountTotal: session.amount_total,
                  refundedAmount: refunds.data.reduce((sum, refund) => sum + (refund.amount || 0), 0),
                };
              })
              .catch((error) => {
                stripeReadError = errorMessage(error);
                return undefined;
              })
          : Promise.resolve(undefined),
      ]);

      const lifecycle = classifyLifecycle(stripeData, calendarEvent);

      if (stripeReadError) {
        const issue = `Stripe read failed: ${stripeReadError}.`;
        monitorIssues.push(issue);
        paymentIssues.push(issue);
      }

      if (!booking.stripeSessionId) {
        paymentIssues.push("Paid booking is missing a Stripe session ID.");
      }

      if (stripeData) {
        const expectedCents = booking.amountPaid != null ? Math.round(booking.amountPaid * 100) : null;
        if (stripeData.paymentStatus !== "paid") {
          paymentIssues.push(`Stripe payment status is ${stripeData.paymentStatus}.`);
        }
        if (expectedCents != null && stripeData.amountTotal !== expectedCents) {
          paymentIssues.push(`Stripe amount ${stripeData.amountTotal} does not match Neon amount ${expectedCents}.`);
        }
      }

      if (lifecycle.requiresOperationalHandoff && !job) {
        handoffIssues.push(
          "Active paid booking is not present in the field PWA Job table; this does not check the separate Forms CRM promotion state."
        );
      }

      let calendarPayload: RecentBooking["calendar"];
      if (bookingNeedsCalendar(booking)) {
        if (calendarReadError) {
          const issue = `Google Calendar read failed: ${calendarReadError}.`;
          monitorIssues.push(issue);
          calendarIssues.push(issue);
        } else if (!calendarEvent && lifecycle.requiresOperationalHandoff) {
          calendarIssues.push("No matching Google Calendar event found.");
        } else if (calendarEvent) {
          const start = calendarEvent.start?.dateTime || calendarEvent.start?.date || null;
          const end = calendarEvent.end?.dateTime || calendarEvent.end?.date || null;
          const hasPhone = includesPhone(calendarEvent.description, booking.phone);
          const hasAddress = includesMeaningfulAddress(calendarEvent.description, booking.propertyAddress);

          if (calendarEvent.status === "cancelled" && (stripeData?.refundedAmount || 0) === 0) {
            paymentIssues.push("Calendar event is cancelled but Stripe shows no refund.");
          }
          if (lifecycle.kind === "refunded" && calendarEvent.status !== "cancelled") {
            calendarIssues.push("Refunded booking still has an active Google Calendar event.");
          }
          if (lifecycle.requiresOperationalHandoff && !hasPhone) {
            calendarIssues.push("Calendar event does not contain the booking phone number.");
          }
          if (lifecycle.requiresOperationalHandoff && !hasAddress) {
            calendarIssues.push("Calendar event does not contain the full property address.");
          }

          calendarPayload = {
            eventId: calendarEvent.id || "",
            status: calendarEvent.status || "unknown",
            summary: calendarEvent.summary || null,
            start,
            end,
            description: calendarEvent.description || null,
            hasPhone,
            hasAddress,
          };
        }
      }

      const issues = [...paymentIssues, ...calendarIssues, ...handoffIssues];

      return {
        id: booking.id,
        name: booking.name,
        email: booking.email,
        phone: booking.phone,
        propertyAddress: booking.propertyAddress,
        appointmentDate: booking.appointmentDate,
        appointmentTime: booking.appointmentTime,
        amountPaid: booking.amountPaid,
        stripeSessionId: booking.stripeSessionId,
        createdAt: booking.createdAt.toISOString(),
        status: booking.status,
        serviceType: booking.serviceType,
        stripe: stripeData,
        calendar: calendarPayload,
        job: job || undefined,
        lifecycle,
        monitorIssues,
        paymentIssues,
        calendarIssues,
        handoffIssues,
        issues,
      };
    })
  );
}

function monitorInstrumentationCheck(bookings: RecentBooking[], bookingReadError: string | null): MonitorCheck {
  if (bookingReadError) {
    return {
      id: "monitor-instrumentation",
      title: "Monitor Instrumentation",
      status: "fail",
      summary: "The monitor could not evaluate recent booking health.",
      evidence: [`Recent booking monitor exception: ${bookingReadError}`],
    };
  }

  const issueCount = countIssues(bookings, "monitorIssues");
  return {
    id: "monitor-instrumentation",
    title: "Monitor Instrumentation",
    status: issueCount > 0 ? "fail" : "ok",
    summary:
      issueCount > 0
        ? `${issueCount} monitor source-read failure${issueCount === 1 ? "" : "s"} found.`
        : "Monitor source reads completed for public, database, Stripe, Calendar, and PWA checks.",
    evidence: issueCount > 0 ? issueEvidence(bookings, "monitorIssues") : [
      "Public website and booking availability are wrapped in timed checks.",
      `${bookings.length} recent paid booking${bookings.length === 1 ? "" : "s"} evaluated for downstream source reads.`,
    ],
  };
}

function paymentRecordCheck(bookings: RecentBooking[]): MonitorCheck {
  const issueCount = countIssues(bookings, "paymentIssues");
  if (!bookings.length) {
    return {
      id: "payment-records",
      title: "Payment Records",
      status: "warn",
      summary: "No paid Stripe bookings found in Neon.",
      evidence: ["Query: ContactSubmission where source=stripe-booking and status=paid."],
    };
  }

  return {
    id: "payment-records",
    title: "Payment Records",
    status: issueCount > 0 ? "fail" : "ok",
    summary:
      issueCount > 0
        ? `${issueCount} payment or lifecycle issue${issueCount === 1 ? "" : "s"} found.`
        : "Paid booking records match readable Stripe payment state.",
    evidence: issueCount > 0 ? issueEvidence(bookings, "paymentIssues") : [
      `${bookings.length} paid booking record${bookings.length === 1 ? "" : "s"} checked.`,
      `Lifecycle: active=${bookings.filter((booking) => booking.lifecycle.kind === "active").length}, refunded=${bookings.filter((booking) => booking.lifecycle.kind === "refunded").length}, canceled=${bookings.filter((booking) => booking.lifecycle.kind === "canceled").length}, review=${bookings.filter((booking) => booking.lifecycle.kind === "needs_review").length}.`,
    ],
  };
}

function calendarHandoffCheck(bookings: RecentBooking[]): MonitorCheck {
  const issueCount = countIssues(bookings, "calendarIssues");
  const calendarBookings = bookings.filter((booking) => bookingNeedsCalendar(booking));

  return {
    id: "calendar-handoff",
    title: "Calendar Handoff",
    status: issueCount > 0 ? "fail" : "ok",
    summary:
      issueCount > 0
        ? `${issueCount} calendar handoff issue${issueCount === 1 ? "" : "s"} found.`
        : "Calendar events are coherent for active paid bookings.",
    evidence: issueCount > 0 ? issueEvidence(bookings, "calendarIssues") : [
      `${calendarBookings.length} booking${calendarBookings.length === 1 ? "" : "s"} required calendar validation.`,
      "Refunded and canceled bookings are classified separately from active booking handoff.",
    ],
  };
}

function pwaJobHandoffCheck(bookings: RecentBooking[]): MonitorCheck {
  const issueCount = countIssues(bookings, "handoffIssues");
  const activeBookings = bookings.filter((booking) => booking.lifecycle.requiresOperationalHandoff);
  const scopeEvidence =
    "Scope: checks the live website/PWA Job table used by the field app, not the separate Forms CRM.";

  return {
    id: "pwa-job-handoff",
    title: "Field PWA Job Dispatch",
    status: issueCount > 0 ? "fail" : "ok",
    summary:
      issueCount > 0
        ? `${issueCount} active paid booking${issueCount === 1 ? "" : "s"} missing field PWA job dispatch.`
        : activeBookings.length
          ? "Active paid bookings have matching field PWA job records."
          : "No active paid bookings currently require field PWA job dispatch.",
    evidence: issueCount > 0 ? [scopeEvidence, ...issueEvidence(bookings, "handoffIssues")] : [
      scopeEvidence,
      `${activeBookings.length} active paid booking${activeBookings.length === 1 ? "" : "s"} checked for PWA Job records.`,
      `${bookings.length - activeBookings.length} refunded, canceled, or review booking${bookings.length - activeBookings.length === 1 ? "" : "s"} excluded from active handoff failure.`,
    ],
  };
}

export async function GET(request: Request) {
  const hasBearerAccess = hasMonitorBearerAccess(request);
  const user = hasBearerAccess ? null : await getCurrentUser();
  if (!hasBearerAccess && (!user || !hasRole(user, ["ADMIN", "OWNER", "SUPER_ADMIN"]))) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const siteUrl = getSiteUrl();

  const [websiteCheck, availabilityCheck, databaseCheck, recentBookings] = await Promise.all([
    timedCheck("public-website", "Public Website", async () => {
      const response = await fetchWithTimeout(siteUrl);
      return {
        status: response.ok ? "ok" : "fail",
        summary: `${response.status} ${response.statusText || ""}`.trim(),
        evidence: [`GET ${siteUrl}`, `Response ok=${response.ok}`],
      };
    }),
    timedCheck("booking-availability", "Booking Availability", async () => {
      const availabilityUrl = `${siteUrl}/api/calendar/availability`;
      const response = await fetchWithTimeout(availabilityUrl);
      const body = (await response.json().catch(() => null)) as
        | { success?: boolean; availability?: Array<{ hasAvailableSlots?: boolean }> }
        | null;
      const daysWithSlots = body?.availability?.filter((day) => day.hasAvailableSlots).length || 0;

      return {
        status: response.ok && body?.success && daysWithSlots > 0 ? "ok" : "fail",
        summary:
          response.ok && body?.success
            ? `${daysWithSlots} day${daysWithSlots === 1 ? "" : "s"} with available booking slots.`
            : "Availability endpoint did not return a successful slot list.",
        evidence: [
          `GET ${availabilityUrl}`,
          `HTTP ${response.status}`,
          `success=${String(body?.success)}`,
          `daysWithSlots=${daysWithSlots}`,
        ],
      };
    }),
    timedCheck("neon-database", "Neon Database", async () => {
      const [submissionCount, jobCount, latestPaid] = await Promise.all([
        prisma.contactSubmission.count(),
        prisma.job.count(),
        prisma.contactSubmission.findFirst({
          where: { source: "stripe-booking", status: "paid" },
          orderBy: { createdAt: "desc" },
          select: { name: true, createdAt: true, stripeSessionId: true },
        }),
      ]);

      return {
        status: latestPaid ? "ok" : "warn",
        summary: latestPaid
          ? `Latest paid booking: ${latestPaid.name} at ${latestPaid.createdAt.toISOString()}.`
          : "Database is reachable, but no paid bookings were found.",
        evidence: [
          `ContactSubmission count=${submissionCount}`,
          `Job count=${jobCount}`,
          `Latest Stripe session=${latestPaid?.stripeSessionId || "none"}`,
        ],
      };
    }),
    buildRecentBookings()
      .then((bookings) => ({ bookings, error: null as string | null }))
      .catch((error) => ({ bookings: [] as RecentBooking[], error: errorMessage(error) })),
  ]);

  const bookingReadError = recentBookings.error;
  const bookingLayerChecks = bookingReadError
    ? [
        unavailableLayerCheck("payment-records", "Payment Records", bookingReadError),
        unavailableLayerCheck("calendar-handoff", "Calendar Handoff", bookingReadError),
        unavailableLayerCheck("pwa-job-handoff", "Field PWA Job Dispatch", bookingReadError),
      ]
    : [
        paymentRecordCheck(recentBookings.bookings),
        calendarHandoffCheck(recentBookings.bookings),
        pwaJobHandoffCheck(recentBookings.bookings),
      ];
  const checks = [
    websiteCheck,
    availabilityCheck,
    databaseCheck,
    monitorInstrumentationCheck(recentBookings.bookings, bookingReadError),
    ...bookingLayerChecks,
  ];

  return NextResponse.json({
    success: true,
    checkedAt: new Date().toISOString(),
    overallStatus: overallStatus(checks),
    checks,
    recentBookings: recentBookings.bookings,
  });
}
