"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle, CheckCircle, Home, Send, Clock } from "lucide-react";
import type { Inspection } from "@/app/technician/inspection/[inspectionId]/page";

interface Props {
  inspection: Inspection;
  onSubmit: () => Promise<void>;
}

export function SubmitStage({ inspection, onSubmit }: Props) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(inspection.status === "SUBMITTED");
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");

    try {
      // Get current location
      let locationData = {};
      if (navigator.geolocation) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 10000,
            });
          });
          locationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
        } catch {
          // Continue without location
        }
      }

      const res = await fetch(`/api/technician/inspections/${inspection.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(locationData),
      });

      const data = await res.json();
      if (data.success) {
        setSubmitted(true);
        await onSubmit();
      } else {
        if (data.errors) {
          setError(data.errors.join(". "));
        } else {
          setError(data.error || "Failed to submit");
        }
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="p-4 space-y-4">
        {/* Success State */}
        <div className="bg-green-50 rounded-xl p-6 border border-green-200 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-green-900 mb-2">Inspection Submitted!</h2>
          <p className="text-green-700">
            Your inspection has been sent for review.
          </p>
        </div>

        {/* What's Next */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Clock className="w-5 h-5 text-gray-500" />
            What&apos;s Next?
          </h3>
          <ul className="text-sm text-gray-600 space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">1.</span>
              Admin will review your submission
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">2.</span>
              Video and report will be verified
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">3.</span>
              Client will receive secure download link
            </li>
          </ul>
        </div>

        {/* Inspection Details */}
        <div className="bg-gray-50 rounded-xl p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Submission Details</h3>
          <div className="text-sm space-y-1">
            <p><strong>Inspection #:</strong> {inspection.inspectionNumber}</p>
            <p><strong>Property:</strong> {inspection.job.propertyAddress}</p>
            <p><strong>Client:</strong> {inspection.job.clientName}</p>
            <p><strong>Condition:</strong> {inspection.overallCondition}</p>
            <p><strong>Urgency:</strong> {inspection.urgencyLevel}</p>
          </div>
        </div>

        {/* Back to Dashboard */}
        <button
          onClick={() => router.push("/technician/dashboard")}
          className="w-full bg-blue-600 text-white py-4 rounded-xl font-semibold text-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
        >
          <Home className="w-5 h-5" />
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Final Review */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-4">Final Review</h3>
        
        <div className="space-y-3">
          {/* Checklist Items */}
          <ChecklistItem
            label="Pre-inspection interview completed"
            checked={!!inspection.confirmedClientName}
          />
          <ChecklistItem
                      label="Inspection time recorded"
                      checked={!!inspection.inspectionStartedAt || (inspection.inspectionDuration || 0) > 0}
                    />
          <ChecklistItem
            label="Findings recorded"
            checked={!!inspection.overallCondition}
          />
          <ChecklistItem
                      label="Report notes captured"
                      checked={!!inspection.recommendations}
                    />
          <ChecklistItem
            label="Video attached"
            checked={inspection.videoAttachment?.uploadStatus === "COMPLETED"}
          />
          <ChecklistItem
            label="Client signature obtained"
            checked={!!inspection.clientSignature}
          />
        </div>
      </div>

      {/* Inspection Summary */}
      <div className="bg-gray-50 rounded-xl p-4">
        <h3 className="font-semibold text-gray-900 mb-3">Inspection Summary</h3>
        <div className="text-sm space-y-1">
          <p><strong>Property:</strong> {inspection.job.propertyAddress}</p>
          <p><strong>Client:</strong> {inspection.job.clientName}</p>
          <p><strong>Condition:</strong> {inspection.overallCondition || "Not set"}</p>
          <p><strong>Urgency:</strong> {inspection.urgencyLevel || "Not set"}</p>
          <p><strong>Duration:</strong> {inspection.inspectionDuration || 0} minutes</p>
        </div>
      </div>

      {/* Warning */}
      <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
        <h3 className="font-semibold text-yellow-800 mb-2 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          Before Submitting
        </h3>
        <p className="text-sm text-yellow-700">
          Make sure all information is accurate. The report will be sent to the admin
          for review before being delivered to the client.
        </p>
      </div>

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full bg-green-600 text-white py-4 rounded-xl font-semibold text-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {submitting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Submitting...
          </>
        ) : (
          <>
            <Send className="w-5 h-5" />
            Submit for Review
          </>
        )}
      </button>
    </div>
  );
}

function ChecklistItem({ label, checked }: { label: string; checked: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`w-5 h-5 rounded-full flex items-center justify-center ${
          checked ? "bg-green-500" : "bg-gray-300"
        }`}
      >
        {checked && <CheckCircle className="w-4 h-4 text-white" />}
      </div>
      <span className={checked ? "text-gray-900" : "text-gray-500"}>{label}</span>
    </div>
  );
}
