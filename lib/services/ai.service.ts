/**
 * AI Service
 * Handles all AI/LLM interactions via Anthropic Claude API.
 * Replaced Abacus AI (OpenAI-compatible proxy) with direct Anthropic SDK.
 */

import Anthropic from "@anthropic-ai/sdk";
import { logger } from "@/lib/logger";

// Initialize Anthropic client
const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Default model (configurable via env)
const AI_MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-20250514";

// Request timeout
const AI_REQUEST_TIMEOUT = 30000; // 30 seconds

interface AIResponse {
  success: boolean;
  content?: string;
  error?: string;
}

interface InspectionContext {
  propertyAddress: string;
  clientName: string;
  homeAge?: string | null;
  pipeMaterial?: string | null;
  knownIssues?: string | null;
  backupHistory?: string | null;
  overallCondition?: string | null;
  pipeConditionRating?: number | null;
  rootIntrusion?: { severity?: string; location?: string; notes?: string } | null;
  cracks?: Array<{ location: string; severity: string; type?: string }> | null;
  bellies?: Array<{ location: string; severity: string }> | null;
  offsetJoints?: Array<{ location: string; severity: string }> | null;
  blockages?: Array<{ location: string; type?: string; severity: string }> | null;
  connectionToMain?: string | null;
  recommendations?: string | null;
  urgencyLevel?: string | null;
  technicianName?: string;
  inspectionDate?: string;
  inspectionDuration?: number | null;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

class AIService {
  private requestCount = 0;
  private lastRequestTime = 0;

  /**
   * Core chat completion via Anthropic SDK.
   * Separates system prompt (Anthropic top-level param) from user/assistant messages.
   */
  private async chatCompletion(
    messages: Array<{ role: string; content: string }>,
    options: {
      maxTokens?: number;
      temperature?: number;
    } = {}
  ): Promise<AIResponse> {
    if (!process.env.ANTHROPIC_API_KEY) {
      return {
        success: false,
        error: "ANTHROPIC_API_KEY not configured",
      };
    }

    this.requestCount++;
    this.lastRequestTime = Date.now();

    // Extract system prompt from messages — Anthropic uses top-level `system` param
    let systemPrompt: string | undefined;
    const chatMessages: ChatMessage[] = [];

    for (const msg of messages) {
      if (msg.role === "system") {
        systemPrompt = msg.content;
      } else if (msg.role === "user" || msg.role === "assistant") {
        chatMessages.push({ role: msg.role, content: msg.content });
      }
    }

    // Anthropic requires at least one user message
    if (chatMessages.length === 0) {
      return { success: false, error: "No user message provided" };
    }

    try {
      const response = await client.messages.create(
        {
          model: AI_MODEL,
          max_tokens: options.maxTokens || 1000,
          temperature: options.temperature ?? 0.7,
          ...(systemPrompt ? { system: systemPrompt } : {}),
          messages: chatMessages,
        },
        {
          timeout: AI_REQUEST_TIMEOUT,
        }
      );

      const textBlock = response.content.find((block) => block.type === "text");
      if (!textBlock || textBlock.type !== "text") {
        return { success: false, error: "No text content in response" };
      }

      logger.info(`[AI] Response received. Tokens — input: ${response.usage.input_tokens}, output: ${response.usage.output_tokens}`);

      return { success: true, content: textBlock.text };
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return { success: false, error: "AI request timed out" };
      }

      const message = error instanceof Error ? error.message : String(error);
      logger.error("AI request failed", { error: message });
      return { success: false, error: message };
    }
  }

