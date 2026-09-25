"use client";

import { useState } from "react";
import { Loader2, MapPin, Navigation, Clock, AlertCircle } from "lucide-react";
import type { Inspection } from "@/app/technician/inspection/[inspectionId]/page";

interface Props {
  inspection: Inspection;
  onArrive: () => Promise<{ success: boolean; error?: string }>;
}

export function EnRouteStage({ inspection, onArrive }: Props) {
  const [arriving, setArriving] = useState(false);
  const [error, setError] = useState("");

  const openMaps = () => {
    const address = encodeURIComponent(
      `${inspection.job.propertyAddress}, ${inspection.job.propertyCity}, ${inspection.job.propertyState} ${inspection.job.propertyZip}`
    );
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${address}`, "_blank");
  };

  const handleArrive = async () => {
    setArriving(true);
    setError("");

    const result = await onArrive();
    if (!result.success) {
      setError(result.error || "Failed to check in");
    }
    setArriving(false);
  };

  return (
    <div className="p-4 space-y-4">
      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* Navigation Card */}
      <button
        onClick={openMaps}
        className="w-full bg-white rounded-xl p-4 shadow-sm text-left"
      >
        <div className="flex items-start gap-3">
          <div className="bg-blue-100 p-2 rounded-full">
            <Navigation className="w-6 h-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-gray-900">Navigate to Property</p>
            <p className="text-sm text-gray-600">
              {inspection.job.propertyAddress}
            </p>
            <p className="text-sm text-gray-500">
              {inspection.job.propertyCity}, {inspection.job.propertyState} {inspection.job.propertyZip}
            </p>
          </div>
        </div>
      </button>

      {/* Client Info */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-3">Client</h3>
        <p className="text-gray-700">{inspection.job.clientName}</p>
        <p className="text-sm text-gray-500">{inspection.job.clientRole.replace("_", " ")}</p>
        {inspection.job.clientPhone && (
          <a
            href={`tel:${inspection.job.clientPhone}`}
            className="mt-2 inline-block text-blue-600 text-sm"
          >
            {inspection.job.clientPhone}
          </a>
        )}
      </div>

      {/* Special Notes */}
      {inspection.job.specialNotes && (
        <div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
          <h3 className="font-semibold text-orange-800 mb-2 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Special Notes
          </h3>
          <p className="text-orange-700 text-sm">{inspection.job.specialNotes}</p>
        </div>
      )}

      {/* Status */}
      <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
        <div className="flex items-center gap-2 text-blue-700">
          <Clock className="w-5 h-5" />
          <span className="font-medium">Currently En Route</span>
        </div>
        <p className="text-blue-600 text-sm mt-1">
          Tap &quot;I&apos;ve Arrived&quot; when you reach the property.
        </p>
      </div>

      {/* Arrive Button */}
      <button
        onClick={handleArrive}
        disabled={arriving}
        className="w-full bg-green-600 text-white py-4 rounded-xl font-semibold text-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {arriving ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Checking in...
          </>
        ) : (
          <>
            <MapPin className="w-5 h-5" />
            I&apos;ve Arrived
          </>
        )}
      </button>
    </div>
  );
}
