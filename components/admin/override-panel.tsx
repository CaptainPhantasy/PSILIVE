"use client";

import { useState, useEffect } from "react";
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  User,
  MapPin,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Loader2,
  Phone,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import type { OverrideRequest, OverrideResolution } from "@/lib/services/override.service";
import { OVERRIDE_REASON_LABELS, OVERRIDE_RESOLUTION_LABELS } from "@/lib/services/override.service";

interface OverridePanelProps {
  onRefresh?: () => void;
}

export function OverridePanel({ onRefresh }: OverridePanelProps) {
  const [requests, setRequests] = useState<OverrideRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedRequest, setExpandedRequest] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchRequests = async () => {
    try {
      const res = await fetch("/api/admin/overrides");
      const data = await res.json();
      if (data.success) {
        setRequests(data.requests);
      } else {
        setError(data.error || "Failed to load requests");
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    // Poll for updates every 30 seconds
    const interval = setInterval(fetchRequests, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleApprove = async (requestId: string, resolution: OverrideResolution, skipSignature: boolean, adminNotes: string) => {
    setProcessingId(requestId);
    try {
      const res = await fetch(`/api/admin/overrides/${requestId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resolution, skipSignature, adminNotes }),
      });

      const data = await res.json();
      if (data.success) {
        setRequests((prev) => prev.filter((r) => r.id !== requestId));
        onRefresh?.();
      } else {
        alert(data.error || "Failed to approve request");
      }
    } catch {
      alert("Network error");
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeny = async (requestId: string, reason: string) => {
    if (!reason.trim()) {
      alert("Please provide a reason for denying");
      return;
    }

    setProcessingId(requestId);
    try {
      const res = await fetch(`/api/admin/overrides/${requestId}/deny`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });

      const data = await res.json();
      if (data.success) {
        setRequests((prev) => prev.filter((r) => r.id !== requestId));
        onRefresh?.();
      } else {
        alert(data.error || "Failed to deny request");
      }
    } catch {
      alert("Network error");
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
        {error}
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="bg-white rounded-xl p-6 text-center">
        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
        <p className="text-gray-600 font-medium">No pending override requests</p>
        <p className="text-sm text-gray-500">All technicians are progressing smoothly</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Alert Banner */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-xl p-4 text-white">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-2 rounded-full">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="font-bold text-lg">{requests.length} Override Request{requests.length > 1 ? "s" : ""} Pending</p>
            <p className="text-white/80 text-sm">
              Technicians are waiting for your approval
            </p>
          </div>
        </div>
      </div>

      {/* Request Cards */}
      {requests.map((request) => (
        <OverrideRequestCard
          key={request.id}
          request={request}
          isExpanded={expandedRequest === request.id}
          onToggle={() => setExpandedRequest(expandedRequest === request.id ? null : request.id)}
          onApprove={handleApprove}
          onDeny={handleDeny}
          isProcessing={processingId === request.id}
        />
      ))}
    </div>
  );
}

interface OverrideRequestCardProps {
  request: OverrideRequest;
  isExpanded: boolean;
  onToggle: () => void;
  onApprove: (id: string, resolution: OverrideResolution, skipSignature: boolean, notes: string) => void;
  onDeny: (id: string, reason: string) => void;
  isProcessing: boolean;
}

function OverrideRequestCard({
  request,
  isExpanded,
  onToggle,
  onApprove,
  onDeny,
  isProcessing,
}: OverrideRequestCardProps) {
  const [resolution, setResolution] = useState<OverrideResolution>("PARTIAL");
  const [skipSignature, setSkipSignature] = useState(request.skipSignature);
  const [adminNotes, setAdminNotes] = useState("");
  const [denyReason, setDenyReason] = useState("");
  const [showDenyForm, setShowDenyForm] = useState(false);

  const timeAgo = formatDistanceToNow(new Date(request.createdAt), { addSuffix: true });

  return (
    <div className="bg-white rounded-xl border-2 border-orange-200 overflow-hidden">
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="bg-orange-100 p-2 rounded-full">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
          </div>
          <div className="text-left">
            <p className="font-semibold text-gray-900">{request.inspectionNumber}</p>
            <p className="text-sm text-gray-500">{request.propertyAddress}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-medium text-orange-600">{OVERRIDE_REASON_LABELS[request.reason]}</p>
            <p className="text-xs text-gray-500">{timeAgo}</p>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-gray-100">
          {/* Details */}
          <div className="p-4 grid md:grid-cols-2 gap-4">
            {/* Left Column */}
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Technician</p>
                <p className="font-medium text-gray-900 flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-400" />
                  {request.technicianName}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Client</p>
                <p className="font-medium text-gray-900">{request.clientName}</p>
                {request.clientPhone && (
                  <a
                    href={`tel:${request.clientPhone}`}
                    className="text-sm text-blue-600 flex items-center gap-1"
                  >
                    <Phone className="w-3 h-3" />
                    {request.clientPhone}
                  </a>
                )}
              </div>

              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Current Stage</p>
                <p className="font-medium text-gray-900">{request.currentStage.replace("_", " ")}</p>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Completed Steps</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {request.completedSteps.map((step) => (
                    <span
                      key={step}
                      className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full"
                    >
                      ✓ {step}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Missing Steps</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {request.missingSteps.map((step) => (
                    <span
                      key={step}
                      className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full"
                    >
                      ✗ {step}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Notes from Technician */}
          {request.notes && (
            <div className="px-4 pb-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                  <MessageSquare className="w-3 h-3 inline mr-1" />
                  Technician Notes
                </p>
                <p className="text-gray-700">{request.notes}</p>
              </div>
            </div>
          )}

          {/* Action Form */}
          <div className="border-t border-gray-100 p-4 bg-gray-50 space-y-4">
            {showDenyForm ? (
              /* Deny Form */
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Reason for Denying
                </label>
                <textarea
                  value={denyReason}
                  onChange={(e) => setDenyReason(e.target.value)}
                  placeholder="Explain why this request is being denied..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowDenyForm(false)}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => onDeny(request.id, denyReason)}
                    disabled={isProcessing || !denyReason.trim()}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium disabled:opacity-50"
                  >
                    {isProcessing ? "Processing..." : "Deny Request"}
                  </button>
                </div>
              </div>
            ) : (
              /* Approve Form */
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Resolution
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(Object.keys(OVERRIDE_RESOLUTION_LABELS) as OverrideResolution[]).map((res) => (
                      <button
                        key={res}
                        type="button"
                        onClick={() => setResolution(res)}
                        className={`p-3 rounded-lg border-2 text-left text-sm transition-colors ${
                          resolution === res
                            ? "border-green-500 bg-green-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <p className="font-medium">{OVERRIDE_RESOLUTION_LABELS[res].split(" - ")[0]}</p>
                        <p className="text-xs text-gray-500">
                          {OVERRIDE_RESOLUTION_LABELS[res].split(" - ")[1]}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Admin Notes (Optional)
                  </label>
                  <input
                    type="text"
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Add any notes for the technician..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={skipSignature}
                    onChange={(e) => setSkipSignature(e.target.checked)}
                    className="h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-700">Skip signature requirement</span>
                </label>

                <div className="flex gap-2">
                  <button
                    onClick={() => setShowDenyForm(true)}
                    className="flex-1 px-4 py-3 bg-white border border-red-300 text-red-600 rounded-xl font-medium hover:bg-red-50 flex items-center justify-center gap-2"
                  >
                    <XCircle className="w-5 h-5" />
                    Deny
                  </button>
                  <button
                    onClick={() => onApprove(request.id, resolution, skipSignature, adminNotes)}
                    disabled={isProcessing}
                    className="flex-1 px-4 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 flex items-center justify-center gap-2"
                  >
                    {isProcessing ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        Approve
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