  /**
   * Generate a summary of inspection findings
   */
  async generateFindingsSummary(context: InspectionContext): Promise<AIResponse> {
    const systemPrompt = `You are a professional sewer inspection technician writing a summary for a client. Write clear, plain-language summaries that a homeowner can understand. Avoid technical jargon. Be professional and factual. Never be alarmist.`;

    const userPrompt = `Based on the following inspection data, write a clear summary of the findings (2-3 paragraphs):

Property: ${context.propertyAddress}
Client: ${context.clientName}
Home Age: ${context.homeAge || "Unknown"}
Pipe Material: ${context.pipeMaterial?.replace("_", " ") || "Unknown"}
Known Issues Reported: ${context.knownIssues || "None reported"}
Backup History: ${context.backupHistory || "None reported"}

Overall Condition: ${context.overallCondition || "Not yet assessed"}
Pipe Condition Rating: ${context.pipeConditionRating ? `${context.pipeConditionRating}/5` : "Not rated"}
Root Intrusion: ${context.rootIntrusion?.severity ? `${context.rootIntrusion.severity} at ${context.rootIntrusion.location || "various locations"}. ${context.rootIntrusion.notes || ""}` : "None observed"}
Cracks: ${context.cracks && context.cracks.length > 0 ? context.cracks.map((c) => `${c.severity} ${c.type || "crack"} at ${c.location}`).join("; ") : "None observed"}
Bellies/Low Spots: ${context.bellies && context.bellies.length > 0 ? context.bellies.map((b) => `${b.severity} at ${b.location}`).join("; ") : "None observed"}
Offset Joints: ${context.offsetJoints && context.offsetJoints.length > 0 ? context.offsetJoints.map((o) => `${o.severity} at ${o.location}`).join("; ") : "None observed"}
Blockages: ${context.blockages && context.blockages.length > 0 ? context.blockages.map((b) => `${b.severity} ${b.type || "blockage"} at ${b.location}`).join("; ") : "None observed"}
Connection to Main: ${context.connectionToMain || "Not documented"}
Current Recommendations: ${context.recommendations || "None yet"}
Urgency Level: ${context.urgencyLevel || "Not set"}

Write a plain-language summary of the findings:`;

    return this.chatCompletion(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      { maxTokens: 1500 }
    );
  }

  /**
   * Generate recommendations based on findings
   */
  async generateRecommendations(context: InspectionContext): Promise<AIResponse> {
    const systemPrompt = `You are a professional sewer inspection technician. Provide clear, actionable recommendations for the property owner. Include priority/urgency and estimated timeframes where appropriate. Be honest but not alarmist. Use bullet points.`;

    const userPrompt = `Based on the following inspection findings, provide clear, actionable recommendations (3-5 bullet points):

Property: ${context.propertyAddress}
Overall Condition: ${context.overallCondition || "Unknown"}
Pipe Rating: ${context.pipeConditionRating || "N/A"}/5
Root Intrusion: ${context.rootIntrusion?.severity || "None"}
Cracks: ${context.cracks?.length || 0} found
Bellies: ${context.bellies?.length || 0} found
Offset Joints: ${context.offsetJoints?.length || 0} found
Blockages: ${context.blockages?.length || 0} found
Urgency Level: ${context.urgencyLevel || "Not set"}

Provide recommendations in plain language:`;

    return this.chatCompletion(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      { maxTokens: 1000, temperature: 0.6 }
    );
  }

  /**
   * Generate a complete inspection summary
   */
  async generateFullSummary(context: InspectionContext): Promise<AIResponse> {
    const systemPrompt = `You are a professional sewer inspection technician writing a complete summary for a client. Write clearly and avoid jargon. Be honest about issues but don't be alarmist.`;

    const userPrompt = `Based on the following inspection data, write:
1. A brief overview of what was found (1 paragraph)
2. Key concerns, if any (bullet points)
3. Recommendations for the homeowner (bullet points)
4. Overall assessment in one sentence

Inspection Data:
Property: ${context.propertyAddress}
Client: ${context.clientName}
Technician: ${context.technicianName || "PSI Team"}
Date: ${context.inspectionDate || "Today"}
Duration: ${context.inspectionDuration || "N/A"} minutes

Property Info:
- Home Age: ${context.homeAge || "Unknown"}
- Pipe Material: ${context.pipeMaterial?.replace("_", " ") || "Unknown"}
- Known Issues: ${context.knownIssues || "None reported"}

Findings:
- Overall Condition: ${context.overallCondition || "Not assessed"}
- Pipe Rating: ${context.pipeConditionRating || "N/A"}/5
- Root Intrusion: ${context.rootIntrusion?.severity || "None"}
- Cracks: ${context.cracks?.length || 0} found
- Bellies: ${context.bellies?.length || 0} found
- Offset Joints: ${context.offsetJoints?.length || 0} found
- Blockages: ${context.blockages?.length || 0} found
- Connection to Main: ${context.connectionToMain || "Not documented"}
- Urgency: ${context.urgencyLevel || "Not set"}

Write the complete summary:`;

    return this.chatCompletion(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      { maxTokens: 2000 }
    );
  }

