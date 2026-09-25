// @ts-nocheck
/**
 * Video Integrity Checker
 * Validates video files before and during upload
 */

import { logger } from "./logger";
import { AppError, ErrorCode } from "./errors";

// Supported video formats
const SUPPORTED_FORMATS = ["video/mp4", "video/quicktime", "video/x-msvideo", "video/webm", "video/3gpp"];
const MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024; // 2GB
const MIN_DURATION_SECONDS = 300; // 5 minutes
const MAX_DURATION_SECONDS = 7200; // 2 hours

export interface VideoValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  metadata: {
    fileName: string;
    fileSize: number;
    duration: number | null;
    mimeType: string | null;
    resolution: { width: number; height: number } | null;
    bitrate: number | null;
    hasAudio: boolean;
    frameRate: number | null;
  };
}

export interface VideoIntegrityCheck {
  fileStructureValid: boolean;
  headersReadable: boolean;
  noCorruption: boolean;
  durationMatches: boolean;
  codecSupported: boolean;
}

class VideoIntegrityService {
  /**
   * Validate video file before upload
   */
  async validateFile(file: File): Promise<VideoValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const metadata: VideoValidationResult["metadata"] = {
      fileName: file.name,
      fileSize: file.size,
      duration: null,
      mimeType: file.type || null,
      resolution: null,
      bitrate: null,
      hasAudio: false,
      frameRate: null,
    };

    // Check file size
    if (file.size === 0) {
      errors.push("File is empty (0 bytes)");
    } else if (file.size > MAX_FILE_SIZE) {
      errors.push(`File size (${this.formatBytes(file.size)}) exceeds maximum (${this.formatBytes(MAX_FILE_SIZE)})`);
    }

    // Check MIME type
    if (file.type && !SUPPORTED_FORMATS.includes(file.type)) {
      warnings.push(`File type "${file.type}" may not be supported. Recommended: MP4, MOV, AVI`);
    }

