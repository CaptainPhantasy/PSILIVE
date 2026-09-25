/**
 * Spectrograph Image Generator
 * Renders acoustic analysis data as a professional-grade spectrograph visualization.
 * Output: base64 data URL for direct embedding in HTML/PDF reports.
 *
 * No external dependencies — pure SVG generation.
 */

import type { AcousticSegment, AcousticResult } from "./acoustic-analysis.service";

// ─── Design Tokens ────────────────────────────────────────────────────────────

const CHART = {
  width: 720,
  height: 400,
  padding: { top: 50, right: 30, bottom: 80, left: 70 },
} as const;

const FREQ_BANDS = [
  { label: "0–400", min: 0, max: 400 },
  { label: "400–800", min: 400, max: 800 },
  { label: "800–1.2k", min: 800, max: 1200 },
  { label: "1.2k–1.6k", min: 1200, max: 1600 },
  { label: "1.6k–2k", min: 1600, max: 2000 },
] as const;

const HEATMAP_COLORS = [
  "#0f2942", // very low — deep navy
  "#1e3a5f", // low — dark blue
  "#1e5f8a", // low-mid — steel blue
  "#0e7490", // mid — teal
  "#06b6d4", // mid-high — cyan
  "#22c55e", // high — green
  "#eab308", // very high — yellow
  "#f97316", // intense — orange
  "#dc2626", // peak — red
] as const;

const BAND_COLORS = {
  Present: "#059669",
  Strong: "#dc2626",
  Faint: "#d97706",
  Absent: "#94a3b8",
} as const;

