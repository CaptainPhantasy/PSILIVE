/**
 * Video Processing Service
 * Handles frame extraction and audio extraction via serverless FFmpeg.
 *
 * ARCHITECTURE NOTE:
 * The Abacus.AI FFmpeg API is no longer available post-cutover.
 * This service needs a serverless FFmpeg replacement (AWS Lambda MediaConvert,
 * or a Vercel Edge Function with ffmpeg.wasm). For now, all methods return
 * graceful degradation — the report pipeline works without video stills/audio.
 */

import { logger } from "@/lib/logger";
import { uploadBuffer, getFileUrl } from "@/lib/s3";
import type {
  IMediaService,
  FrameExtractionResult,
  AudioExtractionResult,
  FFmpegJobResult,
} from "./interfaces";

// FFmpeg service configuration
// TODO: Replace with serverless FFmpeg (Lambda MediaConvert, ffmpeg.wasm, etc.)
const FFMPEG_API_URL = process.env.FFMPEG_API_URL || "";
const FFMPEG_API_KEY = process.env.FFMPEG_API_KEY || "";
const FFMPEG_POLL_INTERVAL_MS = 2000;
const FFMPEG_MAX_POLL_ATTEMPTS = 150; // 5 minutes max

class VideoProcessingService implements IMediaService {
  /**
   * Extract a single frame from a video at a specific timestamp.
   * Uses FFmpeg to seek to timestamp and capture one frame as JPEG.
   */
  async extractFrame(
    videoUrl: string,
    timestampSeconds: number,
    outputLabel: string
  ): Promise<FrameExtractionResult> {
    try {
      const sanitizedLabel = outputLabel.replace(/[^a-zA-Z0-9_-]/g, "_");
      const outputFileName = `frame_${sanitizedLabel}_${timestampSeconds}s.jpg`;

      // FFmpeg: seek to timestamp, extract 1 frame, high quality JPEG
      const ffmpegCommand = `-ss ${timestampSeconds} -i {{in_1}} -vframes 1 -q:v 2 -f image2 {{out_1}}`;

      const job = await this.runFFmpegCommand(
        { in_1: videoUrl },
        { out_1: outputFileName },
        ffmpegCommand,
        60
      );

      if (!job.success || !job.requestId) {
        return { success: false, error: job.error || "Failed to start frame extraction" };
      }

      // Poll for completion
      const result = await this.pollUntilComplete(job.requestId);
      if (!result.success || !result.outputUrl) {
        return { success: false, error: result.error || "Frame extraction failed" };
      }

      // Download the frame and re-upload to our S3
      const frameBuffer = await this.downloadToBuffer(result.outputUrl);
      if (!frameBuffer) {
        return { success: false, error: "Failed to download extracted frame" };
      }

      const cloudPath = await uploadBuffer(frameBuffer, outputFileName, "image/jpeg", false);
      const s3Url = await getFileUrl(cloudPath, false);

      return { success: true, s3Url, cloudPath };
    } catch (error) {
      logger.error("Frame extraction failed", { error, timestampSeconds, outputLabel });
      return { success: false, error: "Frame extraction failed unexpectedly" };
    }
  }

  /**
   * Extract the audio track from a video as WAV (PCM 16-bit, 44.1kHz).
   * Required for acoustic/spectrogram analysis.
   */
  async extractAudio(
    videoUrl: string,
    outputLabel: string
  ): Promise<AudioExtractionResult> {
    try {
      const sanitizedLabel = outputLabel.replace(/[^a-zA-Z0-9_-]/g, "_");
      const outputFileName = `audio_${sanitizedLabel}.wav`;

      // FFmpeg: extract audio, convert to PCM WAV at 44.1kHz mono
      const ffmpegCommand = `-i {{in_1}} -vn -acodec pcm_s16le -ar 44100 -ac 1 {{out_1}}`;

      const job = await this.runFFmpegCommand(
        { in_1: videoUrl },
        { out_1: outputFileName },
        ffmpegCommand,
        120
      );

      if (!job.success || !job.requestId) {
        return { success: false, error: job.error || "Failed to start audio extraction" };
      }

      const result = await this.pollUntilComplete(job.requestId);
      if (!result.success || !result.outputUrl) {
        return { success: false, error: result.error || "Audio extraction failed" };
      }

      // Download and re-upload to our S3
      const audioBuffer = await this.downloadToBuffer(result.outputUrl);
      if (!audioBuffer) {
        return { success: false, error: "Failed to download extracted audio" };
      }

      const cloudPath = await uploadBuffer(audioBuffer, outputFileName, "audio/wav", false);
      const s3Url = await getFileUrl(cloudPath, false);

      return { success: true, s3Url, cloudPath };
    } catch (error) {
      logger.error("Audio extraction failed", { error, outputLabel });
      return { success: false, error: "Audio extraction failed unexpectedly" };
    }
  }

