/**
 * Report Agent Service — "ReportForge"
 * Orchestrates the complete enhanced report generation pipeline.
 *
 * Pipeline phases:
 * 1. DATA COLLECTION — Fetch all inspection data from Prisma
 * 2. ASSET PROCESSING — Extract video stills, audio, map (parallel)
 * 3. NARRATIVE GENERATION — LLM generates material context, condition, limitations
 * 4. REPORT ASSEMBLY — Render enhanced HTML → PDF → S3 → GeneratedReport
 */

import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { uploadBuffer, getFileUrl } from "@/lib/s3";
import { format } from "date-fns";
import { generateEnhancedReportHTML, type EnhancedReportData } from "@/lib/report-template-enhanced";
import { videoProcessingService } from "./video-processing.service";
import { acousticAnalysisService, type AcousticResult } from "./acoustic-analysis.service";
import { generateSpectrographDataUrl } from "./spectrograph.service";
import { mapService, type MapResult } from "./map-service";
import { reportNarrativesService, type InspectionBundle } from "./report-narratives.service";
import { pdfService } from "./pdf.service";


// ─── Types ───────────────────────────────────────────────────────────────────

export interface ReportResult {
  success: boolean;
  cloudPath?: string;
  reportUrl?: string;
  processingTimeMs?: number;
  sectionsGenerated?: string[];
  error?: string;
}

interface ProcessedAssets {
  videoStills: EnhancedReportData["videoStills"];
  surfaceLocatePhotos: EnhancedReportData["surfaceLocatePhotos"];
  acousticResult: AcousticResult | null;
  mapImageUrl: string | null;
  videoUrl: string | null;
  highlightReelUrl: string | null;
}

interface Narratives {
  materialContext: string | null;
  acousticInterpretation: string | null;
  conditionNarrative: string | null;
  limitationsText: string | null;
}

// ─── Service ─────────────────────────────────────────────────────────────────

class ReportAgentService {
  /**
   * Generate a complete enhanced report for an inspection.
   * This is the main entry point — called by the API route.
   */
  async generateEnhancedReport(inspectionId: string): Promise<ReportResult> {
    const startTime = Date.now();
    const sectionsGenerated: string[] = [];

    try {
      // ── Phase 1: Data Collection ──
      logger.info("ReportForge: Phase 1 — Data Collection", { inspectionId });
      const bundle = await this.collectData(inspectionId);
      if (!bundle) {
        return { success: false, error: "Inspection not found" };
      }
      sectionsGenerated.push("data_collection");

      // ── Phase 2: Asset Processing (parallel) ──
      logger.info("ReportForge: Phase 2 — Asset Processing", { inspectionId });
      const assets = await this.processAssets(bundle, inspectionId);
      sectionsGenerated.push("asset_processing");

      // ── Phase 3: Narrative Generation ──
      logger.info("ReportForge: Phase 3 — Narrative Generation", { inspectionId });
      const narratives = await this.generateNarratives(bundle, assets);
      sectionsGenerated.push("narrative_generation");

      // ── Phase 4: Report Assembly ──
      logger.info("ReportForge: Phase 4 — Report Assembly", { inspectionId });
      const reportData = this.assembleReportData(bundle, assets, narratives);
      const html = generateEnhancedReportHTML(reportData, true);
      sectionsGenerated.push("html_generation");

      // ── Phase 5: PDF Generation & Upload ──
      logger.info("ReportForge: Phase 5 — PDF Generation", { inspectionId });
      const pdfResult = await this.generatePDF(html);
      if (!pdfResult.success || !pdfResult.buffer) {
        return { success: false, error: pdfResult.error || "PDF generation failed" };
      }

      const fileName = `enhanced-report-${bundle.inspectionNumber}.pdf`;
      const cloudPath = await uploadBuffer(pdfResult.buffer, fileName, "application/pdf", false);
      const reportUrl = await getFileUrl(cloudPath, false);
      sectionsGenerated.push("pdf_upload");

      // ── Phase 6: Save to Database ──
      await prisma.generatedReport.upsert({
        where: { inspectionId },
        create: {
          inspectionId,
          clientReportCloudPath: cloudPath,
        },
        update: {
          clientReportCloudPath: cloudPath,
          updatedAt: new Date(),
        },
      });
      sectionsGenerated.push("database_save");

      const processingTimeMs = Date.now() - startTime;
      logger.info("ReportForge: Complete", { inspectionId, processingTimeMs, sectionsGenerated });

      return {
        success: true,
        cloudPath,
        reportUrl,
        processingTimeMs,
        sectionsGenerated,
      };
    } catch (error) {
      logger.error("ReportForge: Pipeline failed", { error, inspectionId, sectionsGenerated });
      return {
        success: false,
        error: "Report generation pipeline failed",
        processingTimeMs: Date.now() - startTime,
        sectionsGenerated,
      };
    }
  }

