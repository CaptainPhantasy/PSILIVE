"use client";

import { useState, useRef, useEffect } from "react";
import { useSearchParams, useParams } from "next/navigation";
import Image from "next/image";
import {
  Loader2,
  Download,
  Video,
  FileText,
  Clock,
  AlertCircle,
  CheckCircle,
  Mail,
  Lock,
  Play,
  ChevronRight,
  AlertTriangle,
  Info,
  Phone,
  Film,
  Star,
} from "lucide-react";
import { format } from "date-fns";

interface Chapter {
  id: string;
  timestamp: number;
  endTimestamp: number | null;
  title: string;
  description: string | null;
  chapterType: string;
  severity: string | null;
}

interface InspectionInfo {
  id: string;
  inspectionNumber: string;
  propertyAddress: string;
  inspectionDate: string;
  clientName: string;
  // Findings
  overallCondition: string | null;
  pipeConditionRating: number | null;
  recommendations: string | null;
  urgencyLevel: string | null;
  rootIntrusion: unknown;
  cracks: unknown;
  bellies: unknown;
  offsetJoints: unknown;
  blockages: unknown;
  connectionToMain: string | null;
  // Video
  hasVideo: boolean;
  videoDuration: number | null;
  hasHighlightReel: boolean;
  highlightDuration: number | null;
  chapters: Chapter[];
  hasReport: boolean;
}

interface DownloadInfo {
  remaining: number;
  total: number;
}

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

const getConditionColor = (condition: string | null) => {
  if (!condition) return "text-gray-600";
  switch (condition.toUpperCase()) {
    case "EXCELLENT":
    case "GOOD":
      return "text-green-600";
    case "FAIR":
      return "text-yellow-600";
    case "POOR":
      return "text-orange-600";
    case "CRITICAL":
      return "text-red-600";
    default:
      return "text-gray-600";
  }
};

const getChapterIcon = (type: string) => {
  switch (type) {
    case "INTRO":
    case "CONCLUSION":
      return <Film className="w-4 h-4" />;
    case "DEFECT":
    case "REPAIR_NEEDED":
      return <AlertTriangle className="w-4 h-4" />;
    default:
      return <Info className="w-4 h-4" />;
  }
};

