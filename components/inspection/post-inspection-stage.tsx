"use client";

import { useState } from "react";
import { Loader2, AlertCircle, Video, Plus, Trash2, Sparkles } from "lucide-react";
import type { Inspection } from "@/app/technician/inspection/[inspectionId]/page";
import { CONDITION_RATINGS, URGENCY_LEVELS, DEFECT_TYPES, SEVERITY_LEVELS } from "@/lib/inspection-constants";
import { AISummary } from "./ai-summary";

interface DefectEntry {
  id: string;
  type: string;
  severity: string;
  location: string;
  notes: string;
}

interface Props {
  inspection: Inspection;
  onUpdate: (data: Partial<Inspection>) => Promise<{ success: boolean; error?: string }>;
  onComplete: () => Promise<{ success: boolean; error?: string }>;
}

export function PostInspectionStage({ inspection, onUpdate, onComplete }: Props) {
  const [formData, setFormData] = useState({
    overallCondition: inspection.overallCondition || "",
    pipeConditionRating: inspection.pipeConditionRating || 3,
    connectionToMain: inspection.connectionToMain || "",
    recommendations: inspection.recommendations || "",
    urgencyLevel: inspection.urgencyLevel || "",
  });
  
  const [defects, setDefects] = useState<DefectEntry[]>([]);
  const [saving, setSaving] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addDefect = () => {
    setDefects(prev => [
      ...prev,
      { id: Date.now().toString(), type: "", severity: "moderate", location: "", notes: "" },
    ]);
  };

  const updateDefect = (id: string, field: string, value: string) => {
    setDefects(prev =>
      prev.map(d => (d.id === id ? { ...d, [field]: value } : d))
    );
  };

  const removeDefect = (id: string) => {
    setDefects(prev => prev.filter(d => d.id !== id));
  };

  const validateForm = () => {
    const errors: string[] = [];
    if (!formData.overallCondition) errors.push("Overall condition is required");
    if (!formData.connectionToMain) errors.push("Connection to main status is required");
    if (!formData.recommendations) errors.push("Recommendations are required");
    if (!formData.urgencyLevel) errors.push("Urgency level is required");
    return errors;
  };

  const handleSave = async () => {
    setSaving(true);
    
    // Build defect data
    const rootIntrusion = defects.filter(d => d.type === "root_intrusion");
    const cracks = defects.filter(d => d.type === "crack");
    const bellies = defects.filter(d => d.type === "belly");
    const offsetJoints = defects.filter(d => d.type === "offset");
    const blockages = defects.filter(d => d.type === "blockage");

    const updateData = {
      ...formData,
      rootIntrusion: rootIntrusion.length > 0 ? rootIntrusion[0] : null,
      cracks: cracks.length > 0 ? cracks : null,
      bellies: bellies.length > 0 ? bellies : null,
      offsetJoints: offsetJoints.length > 0 ? offsetJoints : null,
      blockages: blockages.length > 0 ? blockages : null,
    };

    const result = await onUpdate(updateData as Partial<Inspection>);
    if (!result.success) {
      setError(result.error || "Failed to save");
    }
    setSaving(false);
  };

  const handleComplete = async () => {
    const errors = validateForm();
    if (errors.length > 0) {
      setError(errors.join(". "));
      return;
    }

    setCompleting(true);
    setError("");

    // Save first
    await handleSave();

    // Then complete
    const result = await onComplete();
    if (!result.success) {
      setError(result.error || "Failed to proceed");
    }
    setCompleting(false);
  };

  const durationStr = inspection.inspectionDuration
    ? `${inspection.inspectionDuration} minutes`
    : "N/A";

  return (
    <div className="p-4 space-y-4 pb-36">
      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Inspection Summary */}
      <div className="bg-green-50 rounded-xl p-4 border border-green-200">
        <p className="text-green-700 text-sm">
          <strong>Inspection Complete!</strong> Duration: {durationStr}
        </p>
      </div>

      {/* Overall Condition */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-3">Overall Condition <span className="text-red-500">*</span></h3>
        <div className="grid grid-cols-2 gap-2">
          {CONDITION_RATINGS.map((rating) => (
            <button
              key={rating.value}
              onClick={() => handleChange("overallCondition", rating.value)}
              className={`p-3 rounded-lg border-2 text-left transition-colors ${
                formData.overallCondition === rating.value
                  ? rating.color === "green"
                    ? "border-green-500 bg-green-50"
                    : rating.color === "yellow"
                    ? "border-yellow-500 bg-yellow-50"
                    : rating.color === "orange"
                    ? "border-orange-500 bg-orange-50"
                    : "border-red-500 bg-red-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <p className="font-medium">{rating.label}</p>
              <p className="text-xs text-gray-500">{rating.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Pipe Condition Rating */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-3">Pipe Condition (1-5)</h3>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((num) => (
            <button
              key={num}
              onClick={() => handleChange("pipeConditionRating", num)}
              className={`flex-1 py-3 rounded-lg font-bold transition-colors ${
                formData.pipeConditionRating === num
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {num}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-2 text-center">1 = Poor, 5 = Excellent</p>
      </div>

      {/* Defects */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900">Defects Found</h3>
          <button
            onClick={addDefect}
            className="text-blue-600 text-sm font-medium flex items-center gap-1"
          >
            <Plus className="w-4 h-4" /> Add Defect
          </button>
        </div>

        {defects.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-4">
            No defects logged. Tap &quot;Add Defect&quot; if issues were found.
          </p>
        ) : (
          <div className="space-y-3">
            {defects.map((defect) => (
              <div key={defect.id} className="border border-gray-200 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <select
                    value={defect.type}
                    onChange={(e) => updateDefect(defect.id, "type", e.target.value)}
                    className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                  >
                    <option value="">Select type...</option>
                    {DEFECT_TYPES.map((type) => (
                      <option key={type.id} value={type.id}>{type.label}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => removeDefect(defect.id)}
                    className="ml-2 text-red-500 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex gap-2">
                  <select
                    value={defect.severity}
                    onChange={(e) => updateDefect(defect.id, "severity", e.target.value)}
                    className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                  >
                    {SEVERITY_LEVELS.map((sev) => (
                      <option key={sev.value} value={sev.value}>{sev.label}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={defect.location}
                    onChange={(e) => updateDefect(defect.id, "location", e.target.value)}
                    placeholder="Location (e.g., 45ft)"
                    className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                </div>
                <input
                  type="text"
                  value={defect.notes}
                  onChange={(e) => updateDefect(defect.id, "notes", e.target.value)}
                  placeholder="Additional notes..."
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Connection to Main */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-3">Connection to Main <span className="text-red-500">*</span></h3>
        <select
          value={formData.connectionToMain}
          onChange={(e) => handleChange("connectionToMain", e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
        >
          <option value="">Select status...</option>
          <option value="Verified">Verified - Connection confirmed</option>
          <option value="Not Accessible">Not Accessible - Could not reach</option>
          <option value="Issues Found">Issues Found - Problems at connection</option>
        </select>
      </div>

      {/* Recommendations */}
      <div className="bg-white rounded-xl p-4 shadow-sm space-y-4">
        <h3 className="font-semibold text-gray-900">Report Notes <span className="text-red-500">*</span></h3>
        
        {/* AI Summary Helper */}
        <div className="border-b pb-4">
          <AISummary
            inspectionId={inspection.id}
            type="recommendations"
            buttonLabel="Generate AI Recommendations"
            onUseSummary={(summary) => handleChange("recommendations", summary)}
          />
        </div>
        
        <textarea
                  value={formData.recommendations}
                  onChange={(e) => handleChange("recommendations", e.target.value)}
                  rows={4}
                  placeholder="Record what was observed, where it appears, inspection limits, and any context the admin needs for the report. Avoid repair instructions."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
      </div>

      {/* Urgency Level */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-3">Urgency Level <span className="text-red-500">*</span></h3>
        <div className="space-y-2">
          {URGENCY_LEVELS.map((level) => (
            <button
              key={level.value}
              onClick={() => handleChange("urgencyLevel", level.value)}
              className={`w-full p-3 rounded-lg border-2 text-left transition-colors ${
                formData.urgencyLevel === level.value
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <p className="font-medium">{level.label}</p>
              <p className="text-xs text-gray-500">{level.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 space-y-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-gray-200 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-300 transition-colors disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Progress"}
        </button>
        <button
          onClick={handleComplete}
          disabled={completing}
          className="w-full bg-blue-600 text-white py-4 rounded-xl font-semibold text-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {completing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Proceeding...
            </>
          ) : (
            <>
              <Video className="w-5 h-5" />
              Attach Video
            </>
          )}
        </button>
      </div>
    </div>
  );
}