  /**
   * Extract frames for all video chapters in parallel.
   */
  async extractChapterFrames(
    videoUrl: string,
    chapters: Array<{ id: string; timestamp: number; title: string }>
  ): Promise<Array<{ chapterId: string; title: string; timestamp: number } & FrameExtractionResult>> {
    const results = await Promise.allSettled(
      chapters.map(async (chapter) => {
        const result = await this.extractFrame(
          videoUrl,
          chapter.timestamp,
          `chapter_${chapter.id}`
        );
        return {
          chapterId: chapter.id,
          title: chapter.title,
          timestamp: chapter.timestamp,
          ...result,
        };
      })
    );

    return results.map((r, i) => {
      if (r.status === "fulfilled") return r.value;
      return {
        chapterId: chapters[i].id,
        title: chapters[i].title,
        timestamp: chapters[i].timestamp,
        success: false,
        error: "Frame extraction promise rejected",
      };
    });
  }

  /**
   * Run an arbitrary FFmpeg command via serverless FFmpeg API.
   */
  async runFFmpegCommand(
    inputFiles: Record<string, string>,
    outputFiles: Record<string, string>,
    ffmpegCommand: string,
    maxRunSeconds: number = 300
  ): Promise<FFmpegJobResult> {
    if (!FFMPEG_API_KEY) {
      return { success: false, error: "FFmpeg API not configured — video processing unavailable" };
    }

    try {
      const response = await fetch(`${FFMPEG_API_URL}/createRunFfmpegCommandRequest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deployment_token: FFMPEG_API_KEY,
          input_files: inputFiles,
          output_files: outputFiles,
          ffmpeg_command: ffmpegCommand,
          max_command_run_seconds: maxRunSeconds,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return { success: false, error: errorData.error || `FFmpeg API error: ${response.status}` };
      }

      const data = await response.json();
      if (!data.request_id) {
        return { success: false, error: "No request_id returned from FFmpeg API" };
      }

      return { success: true, requestId: data.request_id };
    } catch (error) {
      logger.error("FFmpeg command request failed", { error });
      return { success: false, error: "Failed to submit FFmpeg command" };
    }
  }

  /**
   * Poll an async FFmpeg job for completion.
   */
  async pollFFmpegJob(requestId: string): Promise<FFmpegJobResult> {
    if (!FFMPEG_API_KEY) {
      return { success: false, error: "FFmpeg API not configured — video processing unavailable" };
    }

    try {
      const response = await fetch(`${FFMPEG_API_URL}/getRunFfmpegCommandStatus`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          request_id: requestId,
          deployment_token: FFMPEG_API_KEY,
        }),
      });

      const data = await response.json();
      const status = data?.status || "FAILED";

      if (status === "SUCCESS" && data?.result?.result) {
        // Extract first output URL
        const outputs = data.result.result;
        const firstOutputKey = Object.keys(outputs)[0];
        const outputUrl = firstOutputKey ? outputs[firstOutputKey] : undefined;
        return { success: true, requestId, outputUrl };
      } else if (status === "FAILED") {
        return { success: false, requestId, error: data?.result?.error || "FFmpeg job failed" };
      }

      // Still processing
      return { success: false, requestId, error: "PROCESSING" };
    } catch (error) {
      logger.error("FFmpeg poll failed", { error, requestId });
      return { success: false, requestId, error: "Failed to poll FFmpeg status" };
    }
  }

  /**
   * Poll until FFmpeg job completes or times out.
   */
  private async pollUntilComplete(requestId: string): Promise<FFmpegJobResult> {
    for (let i = 0; i < FFMPEG_MAX_POLL_ATTEMPTS; i++) {
      await new Promise((resolve) => setTimeout(resolve, FFMPEG_POLL_INTERVAL_MS));
      const result = await this.pollFFmpegJob(requestId);

      if (result.error === "PROCESSING") continue;
      return result;
    }

    return { success: false, requestId, error: "FFmpeg job timed out" };
  }

  /**
   * Download a URL to a Buffer.
   */
  private async downloadToBuffer(url: string): Promise<Buffer | null> {
    try {
      const response = await fetch(url);
      if (!response.ok) return null;
      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch {
      return null;
    }
  }
}

export const videoProcessingService = new VideoProcessingService();
export { VideoProcessingService };