    // If we have browser support, try to get video metadata
        if (typeof window !== "undefined") {
          try {
            const videoMetadata = await this.extractVideoMetadata(file);
            if (videoMetadata) {
              metadata.duration = videoMetadata.duration;
              metadata.resolution = videoMetadata.resolution;
              metadata.bitrate = videoMetadata.bitrate;
              metadata.hasAudio = videoMetadata.hasAudio;
              metadata.frameRate = videoMetadata.frameRate;

              // Duration is advisory: field inspections may pause, stop, resume, or add later voiceover notes.
              if (videoMetadata.duration !== null) {
                if (videoMetadata.duration < MIN_DURATION_SECONDS) {
                  warnings.push(
                    `Video duration (${Math.floor(videoMetadata.duration / 60)}:${Math.floor(videoMetadata.duration % 60)
                      .toString()
                      .padStart(2, "0")}) is shorter than the usual ${Math.floor(MIN_DURATION_SECONDS / 60)} minute reference. Upload is allowed; document any stops, return passes, or voiceover notes.`
                  );
                }
                if (videoMetadata.duration > MAX_DURATION_SECONDS) {
                  warnings.push(
                    `Video duration (${Math.floor(videoMetadata.duration / 60)} minutes) is unusually long. Upload is allowed; verify the footage belongs to this inspection.`
                  );
                }
              }

              // Check resolution
              if (videoMetadata.resolution) {
                if (videoMetadata.resolution.width < 640 || videoMetadata.resolution.height < 480) {
                  warnings.push(
                    `Video resolution (${videoMetadata.resolution.width}x${videoMetadata.resolution.height}) is low. HD recommended.`
                  );
                }
              }

              // Check audio
              if (!videoMetadata.hasAudio) {
                warnings.push("Video has no audio track. Add separate voice notes for report context.");
              }
            }
          } catch (error) {
            warnings.push("Could not read video metadata. Upload will proceed but validation is limited.");
          }
        }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      metadata,
    };
  }

  /**
   * Extract video metadata using browser APIs
   */
  private async extractVideoMetadata(file: File): Promise<{
    duration: number | null;
    resolution: { width: number; height: number } | null;
    bitrate: number | null;
    hasAudio: boolean;
    frameRate: number | null;
  } | null> {
    return new Promise((resolve) => {
      const video = document.createElement("video");
      video.preload = "metadata";

      video.onloadedmetadata = () => {
        resolve({
          duration: video.duration || null,
          resolution: video.videoWidth && video.videoHeight
            ? { width: video.videoWidth, height: video.videoHeight }
            : null,
          bitrate: null, // Can't get from browser
          hasAudio: video.mozHasAudio ?? video.webkitAudioDecodedByteCount > 0 ?? false,
          frameRate: null, // Can't get from browser
        });
        URL.revokeObject(video.src);
      };

      video.onerror = () => {
        URL.revokeObject(video.src);
        resolve(null);
      };

      // Timeout after 10 seconds
      setTimeout(() => {
        URL.revokeObject(video.src);
        resolve(null);
      }, 10000);

      video.src = URL.createObjectURL(file);
    });
  }

  /**
   * Calculate checksum for file integrity
   */
  async calculateChecksum(file: File, algorithm: "SHA-256" | "MD5" = "SHA-256"): Promise<string> {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest(algorithm, buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  /**
   * Perform integrity check on uploaded file
   */
  async checkIntegrity(file: File): Promise<VideoIntegrityCheck> {
    // Basic file structure check
    const buffer = await file.slice(0, 1024).arrayBuffer();
    const bytes = new Uint8Array(buffer);

    // Check for common video file signatures
    const fileSignature = Array.from(bytes.slice(0, 12))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    const isMP4 = fileSignature.startsWith("000000") && bytes[4] === 0x66; // 'ftyp'
    const isMOV = bytes[4] === 0x6d && bytes[5] === 0x6f && bytes[6] === 0x6f; // 'moov'
    const isAVI = bytes[0] === 0x52 && bytes[1] === 0x49; // 'RI'
    const isWebM = bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xd3; // WebM signature

    const headersReadable = isMP4 || isMOV || isAVI || isWebM;

    // Try to parse video metadata
    let noCorruption = false;
    try {
      const metadata = await this.extractVideoMetadata(file);
      noCorruption = metadata !== null && metadata.duration !== null && metadata.duration > 0;
    } catch {
      noCorruption = false;
    }

    return {
      fileStructureValid: file.size > 0,
      headersReadable,
      noCorruption,
      durationMatches: noCorruption,
      codecSupported: headersReadable,
    };
  }

  /**
   * Verify chunk integrity during multipart upload
   */
  async verifyChunk(chunk: Blob, expectedSize: number, chunkIndex: number): Promise<boolean> {
    if (chunk.size !== expectedSize) {
      logger.warn(`Chunk ${chunkIndex} size mismatch`, {
        expected: expectedSize,
        actual: chunk.size,
      });
      return false;
    }

    // Could add checksum verification here
    return true;
  }

  /**
     * Validate video matches inspection requirements.
     * Duration is advisory only because real inspections may pause, stop, resume, or add return voiceovers.
     */
    async validateInspectionVideo(
      file: File,
      requirements: {
        minDuration?: number;
        maxDuration?: number;
        minResolution?: { width: number; height: number };
        requireAudio?: boolean;
      }
    ): Promise<VideoValidationResult> {
      const baseResult = await this.validateFile(file);

      if (!baseResult.valid) {
        return baseResult;
      }

      const errors = [...baseResult.errors];
      const warnings = [...baseResult.warnings];

      if (requirements.minDuration && baseResult.metadata.duration && baseResult.metadata.duration < requirements.minDuration) {
        warnings.push(
          `Video duration (${Math.floor(baseResult.metadata.duration / 60)} min) is shorter than the usual field-work reference (${Math.floor(requirements.minDuration / 60)} min). Upload is allowed; document any stops, return passes, or voiceover notes in the report notes.`
        );
      }

      if (requirements.maxDuration && baseResult.metadata.duration && baseResult.metadata.duration > requirements.maxDuration) {
        warnings.push(
          `Video duration (${Math.floor(baseResult.metadata.duration / 60)} min) is longer than the usual reference (${Math.floor(requirements.maxDuration / 60)} min). Upload is allowed; verify the footage is relevant to this inspection.`
        );
      }

      // Check minimum resolution
      if (requirements.minResolution && baseResult.metadata.resolution) {
        if (
          baseResult.metadata.resolution.width < requirements.minResolution.width ||
          baseResult.metadata.resolution.height < requirements.minResolution.height
        ) {
          warnings.push(
            `Video resolution may be too low. Minimum: ${requirements.minResolution.width}x${requirements.minResolution.height}`
          );
        }
      }

      if (requirements.requireAudio && !baseResult.metadata.hasAudio) {
        warnings.push("Video has no audio track. Upload is allowed; add separate voice notes for report context.");
      }

      return {
        ...baseResult,
        valid: errors.length === 0,
        errors,
        warnings,
      };
    }

  /**
   * Format bytes to human readable string
   */
  private formatBytes(bytes: number): string {
    if (bytes < 1024) {
      return `${bytes} B`;
    } else if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    } else if (bytes < 1024 * 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    } else {
      return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    }
  }

  /**
   * Get upload recommendations based on file size
   */
  getUploadStrategy(fileSize: number): {
    method: "single" | "multipart";
    chunkSize: number;
    estimatedChunks: number;
  } {
    if (fileSize > 100 * 1024 * 1024) {
      // Files over 100MB should use multipart
      const chunkSize = 10 * 1024 * 1024; // 10MB chunks
      return {
        method: "multipart",
        chunkSize,
        estimatedChunks: Math.ceil(fileSize / chunkSize),
      };
    }

    return {
      method: "single",
      chunkSize: fileSize,
      estimatedChunks: 1,
    };
  }
}

export const videoIntegrityService = new VideoIntegrityService();
