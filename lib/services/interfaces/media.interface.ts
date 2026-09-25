/**
 * Media Processing Service Interface
 * Abstracts FFmpeg operations so AbacusAI can be swapped for ffmpeg-static/Transloadit at Vercel cutover.
 */

export interface FrameExtractionResult {
  success: boolean;
  s3Url?: string;
  cloudPath?: string;
  error?: string;
}

export interface AudioExtractionResult {
  success: boolean;
  s3Url?: string;
  cloudPath?: string;
  durationSeconds?: number;
  error?: string;
}

export interface FFmpegJobResult {
  success: boolean;
  requestId?: string;
  outputUrl?: string;
  error?: string;
}

export interface IMediaService {
  /**
   * Extract a single frame from a video at a specific timestamp.
   * Returns the S3 URL of the uploaded JPEG.
   */
  extractFrame(
    videoUrl: string,
    timestampSeconds: number,
    outputLabel: string
  ): Promise<FrameExtractionResult>;

  /**
   * Extract the audio track from a video as WAV.
   * Returns the S3 URL of the uploaded WAV file.
   */
  extractAudio(videoUrl: string, outputLabel: string): Promise<AudioExtractionResult>;

  /**
   * Run an arbitrary FFmpeg command (async, returns request ID for polling).
   */
  runFFmpegCommand(
    inputFiles: Record<string, string>,
    outputFiles: Record<string, string>,
    ffmpegCommand: string,
    maxRunSeconds?: number
  ): Promise<FFmpegJobResult>;

  /**
   * Poll an async FFmpeg job for completion.
   */
  pollFFmpegJob(requestId: string): Promise<FFmpegJobResult>;
}
