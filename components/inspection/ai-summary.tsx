"use client";

import { useState } from "react";
import { Sparkles, Loader2, Copy, Check, RefreshCw } from "lucide-react";

interface AISummaryProps {
  inspectionId: string;
  type: "findings" | "recommendations" | "full";
  onUseSummary?: (summary: string) => void;
  buttonLabel?: string;
}

export function AISummary({
  inspectionId,
  type,
  onUseSummary,
  buttonLabel = "Generate AI Summary",
}: AISummaryProps) {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const generateSummary = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/technician/inspections/${inspectionId}/generate-summary`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type }),
        }
      );

      const data = await res.json();

      if (data.success) {
        setSummary(data.summary);
      } else {
        setError(data.error || "Failed to generate summary");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!summary) return;
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for browsers without clipboard API
      const textArea = document.createElement("textarea");
      textArea.value = summary;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleUseSummary = () => {
    if (summary && onUseSummary) {
      onUseSummary(summary);
    }
  };

  if (!summary) {
    return (
      <div className="space-y-2">
        <button
          type="button"
          onClick={generateSummary}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:from-purple-600 hover:to-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              {buttonLabel}
            </>
          )}
        </button>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-purple-600">
          <Sparkles className="w-4 h-4" />
          <span className="text-sm font-medium">AI-Generated Summary</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={copyToClipboard}
            className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
            title="Copy to clipboard"
          >
            {copied ? (
              <Check className="w-4 h-4 text-green-500" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
          <button
            type="button"
            onClick={generateSummary}
            disabled={loading}
            className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
            title="Regenerate"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      <div className="bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-100 rounded-lg p-4">
        <div className="prose prose-sm max-w-none">
          {summary.split("\n").map((line, i) => (
            <p key={i} className="mb-2 last:mb-0 text-gray-700">
              {line}
            </p>
          ))}
        </div>
      </div>

      {onUseSummary && (
        <button
          type="button"
          onClick={handleUseSummary}
          className="w-full py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
        >
          Use This Summary
        </button>
      )}
    </div>
  );
}
