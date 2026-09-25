/**
 * PDF Generation Service Interface
 * Abstracts PDF generation so AbacusAI can be swapped for Puppeteer/Browserless at Vercel cutover.
 */

export interface PDFGenerationOptions {
  format?: "A4" | "Letter";
  margin?: {
    top: string;
    right: string;
    bottom: string;
    left: string;
  };
  printBackground?: boolean;
  landscape?: boolean;
}

export interface PDFResult {
  success: boolean;
  buffer?: Buffer;
  error?: string;
}

export interface IPDFService {
  /**
   * Convert HTML string to PDF buffer.
   */
  generatePDF(html: string, options?: PDFGenerationOptions): Promise<PDFResult>;
}