const getChapterColor = (type: string) => {
  switch (type) {
    case "INTRO":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "FINDING":
      return "bg-purple-100 text-purple-700 border-purple-200";
    case "DEFECT":
      return "bg-red-100 text-red-700 border-red-200";
    case "REPAIR_NEEDED":
      return "bg-orange-100 text-orange-700 border-orange-200";
    case "OBSERVATION":
      return "bg-gray-100 text-gray-700 border-gray-200";
    case "CONCLUSION":
      return "bg-green-100 text-green-700 border-green-200";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
};

export default function DownloadPage() {
  const params = useParams();
  const inspectionId = params.inspectionId as string;
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [email, setEmail] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [inspection, setInspection] = useState<InspectionInfo | null>(null);
  const [downloads, setDownloads] = useState<DownloadInfo | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [hoursRemaining, setHoursRemaining] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [downloadingVideo, setDownloadingVideo] = useState(false);
  const [downloadingReport, setDownloadingReport] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loadingVideo, setLoadingVideo] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifying(true);
    setError("");

    try {
      const res = await fetch(`/api/download/${inspectionId}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token }),
      });

      const data = await res.json();

      if (data.success) {
        setVerified(true);
        setInspection(data.inspection);
        setDownloads(data.downloads);
        setExpiresAt(data.expiresAt);
        setHoursRemaining(data.hoursRemaining);
      } else {
        setError(data.error || "Verification failed");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setVerifying(false);
    }
  };

  // Load video for streaming (doesn't count toward download limit)
  const loadVideoForStreaming = async () => {
    setLoadingVideo(true);
    try {
      const res = await fetch(`/api/download/${inspectionId}/file`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, fileType: "video", streamOnly: true }),
      });
      const data = await res.json();
      if (data.success) {
        setVideoUrl(data.downloadUrl);
      } else {
        setError(data.error || "Failed to load video");
      }
    } catch {
      setError("Failed to load video");
    } finally {
      setLoadingVideo(false);
    }
  };

  // Load video when verified
  useEffect(() => {
    if (verified && inspection?.hasVideo && !videoUrl) {
      loadVideoForStreaming();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verified, inspection]);

  const handleChapterClick = (timestamp: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = timestamp;
      videoRef.current.play();
    }
  };

  const handleDownload = async (fileType: "video" | "report") => {
    if (fileType === "video") {
      setDownloadingVideo(true);
    } else {
      setDownloadingReport(true);
    }

    try {
      const res = await fetch(`/api/download/${inspectionId}/file`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, fileType, streamOnly: false }),
      });

      const data = await res.json();

      if (data.success) {
        const link = document.createElement("a");
        link.href = data.downloadUrl;
        link.download = data.fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        if (downloads) {
          setDownloads({
            ...downloads,
            remaining: downloads.remaining - 1,
          });
        }
      } else {
        setError(data.error || "Download failed");
      }
    } catch {
      setError("Download failed. Please try again.");
    } finally {
      setDownloadingVideo(false);
      setDownloadingReport(false);
    }
  };

  // Build findings list from inspection data
  const buildFindingsList = () => {
    const findings: { label: string; value: string; severity?: string }[] = [];
    
    if (inspection?.rootIntrusion) {
      const root = inspection.rootIntrusion as { detected?: boolean; severity?: string; notes?: string };
      if (root.detected) {
        findings.push({
          label: "Root Intrusion",
          value: root.notes || `${root.severity || "Detected"}`,
          severity: root.severity,
        });
      }
    }
    if (inspection?.cracks) {
      const cracks = inspection.cracks as { detected?: boolean; severity?: string; notes?: string };
      if (cracks.detected) {
        findings.push({
          label: "Cracks",
          value: cracks.notes || `${cracks.severity || "Detected"}`,
          severity: cracks.severity,
        });
      }
    }
    if (inspection?.bellies) {
      const bellies = inspection.bellies as { detected?: boolean; severity?: string; notes?: string };
      if (bellies.detected) {
        findings.push({
          label: "Bellies/Sags",
          value: bellies.notes || `${bellies.severity || "Detected"}`,
          severity: bellies.severity,
        });
      }
    }
    if (inspection?.offsetJoints) {
      const joints = inspection.offsetJoints as { detected?: boolean; severity?: string; notes?: string };
      if (joints.detected) {
        findings.push({
          label: "Offset Joints",
          value: joints.notes || `${joints.severity || "Detected"}`,
          severity: joints.severity,
        });
      }
    }
    if (inspection?.blockages) {
      const blockages = inspection.blockages as { detected?: boolean; severity?: string; notes?: string };
      if (blockages.detected) {
        findings.push({
          label: "Blockages",
          value: blockages.notes || `${blockages.severity || "Detected"}`,
          severity: blockages.severity,
        });
      }
    }
    if (inspection?.connectionToMain) {
      findings.push({
        label: "Main Connection",
        value: inspection.connectionToMain,
      });
    }
    
    return findings;
  };

  // Verification Screen with Terms
  if (!verified) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-900 to-blue-700 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="relative w-20 h-20 mx-auto mb-4 bg-white rounded-full p-2">
              <Image
                src="/logo.png"
                alt="Precision Sewer Inspection"
                fill
                className="object-contain p-2"
              />
            </div>
            <h1 className="text-2xl font-bold text-white">🔒 Verify Your Access</h1>
            <p className="text-blue-200 mt-1">Your sewer inspection video is ready to view</p>
          </div>

          {/* Verification Form */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            {error && (
              <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm mb-4 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            <form onSubmit={handleVerify} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  <Mail className="w-4 h-4 inline mr-1" />
                  Email Address
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  Enter the email address where you received this link
                </p>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                  placeholder="your@email.com"
                />
              </div>

              {/* Terms Acceptance */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="mt-1 w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm text-gray-700">
                    I understand and agree that:
                    <ul className="mt-2 space-y-1 text-xs text-gray-600">
                      <li>• If I cannot view or download my video, I must notify Precision Sewer Inspection within <strong>48 hours</strong></li>
                      <li>• All videos will be removed from the server after <strong>7 days</strong></li>
                      <li>• After 7 days, Precision Sewer Inspection is no longer responsible for video access</li>
                    </ul>
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={verifying || !acceptedTerms}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold text-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {verifying ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Lock className="w-5 h-5" />
                    Verify & Continue
                  </>
                )}
              </button>
            </form>

            <p className="text-xs text-gray-500 text-center mt-4">
              This link expires in 5 days • 3 downloads remaining
            </p>
          </div>

          {/* Footer */}
          <div className="text-center mt-6 text-blue-200 text-sm">
            <p>Precision Sewer Inspection</p>
            <p>Indianapolis, IN</p>
          </div>
        </div>
      </div>
    );
  }

  const findings = buildFindingsList();

  // Main Portal View
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-blue-600 text-white px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4">
            <div className="relative w-14 h-14 bg-white rounded-full p-2 flex-shrink-0">
              <Image
                src="/logo.png"
                alt="PSI"
                fill
                className="object-contain p-1"
              />
            </div>
            <div>
              <h1 className="text-xl font-bold">🏠 {inspection?.propertyAddress}</h1>
              <p className="text-blue-200">
                Completed {inspection?.inspectionDate 
                  ? format(new Date(inspection.inspectionDate), "MMMM d, yyyy") 
                  : ""}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 space-y-6 pb-8">
        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        {/* Expiration Warning */}
        {hoursRemaining !== null && hoursRemaining <= 48 && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
            <div className="flex items-center gap-2 text-orange-700">
              <Clock className="w-5 h-5" />
              <span className="font-semibold">
                {hoursRemaining > 0 ? `${hoursRemaining} hours remaining` : "Expires soon!"}
              </span>
            </div>
            <p className="text-sm text-orange-600 mt-1">
              Download your files before the link expires. Videos are removed after 7 days.
            </p>
          </div>
        )}

        {/* Video Player */}
        {inspection?.hasVideo && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="bg-black">
              {loadingVideo ? (
                <div className="aspect-video flex items-center justify-center">
                  <Loader2 className="w-12 h-12 animate-spin text-white" />
                </div>
              ) : videoUrl ? (
                <video
                  ref={videoRef}
                  src={videoUrl}
                  controls
                  className="w-full aspect-video"
                  poster="/images/video-poster.jpg"
                >
                  Your browser does not support the video tag.
                </video>
              ) : (
                <div className="aspect-video flex items-center justify-center">
                  <button
                    onClick={loadVideoForStreaming}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg flex items-center gap-2"
                  >
                    <Play className="w-6 h-6" /> Load Video
                  </button>
                </div>
              )}
            </div>
            
            {/* Video Duration */}
            {inspection.videoDuration && (
              <div className="px-4 py-2 bg-gray-100 text-sm text-gray-600">
                Full HD Video • {formatTime(inspection.videoDuration)}
              </div>
            )}
          </div>
        )}

        {/* Chapter Navigation */}
        {inspection?.chapters && inspection.chapters.length > 0 && (
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              📑 JUMP TO FINDINGS
            </h2>
            <div className="flex flex-wrap gap-2">
              {inspection.chapters.map((chapter) => (
                <button
                  key={chapter.id}
                  onClick={() => handleChapterClick(chapter.timestamp)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors hover:shadow-sm ${
                    getChapterColor(chapter.chapterType)
                  }`}
                >
                  {getChapterIcon(chapter.chapterType)}
                  <span>{chapter.title}</span>
                  <span className="text-xs opacity-70">{formatTime(chapter.timestamp)}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Inspection Summary */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            📋 INSPECTION SUMMARY
          </h2>
          
          {/* Overall Condition */}
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Overall Condition:</span>
              <span className={`text-xl font-bold flex items-center gap-2 ${getConditionColor(inspection?.overallCondition || null)}`}>
                {inspection?.overallCondition === "GOOD" || inspection?.overallCondition === "EXCELLENT" ? (
                  <CheckCircle className="w-6 h-6" />
                ) : inspection?.overallCondition === "POOR" || inspection?.overallCondition === "CRITICAL" ? (
                  <AlertTriangle className="w-6 h-6" />
                ) : null}
                {inspection?.overallCondition?.replace("_", " ") || "N/A"}
              </span>
            </div>
            {inspection?.pipeConditionRating && (
              <div className="flex items-center gap-1 mt-2 justify-end">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-5 h-5 ${star <= inspection.pipeConditionRating! ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
                  />
                ))}
                <span className="text-sm text-gray-500 ml-1">({inspection.pipeConditionRating}/5)</span>
              </div>
            )}
          </div>

          {/* Findings List */}
          {findings.length > 0 && (
            <div className="mb-4">
              <h3 className="font-medium text-gray-700 mb-2">Findings:</h3>
              <ul className="space-y-2">
                {findings.map((finding, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-gray-600">
                    <span className="text-blue-500 mt-1">•</span>
                    <span>
                      <strong>{finding.label}:</strong> {finding.value}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommendations */}
          {inspection?.recommendations && (
            <div className="border-t pt-4">
              <h3 className="font-medium text-gray-700 mb-2">Recommendation:</h3>
              <p className="text-gray-600">{inspection.recommendations}</p>
            </div>
          )}

          {/* Urgency */}
          {inspection?.urgencyLevel && (
            <div className={`mt-4 p-3 rounded-lg ${
              inspection.urgencyLevel === "IMMEDIATE" 
                ? "bg-red-50 text-red-700" 
                : inspection.urgencyLevel === "SOON"
                  ? "bg-orange-50 text-orange-700"
                  : "bg-green-50 text-green-700"
            }`}>
              <strong>Urgency:</strong> {inspection.urgencyLevel.replace("_", " ")}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Highlight Reel */}
          {inspection?.hasHighlightReel && (
            <button
              className="bg-purple-600 text-white p-4 rounded-xl font-semibold hover:bg-purple-700 transition-colors flex items-center justify-center gap-3"
              onClick={() => {
                // TODO: Play highlight reel
              }}
            >
              <Film className="w-6 h-6" />
              <span>Watch Highlight Reel</span>
              {inspection.highlightDuration && (
                <span className="text-purple-200">({formatTime(inspection.highlightDuration)})</span>
              )}
            </button>
          )}

          {/* Download PDF */}
          <button
            onClick={() => handleDownload("report")}
            disabled={downloadingReport || !inspection?.hasReport || (downloads?.remaining || 0) <= 0}
            className="bg-white border-2 border-blue-600 text-blue-600 p-4 rounded-xl font-semibold hover:bg-blue-50 transition-colors disabled:opacity-50 flex items-center justify-center gap-3"
          >
            {downloadingReport ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <>
                <FileText className="w-6 h-6" />
                <span>Download PDF Report</span>
                <Download className="w-5 h-5" />
              </>
            )}
          </button>
        </div>

        {/* Download Video Button */}
        <button
          onClick={() => handleDownload("video")}
          disabled={downloadingVideo || !inspection?.hasVideo || (downloads?.remaining || 0) <= 0}
          className="w-full bg-blue-600 text-white p-4 rounded-xl font-semibold text-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-3"
        >
          {downloadingVideo ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            <>
              <Video className="w-6 h-6" />
              <span>Download Full Video</span>
              <Download className="w-5 h-5" />
            </>
          )}
        </button>

        {/* Download Count */}
        {downloads && (
          <div className="text-center text-sm text-gray-500">
            <p>
              Downloads remaining: <strong>{downloads.remaining}</strong> of {downloads.total}
            </p>
          </div>
        )}

        {/* Important Notice */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <h3 className="font-semibold text-yellow-800 mb-2 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" /> Important Notice
          </h3>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• If you cannot view or download your video, notify us within <strong>48 hours</strong></li>
            <li>• All videos are removed from our servers after <strong>7 days</strong></li>
            <li>• After 7 days, we cannot provide access to your inspection video</li>
            <li>• Download your files promptly to keep them permanently</li>
          </ul>
        </div>

        {/* Help Section */}
        <div className="bg-gray-100 rounded-xl p-4">
          <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
            ❓ Questions?
          </h3>
          <p className="text-sm text-gray-600 mb-3">
            Contact Precision Sewer Inspection if you have any questions about your results.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href="tel:3176203858"
              className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg"
            >
              <Phone className="w-4 h-4" /> (317) 620-3858
            </a>
            <a
              href="mailto:support@precisionsewerinspections.com"
              className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg"
            >
              <Mail className="w-4 h-4" /> support@precisionsewerinspections.com
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-400 mt-8">
          <p>Precision Sewer Inspection</p>
          <p>Central Indiana&apos;s Trusted Experts</p>
          <p className="mt-2">© {new Date().getFullYear()} All rights reserved</p>
        </div>
      </main>
    </div>
  );
}
