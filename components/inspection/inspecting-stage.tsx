"use client";

import { useState, useEffect } from "react";
import { Loader2, Clock, AlertCircle, ClipboardList, Mic } from "lucide-react";
import type { Inspection } from "@/app/technician/inspection/[inspectionId]/page";
import { CameraPairing } from "./camera-pairing";

interface Props {
  inspection: Inspection;
  onComplete: () => Promise<{ success: boolean; error?: string }>;
}

export function InspectingStage({ inspection, onComplete }: Props) {
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState("");
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    const startTime = inspection.inspectionStartedAt
      ? new Date(inspection.inspectionStartedAt).getTime()
      : Date.now();

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setElapsedTime(elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [inspection.inspectionStartedAt]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleComplete = async () => {
    setCompleting(true);
    setError("");

    const result = await onComplete();
    if (!result.success) {
      setError(result.error || "Failed to complete inspection");
    }
    setCompleting(false);
  };

  return (
    <div className="p-4 space-y-4">
      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* Timer */}
      <div className="bg-white rounded-xl p-6 shadow-sm text-center">
        <div className="flex items-center justify-center gap-2 text-gray-500 mb-2">
          <Clock className="w-5 h-5" />
          <span className="text-sm font-medium">Inspection Time Recorded</span>
        </div>
        <div className="text-5xl font-mono font-bold text-blue-600">
          {formatTime(elapsedTime)}
        </div>
        <p className="text-sm text-gray-500 mt-2">
          Proceed when the field work is complete. Stops, interruptions, and return voiceovers are expected in real inspections.
        </p>
      </div>

      {/* Camera Pairing */}
      <CameraPairing inspectionId={inspection.id} />

      {/* Voice Notes */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Mic className="w-4 h-4 text-gray-500" />
          Voice Notes
        </h3>
        <p className="text-sm text-gray-500 mb-3">
          Use the floating microphone to add observations during the inspection or after returning to a section.
        </p>
      </div>

      {/* Tips */}
      <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-2">Inspection Checklist</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Start from the access point</li>
          <li>• Note footage markers for any defects</li>
          <li>• Check for root intrusion, cracks, bellies</li>
          <li>• Verify connection to main sewer line</li>
          <li>• Document any offset joints or blockages</li>
        </ul>
      </div>

      {/* Complete Button */}
      <button
        onClick={handleComplete}
        disabled={completing}
        className="w-full py-4 rounded-xl font-semibold text-lg transition-colors flex items-center justify-center gap-2 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {completing ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Completing...
          </>
        ) : (
          <>
            <ClipboardList className="w-5 h-5" />
            Complete Field Inspection
          </>
        )}
      </button>
    </div>
  );
}
