// @ts-nocheck
/**
 * Hook for extracting data from voice transcripts using AI
 */

import { useState, useCallback } from "react";
import { aiService } from "@/lib/services/ai.service";
import type { InspectionWithRelations } from "@/lib/services/inspection.service";

interface ExtractedData {
  pipeMaterial?: string;
  overallCondition?: string;
  urgencyLevel?: string;
  rootIntrusion?: {
    severity: string;
    location: string;
  };
  defects?: Array<{
    type: string;
    location: string;
    severity: string;
  }>;
}

interface UseAIExtractorOptions {
  inspectionId: string;
  inspection: InspectionWithRelations;
  onExtracted?: (data: ExtractedData) => void;
  onError?: (error: string) => void;
}

export function useAIExtractor({
  inspectionId,
  inspection,
  onExtracted,
  onError,
}: UseAIExtractorOptions) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastTranscript, setLastTranscript] = useState("");

  const extractFromTranscript = useCallback(
    async (transcript: string) => {
      if (!transcript.trim() || transcript === lastTranscript) return;

      setIsProcessing(true);
      setLastTranscript(transcript);

      try {
        const response = await aiService.extractDataFromTranscript(transcript, {
          propertyAddress: inspection.job.propertyAddress,
          overallCondition: inspection.overallCondition,
          pipeMaterial: inspection.pipeMaterial,
          urgencyLevel: inspection.urgencyLevel,
        });

        if (response.success && response.extractedData) {
          onExtracted?.(response.extractedData);
        } else if (!response.success) {
          onError?.(response.error || "Failed to extract data");
        }
      } catch (error) {
        onError?.(error instanceof Error ? error.message : "Extraction failed");
      } finally {
        setIsProcessing(false);
      }
    },
    [inspection, inspectionId, lastTranscript, onExtracted, onError]
  );

  return {
    extractFromTranscript,
    isProcessing,
  };
}
