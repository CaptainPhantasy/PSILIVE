"use client";

import { useState, useRef, useEffect } from "react";
import { Loader2, AlertCircle, Send, Trash2, CheckCircle } from "lucide-react";
import type { Inspection } from "@/app/technician/inspection/[inspectionId]/page";
import { CLIENT_ROLES } from "@/lib/inspection-constants";

interface Props {
  inspection: Inspection;
  onRefresh: () => Promise<void>;
  onComplete: () => Promise<{ success: boolean; error?: string }>;
}

export function SignatureStage({ inspection, onRefresh, onComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [signerName, setSignerName] = useState(inspection.job.clientName);
  const [signerRole, setSignerRole] = useState(inspection.job.clientRole);
  const [saving, setSaving] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState("");

  const existingSignature = inspection.clientSignature;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = "#1e40af";
        ctx.lineWidth = 2;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
      }
    }
  }, []);

  const getCanvasCoordinates = (e: React.TouchEvent | React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ("touches" in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    } else {
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    }
  };

  const startDrawing = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;

    const { x, y } = getCanvasCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasSignature(true);
  };

  const draw = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDrawing) return;
    e.preventDefault();

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;

    const { x, y } = getCanvasCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (ctx && canvas) {
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    setHasSignature(false);
  };

  const saveSignature = async () => {
    if (!hasSignature || !signerName) {
      setError("Please provide a signature and name");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const canvas = canvasRef.current;
      const signatureData = canvas?.toDataURL("image/png") || "";

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

      const res = await fetch(`/api/technician/inspections/${inspection.id}/signature`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signatureData,
          signerName,
          signerRole,
          ...locationData,
        }),
      });

      const data = await res.json();
      if (data.success) {
        await onRefresh();
      } else {
        setError(data.error || "Failed to save signature");
      }
    } catch {
      setError("Failed to save signature");
    } finally {
      setSaving(false);
    }
  };

  const handleComplete = async () => {
    if (!existingSignature && !hasSignature) {
      setError("Please capture client signature first");
      return;
    }

    if (!existingSignature) {
      await saveSignature();
    }

    setCompleting(true);
    setError("");

    const result = await onComplete();
    if (!result.success) {
      setError(result.error || "Failed to proceed");
    }
    setCompleting(false);
  };

  return (
    <div className="p-4 space-y-4 pb-24">
      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {existingSignature ? (
        <div className="bg-green-50 rounded-xl p-4 border border-green-200">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-green-600" />
            <div>
              <p className="font-semibold text-green-900">Signature Captured</p>
              <p className="text-sm text-green-700">
                Signed by {existingSignature.signerName}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Signer Info */}
          <div className="bg-white rounded-xl p-4 shadow-sm space-y-3">
            <h3 className="font-semibold text-gray-900">Signer Information</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={signerName}
                onChange={(e) => setSignerName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role
              </label>
              <select
                value={signerRole}
                onChange={(e) => setSignerRole(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                {CLIENT_ROLES.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Signature Pad */}
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">Signature</h3>
              {hasSignature && (
                <button
                  onClick={clearSignature}
                  className="text-red-600 text-sm flex items-center gap-1"
                >
                  <Trash2 className="w-4 h-4" /> Clear
                </button>
              )}
            </div>

            <div className="border-2 border-gray-300 rounded-lg overflow-hidden bg-white">
              <canvas
                ref={canvasRef}
                width={600}
                height={200}
                className="w-full h-[150px] touch-none"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
            </div>
            <p className="text-xs text-gray-500 text-center mt-2">
              Sign above with your finger
            </p>
          </div>

          {/* Save Button */}
          {hasSignature && !existingSignature && (
            <button
              onClick={saveSignature}
              disabled={saving}
              className="w-full bg-gray-200 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-300 transition-colors disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Signature"}
            </button>
          )}
        </>
      )}

      {/* Summary Card */}
      <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-2">Inspection Summary</h3>
        <div className="text-sm text-blue-700 space-y-1">
          <p><strong>Property:</strong> {inspection.job.propertyAddress}</p>
          <p><strong>Condition:</strong> {inspection.overallCondition || "Not set"}</p>
          <p><strong>Urgency:</strong> {inspection.urgencyLevel || "Not set"}</p>
          <p><strong>Video:</strong> {inspection.videoAttachment ? "Attached" : "Missing"}</p>
        </div>
      </div>

      {/* Submit Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4">
        <button
          onClick={handleComplete}
          disabled={completing || (!existingSignature && !hasSignature)}
          className={`w-full py-4 rounded-xl font-semibold text-lg transition-colors flex items-center justify-center gap-2 ${
            existingSignature || hasSignature
              ? "bg-green-600 text-white hover:bg-green-700"
              : "bg-gray-200 text-gray-500 cursor-not-allowed"
          }`}
        >
          {completing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              Submit for Review
            </>
          )}
        </button>
      </div>
    </div>
  );
}
