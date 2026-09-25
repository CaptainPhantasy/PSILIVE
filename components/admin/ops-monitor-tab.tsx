"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Database,
  ExternalLink,
  Loader2,
  RefreshCw,
  XCircle,
} from "lucide-react";

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

interface OpsMonitorResponse {
  success: boolean;
  checkedAt: string;
  overallStatus: CheckStatus;
  checks: MonitorCheck[];
  recentBookings: RecentBooking[];
  error?: string;
}

function statusClasses(status: CheckStatus): string {
  switch (status) {
    case "ok":
      return "border-green-200 bg-green-50 text-green-800";
    case "warn":
      return "border-amber-200 bg-amber-50 text-amber-800";
    case "fail":
      return "border-red-200 bg-red-50 text-red-800";
  }
}

function statusIcon(status: CheckStatus) {
  switch (status) {
    case "ok":
      return <CheckCircle2 className="h-5 w-5 text-green-600" />;
    case "warn":
      return <AlertTriangle className="h-5 w-5 text-amber-600" />;
    case "fail":
      return <XCircle className="h-5 w-5 text-red-600" />;
  }
}

function formatMoney(amount: number | null): string {
  if (amount == null) return "n/a";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

function formatCents(amount: number | null | undefined): string {
  if (amount == null) return "n/a";
  return formatMoney(amount / 100);
}

function checkCardClasses(status: CheckStatus): string {
  switch (status) {
    case "ok":
      return "border-green-100 bg-white";
    case "warn":
      return "border-amber-300 bg-amber-50";
    case "fail":
      return "border-red-300 bg-red-50";
  }
}

function lifecycleClasses(kind: BookingLifecycleKind): string {
  switch (kind) {
    case "active":
      return "bg-blue-100 text-blue-800";
    case "refunded":
      return "bg-gray-200 text-gray-800";
    case "canceled":
      return "bg-gray-200 text-gray-800";
    case "partially_refunded":
      return "bg-amber-100 text-amber-800";
    case "needs_review":
      return "bg-red-100 text-red-800";
  }
}

export function OpsMonitorTab() {
  const [data, setData] = useState<OpsMonitorResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const fetchMonitor = useCallback(async (mode: "initial" | "refresh" = "refresh") => {
    if (mode === "initial") setLoading(true);
    if (mode === "refresh") setRefreshing(true);
    setError("");

    try {
      const response = await fetch("/api/admin/ops-monitor", { cache: "no-store" });
      const body = (await response.json()) as OpsMonitorResponse;
      if (!response.ok || !body.success) {
        throw new Error(body.error || `Monitor failed with HTTP ${response.status}`);
      }
      setData(body);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load monitor");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchMonitor("initial");
    const interval = setInterval(() => fetchMonitor("refresh"), 60000);
    return () => clearInterval(interval);
  }, [fetchMonitor]);

  if (loading) {
    return (
      <div className="rounded-xl bg-white p-8 text-center shadow-sm">
        <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-blue-600" />
        <p className="text-sm text-gray-600">Loading live operations checks</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-800">
        <div className="flex items-start gap-3">
          <XCircle className="mt-0.5 h-5 w-5" />
          <div>
            <h2 className="font-semibold">Monitor failed to load</h2>
            <p className="mt-1 text-sm">{error}</p>
            <button
              onClick={() => fetchMonitor("refresh")}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              <RefreshCw className="h-4 w-4" />
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const failedChecks = data.checks.filter((check) => check.status === "fail");
  const warningChecks = data.checks.filter((check) => check.status === "warn");
  const monitorFailing = failedChecks.some((check) => check.id === "monitor-instrumentation");
  const publicFunnelFailing = failedChecks.some((check) =>
    ["public-website", "booking-availability"].includes(check.id)
  );
  const failingBookings = data.recentBookings.filter((booking) => booking.issues.length > 0).length;
  const activeHandoffFailures = data.recentBookings.filter((booking) => booking.handoffIssues.length > 0).length;
  const headline =
    data.overallStatus === "ok"
      ? "Operations monitor clear"
      : monitorFailing
        ? "Monitor cannot prove system health"
        : publicFunnelFailing
          ? "Customer-facing funnel needs attention now"
          : "Back-office handoff needs attention";
  const summary =
    data.overallStatus === "ok"
      ? "Public funnel, payment records, calendar handoff, field PWA jobs, and monitor instrumentation are clean."
      : monitorFailing
        ? "A monitored dependency or credential read failed, so the monitor is treating system health as unproven."
        : publicFunnelFailing
          ? "The public website or booking availability path is failing."
          : `${activeHandoffFailures || failingBookings} booking${(activeHandoffFailures || failingBookings) === 1 ? "" : "s"} need downstream field dispatch attention.`;

  return (
    <div className="space-y-6">
      <section className={`rounded-xl border p-5 shadow-sm ${statusClasses(data.overallStatus)}`}>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            {statusIcon(data.overallStatus)}
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold">{headline}</h2>
                {data.overallStatus !== "ok" && (
                  <span className="rounded-full bg-red-600 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-white">
                    Needs attention now
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm">{summary}</p>
              <p className="mt-1 flex items-center gap-1 text-xs opacity-80">
                <Clock className="h-3.5 w-3.5" />
                Last checked {new Date(data.checkedAt).toLocaleString()}
              </p>
              {failedChecks.length > 0 && (
                <div className="mt-4 rounded-lg border border-red-300 bg-white/80 p-3 text-red-900">
                  <p className="text-sm font-semibold">Failing checks</p>
                  <ul className="mt-2 space-y-1 text-sm">
                    {failedChecks.map((check) => (
                      <li key={check.id}>
                        <strong>{check.title}:</strong> {check.summary}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {failedChecks.length === 0 && warningChecks.length > 0 && (
                <div className="mt-4 rounded-lg border border-amber-300 bg-white/80 p-3 text-amber-900">
                  <p className="text-sm font-semibold">Warnings</p>
                  <ul className="mt-2 space-y-1 text-sm">
                    {warningChecks.map((check) => (
                      <li key={check.id}>
                        <strong>{check.title}:</strong> {check.summary}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
          <button
            onClick={() => fetchMonitor("refresh")}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-white/80 px-3 py-2 text-sm font-medium shadow-sm hover:bg-white disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        {data.checks.map((check) => (
          <article key={check.id} className={`rounded-xl border p-5 shadow-sm ${checkCardClasses(check.status)}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                {statusIcon(check.status)}
                <div>
                  <h3 className="font-semibold text-gray-900">{check.title}</h3>
                  <p className="mt-1 text-sm text-gray-600">{check.summary}</p>
                </div>
              </div>
              {check.durationMs != null && (
                <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600">
                  {check.durationMs}ms
                </span>
              )}
            </div>
            <div className="mt-4 space-y-1 border-t border-gray-100 pt-3">
              {check.evidence.map((line) => (
                <p key={line} className="font-mono text-xs text-gray-600">
                  {line}
                </p>
              ))}
            </div>
          </article>
        ))}
      </section>

      <section className="rounded-xl bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 p-5">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Recent Paid Bookings</h3>
          </div>
          <span className="text-sm text-gray-500">{data.recentBookings.length} checked</span>
        </div>
        <div className="divide-y divide-gray-100">
          {data.recentBookings.map((booking) => (
            <article key={booking.id} className="p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    {booking.issues.length ? statusIcon("fail") : statusIcon("ok")}
                    <h4 className="font-semibold text-gray-900">{booking.name}</h4>
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${lifecycleClasses(booking.lifecycle.kind)}`}>
                      {booking.lifecycle.label}
                    </span>
                    <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600">
                      {booking.serviceType || "unknown service"}
                    </span>
                    <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600">
                      {formatMoney(booking.amountPaid)}
                    </span>
                  </div>
                  <div className="mt-2 grid gap-1 text-sm text-gray-600 md:grid-cols-2">
                    <p>{booking.email}</p>
                    <p>{booking.phone || "No phone"}</p>
                    <p>{booking.propertyAddress || "No address"}</p>
                    <p>
                      {booking.appointmentDate || "No date"} {booking.appointmentTime || ""}
                    </p>
                  </div>
                </div>
                {booking.stripeSessionId && (
                  <a
                    href={`https://dashboard.stripe.com/payments/${booking.stripe?.paymentIntentId || ""}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
                  >
                    Stripe
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>

              <div className="mt-4 grid gap-3 lg:grid-cols-4">
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="text-xs font-medium uppercase text-gray-500">Lifecycle</p>
                  <p className="mt-1 text-sm text-gray-800">{booking.lifecycle.summary}</p>
                </div>
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="text-xs font-medium uppercase text-gray-500">Stripe</p>
                  <p className="mt-1 text-sm text-gray-800">
                    {booking.stripe
                      ? `${booking.stripe.paymentStatus} / ${formatCents(booking.stripe.amountTotal)} / refunded ${formatCents(booking.stripe.refundedAmount)}`
                      : "No Stripe read"}
                  </p>
                </div>
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="text-xs font-medium uppercase text-gray-500">Calendar</p>
                  <p className="mt-1 text-sm text-gray-800">
                    {booking.calendar
                      ? `${booking.calendar.status} / phone ${booking.calendar.hasPhone ? "yes" : "no"} / address ${booking.calendar.hasAddress ? "yes" : "no"}`
                      : "No event"}
                  </p>
                  {booking.calendar?.eventId && (
                    <p className="mt-1 font-mono text-xs text-gray-500">{booking.calendar.eventId}</p>
                  )}
                </div>
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="text-xs font-medium uppercase text-gray-500">Field PWA Job</p>
                  <p className="mt-1 text-sm text-gray-800">
                    {booking.job
                      ? `${booking.job.jobNumber} / ${booking.job.status}`
                      : "Missing from field Job table"}
                  </p>
                </div>
              </div>

              {booking.issues.length > 0 && (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3">
                  <p className="mb-2 text-sm font-semibold text-red-800">Issues</p>
                  <div className="space-y-3">
                    {[
                      ["Monitor instrumentation", booking.monitorIssues],
                      ["Payment record", booking.paymentIssues],
                      ["Calendar handoff", booking.calendarIssues],
                      ["Field PWA dispatch", booking.handoffIssues],
                    ].map(([label, issues]) => {
                      const issueList = issues as string[];
                      if (!issueList.length) return null;

                      return (
                        <div key={label as string}>
                          <p className="text-xs font-semibold uppercase text-red-900">{label as string}</p>
                          <ul className="mt-1 space-y-1">
                            {issueList.map((issue) => (
                              <li key={issue} className="text-sm text-red-700">
                                {issue}
                              </li>
                            ))}
                          </ul>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
