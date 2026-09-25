/**
 * Logo Embedding Utility
 * Reads PSI logo files and returns base64 data URLs for embedding in HTML reports.
 * Uses pre-optimized 128px versions for reasonable file sizes.
 */

import { readFileSync, existsSync } from "fs";
import { join } from "path";

// Cache the base64 strings — they don't change at runtime
let _logoCache: string | null = null;

/**
 * Get the PSI logo as a base64 data URL.
 * Returns null if the file doesn't exist (graceful degradation).
 */
export function getPSILogoDataUrl(): string | null {
  if (_logoCache !== null) return _logoCache;

  // Try optimized report version first, then fall back to full-size
  const candidates = [
    join(process.cwd(), "public/images/report/logo-128.png"),
    join(process.cwd(), "public/logo.png"),
  ];

  for (const path of candidates) {
    if (existsSync(path)) {
      try {
        const buffer = readFileSync(path);
        _logoCache = `data:image/png;base64,${buffer.toString("base64")}`;
        return _logoCache;
      } catch {
        continue;
      }
    }
  }

  _logoCache = ""; // Cache the miss to avoid repeated FS reads
  return null;
}