  /**
   * Generate stage-specific guidance for technician
   */
  async generateStageGuidance(
    stage: string,
    context: Partial<InspectionContext>
  ): Promise<AIResponse> {
    const stagePrompts: Record<string, string> = {
      PRE_INSPECTION: `You're guiding a technician through the pre-inspection interview. Remind them to:
- Confirm client name and property address
- Ask about home age to help assess pipe material
- Ask about any known sewer issues or backup history
- Ask about recent plumbing work
- Note any special instructions

Keep it brief (2-3 sentences) and conversational.`,

      INSPECTING: `You're guiding a technician during an active inspection. Remind them to:
- Start from the access point and document the entry
- Call out distance markers for any findings
- Look for root intrusion, cracks, bellies, offset joints
- Check the connection to the main sewer line
- Speak clearly for voice notes

Keep it brief (2-3 sentences).`,

      POST_INSPECTION: `You're guiding a technician through documenting findings. Remind them to:
- Rate the overall pipe condition
- Document each defect with location and severity
- Note the connection to the main
- Provide clear recommendations
- Set appropriate urgency level

Keep it brief (2-3 sentences).`,
    };

    const stagePrompt = stagePrompts[stage] || "Guide the technician through their current stage.";

    const systemPrompt = `You are a helpful assistant for a sewer inspection technician. ${stagePrompt}

Current inspection context:
Property: ${context.propertyAddress || "Unknown"}
Client: ${context.clientName || "Unknown"}
Stage: ${stage}

Provide a brief, encouraging message for the technician:`;

    return this.chatCompletion(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: "What should I focus on at this stage?" },
      ],
      { maxTokens: 300, temperature: 0.8 }
    );
  }

  /**
   * Extract data from voice transcript
   */
  async extractDataFromTranscript(
    transcript: string,
    currentData: Partial<InspectionContext>
  ): Promise<AIResponse & { extractedData?: Partial<InspectionContext> }> {
    const systemPrompt = `You are a data extraction assistant. Extract structured information from the technician's voice notes about a sewer inspection. Return only valid JSON with the extracted fields. If a field cannot be determined, omit it.`;

    const userPrompt = `Extract information from this voice transcript:

"${transcript}"

Current known data:
${JSON.stringify(currentData, null, 2)}

Extract any of these fields if mentioned:
- pipeMaterial (CAST_IRON, CLAY, PVC, ABS, ORANGEBURG, CONCRETE, HDPE, UNKNOWN)
- overallCondition (GOOD, FAIR, NEEDS_ATTENTION, CRITICAL)
- pipeConditionRating (1-5)
- urgencyLevel (NONE, MONITOR, SOON, IMMEDIATE)
- connectionToMain
- recommendations
- Defects: rootIntrusion, cracks, bellies, offsetJoints, blockages (each with location, severity)

Return only JSON, no explanation:`;

    const response = await this.chatCompletion(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      { maxTokens: 500, temperature: 0.3 }
    );

    if (!response.success || !response.content) {
      return response;
    }

    try {
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const extractedData = JSON.parse(jsonMatch[0]) as Partial<InspectionContext>;
        return { success: true, content: response.content, extractedData };
      }
    } catch {
      // If parsing fails, just return the raw content
    }

    return response;
  }

  /**
   * Verify video description matches inspection data
   */
  async verifyVideoContent(
    videoDescription: string,
    inspectionData: InspectionContext
  ): Promise<AIResponse & { verified?: boolean; issues?: string[] }> {
    const systemPrompt = `You are verifying that a video inspection description matches the recorded findings. Check for consistency and flag any major discrepancies.`;

    const userPrompt = `Compare this video description with the inspection findings:

Video Description:
${videoDescription}

Recorded Findings:
- Overall Condition: ${inspectionData.overallCondition}
- Pipe Rating: ${inspectionData.pipeConditionRating}/5
- Root Intrusion: ${inspectionData.rootIntrusion?.severity || "None"}
- Cracks: ${inspectionData.cracks?.length || 0}
- Bellies: ${inspectionData.bellies?.length || 0}
- Urgency: ${inspectionData.urgencyLevel}

Is this consistent? Reply with JSON: { "verified": boolean, "issues": ["list of any discrepancies"] }`;

    const response = await this.chatCompletion(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      { maxTokens: 300, temperature: 0.2 }
    );

    if (!response.success || !response.content) {
      return response;
    }

    try {
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          success: true,
          content: response.content,
          verified: parsed.verified,
          issues: parsed.issues,
        };
      }
    } catch {
      // If parsing fails, return unverified
    }

    return {
      success: true,
      content: response.content,
      verified: false,
      issues: ["Could not verify video content"],
    };
  }

  /**
   * Populate the blank HTML report template with inspection data
   */
  async populateReportTemplate(
    htmlTemplate: string,
    inspectionData: Record<string, any>
  ): Promise<AIResponse> {
    const systemPrompt = `You are a professional report generation assistant. Your task is to take the provided blank HTML report template and populate it with the provided inspection data.
    
Replace placeholders (like '&nbsp;', empty fields, or bracketed text) in the HTML with the exact corresponding data from the JSON inspection data provided.
Ensure you format dates and values professionally.
Output ONLY the final populated HTML string. Do not use markdown blocks like \`\`\`html.`;

    const userPrompt = `Here is the inspection data:
${JSON.stringify(inspectionData, null, 2)}

Here is the blank HTML template to populate:
${htmlTemplate}`;

    return this.chatCompletion(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      { maxTokens: 4000, temperature: 0.1 }
    );
  }

  /**
   * Get API health status
   */
  getHealthStatus(): {
    configured: boolean;
    requestCount: number;
    lastRequestTime: number | null;
  } {
    return {
      configured: !!process.env.ANTHROPIC_API_KEY,
      requestCount: this.requestCount,
      lastRequestTime: this.lastRequestTime || null,
    };
  }

  /**
   * General chat with inspection context
   */
  async chat(
    message: string,
    context: Partial<InspectionContext> | Record<string, unknown>,
    currentStage: string,
    conversationHistory: ChatMessage[] = []
  ): Promise<AIResponse> {
    const systemPrompt = `You are an AI assistant helping a sewer inspection technician in the field. You have access to the current inspection data (including auto-extracted voice transcripts and GPS logs). Be concise, practical, and helpful. Current stage: ${currentStage}.

Property: ${(context as Partial<InspectionContext>).propertyAddress}
Client: ${(context as Partial<InspectionContext>).clientName}
${(context as Partial<InspectionContext>).pipeMaterial ? `Pipe Material: ${(context as Partial<InspectionContext>).pipeMaterial}` : ""}
${(context as Partial<InspectionContext>).overallCondition ? `Condition: ${(context as Partial<InspectionContext>).overallCondition}` : ""}
${(context as Partial<InspectionContext>).recommendations ? `Recommendations: ${(context as Partial<InspectionContext>).recommendations}` : ""}

YOUR MISSION FOR REPORT GENERATION:
Review the inspection data. Identify critical missing fields required to produce a complete sanitary lateral camera survey report. 
DO NOT ask for information that is already available or can be logically inferred from voice notes/data. 
PROMPT THE USER ONLY FOR CRITICAL MISSING DATA that cannot be verified automatically. Ask exactly one question at a time to complete the report.`;

    const messages: Array<{ role: string; content: string }> = [
      { role: "system", content: systemPrompt },
      ...conversationHistory,
      { role: "user", content: message },
    ];

    return this.chatCompletion(messages, { maxTokens: 500, temperature: 0.7 });
  }
}

// Export singleton instance
export const aiService = new AIService();
export { AIService };