  // ─── Phase 1: Data Collection ────────────────────────────────────────────

  private async collectData(inspectionId: string): Promise<(InspectionBundle & { raw: Record<string, unknown> }) | null> {
    const inspection = await prisma.inspection.findUnique({
      where: { id: inspectionId },
      include: {
        job: true,
        technician: { select: { name: true, email: true } },
        clientSignature: true,
        photos: true,
        videoAttachment: {
          include: { chapters: { orderBy: { timestamp: "asc" as const } } },
        },
        voiceRecordings: true,
        generatedReport: true,
        locationLogs: true,
      },
    });

    if (!inspection) return null;

    // Parse extended measurements
    const extendedMeasurements = inspection.extendedMeasurements as InspectionBundle["extendedMeasurements"] ?? null;

    return {
      inspectionNumber: inspection.inspectionNumber,
      propertyAddress: inspection.job.propertyAddress,
      propertyCity: inspection.job.propertyCity,
      propertyState: inspection.job.propertyState,
      clientName: inspection.confirmedClientName || inspection.job.clientName,
      homeAge: inspection.homeAge,
      pipeMaterial: inspection.pipeMaterial,
      overallCondition: inspection.overallCondition,
      pipeConditionRating: inspection.pipeConditionRating,
      urgencyLevel: inspection.urgencyLevel,
      recommendations: inspection.recommendations,
      accessType: inspection.job.accessType,
      inspectionDuration: inspection.inspectionDuration,
      connectionToMain: inspection.connectionToMain,
      rootIntrusion: inspection.rootIntrusion as InspectionBundle["rootIntrusion"],
      cracks: inspection.cracks as InspectionBundle["cracks"],
      bellies: inspection.bellies as InspectionBundle["bellies"],
      offsetJoints: inspection.offsetJoints as InspectionBundle["offsetJoints"],
      blockages: inspection.blockages as InspectionBundle["blockages"],
      extendedMeasurements,
      technicianName: inspection.technician.name,
      inspectionDate: inspection.completedAt
        ? format(new Date(inspection.completedAt), "MMMM d, yyyy")
        : undefined,
      // Pass raw data for template assembly
      raw: inspection as unknown as Record<string, unknown>,
    };
  }

  // ─── Phase 2: Asset Processing ───────────────────────────────────────────

