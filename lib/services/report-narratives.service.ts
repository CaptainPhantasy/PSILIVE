/**
 * Report Narratives Service
 * Generates professional, plain-language narratives for enhanced inspection reports.
 * Uses Anthropic Claude API via @anthropic-ai/sdk.
 */

import Anthropic from "@anthropic-ai/sdk";
import { logger } from "@/lib/logger";
import type { AcousticResult } from "./acoustic-analysis.service";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const AI_MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-20250514";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface NarrativeResult {
  success: boolean;
  content?: string;
  error?: string;
}

export interface InspectionBundle {
  inspectionNumber: string;
  propertyAddress: string;
  propertyCity: string;
  propertyState: string;
  clientName: string;
  homeAge?: string | null;
  pipeMaterial?: string | null;
  overallCondition?: string | null;
  pipeConditionRating?: number | null;
  urgencyLevel?: string | null;
  recommendations?: string | null;
  accessType?: string;
  inspectionDuration?: number | null;
  connectionToMain?: string | null;
  rootIntrusion?: { severity?: string; location?: string; notes?: string } | null;
  cracks?: Array<{ location: string; severity: string; type?: string }> | null;
  bellies?: Array<{ location: string; severity: string }> | null;
  offsetJoints?: Array<{ location: string; severity: string }> | null;
  blockages?: Array<{ location: string; type?: string; severity: string }> | null;
  extendedMeasurements?: {
    totalFootage?: number;
    depthAtFindings?: Record<string, number>;
    diameterTransitions?: string[];
    cameraDirection?: string;
    flowDirection?: string;
    equipmentUsed?: string;
  } | null;
  technicianName?: string;
  inspectionDate?: string;
}

class ReportNarrativesService {
  /**
   * Generate material context narrative.
   */
  async generateMaterialContext(
    pipeMaterial: string | null | undefined,
    homeAge: string | null | undefined
  ): Promise<NarrativeResult> {
    const material = pipeMaterial?.replace("_", " ") || "Unknown";

    return this.complete(
      [
        {
          role: "user" as const,
          content: `You are a sewer infrastructure expert writing for a homeowner inspection report. Write a 2-3 paragraph narrative about the pipe material found in this home, including:
1. Historical context — when this material was commonly used in Indianapolis
2. Material properties — durability, expected lifespan, common failure modes
3. Regional context — how Indiana soil conditions (clay-heavy, freeze-thaw cycles) affect this material

Tone: Professional, informative, reassuring. Never alarmist. Write as if explaining to an educated homeowner.
Do NOT use bullet points. Write flowing paragraphs.

Write a material context section for a sewer inspection report:
- Pipe Material: ${material}
- Home Age: ${homeAge || "Unknown"}
- Location: Indianapolis, Indiana
- Context: Central Indiana residential sewer system`,
        },
      ],
      { maxTokens: 800, temperature: 0.6 }
    );
  }

  /**
   * Interpret acoustic analysis data into plain language.
   */
  async interpretAcousticData(
    acousticResult: AcousticResult
  ): Promise<NarrativeResult> {
    if (!acousticResult.success || acousticResult.segments.length === 0) {
      return { success: false, error: "No acoustic data to interpret" };
    }

    const segmentSummary = acousticResult.segments
      .map(
        (s) =>
          `${s.label}: ${s.dominantFrequencyHz}Hz dominant, resonance=${s.resonanceBand}, harmonics=${s.harmonicsBand}`
      )
      .join("\n");

    return this.complete(
      [
        {
          role: "user" as const,
          content: `You are a sewer inspection acoustic analysis expert. Write a 1-2 paragraph plain-language interpretation of acoustic frequency data for a homeowner report. Explain what the acoustic signatures indicate about the pipe material. Be professional and factual. This is supplemental analysis — always note that acoustic analysis supports but does not replace visual inspection findings.

Interpret these acoustic findings:

Material indicated by analysis: ${acousticResult.materialIndicator}
Confidence: ${acousticResult.confidence}

Frequency Analysis:
${segmentSummary}

Reference signatures:
- Cast Iron: >800Hz dominant, metallic resonance 2-5kHz, harmonics 5-10kHz
- Clay/Ceramic: <800Hz dominant, duller profile, minimal resonance
- PVC: Mid-range 400-800Hz, plastic dampening effect

Write a professional interpretation paragraph:`,
        },
      ],
      { maxTokens: 500, temperature: 0.5 }
    );
  }

