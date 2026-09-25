"use client";

import { useState, useEffect } from "react";
import { Loader2, MapPin, MessageSquare, AlertCircle, CheckCircle, Camera } from "lucide-react";
import type { Inspection } from "@/app/technician/inspection/[inspectionId]/page";
import { GPS_ACCURACY_THRESHOLD } from "@/lib/inspection-constants";

interface Props {
  inspection: Inspection;
  onStartInterview: () => Promise<{ success: boolean; error?: string }>;
}

export function ArrivedStage({ inspection, onStartInterview }: Props) {
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");
  const [gpsStatus, setGpsStatus] = useState<"checking" | "valid" | "warning" | "override">("checking");
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);

  useEffect(() => {
    // Check GPS on mount
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGpsAccuracy(position.coords.accuracy);
          if (position.coords.accuracy <= GPS_ACCURACY_THRESHOLD) {
            setGpsStatus("valid");
          } else {
            setGpsStatus("warning");
          }
        },
        () => {
          setGpsStatus("warning");
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      setGpsStatus("warning");
    }
  }, []);

  const handleStart = async () => {
    setStarting(true);
    setError("");

    const result = await onStartInterview();
    if (!result.success) {
      setError(result.error || "Failed to start interview");
    }
    setStarting(false);
  };

  const arrivedTime = inspection.arrivedAt
    ? new Date(inspection.arrivedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "Just now";

  return (
    <div className="p-4 space-y-4">
      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* Arrival Confirmation */}
      <div className="bg-green-50 rounded-xl p-4 border border-green-200">
        <div className="flex items-center gap-2 text-green-700 mb-2">
          <CheckCircle className="w-5 h-5" />
          <span className="font-semibold">On Site</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-green-600">Checked in at {arrivedTime}</span>
          {gpsStatus === "checking" && (
            <span className="text-gray-500">Verifying GPS...</span>
          )}
          {gpsStatus === "valid" && (
            <span className="text-green-600">✓ GPS verified</span>
          )}
          {gpsStatus === "warning" && (
            <span className="text-orange-600">GPS accuracy: {gpsAccuracy ? `${Math.round(gpsAccuracy)}m` : "Low"}</span>
          )}
        </div>
      </div>

      {/* Property Photo Reminder */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 p-2 rounded-full">
            <Camera className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900">Take Property Photo</p>
            <p className="text-sm text-gray-500">Optional but recommended</p>
          </div>
        </div>
      </div>

      {/* Property Info */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-gray-500" />
          Property
        </h3>
        <p className="text-gray-700">{inspection.job.propertyAddress}</p>
        <p className="text-sm text-gray-500">
          {inspection.job.propertyCity}, {inspection.job.propertyState} {inspection.job.propertyZip}
        </p>
        <div className="mt-3 pt-3 border-t">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Access Type</span>
            <span className="font-medium">{inspection.job.accessType.replace("_", " ")}</span>
          </div>
          {inspection.job.hasCrawlSpace && (
            <div className="flex justify-between text-sm mt-1">
              <span className="text-gray-500">Crawl Space</span>
              <span className="font-medium text-orange-600">Yes</span>
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-2">Next Step</h3>
        <p className="text-blue-700 text-sm">
          Start the client interview to gather property information before beginning the inspection.
        </p>
      </div>

      {/* Start Interview Button */}
      <button
        onClick={handleStart}
        disabled={starting}
        className="w-full bg-blue-600 text-white py-4 rounded-xl font-semibold text-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {starting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Starting...
          </>
        ) : (
          <>
            <MessageSquare className="w-5 h-5" />
            Start Client Interview
          </>
        )}
      </button>
    </div>
  );
}