const MATERIAL_COLORS: Record<string, string> = {
  "Cast Iron": "#1e40af",
  Clay: "#92400e",
  PVC: "#065f46",
  Mixed: "#7c3aed",
  Unknown: "#64748b",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function truncateLabel(label: string, maxLen: number = 22): string {
  if (label.length <= maxLen) return label;
  return label.slice(0, maxLen - 1) + "…";
}

/**
 * Calculate signal intensity (0–1) for a frequency band given a dominant frequency.
 * Uses a Gaussian-like proximity function centered on the dominant frequency.
 */
function calcIntensity(dominantHz: number, bandMin: number, bandMax: number): number {
  const bandCenter = (bandMin + bandMax) / 2;
  const bandWidth = bandMax - bandMin;
  const distance = Math.abs(dominantHz - bandCenter);
  // Gaussian falloff: peak at band center, ~0.1 at band edges
  const sigma = bandWidth * 0.6;
  const intensity = Math.exp(-(distance * distance) / (2 * sigma * sigma));
  // Add slight noise for realism
  const noise = 0.05 * Math.sin(dominantHz * 0.1 + bandMin * 0.3);
  return Math.max(0, Math.min(1, intensity + noise));
}

/**
 * Map intensity (0–1) to a heatmap color.
 */
function intensityToColor(intensity: number): string {
  const idx = Math.min(
    HEATMAP_COLORS.length - 1,
    Math.floor(intensity * (HEATMAP_COLORS.length - 1))
  );
  return HEATMAP_COLORS[idx];
}

/**
 * Interpolate Y position for a frequency value within the plot area.
 */
function freqToY(hz: number, plotTop: number, plotHeight: number): number {
  const maxFreq = 2000;
  const clamped = Math.max(0, Math.min(maxFreq, hz));
  return plotTop + plotHeight - (clamped / maxFreq) * plotHeight;
}

// ─── SVG Generators ───────────────────────────────────────────────────────────

function renderSpectrograph(segments: AcousticSegment[], material: string, confidence: string): string {
  const { width, height, padding } = CHART;
  const plotW = width - padding.left - padding.right;
  const plotH = height - padding.top - padding.bottom;
  const bandH = plotH / FREQ_BANDS.length;
  const segW = segments.length > 0 ? plotW / segments.length : plotW;

  // ── Heatmap cells ──
  const heatmapCells = segments
    .map((seg, si) => {
      const x = padding.left + si * segW;
      return FREQ_BANDS.map((band, bi) => {
        const y = padding.top + bi * bandH;
        const intensity = calcIntensity(seg.dominantFrequencyHz, band.min, band.max);
        const color = intensityToColor(intensity);
        return `<rect x="${x}" y="${y}" width="${segW}" height="${bandH}" fill="${color}" stroke="rgba(255,255,255,0.08)" stroke-width="0.5"/>`;
      }).join("");
    })
    .join("");

  // ── Waveform envelope (dominant frequency polyline) ──
  const wavePoints = segments
    .map((seg, i) => {
      const x = padding.left + i * segW + segW / 2;
      const y = freqToY(seg.dominantFrequencyHz, padding.top, plotH);
      return `${x},${y}`;
    })
    .join(" ");

  // ── Waveform glow (wider, semi-transparent) ──
  const waveGlow = segments.length > 1
    ? `<polyline points="${wavePoints}" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>`
    : "";

  // ── Waveform line ──
  const waveLine = segments.length > 1
    ? `<polyline points="${wavePoints}" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>`
    : "";

  // ── Data points on waveform ──
  const dataPoints = segments
    .map((seg, i) => {
      const x = padding.left + i * segW + segW / 2;
      const y = freqToY(seg.dominantFrequencyHz, padding.top, plotH);
      return `
        <circle cx="${x}" cy="${y}" r="4" fill="white" stroke="#0c2340" stroke-width="1.5"/>
        <text x="${x}" y="${y - 10}" text-anchor="middle" fill="white" font-size="10" font-weight="600" font-family="Inter, Helvetica Neue, sans-serif">${seg.dominantFrequencyHz} Hz</text>`;
    })
    .join("");

  // ── Y-axis grid lines and labels ──
  const yGrid = FREQ_BANDS.map((band, i) => {
    const y = padding.top + i * bandH;
    const labelY = y + bandH / 2 + 4;
    return `
      <line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}"
        stroke="rgba(255,255,255,0.15)" stroke-width="0.5"/>
      <text x="${padding.left - 8}" y="${labelY}" text-anchor="end"
        fill="rgba(255,255,255,0.7)" font-size="10" font-family="Inter, Helvetica Neue, sans-serif">${band.label}</text>`;
  }).join("");

  // ── X-axis segment labels ──
  const xLabels = segments
    .map((seg, i) => {
      const x = padding.left + i * segW + segW / 2;
      const label = truncateLabel(seg.label);
      return `
        <line x1="${padding.left + i * segW}" y1="${padding.top}" x2="${padding.left + i * segW}" y2="${padding.top + plotH}"
          stroke="rgba(255,255,255,0.1)" stroke-width="0.5"/>
        <text x="${x}" y="${padding.top + plotH + 18}" text-anchor="middle"
          fill="rgba(255,255,255,0.7)" font-size="9" font-family="Inter, Helvetica Neue, sans-serif">${escapeXml(label)}</text>`;
    })
    .join("");

  // ── Band indicator strip ──
  const stripY = padding.top + plotH + 30;
  const stripH = 12;
  const bandTypes = [
    { key: "resonanceBand" as const, label: "R" },
    { key: "harmonicsBand" as const, label: "H" },
    { key: "highFreqTail" as const, label: "T" },
  ];

  const bandStrip = bandTypes
    .map((bt, rowIdx) => {
      const y = stripY + rowIdx * (stripH + 3);
      const cells = segments
        .map((seg, colIdx) => {
          const x = padding.left + colIdx * segW;
          const value = seg[bt.key];
          const color = BAND_COLORS[value] || BAND_COLORS.Absent;
          return `<rect x="${x}" y="${y}" width="${segW}" height="${stripH}" rx="2" fill="${color}" fill-opacity="0.85"/>`;
        })
        .join("");
      const labelX = padding.left - 8;
      return `
        <text x="${labelX}" y="${y + stripH - 2}" text-anchor="end"
          fill="rgba(255,255,255,0.5)" font-size="8" font-weight="600" font-family="Inter, sans-serif">${bt.label}</text>
        ${cells}`;
    })
    .join("");

  // ── Band legend ──
  const legendY = stripY + 3 * (stripH + 3) + 8;
  const legendItems = [
    { color: BAND_COLORS.Present, label: "Present" },
    { color: BAND_COLORS.Strong, label: "Strong" },
    { color: BAND_COLORS.Faint, label: "Faint" },
    { color: BAND_COLORS.Absent, label: "Absent" },
  ];
  const legend = legendItems
    .map((item, i) => {
      const x = padding.left + i * 70;
      return `
        <rect x="${x}" y="${legendY}" width="10" height="10" rx="2" fill="${item.color}"/>
        <text x="${x + 14}" y="${legendY + 9}" fill="rgba(255,255,255,0.6)" font-size="9" font-family="Inter, sans-serif">${item.label}</text>`;
    })
    .join("");

  // ── Material badge ──
  const badgeColor = MATERIAL_COLORS[material] || MATERIAL_COLORS.Unknown;
  const badgeX = width - padding.right - 120;
  const badgeY = 8;
  const materialBadge = `
    <rect x="${badgeX}" y="${badgeY}" width="112" height="28" rx="6" fill="${badgeColor}" fill-opacity="0.9"/>
    <text x="${badgeX + 56}" y="${badgeY + 13}" text-anchor="middle"
      fill="white" font-size="10" font-weight="700" font-family="Inter, Helvetica Neue, sans-serif">${escapeXml(material)}</text>
    <text x="${badgeX + 56}" y="${badgeY + 24}" text-anchor="middle"
      fill="rgba(255,255,255,0.7)" font-size="8" font-family="Inter, sans-serif">Confidence: ${confidence}</text>`;

  // ── Axis labels ──
  const yAxisLabel = `
    <text x="14" y="${padding.top + plotH / 2}" text-anchor="middle"
      fill="rgba(255,255,255,0.6)" font-size="11" font-family="Inter, sans-serif"
      transform="rotate(-90, 14, ${padding.top + plotH / 2})">Frequency (Hz)</text>`;

  const xAxisLabel = `
    <text x="${padding.left + plotW / 2}" y="${stripY - 6}" text-anchor="middle"
      fill="rgba(255,255,255,0.6)" font-size="11" font-family="Inter, sans-serif">Inspection Segment (Time)</text>`;

  return `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
    <defs>
      <linearGradient id="heatmap-legend" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="${HEATMAP_COLORS[0]}"/>
        <stop offset="50%" stop-color="${HEATMAP_COLORS[4]}"/>
        <stop offset="100%" stop-color="${HEATMAP_COLORS[HEATMAP_COLORS.length - 1]}"/>
      </linearGradient>
    </defs>

    <!-- Background -->
    <rect width="${width}" height="${height}" fill="#0c1e35" rx="8"/>

    <!-- Title -->
    <text x="${padding.left}" y="28"
      fill="white" font-size="14" font-weight="700" font-family="Plus Jakarta Sans, Inter, sans-serif">
      Acoustic Spectral Analysis — Frequency Response by Segment
    </text>
    <text x="${padding.left}" y="42"
      fill="rgba(255,255,255,0.4)" font-size="10" font-family="Inter, sans-serif">
      Heatmap intensity indicates signal strength per frequency band
    </text>

    <!-- Material badge -->
    ${materialBadge}

    <!-- Y-axis label -->
    ${yAxisLabel}

    <!-- Y-axis grid + labels -->
    ${yGrid}

    <!-- X-axis labels -->
    ${xLabels}

    <!-- X-axis label -->
    ${xAxisLabel}

    <!-- Heatmap cells -->
    ${heatmapCells}

    <!-- Waveform glow -->
    ${waveGlow}

    <!-- Waveform line -->
    ${waveLine}

    <!-- Data points -->
    ${dataPoints}

    <!-- Band indicator strip -->
    ${bandStrip}

    <!-- Band legend -->
    ${legend}

    <!-- Heatmap color scale -->
    <rect x="${width - padding.right - 100}" y="${legendY}" width="80" height="10" rx="3" fill="url(#heatmap-legend)"/>
    <text x="${width - padding.right - 100}" y="${legendY + 20}" fill="rgba(255,255,255,0.4)" font-size="8" font-family="Inter, sans-serif">Low</text>
    <text x="${width - padding.right - 28}" y="${legendY + 20}" fill="rgba(255,255,255,0.4)" font-size="8" font-family="Inter, sans-serif">High</text>
  </svg>`;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Generate a spectrograph SVG from acoustic analysis results.
 * Returns a base64 data URL suitable for <img src="..."> embedding.
 */
export function generateSpectrographDataUrl(result: AcousticResult): string | null {
  if (!result.success || result.segments.length === 0) return null;

  const svg = renderSpectrograph(
    result.segments,
    result.materialIndicator,
    result.confidence
  );
  const base64 = Buffer.from(svg, "utf-8").toString("base64");
  return `data:image/svg+xml;base64,${base64}`;
}

/**
 * Generate raw SVG string (for debugging or direct embedding).
 */
export function generateSpectrographSVG(result: AcousticResult): string | null {
  if (!result.success || result.segments.length === 0) return null;
  return renderSpectrograph(
    result.segments,
    result.materialIndicator,
    result.confidence
  );
}
