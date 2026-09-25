"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Film,
  Plus,
  Trash2,
  Edit2,
  Clock,
  AlertTriangle,
  CheckCircle,
  Info,
  Loader2,
  Save,
  X,
  ChevronDown,
  ChevronUp,
  Bookmark,
  Flag,
} from "lucide-react";

interface VideoChapter {
  id: string;
  timestamp: number;
  endTimestamp?: number | null;
  title: string;
  description?: string | null;
  chapterType: ChapterType;
  severity?: FindingSeverity | null;
  includeInHighlight: boolean;
}

type ChapterType = "INTRO" | "FINDING" | "DEFECT" | "REPAIR_NEEDED" | "OBSERVATION" | "CONCLUSION";
type FindingSeverity = "INFO" | "MINOR" | "MODERATE" | "MAJOR" | "CRITICAL";

interface VideoChaptersProps {
  inspectionId: string;
  videoDuration?: number;
  currentTime?: number;
  onChapterClick?: (timestamp: number) => void;
  onChaptersChange?: (chapters: VideoChapter[]) => void;
}

const CHAPTER_TYPES: { value: ChapterType; label: string; icon: React.ReactNode; color: string }[] = [
  { value: "INTRO", label: "Introduction", icon: <Film className="w-4 h-4" />, color: "bg-blue-100 text-blue-700" },
  { value: "FINDING", label: "Finding", icon: <Bookmark className="w-4 h-4" />, color: "bg-purple-100 text-purple-700" },
  { value: "DEFECT", label: "Defect", icon: <AlertTriangle className="w-4 h-4" />, color: "bg-red-100 text-red-700" },
  { value: "REPAIR_NEEDED", label: "Repair Needed", icon: <Flag className="w-4 h-4" />, color: "bg-orange-100 text-orange-700" },
  { value: "OBSERVATION", label: "Observation", icon: <Info className="w-4 h-4" />, color: "bg-gray-100 text-gray-700" },
  { value: "CONCLUSION", label: "Conclusion", icon: <CheckCircle className="w-4 h-4" />, color: "bg-green-100 text-green-700" },
];

const SEVERITY_LEVELS: { value: FindingSeverity; label: string; color: string }[] = [
  { value: "INFO", label: "Info", color: "bg-blue-100 text-blue-700" },
  { value: "MINOR", label: "Minor", color: "bg-yellow-100 text-yellow-700" },
  { value: "MODERATE", label: "Moderate", color: "bg-orange-100 text-orange-700" },
  { value: "MAJOR", label: "Major", color: "bg-red-100 text-red-700" },
  { value: "CRITICAL", label: "Critical", color: "bg-red-200 text-red-800" },
];

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

const parseTime = (timeStr: string): number => {
  const parts = timeStr.split(":").map(Number);
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  return 0;
};

