"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import {
  Loader2,
  ArrowLeft,
  CheckCircle,
  Navigation,
  MapPin,
  MessageSquare,
  Camera,
  ClipboardList,
  Video,
  PenTool,
  Send,
  ChevronRight,
  AlertCircle,
  AlertTriangle,
  Phone,
  RefreshCw,
} from "lucide-react";

// Stage components
import { EnRouteStage } from "@/components/inspection/en-route-stage";
import { ArrivedStage } from "@/components/inspection/arrived-stage";
import { PreInspectionStage } from "@/components/inspection/pre-inspection-stage";
import { InspectingStage } from "@/components/inspection/inspecting-stage";
import { PostInspectionStage } from "@/components/inspection/post-inspection-stage";
import { VideoAttachStage } from "@/components/inspection/video-attach-stage";
import { SignatureStage } from "@/components/inspection/signature-stage";
import { SubmitStage } from "@/components/inspection/submit-stage";
import { FieldValidator } from "@/components/inspection/field-validator";
import { GlobalVoiceNote } from "@/components/inspection/global-voice-note";

const STAGES = [
  { id: "ACCEPTED", label: "Accepted", icon: CheckCircle },
  { id: "EN_ROUTE", label: "En Route", icon: Navigation },
  { id: "ARRIVED", label: "On Site", icon: MapPin },
  { id: "PRE_INSPECTION", label: "Interview", icon: MessageSquare },
  { id: "INSPECTING", label: "Inspection", icon: Camera },
  { id: "POST_INSPECTION", label: "Findings", icon: ClipboardList },
  { id: "VIDEO_ATTACH", label: "Video", icon: Video },
  { id: "CLIENT_SIGNOFF", label: "Sign-off", icon: PenTool },
  { id: "SUBMITTED", label: "Submit", icon: Send },
];

export interface Inspection {
  id: string;
  inspectionNumber: string;
  currentStage: string;
  status: string;
  rejectedStage: string | null;
  reviewNotes: string | null;
  reviewedAt: string | null;
  confirmedClientName: string | null;
  confirmedAddress: string | null;
  homeAge: string | null;
  pipeMaterial: string | null;
  knownIssues: string | null;
  backupHistory: string | null;
  recentWork: string | null;
  specialInstructions: string | null;
  overallCondition: string | null;
  rootIntrusion: Record<string, unknown> | null;
  cracks: Record<string, unknown>[] | null;
  bellies: Record<string, unknown>[] | null;
  offsetJoints: Record<string, unknown>[] | null;
  blockages: Record<string, unknown>[] | null;
  pipeConditionRating: number | null;
  connectionToMain: string | null;
  recommendations: string | null;
  urgencyLevel: string | null;
  arrivedAt: string | null;
  inspectionStartedAt: string | null;
  inspectionEndedAt: string | null;
  inspectionDuration: number | null;
  job: {
    id: string;
    jobNumber: string;
    clientName: string;
    clientEmail: string;
    clientPhone: string | null;
    clientRole: string;
    propertyAddress: string;
    propertyCity: string;
    propertyState: string;
    propertyZip: string;
    accessType: string;
    hasCrawlSpace: boolean;
    specialNotes: string | null;
    totalPrice: number;
  };
  videoAttachment: {
    id: string;
    uploadStatus: string;
    fileName: string;
    fileSize: number;
    duration: number | null;
  } | null;
  clientSignature: {
    id: string;
    signerName: string;
  } | null;
}

// Stage labels for rejection UI
const STAGE_LABELS: Record<string, string> = {
  PRE_INSPECTION: "Property Details",
  INSPECTING: "Findings & Defects",
  POST_INSPECTION: "Summary & Recommendations",
  VIDEO_ATTACH: "Video & Chapters",
  CLIENT_SIGNOFF: "Client Signature",
};

