"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Film,
  Play,
  Loader2,
  Download,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Clock,
  Scissors,
  Sparkles,
} from "lucide-react";

interface HighlightReelProps {
  inspectionId: string;
  chaptersCount: number;
}

type GenerationStatus = "idle" | "generating" | "success" | "failed";

export function HighlightReel({ inspectionId, chaptersCount }: HighlightReelProps) {
  const [status, setStatus] = useState<GenerationStatus>("idle");
  const [highlightUrl, setHighlightUrl] = useState<string | null>(null);
  const [highlightDuration, setHighlightDuration] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [clipDuration, setClipDuration] = useState(10);
  const [loading, setLoading] = useState(true);

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const requestIdRef = useRef<string | null>(null);
  const estimatedDurationRef = useRef<number>(0);

  // Check for existing highlight reel
  const checkExisting = useCallback(async () => {
    try {
      const response = await fetch(`/api/technician/inspections/${inspectionId}/highlight-reel`);
      const result = await response.json();

      if (result.success && result.hasHighlightReel) {
        setHighlightUrl(result.highlightReelUrl);
        setHighlightDuration(result.highlightDuration);
        setStatus("success");
      }
    } catch {
      console.error("Failed to check existing highlight reel");
    } finally {
      setLoading(false);
    }
  }, [inspectionId]);

  useEffect(() => {
    checkExisting();
  }, [checkExisting]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  // Poll for generation status
  const pollStatus = useCallback(async () => {
    if (!requestIdRef.current) return;

    try {
      const response = await fetch(`/api/technician/inspections/${inspectionId}/highlight-reel`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: requestIdRef.current,
          estimatedDuration: estimatedDurationRef.current,
        }),
      });

      const result = await response.json();

      if (result.status === "SUCCESS") {
        setStatus("success");
        setHighlightUrl(result.highlightReelUrl);
        setProgress(100);
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
      } else if (result.status === "FAILED") {
        setStatus("failed");
        setError(result.error || "Generation failed");
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
      } else {
        // Still processing - update progress
        setProgress(prev => Math.min(prev + 5, 90));
      }
    } catch {
      console.error("Failed to poll status");
    }
  }, [inspectionId]);

  // Start generation
  const generateHighlightReel = async () => {
    if (chaptersCount === 0) {
      setError("No chapters marked for highlight reel. Add chapter markers first.");
      return;
    }

    setStatus("generating");
    setError(null);
    setProgress(0);

    try {
      const response = await fetch(`/api/technician/inspections/${inspectionId}/highlight-reel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clipDuration }),
      });

      const result = await response.json();

      if (!result.success) {
        setStatus("failed");
        setError(result.error || "Failed to start generation");
        return;
      }

      requestIdRef.current = result.requestId;
      estimatedDurationRef.current = result.estimatedDuration;
      setProgress(10);

      // Start polling for status
      pollIntervalRef.current = setInterval(pollStatus, 3000);
    } catch {
      setStatus("failed");
      setError("Failed to start highlight reel generation");
    }
  };

  // Regenerate
  const regenerate = () => {
    setHighlightUrl(null);
    setStatus("idle");
    setError(null);
    setProgress(0);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-600 to-rose-600 px-4 py-3">
        <div className="flex items-center gap-2 text-white">
          <Sparkles className="w-5 h-5" />
          <h3 className="font-semibold">Highlight Reel</h3>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Success state */}
        {status === "success" && highlightUrl && (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">Highlight reel ready!</span>
                {highlightDuration && (
                  <span className="text-sm text-green-600">
                    ({formatDuration(highlightDuration)})
                  </span>
                )}
              </div>
            </div>

            {/* Video preview */}
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
              <video
                src={highlightUrl}
                controls
                className="w-full h-full"
                poster={undefined}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <a
                href={highlightUrl}
                download={`highlight_reel_${inspectionId}.mp4`}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                <Download className="w-5 h-5" />
                Download
              </a>
              <button
                onClick={regenerate}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
              >
                <RefreshCw className="w-5 h-5" />
                Regenerate
              </button>
            </div>
          </div>
        )}

        {/* Generating state */}
        {status === "generating" && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                <div>
                  <p className="font-medium text-blue-800">Generating highlight reel...</p>
                  <p className="text-sm text-blue-600">This may take a few minutes</p>
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Processing</span>
                <span className="text-gray-600">{progress}%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-pink-500 to-rose-500 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 text-gray-500 text-sm">
              <Scissors className="w-4 h-4" />
              <span>Extracting and combining clips...</span>
            </div>
          </div>
        )}

        {/* Error state */}
        {status === "failed" && error && (
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-start gap-2 text-red-700">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Generation failed</p>
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              </div>
            </div>
            <button
              onClick={regenerate}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
            >
              <RefreshCw className="w-5 h-5" />
              Try Again
            </button>
          </div>
        )}

        {/* Idle state */}
        {status === "idle" && (
          <div className="space-y-4">
            {chaptersCount === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <Film className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p>No chapters marked for highlight reel</p>
                <p className="text-sm">Add chapter markers to create a highlight reel</p>
              </div>
            ) : (
              <>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-3">
                    Generate a highlight reel from your {chaptersCount} marked chapter
                    {chaptersCount !== 1 ? "s" : ""}. Each chapter will become a clip in the
                    final video.
                  </p>

                  {/* Clip duration setting */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Clip Duration
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min={5}
                        max={30}
                        value={clipDuration}
                        onChange={e => setClipDuration(Number(e.target.value))}
                        className="flex-1"
                      />
                      <span className="text-sm font-medium text-gray-700 w-12">
                        {clipDuration}s
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Each clip will be up to {clipDuration} seconds from the marked timestamp
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>
                    Estimated length: ~{formatDuration(chaptersCount * clipDuration)}
                  </span>
                </div>

                <button
                  onClick={generateHighlightReel}
                  className="w-full flex items-center justify-center gap-2 px-4 py-4 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-lg font-medium hover:from-pink-700 hover:to-rose-700 transition-colors"
                >
                  <Play className="w-5 h-5" />
                  Generate Highlight Reel
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
