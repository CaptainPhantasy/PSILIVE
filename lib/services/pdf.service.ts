/**
 * PDF Generation Service
 * Consolidates PDF logic from report-generation and approval routes.
 *
 * Runs Chromium directly in the Vercel function using puppeteer-core plus
 * @sparticuz/chromium. This is the owned cutover path that replaces the
 * retired Abacus HTML-to-PDF service; no external PDF_API_URL bridge is
 * required for the production report pipeline.
 */

import { existsSync } from "node:fs";
import chromium from "@sparticuz/chromium";
import puppeteer, { type Browser, type PDFOptions } from "puppeteer-core";

import {
  IPDFService,
  PDFGenerationOptions,
  PDFResult,
} from "./interfaces/pdf.interface";

const DEFAULT_OPTIONS: Required<PDFGenerationOptions> = {
  format: "A4",
  margin: { top: "20mm", right: "20mm", bottom: "20mm", left: "20mm" },
  printBackground: true,
  landscape: false,
};

const PDF_RENDER_TIMEOUT_MS = 45_000;

function toPuppeteerOptions(options?: PDFGenerationOptions): PDFOptions {
  const merged = {
    ...DEFAULT_OPTIONS,
    ...options,
    margin: { ...DEFAULT_OPTIONS.margin, ...options?.margin },
  };

  return {
    format: merged.format,
    margin: merged.margin,
    printBackground: merged.printBackground,
    landscape: merged.landscape,
    preferCSSPageSize: true,
    timeout: PDF_RENDER_TIMEOUT_MS,
  };
}

function resolveLocalChromePath(): string | null {
  const candidates =
    process.platform === "darwin"
      ? [
          "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
          "/Applications/Chromium.app/Contents/MacOS/Chromium",
        ]
      : process.platform === "win32"
        ? [
            "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
            "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
          ]
        : [];

  return candidates.find((candidate) => existsSync(candidate)) ?? null;
}

async function resolveExecutablePath(): Promise<string> {
  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    return process.env.PUPPETEER_EXECUTABLE_PATH;
  }

  const localChromePath = resolveLocalChromePath();
  if (localChromePath) {
    return localChromePath;
  }

  if (process.platform === "darwin" || process.platform === "win32") {
    throw new Error(
      "Local PDF smoke requires PUPPETEER_EXECUTABLE_PATH or Chrome/Chromium installed; Vercel uses bundled @sparticuz/chromium."
    );
  }

  return chromium.executablePath();
}

async function launchBrowser(): Promise<Browser> {
  const executablePath = await resolveExecutablePath();

  return puppeteer.launch({
    args: [
      ...chromium.args,
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--hide-scrollbars",
      "--no-sandbox",
    ],
    executablePath,
    headless: true,
  });
}

class ChromiumPDFService implements IPDFService {
  async generatePDF(
    html: string,
    options?: PDFGenerationOptions
  ): Promise<PDFResult> {
    if (!html.trim()) {
      return { success: false, error: "Cannot generate PDF from empty HTML" };
    }

    let browser: Browser | undefined;

    try {
      browser = await launchBrowser();
      const page = await browser.newPage();
      page.setDefaultTimeout(PDF_RENDER_TIMEOUT_MS);
      page.setDefaultNavigationTimeout(PDF_RENDER_TIMEOUT_MS);

      await page.setContent(html, {
        waitUntil: ["load", "domcontentloaded"],
        timeout: PDF_RENDER_TIMEOUT_MS,
      });

      const pdf = await page.pdf(toPuppeteerOptions(options));
      const buffer = Buffer.isBuffer(pdf) ? pdf : Buffer.from(pdf);

      return { success: true, buffer };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown PDF generation error";
      console.error("PDF service error:", message);
      return { success: false, error: message };
    } finally {
      await browser?.close().catch((closeError) => {
        const message =
          closeError instanceof Error ? closeError.message : String(closeError);
        console.error("PDF browser close error:", message);
      });
    }
  }
}

export const pdfService: IPDFService = new ChromiumPDFService();
