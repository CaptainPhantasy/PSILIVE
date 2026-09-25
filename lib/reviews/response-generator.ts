// ============================================================================
// AI Review Response Generator
// Uses LLM to generate personalized review responses
// ============================================================================

export interface Review {
  id: string;
  rating: number;
  content: string;
  authorName?: string;
  source: string;
}

interface GeneratedResponse {
  response: string;
  confidence: number;
  suggestedTone: 'professional' | 'friendly' | 'apologetic' | 'grateful';
}

// ============================================================================
// Prompt Templates
// ============================================================================

const RESPONSE_PROMPT = `You are a professional business owner responding to customer reviews for a sewer inspection company called Precision Sewer Inspections.

Company Info:
- Professional sewer and drain camera inspections
- Serves Indianapolis metro area (Indianapolis, Carmel, Fishers, Noblesville, Greenwood, etc.)
- InterNACHI member, fully insured
- Focus on customer education and transparency

Response Rules:
1. Be specific - reference something from the review
2. Keep it concise (under 150 words)
3. Professional but personable tone
4. Include a subtle call-to-action when appropriate
5. NEVER make up claims or promise things you can't verify
6. For negative reviews: acknowledge the issue, take responsibility if warranted, offer to make it right

Review to respond to:
Rating: {rating}/5
Author: {authorName}
Content: {content}

Generate a response in this format:
TONE: [professional|friendly|apologetic|grateful]
RESPONSE: [your response text]
`;

const POSITIVE_RESPONSE_PROMPT = `Generate a grateful response to this positive review:

Rating: {rating}/5
Author: {authorName}
Content: {content}

Keep it warm, specific to their experience, and end with an invitation to return or refer others.`;

// ============================================================================
// Response Generator Class
// ============================================================================

export class ReviewResponseGenerator {
  private apiKey?: string;
  private model: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.OPENAI_API_KEY;
    this.model = 'gpt-4o-mini';
  }

  // Generate a response using OpenAI
  async generate(review: Review): Promise<GeneratedResponse> {
    // If no API key, use template-based response
    if (!this.apiKey) {
      return this.generateTemplateResponse(review);
    }

    try {
      const prompt = review.rating >= 4 
        ? POSITIVE_RESPONSE_PROMPT
        : RESPONSE_PROMPT;

      const formattedPrompt = prompt
        .replace('{rating}', review.rating.toString())
        .replace('{authorName}', review.authorName || 'Valued Customer')
        .replace('{content}', review.content);

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: 'You are a professional business owner. Keep responses concise and genuine.' },
            { role: 'user', content: formattedPrompt },
          ],
          max_tokens: 300,
          temperature: 0.7,
        }),
      });

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';

      // Parse the response
      const toneMatch = content.match(/TONE:\s*(\w+)/i);
      const responseMatch = content.match(/RESPONSE:\s*([\s\S]+)/i);

      return {
        response: responseMatch?.[1]?.trim() || content,
        confidence: 0.85,
        suggestedTone: (toneMatch?.[1] as GeneratedResponse['suggestedTone']) || 'professional',
      };
    } catch (error) {
      console.error('Error generating response:', error);
      // Fall back to template
      return this.generateTemplateResponse(review);
    }
  }

  // Generate response without API (template-based)
  private generateTemplateResponse(review: Review): GeneratedResponse {
    const authorName = review.authorName || 'Valued Customer';

    if (review.rating === 5) {
      return {
        response: `Thank you so much, ${authorName}! We really appreciate you taking the time to share your experience. It's wonderful to hear we exceeded your expectations. If you ever need us again or know someone who does, we're always here to help. Have a great day!`,
        confidence: 0.9,
        suggestedTone: 'grateful',
      };
    }

    if (review.rating === 4) {
      return {
        response: `Hi ${authorName}, thank you for the great feedback! We're thrilled to hear you had a positive experience. We appreciate you choosing Precision Sewer Inspections and hope to serve you again in the future.`,
        confidence: 0.9,
        suggestedTone: 'friendly',
      };
    }

    if (review.rating === 3) {
      return {
        response: `Thank you for your feedback, ${authorName}. We appreciate you sharing your experience. If there's anything specific we could have done better, please reach out to us directly so we can address your concerns. We're always looking to improve our service.`,
        confidence: 0.7,
        suggestedTone: 'professional',
      };
    }

    // Negative reviews (1-2 stars)
    return {
      response: `Hi ${authorName}, we're sorry to hear your experience wasn't what you expected. Your feedback is important to us, and we'd like the opportunity to make things right. Please contact us directly so we can discuss this further. We're committed to ensuring every customer is satisfied.`,
      confidence: 0.7,
      suggestedTone: 'apologetic',
    };
  }

  // Generate batch responses
  async generateBatch(reviews: Review[]): Promise<Map<string, GeneratedResponse>> {
    const results = new Map<string, GeneratedResponse>();

    // Process in parallel with rate limiting
    const batchSize = 3;
    for (let i = 0; i < reviews.length; i += batchSize) {
      const batch = reviews.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(review => this.generate(review))
      );
      batchResults.forEach((result, index) => {
        results.set(batch[index].id, result);
      });
    }

    return results;
  }
}

// ============================================================================
// Sentiment Analyzer
// ============================================================================

interface SentimentResult {
  sentiment: 'positive' | 'neutral' | 'negative';
  score: number; // -1 to 1
  themes: string[];
}

export function analyzeSentiment(review: Review): SentimentResult {
  const content = review.content.toLowerCase();
  
  // Simple keyword-based sentiment
  const positiveWords = ['great', 'excellent', 'amazing', 'professional', 'friendly', 'thorough', 'helpful', 'knowledgeable', 'quick', 'clean', 'recommend', 'perfect', 'outstanding', 'awesome'];
  const negativeWords = ['terrible', 'awful', 'horrible', 'rude', 'slow', 'expensive', 'problem', 'issue', 'disappointed', 'unprofessional', 'worst', 'avoid', 'failed', 'broken'];

  let positiveCount = 0;
  let negativeCount = 0;

  positiveWords.forEach(word => {
    if (content.includes(word)) positiveCount++;
  });
  negativeWords.forEach(word => {
    if (content.includes(word)) negativeCount++;
  });

  const total = positiveCount + negativeCount;
  const score = total === 0 ? 0 : (positiveCount - negativeCount) / total;

  let sentiment: SentimentResult['sentiment'] = 'neutral';
  if (score > 0.2) sentiment = 'positive';
  if (score < -0.2) sentiment = 'negative';

  // Extract themes
  const themes: string[] = [];
  if (content.includes('professional') || content.includes('technician')) themes.push('technician');
  if (content.includes('price') || content.includes('cost') || content.includes('expensive')) themes.push('pricing');
  if (content.includes('time') || content.includes('hour') || content.includes('quick')) themes.push('timing');
  if (content.includes('report') || content.includes('video')) themes.push('documentation');
  if (content.includes('communication') || content.includes('responsive')) themes.push('communication');

  return {
    sentiment,
    score,
    themes,
  };
}

// ============================================================================
// Convenience Exports
// ============================================================================

export async function generateReviewResponse(review: Review): Promise<string> {
  const generator = new ReviewResponseGenerator();
  const result = await generator.generate(review);
  return result.response;
}

export function getSentiment(review: Review): SentimentResult {
  return analyzeSentiment(review);
}
