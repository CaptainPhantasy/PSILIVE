/**
 * LLM Service Interface
 * Abstracts chat completion so AbacusAI can be swapped for direct OpenAI at Vercel cutover.
 */

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LLMCompletionOptions {
  maxTokens?: number;
  temperature?: number;
  model?: string;
}

export interface LLMResult {
  success: boolean;
  content?: string;
  error?: string;
}

export interface ILLMService {
  /**
   * Send a chat completion request and return the assistant's response.
   */
  complete(messages: ChatMessage[], options?: LLMCompletionOptions): Promise<LLMResult>;
}
