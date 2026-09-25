"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import {
  Loader2,
  ArrowLeft,
  CheckCircle,
  XCircle,
  MapPin,
  User,
  Clock,
  Video,
  FileText,
  AlertCircle,
  Send,
} from "lucide-react";
import { format } from "date-fns";
import { VideoChapters } from "@/components/inspection/video-chapters";

interface Inspection {
  id: string;
  inspectionNumber: string;
  currentStage: string;
  status: string;
  confirmedClientName: string | null;
  confirmedAddress: string | null;
  homeAge: string | null;
  pipeMaterial: string | null;
  knownIssues: string | null;
  backupHistory: string | null;
  recentWork: string | null;
  specialInstructions: string | null;
  overallCondition: string | null;
  pipeConditionRating: number | null;
  connectionToMain: string | null;
  recommendations: string | null;
  urgencyLevel: string | null;
  inspectionDuration: number | null;
  completedAt: string | null;
  job: {
    clientName: string;
    clientEmail: string;
    clientPhone: string | null;
    propertyAddress: string;
    propertyCity: string;
    propertyState: string;
    totalPrice: number;
  };
  technician: {
    name: string;
    email: string;
  } | null;
  videoAttachment: {
    id: string;
    cloudPath: string;
    fileName: string;
    fileSize: number;
    uploadStatus: string;
    duration: number | null;
  } | null;
  clientSignature: {
    signerName: string;
    signedAt: string;
  } | null;
}