  /**
   * Generate limitations and exclusions section.
   */
  async generateLimitations(
    bundle: InspectionBundle
  ): Promise<NarrativeResult> {
    const footage = bundle.extendedMeasurements?.totalFootage;
    const equipment = bundle.extendedMeasurements?.equipmentUsed;
    const accessType = bundle.accessType;

    return this.complete(
      [
        {
          role: "user" as const,
          content: `You are writing the "Limitations & Exclusions" section of a professional sewer inspection report. List specific limitations based on the inspection parameters. Be factual and thorough. Use numbered items. Include standard disclaimers about camera-based inspection limitations.

Generate limitations for this inspection:
- Access Type: ${accessType || "Cleanout"}
- Total Footage Inspected: ${footage ? `${footage} ft` : "Not recorded"}
- Equipment: ${equipment || "Standard push camera"}
- Duration: ${bundle.inspectionDuration || "N/A"} minutes
- Property: ${bundle.propertyAddress}, ${bundle.propertyCity}, ${bundle.propertyState}

Standard limitations to consider:
1. Camera can only inspect accessible portions of the sewer line
2. Standing water may obscure defects below the waterline
3. Inspection is limited to the date and conditions at time of service
4. Areas beyond camera reach were not inspected
5. Lateral connections may not be fully visible
6. Acoustic analysis is supplemental and not a substitute for visual findings

Generate 5-8 specific limitation items:`,
        },
      ],
      { maxTokens: 600, temperature: 0.4 }
    );
  }

  /**
   * Generate enhanced finding narrative for a specific defect.
   */
  async generateFindingNarrative(
    findingType: string,
    severity: string,
    location: string,
    context: InspectionBundle
  ): Promise<NarrativeResult> {
    return this.complete(
      [
        {
          role: "user" as const,
          content: `You are writing a detailed finding description for a sewer inspection report. Write 2-3 sentences that explain what was found, its significance, and any relevant context. Use plain language a homeowner can understand. Be factual, not alarmist.

Describe this finding for the report:
- Type: ${findingType}
- Severity: ${severity}
- Location: ${location}
- Pipe Material: ${context.pipeMaterial?.replace("_", " ") || "Unknown"}
- Home Age: ${context.homeAge || "Unknown"}
- Overall Condition: ${context.overallCondition || "Not assessed"}`,
        },
      ],
      { maxTokens: 300, temperature: 0.5 }
    );
  }

  /**
   * Generate overall condition narrative.
   */
  async generateConditionNarrative(
    bundle: InspectionBundle
  ): Promise<NarrativeResult> {
    const findingsCount =
      (bundle.cracks?.length || 0) +
      (bundle.bellies?.length || 0) +
      (bundle.offsetJoints?.length || 0) +
      (bundle.blockages?.length || 0) +
      (bundle.rootIntrusion?.severity ? 1 : 0);

    return this.complete(
      [
        {
          role: "user" as const,
          content: `You are writing the overall condition assessment for a professional sewer inspection report. Write 2-3 paragraphs summarizing the overall state of the sewer line. Be balanced — acknowledge issues but also note positive findings. Professional tone, plain language.

Write an overall condition assessment:
- Overall Condition: ${bundle.overallCondition || "Not assessed"}
- Pipe Rating: ${bundle.pipeConditionRating || "N/A"}/5
- Urgency: ${bundle.urgencyLevel || "Not set"}
- Total Findings: ${findingsCount}
- Pipe Material: ${bundle.pipeMaterial?.replace("_", " ") || "Unknown"}
- Home Age: ${bundle.homeAge || "Unknown"}
- Root Intrusion: ${bundle.rootIntrusion?.severity || "None"}
- Cracks: ${bundle.cracks?.length || 0}
- Bellies: ${bundle.bellies?.length || 0}
- Offset Joints: ${bundle.offsetJoints?.length || 0}
- Blockages: ${bundle.blockages?.length || 0}
- Connection to Main: ${bundle.connectionToMain || "Not documented"}
- Recommendations: ${bundle.recommendations || "None"}`,
        },
      ],
      { maxTokens: 800, temperature: 0.6 }
    );
  }

  /**
   * Internal chat completion helper using Anthropic SDK.
   * Prompts embed the system instructions in the user message for single-turn calls.
   */
  private async complete(
    messages: ChatMessage[],
    options: { maxTokens?: number; temperature?: number } = {}
  ): Promise<NarrativeResult> {
    if (!process.env.ANTHROPIC_API_KEY) {
      return { success: false, error: "ANTHROPIC_API_KEY not configured" };
    }

    try {
      // For narrative generation, system instructions are embedded in the user message
      // since we're using single-turn patterns (no separate system message)
      const response = await client.messages.create({
        model: AI_MODEL,
        max_tokens: options.maxTokens || 1000,
        temperature: options.temperature ?? 0.7,
        messages,
      });

      const textBlock = response.content.find((block) => block.type === "text");
      if (!textBlock || textBlock.type !== "text") {
        return { success: false, error: "No text content in response" };
      }

      return { success: true, content: textBlock.text };
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return { success: false, error: "Narrative generation timed out" };
      }
      logger.error("Narrative generation failed", { error });
      return { success: false, error: "Failed to generate narrative" };
    }
  }
}

export const reportNarrativesService = new ReportNarrativesService();
export { ReportNarrativesService };