  private async processAssets(
    bundle: InspectionBundle & { raw: Record<string, unknown> },
    inspectionId: string
  ): Promise<ProcessedAssets> {
    const raw = bundle.raw as Record<string, unknown>;
    const videoAttachment = raw.videoAttachment as {
      publicUrl?: string;
      cloudPath?: string;
      highlightReelUrl?: string;
      chapters?: Array<{ id: string; timestamp: number; title: string; chapterType: string; severity?: string }>;
    } | null;
    const photos = raw.photos as Array<{
      publicUrl?: string;
      cloudPath?: string;
      caption?: string;
      photoType: string;
    }> | null;

    // Run asset processing in parallel
    const [videoStillsResult, acousticResult, mapResult] = await Promise.allSettled([
      // Video stills extraction
      this.processVideoStills(videoAttachment, inspectionId),
      // Acoustic analysis
      this.processAcoustic(videoAttachment, inspectionId, bundle.pipeMaterial),
      // Municipal map
      mapService.getSewerMap(bundle.propertyAddress, bundle.propertyCity, bundle.propertyState),
    ]);

    // Collect surface locate photos
    const surfaceLocatePhotos = photos
      ?.filter((p) => p.photoType === "DEFECT" || p.photoType === "ACCESS_POINT")
      .map((p) => ({
        photoUrl: p.publicUrl || "",
        caption: p.caption || `${p.photoType.replace("_", " ")} photo`,
        photoType: p.photoType,
      }))
      .filter((p) => p.photoUrl) || null;

    return {
      videoStills: videoStillsResult.status === "fulfilled" ? videoStillsResult.value : null,
      surfaceLocatePhotos: surfaceLocatePhotos?.length ? surfaceLocatePhotos : null,
      acousticResult: acousticResult.status === "fulfilled" ? acousticResult.value : null,
      mapImageUrl: mapResult.status === "fulfilled" && mapResult.value.success ? mapResult.value.mapImageUrl || null : null,
      videoUrl: videoAttachment?.publicUrl || null,
      highlightReelUrl: videoAttachment?.highlightReelUrl || null,
    };
  }

  private async processVideoStills(
    videoAttachment: {
      publicUrl?: string;
      cloudPath?: string;
      chapters?: Array<{ id: string; timestamp: number; title: string; chapterType: string; severity?: string }>;
    } | null,
    inspectionId: string
  ): Promise<EnhancedReportData["videoStills"]> {
    if (!videoAttachment?.publicUrl || !videoAttachment.chapters?.length) return null;

    const findingChapters = videoAttachment.chapters.filter(
      (ch) => ch.chapterType === "FINDING" || ch.chapterType === "DEFECT" || ch.chapterType === "REPAIR_NEEDED"
    );

    if (findingChapters.length === 0) return null;

    try {
      const results = await videoProcessingService.extractChapterFrames(
        videoAttachment.publicUrl,
        findingChapters
      );

      return results
        .filter((r) => r.success && r.s3Url)
        .map((r) => {
          const chapter = findingChapters.find((ch) => ch.id === r.chapterId);
          return {
            chapterId: r.chapterId,
            title: r.title,
            timestamp: r.timestamp,
            s3Url: r.s3Url!,
            severity: chapter?.severity,
          };
        });
    } catch (error) {
      logger.error("Video stills extraction failed", { error, inspectionId });
      return null;
    }
  }

  private async processAcoustic(
    videoAttachment: { publicUrl?: string; cloudPath?: string } | null,
    inspectionId: string,
    pipeMaterial?: string | null
  ): Promise<AcousticResult | null> {
    // Acoustic analysis requires video with audio
    if (!videoAttachment?.publicUrl) return null;

    try {
      // Extract audio first
      const audioResult = await videoProcessingService.extractAudio(
        videoAttachment.publicUrl,
        `inspection_${inspectionId}`
      );

      if (!audioResult.success || !audioResult.s3Url) {
        // Fall back to material-hint-based analysis (no actual audio processing)
        return acousticAnalysisService.analyzeAudio("", inspectionId, pipeMaterial || undefined);
      }

      return acousticAnalysisService.analyzeAudio(audioResult.s3Url, inspectionId, pipeMaterial || undefined);
    } catch (error) {
      logger.error("Acoustic processing failed", { error, inspectionId });
      return null;
    }
  }

  // ─── Phase 3: Narrative Generation ───────────────────────────────────────

