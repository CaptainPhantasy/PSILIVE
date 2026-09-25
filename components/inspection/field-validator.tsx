"use client";

import { useMemo } from "react";
import { AlertTriangle, CheckCircle, XCircle, Info } from "lucide-react";
import type { Inspection } from "@/app/technician/inspection/[inspectionId]/page";

interface FieldValidatorProps {
  inspection: Inspection;
  currentStage: string;
}

interface ValidationItem {
  field: string;
  label: string;
  status: "complete" | "incomplete" | "warning";
  message: string;
  required: boolean;
  stage: string[];
}

export function FieldValidator({ inspection, currentStage }: FieldValidatorProps) {
  const validationItems = useMemo<ValidationItem[]>(() => {
      const items: ValidationItem[] = [];

      // Pre-Inspection Interview Fields
      items.push({
        field: "confirmedClientName",
        label: "Client Name Confirmed",
        status: inspection.confirmedClientName ? "complete" : "incomplete",
        message: inspection.confirmedClientName
          ? `Confirmed: ${inspection.confirmedClientName}`
          : "Client name not confirmed yet",
        required: true,
        stage: ["PRE_INSPECTION", "INSPECTING", "POST_INSPECTION", "VIDEO_ATTACH", "CLIENT_SIGNOFF"],
      });

      items.push({
        field: "confirmedAddress",
        label: "Property Address Confirmed",
        status: inspection.confirmedAddress ? "complete" : "incomplete",
        message: inspection.confirmedAddress
          ? `Address: ${inspection.confirmedAddress}`
          : "Property address not confirmed yet",
        required: true,
        stage: ["PRE_INSPECTION", "INSPECTING", "POST_INSPECTION", "VIDEO_ATTACH", "CLIENT_SIGNOFF"],
      });

      items.push({
        field: "homeAge",
        label: "Home Age",
        status: inspection.homeAge ? "complete" : "warning",
        message: inspection.homeAge
          ? `Home age: ${inspection.homeAge}`
          : "Home age helps with material context",
        required: false,
        stage: ["PRE_INSPECTION", "POST_INSPECTION", "VIDEO_ATTACH", "CLIENT_SIGNOFF"],
      });

      items.push({
        field: "pipeMaterial",
        label: "Pipe Material",
        status: inspection.pipeMaterial ? "complete" : "warning",
        message: inspection.pipeMaterial
          ? `${inspection.pipeMaterial.replace("_", " ")}`
          : "Identify if visible or note as unknown",
        required: false,
        stage: ["INSPECTING", "POST_INSPECTION", "VIDEO_ATTACH", "CLIENT_SIGNOFF"],
      });

      // Post-Inspection Fields
      items.push({
        field: "overallCondition",
        label: "Overall Condition",
        status: inspection.overallCondition ? "complete" : "incomplete",
        message: inspection.overallCondition
          ? `${inspection.overallCondition}`
          : "Overall condition rating required",
        required: true,
        stage: ["POST_INSPECTION", "VIDEO_ATTACH", "CLIENT_SIGNOFF"],
      });

      items.push({
        field: "pipeConditionRating",
        label: "Pipe Rating",
        status: inspection.pipeConditionRating ? "complete" : "incomplete",
        message: inspection.pipeConditionRating
          ? `${inspection.pipeConditionRating}/5`
          : "Pipe condition rating (1-5) required",
        required: true,
        stage: ["POST_INSPECTION", "VIDEO_ATTACH", "CLIENT_SIGNOFF"],
      });

      items.push({
        field: "connectionToMain",
        label: "Connection to Main",
        status: inspection.connectionToMain ? "complete" : "incomplete",
        message: inspection.connectionToMain
          ? `${inspection.connectionToMain}`
          : "Connection to main status required",
        required: true,
        stage: ["POST_INSPECTION", "VIDEO_ATTACH", "CLIENT_SIGNOFF"],
      });

      items.push({
        field: "recommendations",
        label: "Report Notes",
        status: inspection.recommendations ? "complete" : "incomplete",
        message: inspection.recommendations
          ? "Report notes captured"
          : "Record observational report notes for admin review",
        required: true,
        stage: ["POST_INSPECTION", "VIDEO_ATTACH", "CLIENT_SIGNOFF"],
      });

      items.push({
        field: "urgencyLevel",
        label: "Review Priority",
        status: inspection.urgencyLevel ? "complete" : "incomplete",
        message: inspection.urgencyLevel
          ? `${inspection.urgencyLevel}`
          : "Set review priority for admin triage",
        required: true,
        stage: ["POST_INSPECTION", "VIDEO_ATTACH", "CLIENT_SIGNOFF"],
      });

      // Video & Signature
      items.push({
        field: "videoAttachment",
        label: "Video Upload",
        status:
          inspection.videoAttachment?.uploadStatus === "COMPLETED"
            ? "complete"
            : inspection.videoAttachment
            ? "warning"
            : "incomplete",
        message:
          inspection.videoAttachment?.uploadStatus === "COMPLETED"
            ? `Video uploaded: ${inspection.videoAttachment.fileName}`
            : inspection.videoAttachment
            ? `Upload in progress: ${inspection.videoAttachment.uploadStatus}`
            : "Video recording required",
        required: true,
        stage: ["VIDEO_ATTACH", "CLIENT_SIGNOFF"],
      });

      items.push({
        field: "clientSignature",
        label: "Client Signature",
        status: inspection.clientSignature ? "complete" : "incomplete",
        message: inspection.clientSignature
          ? `Signed by: ${inspection.clientSignature.signerName}`
          : "Client signature required for completion",
        required: true,
        stage: ["CLIENT_SIGNOFF"],
      });

      // Timing is evidence, not a gate. Real inspections include stops, returns, and voiceover passes.
      items.push({
        field: "inspectionDuration",
        label: "Inspection Time Recorded",
        status:
          (inspection.inspectionDuration || 0) > 0
            ? "complete"
            : inspection.inspectionStartedAt
            ? "warning"
            : "incomplete",
        message:
          (inspection.inspectionDuration || 0) > 0
            ? `${inspection.inspectionDuration} minutes recorded`
            : inspection.inspectionStartedAt
            ? "Inspection in progress; finish when field work is complete"
            : "Inspection not started yet",
        required: false,
        stage: ["INSPECTING", "POST_INSPECTION", "VIDEO_ATTACH", "CLIENT_SIGNOFF"],
      });

      return items;
    }, [inspection]);

  // Filter items relevant to current stage
  const relevantItems = validationItems.filter((item) =>
    item.stage.includes(currentStage)
  );

  const requiredIncomplete = relevantItems.filter(
    (item) => item.required && item.status === "incomplete"
  );
  const warnings = relevantItems.filter((item) => item.status === "warning");
  const complete = relevantItems.filter((item) => item.status === "complete");

  const completionPercentage = Math.round(
    (complete.length / relevantItems.length) * 100
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-3">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-semibold">Checklist</h3>
          <div className="flex items-center gap-2">
            <div className="bg-white/20 px-2 py-1 rounded text-white text-sm">
              {complete.length}/{relevantItems.length}
            </div>
          </div>
        </div>
        <div className="mt-2 bg-white/20 rounded-full h-2">
          <div
            className="bg-white rounded-full h-2 transition-all duration-300"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </div>

      <div className="p-4 space-y-3 max-h-64 overflow-y-auto">
        {/* Required incomplete items first */}
        {requiredIncomplete.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-red-600 uppercase tracking-wide">
              Required - Missing
            </p>
            {requiredIncomplete.map((item) => (
              <div
                key={item.field}
                className="flex items-start gap-2 p-2 bg-red-50 rounded-lg border border-red-100"
              >
                <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-red-800">{item.label}</p>
                  <p className="text-xs text-red-600">{item.message}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Warnings */}
        {warnings.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-orange-600 uppercase tracking-wide">
              Recommended
            </p>
            {warnings.map((item) => (
              <div
                key={item.field}
                className="flex items-start gap-2 p-2 bg-orange-50 rounded-lg border border-orange-100"
              >
                <AlertTriangle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-orange-800">{item.label}</p>
                  <p className="text-xs text-orange-600">{item.message}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Completed items */}
        {complete.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-green-600 uppercase tracking-wide">
              Completed
            </p>
            {complete.map((item) => (
              <div
                key={item.field}
                className="flex items-start gap-2 p-2 bg-green-50 rounded-lg border border-green-100"
              >
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-green-800">{item.label}</p>
                  <p className="text-xs text-green-600">{item.message}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {requiredIncomplete.length > 0 && (
        <div className="px-4 py-3 bg-red-50 border-t border-red-100">
          <div className="flex items-center gap-2 text-red-700">
            <Info className="w-4 h-4" />
            <p className="text-sm">
              Complete {requiredIncomplete.length} required item
              {requiredIncomplete.length > 1 ? "s" : ""} before proceeding
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
