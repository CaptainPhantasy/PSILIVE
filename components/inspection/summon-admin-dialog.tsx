"use client";

import { useState } from "react";
import {
  AlertTriangle,
  X,
  Camera,
  Send,
  Loader2,
  CheckCircle,
  Clock,
} from "lucide-react";
import type { InspectionWithRelations } from "@/lib/services/inspection.service";
import type { OverrideReason } from "@/lib/services/override.service";
import { OVERRIDE_REASON_LABELS } from "@/lib/services/override.service";

interface SummonAdminDialogProps {
  inspection: InspectionWithRelations;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const REASONS: { value: OverrideReason; description: string; icon: string }[] = [
  {
    value: "ACCESS_DENIED",
    description: "Client or property access denied",
    icon: "🚫",
  },
  {
    value: "EQUIPMENT_MALFUNCTION",
    description: "Camera or equipment not working",
    icon: "🔧",
  },
  {
    value: "PIPE_BLOCKED",
    description: "Cannot proceed - pipe completely blocked",
    icon: "🚷",
  },
  {
    value: "SAFETY_CONCERN",
    description: "Unsafe conditions at property",
    icon: "⚠️",
  },
  {
    value: "CLIENT_ABSENT",
    description: "No one home / cannot access",
    icon: "🏠",
  },
  {
    value: "PROPERTY_ISSUE",
    description: "Property condition prevents inspection",
    icon: "🏗️",
  },
  {
    value: "OTHER",
    description: "Other issue (explain in notes)",
    icon: "❓",
  },
];

export function SummonAdminDialog({
  inspection,
  isOpen,
  onClose,
  onSuccess,
}: SummonAdminDialogProps) {
  const [selectedReason, setSelectedReason] = useState<OverrideReason | "">("");
  const [notes, setNotes] = useState("");
  const [skipSignature, setSkipSignature] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handlePhotoCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Upload photo
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("inspectionId", inspection.id);
      formData.append("type", "DEFECT");

      const res = await fetch("/api/technician/inspections/" + inspection.id + "/photo", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        setPhotoUrl(data.photo.url);
      }
    } catch (err) {
      console.error("Photo upload failed:", err);
    }
  };

  const handleSubmit = async () => {
    if (!selectedReason) {
      setError("Please select a reason for the request");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch(`/api/technician/inspections/${inspection.id}/override`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: selectedReason,
          notes,
          skipSignature,
          photoUrl,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setSubmitted(true);
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 2000);
      } else {
        setError(data.error || "Failed to submit request");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting && !submitted) {
      setSelectedReason("");
      setNotes("");
      setSkipSignature(false);
      setPhotoUrl(null);
      setError("");
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />

      {/* Dialog */}
      <div className="relative bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col shadow-xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-red-500 px-4 py-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6" />
              <div>
                <h2 className="font-bold text-lg">Request Admin Assistance</h2>
                <p className="text-sm text-white/80">Blocked and need help?</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-1 hover:bg-white/20 rounded-full transition-colors"
              disabled={isSubmitting || submitted}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {submitted ? (
          /* Success State */
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Request Sent!</h3>
            <p className="text-gray-600 mb-4">
              An admin has been notified. They will review your request shortly.
            </p>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Clock className="w-4 h-4" />
              <span>Average response time: ~5 minutes</span>
            </div>
          </div>
        ) : (
          /* Form */
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Current Status */}
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Current Inspection</p>
                <p className="font-medium text-gray-900">{inspection.inspectionNumber}</p>
                <p className="text-sm text-gray-600">{inspection.job.propertyAddress}</p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              {/* Reason Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What&apos;s preventing completion? <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {REASONS.map((reason) => (
                    <button
                      key={reason.value}
                      type="button"
                      onClick={() => setSelectedReason(reason.value)}
                      className={`flex items-center gap-3 p-3 rounded-lg border-2 text-left transition-colors ${
                        selectedReason === reason.value
                          ? "border-orange-500 bg-orange-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <span className="text-2xl">{reason.icon}</span>
                      <div>
                        <p className="font-medium text-gray-900">
                          {OVERRIDE_REASON_LABELS[reason.value]}
                        </p>
                        <p className="text-sm text-gray-500">{reason.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Details
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Provide more context about the situation..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* Photo Evidence */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Photo Evidence (Optional)
                </label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg cursor-pointer hover:bg-gray-200 transition-colors">
                    <Camera className="w-5 h-5 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">
                      {photoUrl ? "Photo Added" : "Add Photo"}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handlePhotoCapture}
                      className="hidden"
                    />
                  </label>
                  {photoUrl && (
                    <span className="text-sm text-green-600">✓ Photo attached</span>
                  )}
                </div>
              </div>

              {/* Skip Signature Option */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={skipSignature}
                    onChange={(e) => setSkipSignature(e.target.checked)}
                    className="mt-1 h-4 w-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                  />
                  <div>
                    <p className="font-medium text-gray-900">Skip signature requirement</p>
                    <p className="text-sm text-gray-600">
                      Check this if the client is unavailable to sign
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t p-4 space-y-2">
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !selectedReason}
                className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 rounded-xl font-semibold hover:from-orange-600 hover:to-red-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Sending Request...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Send Request to Admin
                  </>
                )}
              </button>
              <button
                onClick={handleClose}
                disabled={isSubmitting}
                className="w-full bg-gray-100 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