export function VideoChapters({
  inspectionId,
  videoDuration = 0,
  currentTime = 0,
  onChapterClick,
  onChaptersChange,
}: VideoChaptersProps) {
  const [chapters, setChapters] = useState<VideoChapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    timestamp: "0:00",
    endTimestamp: "",
    title: "",
    description: "",
    chapterType: "FINDING" as ChapterType,
    severity: null as FindingSeverity | null,
    includeInHighlight: true,
  });

  // Load chapters
  const loadChapters = useCallback(async () => {
    try {
      const response = await fetch(`/api/technician/inspections/${inspectionId}/chapters`);
      const result = await response.json();
      if (result.success) {
        setChapters(result.chapters);
        onChaptersChange?.(result.chapters);
      }
    } catch {
      console.error("Failed to load chapters");
    } finally {
      setLoading(false);
    }
  }, [inspectionId, onChaptersChange]);

  useEffect(() => {
    loadChapters();
  }, [loadChapters]);

  // Mark current time
  const markCurrentTime = () => {
    setFormData(prev => ({
      ...prev,
      timestamp: formatTime(currentTime),
    }));
    setShowAddForm(true);
  };

  // Save chapter
  const saveChapter = async () => {
    if (!formData.title.trim()) {
      setError("Title is required");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const payload = {
        timestamp: parseTime(formData.timestamp),
        endTimestamp: formData.endTimestamp ? parseTime(formData.endTimestamp) : null,
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        chapterType: formData.chapterType,
        severity: formData.severity,
        includeInHighlight: formData.includeInHighlight,
      };

      let response;
      if (editingId) {
        response = await fetch(`/api/technician/inspections/${inspectionId}/chapters`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chapterId: editingId, ...payload }),
        });
      } else {
        response = await fetch(`/api/technician/inspections/${inspectionId}/chapters`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      const result = await response.json();
      if (result.success) {
        await loadChapters();
        resetForm();
      } else {
        setError(result.error || "Failed to save chapter");
      }
    } catch {
      setError("Failed to save chapter");
    } finally {
      setSaving(false);
    }
  };

  // Delete chapter
  const deleteChapter = async (chapterId: string) => {
    if (!confirm("Delete this chapter marker?")) return;

    try {
      const response = await fetch(
        `/api/technician/inspections/${inspectionId}/chapters?chapterId=${chapterId}`,
        { method: "DELETE" }
      );
      const result = await response.json();
      if (result.success) {
        await loadChapters();
      }
    } catch {
      console.error("Failed to delete chapter");
    }
  };

  // Edit chapter
  const editChapter = (chapter: VideoChapter) => {
    setFormData({
      timestamp: formatTime(chapter.timestamp),
      endTimestamp: chapter.endTimestamp ? formatTime(chapter.endTimestamp) : "",
      title: chapter.title,
      description: chapter.description || "",
      chapterType: chapter.chapterType,
      severity: chapter.severity || null,
      includeInHighlight: chapter.includeInHighlight,
    });
    setEditingId(chapter.id);
    setShowAddForm(true);
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      timestamp: "0:00",
      endTimestamp: "",
      title: "",
      description: "",
      chapterType: "FINDING",
      severity: null,
      includeInHighlight: true,
    });
    setShowAddForm(false);
    setEditingId(null);
    setError(null);
  };

  const getChapterTypeConfig = (type: ChapterType) =>
    CHAPTER_TYPES.find(t => t.value === type) || CHAPTER_TYPES[1];

  const getSeverityConfig = (sev: FindingSeverity | null) =>
    sev ? SEVERITY_LEVELS.find(s => s.value === sev) : null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 px-4 py-3 flex items-center justify-between"
      >
        <div className="flex items-center gap-2 text-white">
          <Film className="w-5 h-5" />
          <h3 className="font-semibold">Video Chapters</h3>
          <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">
            {chapters.length} markers
          </span>
        </div>
        {expanded ? (
          <ChevronUp className="w-5 h-5 text-white" />
        ) : (
          <ChevronDown className="w-5 h-5 text-white" />
        )}
      </button>

      {expanded && (
        <div className="p-4 space-y-4">
          {/* Quick mark button */}
          {videoDuration > 0 && (
            <button
              onClick={markCurrentTime}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-50 text-indigo-700 rounded-lg font-medium hover:bg-indigo-100 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Mark at {formatTime(currentTime)}
            </button>
          )}

          {/* Add/Edit form */}
          {showAddForm && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-800">
                  {editingId ? "Edit Chapter" : "Add Chapter Marker"}
                </h4>
                <button onClick={resetForm} className="text-gray-500 hover:text-gray-700">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {error && (
                <div className="bg-red-50 text-red-700 p-2 rounded text-sm">{error}</div>
              )}

              {/* Time inputs */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Start Time
                  </label>
                  <input
                    type="text"
                    value={formData.timestamp}
                    onChange={e => setFormData(prev => ({ ...prev, timestamp: e.target.value }))}
                    placeholder="0:00"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    End Time (optional)
                  </label>
                  <input
                    type="text"
                    value={formData.endTimestamp}
                    onChange={e => setFormData(prev => ({ ...prev, endTimestamp: e.target.value }))}
                    placeholder="0:30"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Root intrusion at 45ft"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Chapter type */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
                <div className="flex flex-wrap gap-2">
                  {CHAPTER_TYPES.map(type => (
                    <button
                      key={type.value}
                      onClick={() => setFormData(prev => ({ ...prev, chapterType: type.value }))}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        formData.chapterType === type.value
                          ? type.color + " ring-2 ring-offset-1 ring-indigo-500"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {type.icon}
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Severity (for findings/defects) */}
              {["FINDING", "DEFECT", "REPAIR_NEEDED"].includes(formData.chapterType) && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Severity</label>
                  <div className="flex flex-wrap gap-2">
                    {SEVERITY_LEVELS.map(sev => (
                      <button
                        key={sev.value}
                        onClick={() => setFormData(prev => ({ ...prev, severity: sev.value }))}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                          formData.severity === sev.value
                            ? sev.color + " ring-2 ring-offset-1 ring-indigo-500"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        {sev.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Description (optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Additional details about this finding..."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Include in highlight */}
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.includeInHighlight}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, includeInHighlight: e.target.checked }))
                  }
                  className="rounded text-indigo-600"
                />
                <span className="text-sm text-gray-700">Include in highlight reel</span>
              </label>

              {/* Save button */}
              <button
                onClick={saveChapter}
                disabled={saving || !formData.title.trim()}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    {editingId ? "Update Chapter" : "Save Chapter"}
                  </>
                )}
              </button>
            </div>
          )}

          {/* Chapters list */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : chapters.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Film className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p>No chapter markers yet</p>
              <p className="text-sm">Mark key moments during your inspection</p>
            </div>
          ) : (
            <div className="space-y-2">
              {chapters.map(chapter => {
                const typeConfig = getChapterTypeConfig(chapter.chapterType);
                const sevConfig = getSeverityConfig(chapter.severity || null);

                return (
                  <div
                    key={chapter.id}
                    className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    {/* Timestamp button */}
                    <button
                      onClick={() => onChapterClick?.(chapter.timestamp)}
                      className="flex items-center gap-1 px-2 py-1 bg-white rounded border border-gray-200 text-sm font-mono text-gray-700 hover:bg-gray-50"
                    >
                      <Clock className="w-3 h-3" />
                      {formatTime(chapter.timestamp)}
                    </button>

                    {/* Chapter info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${typeConfig.color}`}>
                          {typeConfig.icon}
                          {typeConfig.label}
                        </span>
                        {sevConfig && (
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${sevConfig.color}`}>
                            {sevConfig.label}
                          </span>
                        )}
                        {chapter.includeInHighlight && (
                          <span className="text-xs text-indigo-500">★ Highlight</span>
                        )}
                      </div>
                      <p className="font-medium text-gray-800 mt-1">{chapter.title}</p>
                      {chapter.description && (
                        <p className="text-sm text-gray-500 mt-0.5">{chapter.description}</p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => editChapter(chapter)}
                        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteChapter(chapter.id)}
                        className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Add button when form is closed */}
          {!showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-indigo-400 hover:text-indigo-600 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add Chapter Marker
            </button>
          )}
        </div>
      )}
    </div>
  );
}
