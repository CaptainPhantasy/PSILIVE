/**
 * Anthropic AI Service
 * Handles Claude API interactions for post-cutover PSI application
 * Uses @anthropic-ai/sdk for direct Anthropic API access
 */

import Anthropic from "@anthropic-ai/sdk";
import { logger } from "@/lib/logger";
import { AppError, ErrorCode } from "@/lib/errors";

// Initialize Anthropic client
const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Default model (can be overridden per request)
const DEFAULT_MODEL = process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-20241022";

// Request timeout
const REQUEST_TIMEOUT = 30000; // 30 seconds

interface ClaudeResponse {
  success: boolean;
  content?: string;
  error?: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

class AnthropicAIService {
  /**
   * Send a message to Claude and get a response
   */
  async sendMessage(
    userMessage: string,
    systemPrompt?: string,
    model = DEFAULT_MODEL
  ): Promise<ClaudeResponse> {
    try {
      logger.info(`[AnthropicAI] Sending message to ${model}`);

      const response = await client.messages.create({
        model,
        max_tokens: 2048,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: userMessage,
          },
        ],
      });

      const textContent = response.content.find((block) => block.type === "text");
      if (!textContent || textContent.type !== "text") {
        throw new Error("No text content in response");
      }

      logger.info(
        `[AnthropicAI] Response received. Tokens - input: ${response.usage.input_tokens}, output: ${response.usage.output_tokens}`
      );

      return {
        success: true,
        content: textContent.text,
        usage: {
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens,
        },
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      logger.error(`[AnthropicAI] Error: ${errorMessage}`);

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Generate an inspection report narrative
   */
  async generateReportNarrative(
    inspectionData: Record<string, any>,
    clientName: string
  ): Promise<ClaudeResponse> {
    const systemPrompt = `You are an expert sewer inspection report writer. 
Generate a professional, concise narrative based on the provided inspection data.
Focus on findings, recommendations, and urgency level.
Keep the tone professional but accessible to homeowners.`;

    const userMessage = `
Generate a report narrative for client: ${clientName}

Inspection Data:
${JSON.stringify(inspectionData, null, 2)}

Please generate a comprehensive but concise narrative summary.`;

    return this.sendMessage(userMessage, systemPrompt);
  }

  /**
   * Analyze inspection findings and suggest recommendations
   */
  async analyzeFindings(
    findings: Record<string, any>
  ): Promise<ClaudeResponse> {
    const systemPrompt = `You are a sewer system expert. 
Analyze the provided inspection findings and provide professional recommendations.
Prioritize issues by severity and urgency.
Include estimated timelines and potential costs where appropriate.`;

    const userMessage = `
Please analyze these inspection findings and provide recommendations:

${JSON.stringify(findings, null, 2)}`;

    return this.sendMessage(userMessage, systemPrompt);
  }

  /**
   * Extract structured data from inspection photos/descriptions
   */
  async extractStructuredData(
    description: string,
    dataSchema: Record<string, any>
  ): Promise<ClaudeResponse> {
    const systemPrompt = `You are a data extraction expert for sewer inspection systems.
Extract and structure the provided inspection information according to the given schema.
Return valid JSON that matches the schema.
If information is not available, use null.`;

    const userMessage = `
Extract structured data from this inspection description:

Description: ${description}

Target Schema:
${JSON.stringify(dataSchema, null, 2)}

Return ONLY valid JSON matching the schema above.`;

    return this.sendMessage(userMessage, systemPrompt);
  }

  /**
   * Health check: verify API connectivity
   */
  async healthCheck(): Promise<{ healthy: boolean; message: string }> {
    try {
      const response = await this.sendMessage(
        "Say 'OK' if you receive this message.",
        "Respond with exactly one word: OK"
      );

      if (response.success && response.content?.includes("OK")) {
        return { healthy: true, message: "Anthropic API is accessible" };
      } else {
        return {
          healthy: false,
          message: `Unexpected response: ${response.content}`,
        };
      }
    } catch (error) {
      return {
        healthy: false,
        message: `Health check failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      };
    }
  }
}

// Export singleton instance
export const anthropicAIService = new AnthropicAIService();

// Type exports
export type { ClaudeResponse, ChatMessage };
