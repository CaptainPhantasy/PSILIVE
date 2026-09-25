"use client";

import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import {
  Loader2,
  ChevronDown,
  ChevronUp,
  DollarSign,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Filter,
  RefreshCw,
} from "lucide-react";

interface Submission {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  serviceType: string | null;
  source: string | null;
  status: string;
  propertyAddress: string | null;
  propertyCity: string | null;
  propertyState: string | null;
  propertyZip: string | null;
  occupancy: string | null;
  propertyAccess: string | null;
  cleanoutLocation: string | null;
  referrerName: string | null;
  buyersAgent: string | null;
  listingAgent: string | null;
  howHeardAboutUs: string | null;
  directions: string | null;
  appointmentDate: string | null;
  appointmentTime: string | null;
  promoCode: string | null;
  stripeSessionId: string | null;
  amountPaid: number | null;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "new", label: "New" },
  { value: "pending-payment", label: "Pending Payment" },
  { value: "paid", label: "Paid" },
];

const statusBadge = (status: string) => {
  switch (status) {
    case "paid":
      return "bg-green-100 text-green-800";
    case "pending-payment":
      return "bg-yellow-100 text-yellow-800";
    case "new":
      return "bg-blue-100 text-blue-800";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

export function BookingsTab() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const fetchSubmissions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "15" });
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/admin/submissions?${params}`);
      const data = await res.json();
      if (data.success) {
        setSubmissions(data.submissions);
        setPagination(data.pagination);
      }
    } catch (err) {
      console.error("Failed to fetch submissions:", err);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  const fullAddress = (s: Submission) => {
    const parts = [s.propertyAddress, s.propertyCity, s.propertyState, s.propertyZip].filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : null;
  };

  return (
    <div>
      {/* Filters */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <button
          onClick={() => fetchSubmissions()}
          className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
        {pagination && (
          <span className="text-sm text-gray-500 ml-auto">
            {pagination.total} total submission{pagination.total !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        </div>
      ) : submissions.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No submissions found.
        </div>
      ) : (
        <div className="space-y-2">
          {submissions.map((s) => (
            <div key={s.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              {/* Summary row */}
              <button
                onClick={() => setExpandedId(expandedId === s.id ? null : s.id)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
              >
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusBadge(s.status)}`}>
                  {s.status}
                </span>
                <span className="font-medium text-gray-900 truncate">{s.name}</span>
                {s.amountPaid != null && (
                  <span className="flex items-center gap-0.5 text-green-700 font-semibold text-sm">
                    <DollarSign className="w-3.5 h-3.5" />
                    {s.amountPaid.toFixed(2)}
                  </span>
                )}
                <span className="text-xs text-gray-400 ml-auto whitespace-nowrap">
                  {format(new Date(s.createdAt), "MMM d, yyyy h:mm a")}
                </span>
                {expandedId === s.id ? (
                  <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                )}
              </button>

              {/* Expanded detail */}
              {expandedId === s.id && (
                <div className="px-4 pb-4 border-t border-gray-100">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                    {/* Contact info */}
                    <div className="space-y-1.5">
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Contact</h4>
                      <p className="flex items-center gap-1.5 text-sm"><Mail className="w-3.5 h-3.5 text-gray-400" /> <a href={`mailto:${s.email}`} className="text-blue-600 hover:underline">{s.email}</a></p>
                      {s.phone && <p className="flex items-center gap-1.5 text-sm"><Phone className="w-3.5 h-3.5 text-gray-400" /> <a href={`tel:${s.phone}`} className="text-blue-600 hover:underline">{s.phone}</a></p>}
                    </div>

                    {/* Property info */}
                    <div className="space-y-1.5">
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Property</h4>
                      {fullAddress(s) && <p className="flex items-center gap-1.5 text-sm"><MapPin className="w-3.5 h-3.5 text-gray-400" /> {fullAddress(s)}</p>}
                      {s.occupancy && <p className="text-sm"><span className="text-gray-500">Occupancy:</span> {s.occupancy}</p>}
                      {s.propertyAccess && <p className="text-sm"><span className="text-gray-500">Access:</span> {s.propertyAccess}</p>}
                      {s.cleanoutLocation && <p className="text-sm"><span className="text-gray-500">Cleanout:</span> {s.cleanoutLocation}</p>}
                    </div>

                    {/* Appointment */}
                    {(s.appointmentDate || s.appointmentTime) && (
                      <div className="space-y-1.5">
                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Appointment</h4>
                        <p className="flex items-center gap-1.5 text-sm"><Calendar className="w-3.5 h-3.5 text-gray-400" /> {s.appointmentDate || ""} {s.appointmentTime || ""}</p>
                      </div>
                    )}

                    {/* Agents & Referral */}
                    {(s.buyersAgent || s.listingAgent || s.referrerName || s.howHeardAboutUs) && (
                      <div className="space-y-1.5">
                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Referral / Agents</h4>
                        {s.howHeardAboutUs && <p className="text-sm"><span className="text-gray-500">How heard:</span> {s.howHeardAboutUs}</p>}
                        {s.referrerName && <p className="text-sm"><span className="text-gray-500">Referrer:</span> {s.referrerName}</p>}
                        {s.buyersAgent && <p className="text-sm"><span className="text-gray-500">Buyer&apos;s Agent:</span> {s.buyersAgent}</p>}
                        {s.listingAgent && <p className="text-sm"><span className="text-gray-500">Listing Agent:</span> {s.listingAgent}</p>}
                      </div>
                    )}

                    {/* Payment */}
                    {s.stripeSessionId && (
                      <div className="space-y-1.5">
                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Payment</h4>
                        {s.amountPaid != null && <p className="text-sm"><span className="text-gray-500">Amount:</span> <span className="font-semibold text-green-700">${s.amountPaid.toFixed(2)}</span></p>}
                        {s.promoCode && <p className="text-sm"><span className="text-gray-500">Promo:</span> {s.promoCode}</p>}
                        {s.paidAt && <p className="text-sm"><span className="text-gray-500">Paid:</span> {format(new Date(s.paidAt), "MMM d, yyyy h:mm a")}</p>}
                      </div>
                    )}
                  </div>

                  {/* Message */}
                  {s.message && (
                    <div className="mt-3">
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Message</h4>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 rounded p-2">{s.message}</p>
                    </div>
                  )}

                  {/* Directions */}
                  {s.directions && (
                    <div className="mt-3">
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Directions / Special Instructions</h4>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 rounded p-2">{s.directions}</p>
                    </div>
                  )}

                  {/* Meta */}
                  <div className="mt-3 flex gap-4 text-xs text-gray-400">
                    {s.source && <span>Source: {s.source}</span>}
                    {s.serviceType && <span>Service: {s.serviceType}</span>}
                    <span>ID: {s.id.slice(0, 8)}…</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
            disabled={page >= pagination.totalPages}
            className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