export default function AdminInspectionReviewPage() {
  const params = useParams();
  const inspectionId = params.inspectionId as string;
  const router = useRouter();
  const { user, loading } = useAuth();
  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedRejectStage, setSelectedRejectStage] = useState("");
  const [reviewNotes, setReviewNotes] = useState("");
  const [savingReportData, setSavingReportData] = useState(false);
  const [reportData, setReportData] = useState({
  	confirmedClientName: "",
  	confirmedAddress: "",
  	homeAge: "",
  	pipeMaterial: "",
  	knownIssues: "",
  	backupHistory: "",
  	recentWork: "",
  	specialInstructions: "",
  	overallCondition: "",
  	pipeConditionRating: "",
  	connectionToMain: "",
  	recommendations: "",
  	urgencyLevel: "",
  });
  
  // Stages that can be rejected/reopened
  const REJECTABLE_STAGES = [
    { value: "PRE_INSPECTION", label: "Property Details", description: "Client info, property details, known issues" },
    { value: "INSPECTING", label: "Findings & Defects", description: "Root intrusion, cracks, bellies, blockages" },
    { value: "POST_INSPECTION", label: "Summary & Recommendations", description: "Overall condition, recommendations, urgency" },
    { value: "VIDEO_ATTACH", label: "Video & Chapters", description: "Video upload, chapter markers, timestamps" },
    { value: "CLIENT_SIGNOFF", label: "Client Signature", description: "Client sign-off and confirmation" },
  ];
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loadingVideo, setLoadingVideo] = useState(false);
  const [videoCurrentTime, setVideoCurrentTime] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Load video URL when inspection has video
  const loadVideoUrl = async () => {
    if (!inspection?.videoAttachment?.cloudPath) return;
    setLoadingVideo(true);
    try {
      const res = await fetch("/api/admin/video-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cloudPath: inspection.videoAttachment.cloudPath }),
      });
      const data = await res.json();
      if (data.success) {
        setVideoUrl(data.url);
      }
    } catch (err) {
      console.error("Failed to load video URL:", err);
    } finally {
      setLoadingVideo(false);
    }
  };

  // Handle chapter click - seek video
  const handleChapterClick = (timestamp: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = timestamp;
      videoRef.current.play();
    }
  };

  useEffect(() => {
    if (!loading && !user) {
      router.push("/technician/login");
    } else if (!loading && user && !["ADMIN", "OWNER", "SUPER_ADMIN"].includes(user.role)) {
      router.push("/technician/dashboard");
    }
  }, [user, loading, router]);

  useEffect(() => {
    const fetchInspection = async () => {
      try {
        const res = await fetch(`/api/technician/inspections/${inspectionId}`);
        const data = await res.json();
        if (data.success) {
          setInspection(data.inspection);
          setReportData({
            confirmedClientName: data.inspection.confirmedClientName || data.inspection.job.clientName || "",
            confirmedAddress: data.inspection.confirmedAddress || data.inspection.job.propertyAddress || "",
            homeAge: data.inspection.homeAge || "",
            pipeMaterial: data.inspection.pipeMaterial || "",
            knownIssues: data.inspection.knownIssues || "",
            backupHistory: data.inspection.backupHistory || "",
            recentWork: data.inspection.recentWork || "",
            specialInstructions: data.inspection.specialInstructions || "",
            overallCondition: data.inspection.overallCondition || "",
            pipeConditionRating: data.inspection.pipeConditionRating?.toString() || "",
            connectionToMain: data.inspection.connectionToMain || "",
            recommendations: data.inspection.recommendations || "",
            urgencyLevel: data.inspection.urgencyLevel || "",
          });
        }
      } catch (error) {
        console.error("Failed to fetch inspection:", error);
      } finally {
        setLoadingData(false);
      }
    };

    if (user) {
      fetchInspection();
    }
  }, [user, inspectionId]);

  // Load video URL when inspection data is available
  useEffect(() => {
    if (inspection?.videoAttachment?.cloudPath && !videoUrl) {
      loadVideoUrl();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inspection]);

  const handleSaveReportData = async () => {
    setSavingReportData(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`/api/technician/inspections/${inspectionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...reportData,
          pipeConditionRating: reportData.pipeConditionRating
            ? Number(reportData.pipeConditionRating)
            : null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setInspection(data.inspection);
        setSuccess("Report data saved.");
      } else {
        setError(data.error || "Failed to save report data");
      }
    } catch {
      setError("Network error");
    } finally {
      setSavingReportData(false);
    }
  };

const handleApprove = async () => {
	setApproving(true);
	setError("");

	try {
		const res = await fetch(`/api/admin/inspections/${inspectionId}/approve`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ reviewNotes }),
		});

		const data = await res.json();
		if (data.success) {
			setSuccess("Inspection approved! Client notification sent.");
			setTimeout(() => router.push("/admin"), 2000);
		} else {
			setError(data.error || "Failed to approve");
		}
	} catch {
		setError("Network error");
	} finally {
		setApproving(false);
	}
};

const handleReject = async () => {
    if (!selectedRejectStage) {
      setError("Please select a stage to return for corrections");
      return;
    }
    if (!rejectReason) {
      setError("Please provide a reason for rejection");
      return;
    }

    setRejecting(true);
    setError("");

    try {
      const res = await fetch(`/api/admin/inspections/${inspectionId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          reason: rejectReason,
          rejectedStage: selectedRejectStage,
        }),
      });

      const data = await res.json();
      if (data.success) {
        const stageLabel = REJECTABLE_STAGES.find(s => s.value === selectedRejectStage)?.label || selectedRejectStage;
        setSuccess(`Inspection returned to technician. "${stageLabel}" section unlocked for editing.`);
        setShowRejectModal(false);
        setTimeout(() => router.push("/admin"), 2000);
      } else {
        setError(data.error || "Failed to reject");
      }
    } catch {
      setError("Network error");
    } finally {
      setRejecting(false);
    }
  };

  if (loading || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!inspection) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <p className="text-gray-600">Inspection not found</p>
      </div>
    );
  }

  const isActionable = inspection.status === "SUBMITTED" || inspection.status === "UNDER_REVIEW";
  const handleReportDataChange = (field: keyof typeof reportData, value: string) => {
    setReportData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gray-100 pb-8">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => router.push("/admin")}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-bold text-gray-900">{inspection.inspectionNumber}</h1>
            <p className="text-sm text-gray-500">
              {inspection.job.propertyAddress}, {inspection.job.propertyCity}
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 text-green-700 p-4 rounded-lg flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            {success}
          </div>
        )}

        {/* Summary Card */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <User className="w-4 h-4" /> Client Information
              </h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-500">Name</dt>
                  <dd className="font-medium">{inspection.job.clientName}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Email</dt>
                  <dd className="font-medium">{inspection.job.clientEmail}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Phone</dt>
                  <dd className="font-medium">{inspection.job.clientPhone || "N/A"}</dd>
                </div>
              </dl>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin className="w-4 h-4" /> Property
              </h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-500">Address</dt>
                  <dd className="font-medium">{inspection.job.propertyAddress}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Home Age</dt>
                  <dd className="font-medium">{inspection.homeAge || "N/A"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Pipe Material</dt>
                  <dd className="font-medium">{inspection.pipeMaterial?.replace("_", " ") || "N/A"}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>

        {/* Report Data */}
        <div className="bg-white rounded-xl p-6 shadow-sm space-y-4">
        	<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        		<h3 className="font-semibold text-gray-900 flex items-center gap-2">
        			<FileText className="w-4 h-4" /> Report Data
        		</h3>
        		<button
        			type="button"
        			onClick={handleSaveReportData}
        			disabled={savingReportData}
        			className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
        		>
        			{savingReportData ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
        			Save Report Data
        		</button>
        	</div>
        	<div className="grid md:grid-cols-2 gap-4">
        		<label className="block text-sm">
        			<span className="text-gray-600">Confirmed Client Name</span>
        			<input type="text" value={reportData.confirmedClientName} onChange={(e) => handleReportDataChange("confirmedClientName", e.target.value)} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg" />
        		</label>
        		<label className="block text-sm">
        			<span className="text-gray-600">Confirmed Address</span>
        			<input type="text" value={reportData.confirmedAddress} onChange={(e) => handleReportDataChange("confirmedAddress", e.target.value)} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg" />
        		</label>
        		<label className="block text-sm">
        			<span className="text-gray-600">Home Age</span>
        			<input type="text" value={reportData.homeAge} onChange={(e) => handleReportDataChange("homeAge", e.target.value)} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg" />
        		</label>
        		<label className="block text-sm">
        			<span className="text-gray-600">Pipe Material</span>
        			<select value={reportData.pipeMaterial} onChange={(e) => handleReportDataChange("pipeMaterial", e.target.value)} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg bg-white">
        				<option value="">Not set</option>
        				<option value="CAST_IRON">Cast Iron</option>
        				<option value="CLAY">Clay</option>
        				<option value="PVC">PVC</option>
        				<option value="ABS">ABS</option>
        				<option value="ORANGEBURG">Orangeburg</option>
        				<option value="CONCRETE">Concrete</option>
        				<option value="HDPE">HDPE</option>
        				<option value="UNKNOWN">Unknown</option>
        			</select>
        		</label>
        		<label className="block text-sm">
        			<span className="text-gray-600">Overall Condition</span>
        			<select value={reportData.overallCondition} onChange={(e) => handleReportDataChange("overallCondition", e.target.value)} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg bg-white">
        				<option value="">Not set</option>
        				<option value="GOOD">Good</option>
        				<option value="FAIR">Fair</option>
        				<option value="NEEDS_ATTENTION">Needs Attention</option>
        				<option value="CRITICAL">Critical</option>
        			</select>
        		</label>
        		<label className="block text-sm">
        			<span className="text-gray-600">Pipe Rating</span>
        			<input type="number" min="1" max="5" value={reportData.pipeConditionRating} onChange={(e) => handleReportDataChange("pipeConditionRating", e.target.value)} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg" />
        		</label>
        		<label className="block text-sm">
        			<span className="text-gray-600">Connection to Main</span>
        			<input type="text" value={reportData.connectionToMain} onChange={(e) => handleReportDataChange("connectionToMain", e.target.value)} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg" />
        		</label>
        		<label className="block text-sm">
        			<span className="text-gray-600">Urgency Level</span>
        			<select value={reportData.urgencyLevel} onChange={(e) => handleReportDataChange("urgencyLevel", e.target.value)} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg bg-white">
        				<option value="">Not set</option>
        				<option value="NONE">None</option>
        				<option value="MONITOR">Monitor</option>
        				<option value="SOON">Soon</option>
        				<option value="IMMEDIATE">Immediate</option>
        			</select>
        		</label>
        	</div>
        	<label className="block text-sm">
        		<span className="text-gray-600">Known Issues</span>
        		<textarea rows={2} value={reportData.knownIssues} onChange={(e) => handleReportDataChange("knownIssues", e.target.value)} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg" />
        	</label>
        	<label className="block text-sm">
        		<span className="text-gray-600">Backup History</span>
        		<textarea rows={2} value={reportData.backupHistory} onChange={(e) => handleReportDataChange("backupHistory", e.target.value)} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg" />
        	</label>
        	<label className="block text-sm">
        		<span className="text-gray-600">Recent Work</span>
        		<textarea rows={2} value={reportData.recentWork} onChange={(e) => handleReportDataChange("recentWork", e.target.value)} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg" />
        	</label>
        	<label className="block text-sm">
        		<span className="text-gray-600">Special Instructions</span>
        		<textarea rows={2} value={reportData.specialInstructions} onChange={(e) => handleReportDataChange("specialInstructions", e.target.value)} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg" />
        	</label>
        	<label className="block text-sm">
        		<span className="text-gray-600">Report Notes</span>
        		<textarea rows={4} value={reportData.recommendations} onChange={(e) => handleReportDataChange("recommendations", e.target.value)} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg" />
        	</label>
        </div>

        {/* Attachments */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">Attachments</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className={`p-4 rounded-lg border ${
              inspection.videoAttachment?.uploadStatus === "COMPLETED"
                ? "border-green-200 bg-green-50"
                : "border-gray-200"
            }`}>
              <div className="flex items-center gap-3">
                <Video className={`w-6 h-6 ${
                  inspection.videoAttachment?.uploadStatus === "COMPLETED"
                    ? "text-green-600"
                    : "text-gray-400"
                }`} />
                <div>
                  <p className="font-medium">Inspection Video</p>
                  <p className="text-sm text-gray-500">
                    {inspection.videoAttachment?.fileName || "Not attached"}
                    {inspection.videoAttachment?.duration && (
                      <span className="ml-2">
                        ({Math.floor(inspection.videoAttachment.duration / 60)}:{String(inspection.videoAttachment.duration % 60).padStart(2, "0")})
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>
            <div className={`p-4 rounded-lg border ${
              inspection.clientSignature
                ? "border-green-200 bg-green-50"
                : "border-gray-200"
            }`}>
              <div className="flex items-center gap-3">
                <CheckCircle className={`w-6 h-6 ${
                  inspection.clientSignature
                    ? "text-green-600"
                    : "text-gray-400"
                }`} />
                <div>
                  <p className="font-medium">Client Signature</p>
                  <p className="text-sm text-gray-500">
                    {inspection.clientSignature
                      ? `Signed by ${inspection.clientSignature.signerName}`
                      : "Not signed"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Video Player & Chapter Management */}
        {inspection.videoAttachment?.uploadStatus === "COMPLETED" && (
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Video className="w-4 h-4" /> Video Review & Chapters
            </h3>
            
            {/* Video Player */}
            <div className="mb-6">
              {loadingVideo ? (
                <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                </div>
              ) : videoUrl ? (
                <video
                  ref={videoRef}
                  src={videoUrl}
                  controls
                  className="w-full rounded-lg bg-black"
                  onTimeUpdate={(e) => setVideoCurrentTime((e.target as HTMLVideoElement).currentTime)}
                >
                  Your browser does not support the video tag.
                </video>
              ) : (
                <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                  <button
                    onClick={loadVideoUrl}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Load Video
                  </button>
                </div>
              )}
            </div>

            {/* Chapter Management */}
            <VideoChapters
              inspectionId={inspectionId}
              videoDuration={inspection.videoAttachment.duration || 0}
              currentTime={videoCurrentTime}
              onChapterClick={handleChapterClick}
            />
          </div>
        )}

        {/* Technician Info */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4" /> Inspection Details
          </h3>
          <dl className="grid md:grid-cols-3 gap-4 text-sm">
            <div>
              <dt className="text-gray-500">Technician</dt>
              <dd className="font-medium">{inspection.technician?.name || "N/A"}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Duration</dt>
              <dd className="font-medium">{inspection.inspectionDuration} minutes</dd>
            </div>
            <div>
              <dt className="text-gray-500">Completed</dt>
              <dd className="font-medium">
                {inspection.completedAt
                  ? format(new Date(inspection.completedAt), "MMM d, yyyy h:mm a")
                  : "N/A"}
              </dd>
            </div>
          </dl>
        </div>

        {/* Review Notes */}
        {isActionable && (
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4">Review Notes</h3>
            <textarea
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              placeholder="Optional notes about this review..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        )}

        {/* Action Buttons */}
        {isActionable && (
          <div className="flex gap-4">
            <button
              onClick={() => setShowRejectModal(true)}
              className="flex-1 bg-white border border-red-300 text-red-600 py-3 rounded-xl font-semibold hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
            >
              <XCircle className="w-5 h-5" /> Return for Corrections
            </button>
            <button
              onClick={handleApprove}
              disabled={approving}
              className="flex-1 bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {approving ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Send className="w-5 h-5" /> Approve & Send to Client
                </>
              )}
            </button>
          </div>
        )}
      </main>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-lg mb-2">Return for Corrections</h3>
            <p className="text-gray-600 text-sm mb-4">
              Select which section needs to be redone. Only that section will be unlocked for the technician.
            </p>
            
            {/* Stage Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Section to Reopen <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2">
                {REJECTABLE_STAGES.map((stage) => (
                  <label
                    key={stage.value}
                    className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedRejectStage === stage.value
                        ? "border-red-500 bg-red-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="rejectStage"
                      value={stage.value}
                      checked={selectedRejectStage === stage.value}
                      onChange={(e) => setSelectedRejectStage(e.target.value)}
                      className="mt-1 text-red-600 focus:ring-red-500"
                    />
                    <div>
                      <p className="font-medium text-gray-900">{stage.label}</p>
                      <p className="text-sm text-gray-500">{stage.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Reason */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Return <span className="text-red-500">*</span>
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Explain what needs to be corrected..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>

            {error && (
              <p className="text-red-600 text-sm mb-4 bg-red-50 p-2 rounded">{error}</p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setSelectedRejectStage("");
                  setRejectReason("");
                  setError("");
                }}
                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={rejecting || !selectedRejectStage || !rejectReason}
                className="flex-1 bg-red-600 text-white py-2 rounded-lg font-medium disabled:opacity-50 hover:bg-red-700"
              >
                {rejecting ? "Sending..." : "Return to Technician"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
