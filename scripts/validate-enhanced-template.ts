/**
 * Template validation script — exercises generateEnhancedReportHTML with real Bonham data.
 * Run: DATABASE_URL="postgresql://douglastalley@localhost:5432/psi_local" npx tsx scripts/validate-enhanced-template.ts
 */

import { PrismaClient } from "@prisma/client";
import { generateEnhancedReportHTML } from "../lib/report-template-enhanced";
import type { AcousticResult } from "../lib/services/acoustic-analysis.service";
import { generateSpectrographDataUrl } from "../lib/services/spectrograph.service";
import { writeFileSync, readFileSync } from "fs";
import { join } from "path";


// ─── Inline SVG Image Generator (zero deps) ────────────────────────────────

function generateTestImageDataUrl(
  width: number,
  height: number,
  title: string,
  subtitle: string,
  bgColor: string,
  accentColor: string
): string {
  const safeTitle = title.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const safeSubtitle = subtitle.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <rect width="${width}" height="${height}" fill="${bgColor}"/>
    <rect x="0" y="0" width="${width}" height="4" fill="${accentColor}"/>
    <rect x="0" y="${height - 4}" width="${width}" height="4" fill="${accentColor}"/>
    <text x="${width / 2}" y="${height / 2 - 20}" text-anchor="middle" fill="white" font-size="22" font-weight="bold" font-family="Helvetica Neue, Arial, sans-serif">${safeTitle}</text>
    <text x="${width / 2}" y="${height / 2 + 12}" text-anchor="middle" fill="rgba(255,255,255,0.7)" font-size="14" font-family="Helvetica Neue, Arial, sans-serif">${safeSubtitle}</text>
    <rect x="${width / 2 - 40}" y="${height - 50}" width="80" height="24" rx="4" fill="rgba(255,255,255,0.12)"/>
    <text x="${width / 2}" y="${height - 34}" text-anchor="middle" fill="rgba(255,255,255,0.4)" font-size="10" font-family="Helvetica Neue, Arial, sans-serif">TEST IMAGE</text>
  </svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

function formatTimestampSec(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}


function fileToDataUrl(filePath: string, mimeType = "image/png"): string {
  const buffer = readFileSync(filePath);
  return `data:${mimeType};base64,${buffer.toString("base64")}`;
}

const prisma = new PrismaClient();

async function main() {
  console.log("Fetching Bonham inspection from local DB...");

  const inspection = await prisma.inspection.findFirst({
    include: {
      job: true,
      technician: { select: { name: true, email: true } },
      clientSignature: true,
      videoAttachment: { include: { chapters: true } },
      generatedReport: true,
    },
  });

  if (!inspection) {
    console.error("No inspection found in local DB");
    process.exit(1);
  }

  console.log(`Found: ${inspection.inspectionNumber} — ${inspection.confirmedClientName}`);
  console.log(`Status: ${inspection.status}, Condition: ${inspection.overallCondition}`);
  console.log(`Pipe: ${inspection.pipeMaterial}, Age: ${inspection.homeAge}`);
  console.log(`Chapters: ${inspection.videoAttachment?.chapters?.length ?? 0}`);

  // Build synthetic acoustic result to exercise that section
  const syntheticAcoustic: AcousticResult = {
    success: true,
    segments: [
      {
        label: "0:00–0:30 (Near cleanout)",
        timestampStart: 0,
        timestampEnd: 30,
        dominantFrequencyHz: 450,
        resonanceBand: "Absent",
        harmonicsBand: "Absent",
        highFreqTail: "Faint",
      },
      {
        label: "0:30–1:30 (Mid-line)",
        timestampStart: 30,
        timestampEnd: 90,
        dominantFrequencyHz: 1200,
        resonanceBand: "Present",
        harmonicsBand: "Present",
        highFreqTail: "Strong",
      },
    ],
    materialIndicator: "Mixed",
    confidence: "medium",
    interpretation:
      "The acoustic profile suggests a transition from PVC (near the cleanout) to cast iron (deeper in the line). This is consistent with a property of this age where partial repairs may have replaced original cast iron sections with PVC.",
  };

  // Build EnhancedReportData from the real inspection
  const data = {
    inspectionNumber: inspection.inspectionNumber,
    completedAt: inspection.completedAt,
    confirmedClientName: inspection.confirmedClientName,
    confirmedAddress: inspection.confirmedAddress,
    homeAge: inspection.homeAge,
    pipeMaterial: inspection.pipeMaterial,
    knownIssues: inspection.knownIssues,
    backupHistory: inspection.backupHistory,
    recentWork: null,
    overallCondition: inspection.overallCondition,
    rootIntrusion: inspection.rootIntrusion as any ?? null,
    cracks: inspection.cracks as any ?? null,
    bellies: inspection.bellies as any ?? null,
    offsetJoints: inspection.offsetJoints as any ?? null,
    blockages: inspection.blockages as any ?? null,
    pipeConditionRating: inspection.pipeConditionRating,
    connectionToMain: inspection.connectionToMain,
    recommendations: inspection.recommendations,
    urgencyLevel: inspection.urgencyLevel,
    inspectionDuration: inspection.inspectionDuration,

    job: {
      clientName: inspection.job.clientName,
      clientEmail: inspection.job.clientEmail,
      clientPhone: inspection.job.clientPhone,
      propertyAddress: inspection.job.propertyAddress,
      propertyCity: inspection.job.propertyCity,
      propertyState: inspection.job.propertyState,
      propertyZip: "", // Not in DB schema
      totalPrice: inspection.job.totalPrice,
    },

    technician: inspection.technician ?? { name: "Unknown", email: "" },

    clientSignature: inspection.clientSignature
      ? {
          signerName: inspection.clientSignature.signerName,
          signedAt: inspection.clientSignature.signedAt,
        }
      : null,

    // Extended measurements (synthetic for testing)
    extendedMeasurements: {
      totalFootage: 85,
      cameraDirection: "Upstream from cleanout",
      flowDirection: "Toward main",
      equipmentUsed: "RIDGID SeeSnake CS65x",
      diameterTransitions: ["4\" PVC at cleanout", "6\" Cast Iron at 35ft"],
    },

    // Enhanced sections (synthetic narratives for testing)
    materialContextNarrative:
      "The sewer line at 123 Main Street is constructed of Orangeburg pipe, a bituminous fiber material commonly installed between the 1940s and 1970s. Orangeburg has a typical service life of 30-50 years and is known for its susceptibility to deformation, root intrusion, and collapse.\n\nGiven the reported age of the property (over 100 years), it is likely that the Orangeburg pipe was installed as a replacement for an earlier material, possibly clay or cast iron. Properties of this vintage in the Indianapolis area frequently exhibit mixed-material sewer lines due to partial repairs over the decades.",

    acousticResult: syntheticAcoustic,
    acousticInterpretation: syntheticAcoustic.interpretation,
    spectrogramDataUrl: fileToDataUrl(join(__dirname, "../test-output/assets/spectrogram.png")),

    conditionNarrative:
      "The overall condition of the sewer line is assessed as GOOD with a condition rating of 3 out of 5. While the pipe shows signs of aging consistent with its Orangeburg construction, no active blockages, significant cracks, or structural failures were observed during the inspection.\n\nThe 15-minute inspection duration was sufficient to evaluate the accessible portions of the line. The connection to the municipal main was verified as intact.",

    limitationsText:
      "This inspection was limited to the accessible portions of the sewer lateral from the interior cleanout to the municipal connection. Areas behind walls, under foundations, or beyond the municipal connection point were not inspected. Acoustic material analysis is supplemental and should not be used as the sole basis for material identification. Weather conditions, ambient noise, and pipe geometry can affect acoustic readings.",

    // Real video stills extracted from inspection video via FFmpeg
    videoStills: [
      {
        chapterId: inspection.videoAttachment?.chapters?.[0]?.id ?? "",
        title: "Face",
        timestamp: 94,
        s3Url: fileToDataUrl(join(__dirname, "../test-output/assets/still_face_94s.png")),
        severity: "MODERATE",
        description: "Camera view at 1:34 — pipe interior showing joint connection and surrounding material.",
      },
      {
        chapterId: inspection.videoAttachment?.chapters?.[1]?.id ?? "",
        title: "Ope'!",
        timestamp: 192,
        s3Url: fileToDataUrl(join(__dirname, "../test-output/assets/still_ope_192s.png")),
        severity: undefined,
        description: "Camera view at 3:12 — mid-line traverse section.",
      },
      {
        chapterId: inspection.videoAttachment?.chapters?.[2]?.id ?? "",
        title: "Imaginary guitar notes",
        timestamp: 240,
        s3Url: fileToDataUrl(join(__dirname, "../test-output/assets/still_guitar_240s.png")),
        severity: undefined,
        description: "Camera view at 4:00 — deep section near municipal connection.",
      },
    ],

    surfaceLocatePhotos: [
      {
        photoUrl: generateTestImageDataUrl(
          640, 480,
          "Surface Locate #1",
          "Property Line — North Side",
          "#065f46",
          "#10b981"
        ),
        caption: "Surface locate marker at property line, north side of structure. Paint indicates approximate sewer lateral path.",
        photoType: "property_line",
      },
      {
        photoUrl: generateTestImageDataUrl(
          640, 480,
          "Surface Locate #2",
          "Street Connection — Main",
          "#065f46",
          "#10b981"
        ),
        caption: "Surface locate at municipal sewer main connection point. Confirms lateral alignment with city records.",
        photoType: "street_connection",
      },
    ],

    // Synthetic map
    mapImageUrl: "https://placehold.co/800x600/e2e8f0/475569?text=MapIndy+Sewer+Map",

    videoUrl: inspection.videoAttachment?.publicUrl || "https://example.com/inspection-video.mp4",
    highlightReelUrl: inspection.videoAttachment?.highlightReelUrl || "https://example.com/highlight-reel.mp4",
  };

  console.log("\nGenerating enhanced report HTML...");

  // Test 1: Full report (client version)
  const clientHTML = generateEnhancedReportHTML(data, true);
  const clientPath = join(__dirname, "../test-output/enhanced-report-client.html");
  writeFileSync(clientPath, clientHTML, "utf-8");
  console.log(`✅ Client report: ${clientPath} (${(clientHTML.length / 1024).toFixed(1)} KB)`);

  // Test 2: Full report (internal version)
  const internalHTML = generateEnhancedReportHTML(data, false);
  const internalPath = join(__dirname, "../test-output/enhanced-report-internal.html");
  writeFileSync(internalPath, internalHTML, "utf-8");
  console.log(`✅ Internal report: ${internalPath} (${(internalHTML.length / 1024).toFixed(1)} KB)`);

  // Validate sections present
  const sections = [
    { name: "Material Context", marker: "Material Context" },
    { name: "Acoustic Analysis", marker: "Acoustic Material Analysis" },
    { name: "Spectrograph Image", marker: "spectrogram-container" },
    { name: "Condition Assessment", marker: "Condition Assessment" },
    { name: "Video Stills", marker: "still-card" },
    { name: "Surface Locate", marker: "locate-card" },
    { name: "Municipal Map", marker: "MapIndy" },
    { name: "Measurements", marker: "Precise Measurements" },
    { name: "Limitations", marker: "Limitations" },
    { name: "Disclaimers", marker: "Disclaimer" },
    { name: "Recommendations", marker: "Recommendations" },
    { name: "Verification", marker: "Verification" },
  ];

  console.log("\nSection validation:");
  let allPresent = true;
  for (const s of sections) {
    const found = clientHTML.includes(s.marker);
    console.log(`  ${found ? "✅" : "❌"} ${s.name}`);
    if (!found) allPresent = false;
  }

  // Test 3: Edge case — minimal data (no enhanced sections)
  console.log("\nGenerating minimal report (no enhanced sections)...");
  const minimalData = {
    ...data,
    materialContextNarrative: null,
    acousticResult: null,
    acousticInterpretation: null,
    conditionNarrative: null,
    limitationsText: null,
    videoStills: null,
    surfaceLocatePhotos: null,
    mapImageUrl: null,
    extendedMeasurements: null,
  };

  const minimalHTML = generateEnhancedReportHTML(minimalData, true);
  const minimalPath = join(__dirname, "../test-output/enhanced-report-minimal.html");
  writeFileSync(minimalPath, minimalHTML, "utf-8");
  console.log(`✅ Minimal report: ${minimalPath} (${(minimalHTML.length / 1024).toFixed(1)} KB)`);

  // Verify enhanced sections are NOT in minimal — use section-specific markers from rendered HTML, not CSS/headers
  const enhancedMarkers = [
    { name: "Material Context", marker: 'section-title">Material Context</h2>' },
    { name: "Acoustic Analysis", marker: 'section-title">Acoustic Material Analysis</h2>' },
    { name: "Video Stills", marker: '<div class="still-card">' },
    { name: "Municipal Map", marker: 'section-title">Municipal Sewer Map</h2>' },
    { name: "Measurements", marker: 'section-title">Precise Measurements</h2>' },
    { name: "Limitations", marker: 'section-title">Limitations' },
  ];
  let minimalClean = true;
  for (const { name, marker } of enhancedMarkers) {
    if (minimalHTML.includes(marker)) {
      console.log(`  ❌ "${name}" should NOT appear in minimal report`);
      minimalClean = false;
    }
  }
  if (minimalClean) {
    console.log("  ✅ All enhanced sections correctly omitted in minimal report");
  }

  console.log(`\n${allPresent && minimalClean ? "✅ ALL TESTS PASSED" : "❌ SOME TESTS FAILED"}`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