  private async generateNarratives(
    bundle: InspectionBundle,
    assets: ProcessedAssets
  ): Promise<Narratives> {
    // Run narrative generation in parallel
    const [materialCtx, acousticInterp, conditionNarr, limitations] = await Promise.allSettled([
      reportNarrativesService.generateMaterialContext(bundle.pipeMaterial, bundle.homeAge),
      assets.acousticResult
        ? reportNarrativesService.interpretAcousticData(assets.acousticResult)
        : Promise.resolve({ success: false, content: undefined, error: "No acoustic data" } as { success: boolean; content?: string; error?: string }),
      reportNarrativesService.generateConditionNarrative(bundle),
      reportNarrativesService.generateLimitations(bundle),
    ]);

    return {
      materialContext:
        materialCtx.status === "fulfilled" && materialCtx.value.success
          ? materialCtx.value.content || null
          : null,
      acousticInterpretation:
        acousticInterp.status === "fulfilled" && acousticInterp.value.success
          ? acousticInterp.value.content || null
          : null,
      conditionNarrative:
        conditionNarr.status === "fulfilled" && conditionNarr.value.success
          ? conditionNarr.value.content || null
          : null,
      limitationsText:
        limitations.status === "fulfilled" && limitations.value.success
          ? limitations.value.content || null
          : null,
    };
  }

  // ─── Phase 4: Report Assembly ────────────────────────────────────────────

  private assembleReportData(
    bundle: InspectionBundle & { raw: Record<string, unknown> },
    assets: ProcessedAssets,
    narratives: Narratives
  ): EnhancedReportData {
    const raw = bundle.raw as Record<string, unknown>;
    const inspection = raw as unknown as {
      completedAt: Date | null;
      confirmedClientName: string | null;
      confirmedAddress: string | null;
      recentWork: string | null;
      knownIssues: string | null;
      backupHistory: string | null;
      job: EnhancedReportData["job"];
      technician: EnhancedReportData["technician"];
      clientSignature: EnhancedReportData["clientSignature"];
    };

    return {
      inspectionNumber: bundle.inspectionNumber,
      completedAt: inspection.completedAt,
      confirmedClientName: inspection.confirmedClientName,
      confirmedAddress: inspection.confirmedAddress,
      homeAge: bundle.homeAge ?? null,
      pipeMaterial: bundle.pipeMaterial ?? null,
      knownIssues: inspection.knownIssues,
      backupHistory: inspection.backupHistory,
      recentWork: inspection.recentWork,
      overallCondition: bundle.overallCondition ?? null,
      rootIntrusion: bundle.rootIntrusion ?? null,
      cracks: bundle.cracks ?? null,
      bellies: bundle.bellies ?? null,
      offsetJoints: bundle.offsetJoints ?? null,
      blockages: bundle.blockages ?? null,
      pipeConditionRating: bundle.pipeConditionRating ?? null,
      connectionToMain: bundle.connectionToMain ?? null,
      recommendations: bundle.recommendations ?? null,
      urgencyLevel: bundle.urgencyLevel ?? null,
      inspectionDuration: bundle.inspectionDuration ?? null,
      job: inspection.job,
      technician: inspection.technician,
      clientSignature: inspection.clientSignature,
      extendedMeasurements: bundle.extendedMeasurements ?? null,

      // Enhanced sections
      materialContextNarrative: narratives.materialContext,
      acousticResult: assets.acousticResult,
      acousticInterpretation: narratives.acousticInterpretation,
      spectrogramDataUrl: assets.acousticResult ? generateSpectrographDataUrl(assets.acousticResult) : null,
      conditionNarrative: narratives.conditionNarrative,
      limitationsText: narratives.limitationsText,

      // Assets
      videoStills: assets.videoStills,
      surfaceLocatePhotos: assets.surfaceLocatePhotos,
      mapImageUrl: assets.mapImageUrl,
      videoUrl: assets.videoUrl,
      highlightReelUrl: assets.highlightReelUrl,
    };
  }

  // ─── Phase 5: PDF Generation ─────────────────────────────────────────────

  private async generatePDF(html: string): Promise<{ success: boolean; buffer?: Buffer; error?: string }> {
    return pdfService.generatePDF(html, {
      format: "A4",
      margin: { top: "0mm", right: "0mm", bottom: "0mm", left: "0mm" },
      printBackground: true,
    });
  }
}

export const reportAgentService = new ReportAgentService();
export { ReportAgentService };
