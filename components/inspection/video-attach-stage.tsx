"use client";

import { useState, useRef } from "react";
import { Loader2, AlertCircle, Upload, Video, CheckCircle, PenTool, X, RefreshCw } from "lucide-react";
import type { Inspection } from "@/app/technician/inspection/[inspectionId]/page";
import { VideoChapters } from "./video-chapters";
import { HighlightReel } from "./highlight-reel";

interface Props {
  inspection: Inspection;
  onRefresh: () => Promise<void>;
  onComplete: () => Promise<{ success: boolean; error?: string }>;
}

const CHUNK_SIZE = 10 * 1024 * 1024; // 10MB chunks

export function VideoAttachStage({ inspection, onRefresh, onComplete }: Props) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [chaptersCount, setChaptersCount] = useState(0);
  const [showReplaceUpload, setShowReplaceUpload] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasVideo = inspection.videoAttachment?.uploadStatus === "COMPLETED";
  const isRejected = inspection.status === "REJECTED" && inspection.rejectedStage === "VIDEO_ATTACH";

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("video/")) {
        setError("Please select a video file");
        return;
      }
      // Validate file size (max 2GB)
      if (file.size > 2 * 1024 * 1024 * 1024) {
        setError("Video file must be under 2GB");
        return;
      }
      setSelectedFile(file);
      setError("");
    }
  };

  const uploadVideo = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setUploadProgress(0);
    setError("");

    try {
      // Determine upload method based on file size
      const useMultipart = selectedFile.size > 100 * 1024 * 1024; // >100MB

      if (useMultipart) {
        await uploadMultipart();
      } else {
        await uploadSinglePart();
      }

      await onRefresh();
      setSelectedFile(null);
      setShowReplaceUpload(false);
    } catch (err) {
      console.error("Upload error:", err);
      setError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const uploadSinglePart = async () => {
    if (!selectedFile) return;

    // Get presigned URL
    const presignedRes = await fetch("/api/upload/presigned", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileName: selectedFile.name,
        contentType: selectedFile.type,
        isPublic: false,
      }),
    });

    const { uploadUrl, cloud_storage_path } = await presignedRes.json();

    // Create video attachment record
    await fetch(`/api/technician/inspections/${inspection.id}/video`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cloudPath: cloud_storage_path,
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        mimeType: selectedFile.type,
        uploadStatus: "UPLOADING",
      }),
    });

    // Upload to S3
    const uploadRes = await fetch(uploadUrl, {
      method: "PUT",
      body: selectedFile,
      headers: {
        "Content-Type": selectedFile.type,
      },
    });

    if (!uploadRes.ok) {
      throw new Error("Upload failed");
    }

    // Update status to completed
    await fetch(`/api/technician/inspections/${inspection.id}/video`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        uploadStatus: "COMPLETED",
        uploadProgress: 100,
      }),
    });

    setUploadProgress(100);
  };

  const uploadMultipart = async () => {
    if (!selectedFile) return;

    // Initiate multipart upload
    const initiateRes = await fetch("/api/upload/multipart/initiate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileName: selectedFile.name,
        contentType: selectedFile.type,
        isPublic: false,
      }),
    });

    const { uploadId, cloud_storage_path } = await initiateRes.json();

    // Create video attachment record
    await fetch(`/api/technician/inspections/${inspection.id}/video`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cloudPath: cloud_storage_path,
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        mimeType: selectedFile.type,
        uploadId,
        uploadStatus: "UPLOADING",
      }),
    });

    // Upload parts
    const totalParts = Math.ceil(selectedFile.size / CHUNK_SIZE);
    const parts: Array<{ ETag: string; PartNumber: number }> = [];

    for (let partNumber = 1; partNumber <= totalParts; partNumber++) {
      const start = (partNumber - 1) * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, selectedFile.size);
      const chunk = selectedFile.slice(start, end);

      // Get presigned URL for this part
      const partRes = await fetch("/api/upload/multipart/part", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cloud_storage_path,
          uploadId,
          partNumber,
        }),
      });

      const { uploadUrl } = await partRes.json();

      // Upload part
      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        body: chunk,
      });

      if (!uploadRes.ok) {
        throw new Error(`Part ${partNumber} upload failed`);
      }

      const etag = uploadRes.headers.get("ETag");
      if (etag) {
        parts.push({ ETag: etag.replace(/"/g, ""), PartNumber: partNumber });
      }

      const progress = Math.round((partNumber / totalParts) * 100);
      setUploadProgress(progress);

      // Update progress in DB
      await fetch(`/api/technician/inspections/${inspection.id}/video`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uploadProgress: progress }),
      });
    }

    // Complete multipart upload
    await fetch("/api/upload/multipart/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cloud_storage_path,
        uploadId,
        parts,
        isPublic: false,
      }),
    });

    // Update status to completed
    await fetch(`/api/technician/inspections/${inspection.id}/video`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        uploadStatus: "COMPLETED",
        uploadProgress: 100,
      }),
    });
  };

  const handleComplete = async () => {
    if (!hasVideo) {
      setError("Please upload the inspection video first");
      return;
    }

    setCompleting(true);
    setError("");

    const result = await onComplete();
    if (!result.success) {
      setError(result.error || "Failed to proceed");
    }
    setCompleting(false);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="p-4 space-y-4">
      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* Rejection notice for video */}
      {isRejected && hasVideo && (
        <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-900">Video Needs Replacement</p>
              <p className="text-sm text-amber-700 mt-1">
                The admin has requested changes to this video. You can replace it with a new upload below, or edit the chapters if that was the issue.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Video Status */}
      {hasVideo && !showReplaceUpload ? (
        <div className="space-y-4">
          <div className={`rounded-xl p-4 border ${isRejected ? "bg-amber-50 border-amber-200" : "bg-green-50 border-green-200"}`}>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${isRejected ? "bg-amber-100" : "bg-green-100"}`}>
                {isRejected ? (
                  <RefreshCw className="w-6 h-6 text-amber-600" />
                ) : (
                  <CheckCircle className="w-6 h-6 text-green-600" />
                )}
              </div>
              <div className="flex-1">
                <p className={`font-semibold ${isRejected ? "text-amber-900" : "text-green-900"}`}>
                  {isRejected ? "Current Video (Rejected)" : "Video Uploaded"}
                </p>
                <p className={`text-sm ${isRejected ? "text-amber-700" : "text-green-700"}`}>
                  {inspection.videoAttachment?.fileName}
                  {inspection.videoAttachment?.fileSize && (
                    <> ({formatFileSize(inspection.videoAttachment.fileSize)})</>  
                  )}
                </p>
              </div>
            </div>

            {/* Replace Video Button - always available, prominently shown when rejected */}
            <button
              onClick={() => {
                setShowReplaceUpload(true);
                setSelectedFile(null);
              }}
              className={`mt-3 w-full py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                isRejected 
                  ? "bg-amber-600 text-white hover:bg-amber-700"
                  : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
              }`}
            >
              <RefreshCw className="w-4 h-4" />
              {isRejected ? "Upload Replacement Video" : "Replace Video"}
            </button>
          </div>

          {/* Video Chapters */}
          <VideoChapters
            inspectionId={inspection.id}
            videoDuration={inspection.videoAttachment?.duration || 0}
            onChaptersChange={(chapters) => setChaptersCount(chapters.filter(c => c.includeInHighlight).length)}
          />

          {/* Highlight Reel */}
          <HighlightReel
            inspectionId={inspection.id}
            chaptersCount={chaptersCount}
          />
        </div>
      ) : (
        <>
          {/* Upload Area */}
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Video className="w-5 h-5 text-gray-500" />
                {showReplaceUpload ? "Upload Replacement Video" : "Attach Inspection Video"}
              </h3>
              {showReplaceUpload && (
                <button
                  onClick={() => {
                    setShowReplaceUpload(false);
                    setSelectedFile(null);
                  }}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Cancel
                </button>
              )}
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="video/*"
              className="hidden"
            />

            {!selectedFile ? (
              <button
                onClick={() => fileInputRef.current?.click()}
                className={`w-full border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                  isRejected 
                    ? "border-amber-300 hover:border-amber-400 hover:bg-amber-50" 
                    : "border-gray-300 hover:border-blue-400 hover:bg-blue-50"
                }`}
              >
                <Upload className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                <p className="font-medium text-gray-700">
                  {showReplaceUpload ? "Tap to select replacement video" : "Tap to select video"}
                </p>
                <p className="text-sm text-gray-500 mt-1">MP4, MOV, AVI (max 2GB)</p>
              </button>
            ) : (
              <div className="border border-gray-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Video className="w-8 h-8 text-blue-600" />
                    <div>
                      <p className="font-medium text-gray-900 truncate max-w-[200px]">
                        {selectedFile.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatFileSize(selectedFile.size)}
                      </p>
                    </div>
                  </div>
                  {!uploading && (
                    <button
                      onClick={() => setSelectedFile(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>

                {uploading ? (
                  <div>
                    <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-blue-600 h-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <p className="text-sm text-gray-500 mt-2 text-center">
                      Uploading... {uploadProgress}%
                    </p>
                  </div>
                ) : (
                  <button
                    onClick={uploadVideo}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Upload className="w-5 h-5" />
                    {showReplaceUpload ? "Upload Replacement" : "Upload Video"}
                  </button>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
              <h3 className="font-semibold text-blue-900 mb-2">Video Requirements</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Upload the complete inspection video or the best complete segment available</li>
                <li>• Stops, interruptions, replacement footage, and return voiceovers are allowed</li>
                <li>• Use chapters and voice notes to explain any gaps, limits, or returned sections</li>
                <li>• Video will be reviewed before delivery to client</li>
              </ul>
            </div>

      {/* Continue Button */}
      <button
        onClick={handleComplete}
        disabled={completing || !hasVideo}
        className={`w-full py-4 rounded-xl font-semibold text-lg transition-colors flex items-center justify-center gap-2 ${
          hasVideo
            ? "bg-blue-600 text-white hover:bg-blue-700"
            : "bg-gray-200 text-gray-500 cursor-not-allowed"
        }`}
      >
        {completing ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Proceeding...
          </>
        ) : (
          <>
            <PenTool className="w-5 h-5" />
            Get Client Signature
          </>
        )}
      </button>
    </div>
  );
}
