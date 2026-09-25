/**
 * Email Service Interface
 * Abstracts email sending so AbacusAI notifications can be swapped for SendGrid at Vercel cutover.
 */

export interface EmailParams {
  recipientEmail: string;
  recipientName?: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
}

export interface EmailResult {
  success: boolean;
  error?: string;
}

export interface IEmailService {
  /**
   * Send a notification email.
   */
  send(params: EmailParams): Promise<EmailResult>;
}