export default function InspectionPage() {
  const params = useParams();
  const inspectionId = params.inspectionId as string;
  const router = useRouter();
  const { user, loading } = useAuth();
  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [loadingInspection, setLoadingInspection] = useState(true);
  const [error, setError] = useState("");
  const [showChecklist, setShowChecklist] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/technician/login");
    }
  }, [user, loading, router]);

  const fetchInspection = useCallback(async () => {
    try {
      const res = await fetch(`/api/technician/inspections/${inspectionId}`);
      const data = await res.json();
      if (data.success) {
        setInspection(data.inspection);
      } else {
        setError(data.error || "Failed to load inspection");
      }
    } catch {
      setError("Network error");
    } finally {
      setLoadingInspection(false);
    }
  }, [inspectionId]);

  useEffect(() => {
    if (user) {
      fetchInspection();
    }
  }, [user, fetchInspection]);

  const updateStage = async (newStage: string, additionalData?: Record<string, unknown>) => {
    try {
      // Get current location if available
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
            accuracy: position.coords.accuracy,
          };
        } catch {
          // Continue without location
        }
      }

      const res = await fetch(`/api/technician/inspections/${inspectionId}/stage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: newStage, ...locationData, ...additionalData }),
      });

      const data = await res.json();
      if (data.success) {
        setInspection(prev => prev ? { ...prev, currentStage: newStage } : null);
        await fetchInspection();
        return { success: true };
      } else {
        return { success: false, error: data.error };
      }
    } catch {
      return { success: false, error: "Network error" };
    }
  };

  const updateInspection = async (data: Partial<Inspection>) => {
    try {
      const res = await fetch(`/api/technician/inspections/${inspectionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();
      if (result.success) {
        setInspection(prev => prev ? { ...prev, ...data } : null);
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    } catch {
      return { success: false, error: "Network error" };
    }
  };

  // Handle resubmit after corrections
  const [resubmitting, setResubmitting] = useState(false);
  const handleResubmitCorrection = async () => {
    setResubmitting(true);
    try {
      // Update stage to SUBMITTED and clear rejection
      const res = await fetch(`/api/technician/inspections/${inspectionId}/stage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: "SUBMITTED", clearRejection: true }),
      });

      const data = await res.json();
      if (data.success) {
        await fetchInspection();
      } else {
        setError(data.error || "Failed to resubmit");
      }
    } catch {
      setError("Network error");
    } finally {
      setResubmitting(false);
    }
  };

  // Check if this is a rejected inspection
  const isRejected = inspection?.status === "REJECTED";
  const rejectedStage = inspection?.rejectedStage;

  if (loading || loadingInspection) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !inspection) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <p className="text-gray-600 mb-4">{error || "Inspection not found"}</p>
        <button
          onClick={() => router.push("/technician/dashboard")}
          className="text-blue-600 hover:underline"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  const currentStageIndex = STAGES.findIndex(s => s.id === inspection.currentStage);

  const renderStageContent = () => {
    switch (inspection.currentStage) {
      case "ACCEPTED":
        return (
          <div className="p-4 space-y-4">
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
              <h3 className="font-semibold text-blue-900 mb-2">Job Accepted</h3>
              <p className="text-blue-700 text-sm">
                Tap "En Route" when you leave for the job site.
              </p>
            </div>
            <button
              onClick={() => updateStage("EN_ROUTE")}
              className="w-full bg-blue-600 text-white py-4 rounded-xl font-semibold text-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <Navigation className="w-5 h-5" />
              I&apos;m En Route
            </button>
          </div>
        );

      case "EN_ROUTE":
        return (
          <EnRouteStage
            inspection={inspection}
            onArrive={() => updateStage("ARRIVED")}
          />
        );

      case "ARRIVED":
        return (
          <ArrivedStage
            inspection={inspection}
            onStartInterview={() => updateStage("PRE_INSPECTION")}
          />
        );

      case "PRE_INSPECTION":
        return (
          <PreInspectionStage
            inspection={inspection}
            onUpdate={updateInspection}
            onComplete={() => updateStage("INSPECTING")}
          />
        );

      case "INSPECTING":
        return (
          <InspectingStage
            inspection={inspection}
            onComplete={() => updateStage("POST_INSPECTION")}
          />
        );

      case "POST_INSPECTION":
        return (
          <PostInspectionStage
            inspection={inspection}
            onUpdate={updateInspection}
            onComplete={() => updateStage("VIDEO_ATTACH")}
          />
        );

      case "VIDEO_ATTACH":
        return (
          <VideoAttachStage
            inspection={inspection}
            onRefresh={fetchInspection}
            onComplete={() => updateStage("CLIENT_SIGNOFF")}
          />
        );

      case "CLIENT_SIGNOFF":
        return (
          <SignatureStage
            inspection={inspection}
            onRefresh={fetchInspection}
            onComplete={() => updateStage("SUBMITTED")}
          />
        );

      case "SUBMITTED":
        return (
          <SubmitStage
            inspection={inspection}
            onSubmit={fetchInspection}
          />
        );

      default:
        return (
          <div className="p-4 text-center text-gray-500">
            Unknown stage: {inspection.currentStage}
          </div>
        );
    }
  };

  // No-op complete handler for rejected stage editing
  const noOpComplete = async () => ({ success: true });

  // Render the content for rejected stage editing
  const renderRejectedStageContent = () => {
    if (!rejectedStage) return null;

    const stageLabel = STAGE_LABELS[rejectedStage] || rejectedStage;

    switch (rejectedStage) {
      case "PRE_INSPECTION":
        return (
          <PreInspectionStage
            inspection={inspection}
            onUpdate={updateInspection}
            onComplete={noOpComplete} // Don't auto-advance, use resubmit button
          />
        );
      case "INSPECTING":
        return (
          <InspectingStage
            inspection={inspection}
            onComplete={noOpComplete} // Don't auto-advance
          />
        );
      case "POST_INSPECTION":
        return (
          <PostInspectionStage
            inspection={inspection}
            onUpdate={updateInspection}
            onComplete={noOpComplete} // Don't auto-advance
          />
        );
      case "VIDEO_ATTACH":
        return (
          <VideoAttachStage
            inspection={inspection}
            onRefresh={fetchInspection}
            onComplete={noOpComplete} // Don't auto-advance
          />
        );
      case "CLIENT_SIGNOFF":
        return (
          <SignatureStage
            inspection={inspection}
            onRefresh={fetchInspection}
            onComplete={noOpComplete} // Don't auto-advance
          />
        );
      default:
        return (
          <div className="p-4 text-center text-gray-500">
            Unknown stage: {stageLabel}
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-4">
      {/* Header */}
      <header className={`text-white px-4 py-4 sticky top-0 z-10 ${isRejected ? "bg-red-600" : "bg-blue-600"}`}>
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/technician/dashboard")}
            className={`p-1 rounded-full transition-colors ${isRejected ? "hover:bg-red-700" : "hover:bg-blue-700"}`}
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex-1">
            <h1 className="font-semibold">{inspection.inspectionNumber}</h1>
            <p className={`text-sm truncate ${isRejected ? "text-red-200" : "text-blue-200"}`}>
              {inspection.job.propertyAddress}, {inspection.job.propertyCity}
            </p>
          </div>
          {inspection.job.clientPhone && (
            <a
              href={`tel:${inspection.job.clientPhone}`}
              className={`p-2 rounded-full transition-colors ${isRejected ? "hover:bg-red-700" : "hover:bg-blue-700"}`}
            >
              <Phone className="w-5 h-5" />
            </a>
          )}
          {!isRejected && (
            <button
              onClick={() => setShowChecklist(!showChecklist)}
              className={`p-2 rounded-full transition-colors ${
                showChecklist ? "bg-white text-blue-600" : "hover:bg-blue-700"
              }`}
              title="Toggle Checklist"
            >
              <ClipboardList className="w-5 h-5" />
            </button>
          )}
        </div>
      </header>

      {/* Rejection Banner */}
      {isRejected && rejectedStage && (
        <div className="bg-red-50 border-b-2 border-red-200 px-4 py-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-bold text-red-800 mb-1">Returned for Corrections</h3>
              <p className="text-sm text-red-700 mb-2">
                <span className="font-medium">Section to fix:</span>{" "}
                <span className="font-bold">{STAGE_LABELS[rejectedStage] || rejectedStage}</span>
              </p>
              {inspection.reviewNotes && (
                <div className="bg-red-100 p-3 rounded-lg mb-3">
                  <p className="text-sm text-red-800">
                    <span className="font-medium">Admin feedback:</span> {inspection.reviewNotes}
                  </p>
                </div>
              )}
              <p className="text-xs text-red-600">
                Make the necessary corrections below, then tap "Resubmit for Review".
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Progress Bar - Only show when not rejected */}
      {!isRejected && (
        <div className="bg-white border-b px-4 py-3 overflow-x-auto">
          <div className="flex gap-1 min-w-max">
            {STAGES.map((stage, index) => {
              const Icon = stage.icon;
              const isCompleted = index < currentStageIndex;
              const isCurrent = index === currentStageIndex;
              const isUpcoming = index > currentStageIndex;

              return (
                <button
                  key={stage.id}
                  onClick={() => {
                    if (isCompleted || user?.role === "ADMIN" || user?.role === "SUPER_ADMIN") {
                      if (isUpcoming && !confirm(`Bypass gates to jump to ${stage.label}?`)) return;
                      updateStage(stage.id);
                    }
                  }}
                  disabled={!isCompleted && user?.role !== "ADMIN" && user?.role !== "SUPER_ADMIN" && !isCurrent}
                  className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                    isCompleted
                      ? "bg-green-100 text-green-700 hover:bg-green-200 cursor-pointer"
                      : isCurrent
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-400"
                  } ${(user?.role === "ADMIN" || user?.role === "SUPER_ADMIN") && isUpcoming ? "hover:bg-blue-100 border border-blue-300 cursor-pointer text-blue-700" : ""}`}
                >
                  <Icon className="w-3 h-3" />
                  <span className="hidden sm:inline">{stage.label}</span>
                  {index < STAGES.length - 1 && (
                    <ChevronRight className={`w-3 h-3 ${isUpcoming ? "text-gray-300" : ""}`} />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Admin Bypass Warning */}
      {!isRejected && (user?.role === "ADMIN" || user?.role === "SUPER_ADMIN") && currentStageIndex < STAGES.length - 1 && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-yellow-800">
              <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
              <span className="text-xs sm:text-sm font-bold">Admin Bypass Available:</span>
              <span className="text-xs sm:text-sm">You may click any future stage above to bypass gates, or click any past stage to go back.</span>
            </div>
            <button
              onClick={() => {
                if (confirm("WARNING: You are about to bypass required gates and jump to the next stage. Proceed?")) {
                  updateStage(STAGES[currentStageIndex + 1].id);
                }
              }}
              className="px-3 py-1.5 bg-yellow-600 text-white text-xs font-bold rounded hover:bg-yellow-700 whitespace-nowrap shadow-sm"
            >
              Force Next Stage
            </button>
          </div>
        </div>
      )}

      {/* Checklist Panel */}
      {showChecklist && !isRejected && (
        <div className="px-4 py-3 bg-gray-50 border-b">
          <FieldValidator inspection={inspection} currentStage={inspection.currentStage} />
        </div>
      )}

      {/* Stage Content */}
      <main>
        {isRejected ? (
          <>
            {renderRejectedStageContent()}
            {/* Resubmit Button */}
            <div className="px-4 py-4 border-t bg-white sticky bottom-0">
              <button
                onClick={handleResubmitCorrection}
                disabled={resubmitting}
                className="w-full bg-green-600 text-white py-4 rounded-xl font-semibold text-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {resubmitting ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Resubmitting...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Resubmit for Review
                  </>
                )}
              </button>
            </div>
          </>
        ) : (
          renderStageContent()
        )}
      </main>
    </div>
  );
}
