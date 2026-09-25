"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Loader2, AlertCircle, Camera, ChevronRight, Mic, MicOff } from "lucide-react";
import type { Inspection } from "@/app/technician/inspection/[inspectionId]/page";
import { PIPE_MATERIALS, PRE_INSPECTION_FIELDS } from "@/lib/inspection-constants";
import { PropertyLookup } from "./property-lookup";

interface Props {
  inspection: Inspection;
  onUpdate: (data: Partial<Inspection>) => Promise<{ success: boolean; error?: string }>;
  onComplete: () => Promise<{ success: boolean; error?: string }>;
}

export function PreInspectionStage({ inspection, onUpdate, onComplete }: Props) {
  const [formData, setFormData] = useState({
    confirmedClientName: inspection.confirmedClientName || inspection.job.clientName,
    confirmedAddress: inspection.confirmedAddress || `${inspection.job.propertyAddress}, ${inspection.job.propertyCity}`,
    homeAge: inspection.homeAge || "",
    pipeMaterial: inspection.pipeMaterial || "",
    knownIssues: inspection.knownIssues || "None reported",
    backupHistory: inspection.backupHistory || "None reported",
    recentWork: inspection.recentWork || "",
    specialInstructions: inspection.specialInstructions || "",
  });
  const [saving, setSaving] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState("");
  const [listeningField, setListeningField] = useState<string | null>(null);
  const [voiceSupported, setVoiceSupported] = useState(true);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  // Check voice support
  useEffect(() => {
    if (typeof window !== "undefined") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognitionAPI) {
        setVoiceSupported(false);
      }
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    const result = await onUpdate(formData);
    if (!result.success) {
      setError(result.error || "Failed to save");
    }
    setSaving(false);
  };

  const validateForm = () => {
    const errors: string[] = [];
    if (!formData.confirmedClientName) errors.push("Client name is required");
    if (!formData.confirmedAddress) errors.push("Address is required");
    if (!formData.homeAge) errors.push("Home age is required");
    if (!formData.pipeMaterial) errors.push("Pipe material is required");
    if (!formData.knownIssues) errors.push("Known issues field is required");
    if (!formData.backupHistory) errors.push("Backup history is required");
    return errors;
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
    const saveResult = await onUpdate(formData);
    if (!saveResult.success) {
      setError(saveResult.error || "Failed to save");
      setCompleting(false);
      return;
    }

    // Then complete
    const result = await onComplete();
    if (!result.success) {
      setError(result.error || "Failed to proceed");
    }
    setCompleting(false);
  };

  const toggleVoiceForField = useCallback((field: string) => {
    if (!voiceSupported) return;

    // If already listening to this field, stop
    if (listeningField === field) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
      setListeningField(null);
      return;
    }

    // Stop any existing recognition
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognitionAPI) return;
      
      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        setListeningField(field);
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        let finalTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript + " ";
          }
        }
        if (finalTranscript) {
          setFormData(prev => ({
            ...prev,
            [field]: prev[field as keyof typeof prev]
              ? `${prev[field as keyof typeof prev]} ${finalTranscript.trim()}`
              : finalTranscript.trim(),
          }));
        }
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setListeningField(null);
      };

      recognition.onend = () => {
        setListeningField(null);
        recognitionRef.current = null;
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error("Failed to start voice input:", err);
      setListeningField(null);
    }
  }, [voiceSupported, listeningField]);

  return (
    <div className="p-4 space-y-4 pb-32">
      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Property Data Lookup */}
      <PropertyLookup
        initialAddress={inspection.job.propertyAddress}
        initialCity={inspection.job.propertyCity}
        initialState={inspection.job.propertyState}
        initialZip={inspection.job.propertyZip}
        onUseData={(data) => {
          setFormData(prev => ({
            ...prev,
            ...(data.homeAge && { homeAge: data.homeAge }),
            ...(data.pipeMaterial && { pipeMaterial: data.pipeMaterial }),
          }));
        }}
      />

      {/* Voice Input Section */}
      {voiceSupported && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-2">
          <p className="text-sm text-blue-700 font-medium mb-1">🎤 Voice Input Available</p>
          <p className="text-xs text-blue-600">
            Tap the microphone icon next to any text field to dictate your notes.
          </p>
        </div>
      )}

      {/* Form Fields */}
      <div className="bg-white rounded-xl p-4 shadow-sm space-y-4">
        <h3 className="font-semibold text-gray-900">Client Interview</h3>

        {/* Client Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Client Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.confirmedClientName}
            onChange={(e) => handleChange("confirmedClientName", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Address */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Property Address <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.confirmedAddress}
            onChange={(e) => handleChange("confirmedAddress", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Home Age */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Home Age (Approximate) <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.homeAge}
            onChange={(e) => handleChange("homeAge", e.target.value)}
            placeholder="e.g., Built 1985, About 40 years old"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Pipe Material */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Pipe Material <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.pipeMaterial}
            onChange={(e) => handleChange("pipeMaterial", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select pipe material...</option>
            {PIPE_MATERIALS.map((mat) => (
              <option key={mat.value} value={mat.value}>
                {mat.label} {mat.era && `(${mat.era})`}
              </option>
            ))}
          </select>
        </div>

        {/* Known Issues */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-gray-700">
              Known Sewer Issues <span className="text-red-500">*</span>
            </label>
            {voiceSupported && (
              <button
                type="button"
                onClick={() => toggleVoiceForField("knownIssues")}
                className={`p-1.5 rounded-full transition-colors ${
                  listeningField === "knownIssues"
                    ? "bg-red-500 text-white animate-pulse"
                    : "bg-gray-100 text-gray-600 hover:bg-blue-100 hover:text-blue-600"
                }`}
              >
                {listeningField === "knownIssues" ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
            )}
          </div>
          <textarea
            value={formData.knownIssues}
            onChange={(e) => handleChange("knownIssues", e.target.value)}
            rows={2}
            placeholder="Any known problems? Previous repairs?"
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              listeningField === "knownIssues" ? "border-red-300 bg-red-50" : "border-gray-300"
            }`}
          />
        </div>

        {/* Backup History */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-gray-700">
              Backup/Slow Drain History <span className="text-red-500">*</span>
            </label>
            {voiceSupported && (
              <button
                type="button"
                onClick={() => toggleVoiceForField("backupHistory")}
                className={`p-1.5 rounded-full transition-colors ${
                  listeningField === "backupHistory"
                    ? "bg-red-500 text-white animate-pulse"
                    : "bg-gray-100 text-gray-600 hover:bg-blue-100 hover:text-blue-600"
                }`}
              >
                {listeningField === "backupHistory" ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
            )}
          </div>
          <textarea
            value={formData.backupHistory}
            onChange={(e) => handleChange("backupHistory", e.target.value)}
            rows={2}
            placeholder="Any backups or slow drains? How often?"
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              listeningField === "backupHistory" ? "border-red-300 bg-red-50" : "border-gray-300"
            }`}
          />
        </div>

        {/* Recent Work */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-gray-700">
              Recent Plumbing Work
            </label>
            {voiceSupported && (
              <button
                type="button"
                onClick={() => toggleVoiceForField("recentWork")}
                className={`p-1.5 rounded-full transition-colors ${
                  listeningField === "recentWork"
                    ? "bg-red-500 text-white animate-pulse"
                    : "bg-gray-100 text-gray-600 hover:bg-blue-100 hover:text-blue-600"
                }`}
              >
                {listeningField === "recentWork" ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
            )}
          </div>
          <textarea
            value={formData.recentWork}
            onChange={(e) => handleChange("recentWork", e.target.value)}
            rows={2}
            placeholder="Optional: Any recent plumbing or sewer work?"
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              listeningField === "recentWork" ? "border-red-300 bg-red-50" : "border-gray-300"
            }`}
          />
        </div>

        {/* Special Instructions */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-gray-700">
              Special Notes
            </label>
            {voiceSupported && (
              <button
                type="button"
                onClick={() => toggleVoiceForField("specialInstructions")}
                className={`p-1.5 rounded-full transition-colors ${
                  listeningField === "specialInstructions"
                    ? "bg-red-500 text-white animate-pulse"
                    : "bg-gray-100 text-gray-600 hover:bg-blue-100 hover:text-blue-600"
                }`}
              >
                {listeningField === "specialInstructions" ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
            )}
          </div>
          <textarea
            value={formData.specialInstructions}
            onChange={(e) => handleChange("specialInstructions", e.target.value)}
            rows={2}
            placeholder="Optional: Anything else to note?"
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              listeningField === "specialInstructions" ? "border-red-300 bg-red-50" : "border-gray-300"
            }`}
          />
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
              <Camera className="w-5 h-5" />
              Begin Inspection
            </>
          )}
        </button>
      </div>
    </div>
  );
}
