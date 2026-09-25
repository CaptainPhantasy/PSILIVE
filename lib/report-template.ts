// PDF Report Template Generator for Inspection Reports

import { format } from "date-fns";

interface InspectionData {
  inspectionNumber: string;
  completedAt: Date | null;
  confirmedClientName: string | null;
  confirmedAddress: string | null;
  homeAge: string | null;
  pipeMaterial: string | null;
  knownIssues: string | null;
  backupHistory: string | null;
  recentWork: string | null;
  overallCondition: string | null;
  rootIntrusion: { severity?: string; location?: string; notes?: string } | null;
  cracks: { location: string; severity: string; type?: string }[] | null;
  bellies: { location: string; severity: string }[] | null;
  offsetJoints: { location: string; severity: string }[] | null;
  blockages: { location: string; type?: string; severity: string }[] | null;
  pipeConditionRating: number | null;
  connectionToMain: string | null;
  recommendations: string | null;
  urgencyLevel: string | null;
  inspectionDuration: number | null;
  job: {
    clientName: string;
    clientEmail: string;
    clientPhone: string | null;
    propertyAddress: string;
    propertyCity: string;
    propertyState: string;
    propertyZip: string;
    totalPrice: number;
  };
  technician: {
    name: string;
    email: string;
  };
  clientSignature: {
    signerName: string;
    signedAt: Date;
  } | null;
}

const getConditionColor = (condition: string | null): string => {
  switch (condition) {
    case "EXCELLENT":
      return "#22c55e";
    case "GOOD":
      return "#84cc16";
    case "FAIR":
      return "#eab308";
    case "POOR":
      return "#f97316";
    case "CRITICAL":
      return "#ef4444";
    default:
      return "#6b7280";
  }
};

const getUrgencyBadge = (urgency: string | null): string => {
  switch (urgency) {
    case "IMMEDIATE":
      return `<span style="background-color: #ef4444; color: white; padding: 4px 12px; border-radius: 4px; font-weight: bold;">IMMEDIATE ACTION REQUIRED</span>`;
    case "SOON":
      return `<span style="background-color: #f97316; color: white; padding: 4px 12px; border-radius: 4px; font-weight: bold;">REPAIR SOON (1-3 MONTHS)</span>`;
    case "MONITOR":
      return `<span style="background-color: #eab308; color: white; padding: 4px 12px; border-radius: 4px; font-weight: bold;">MONITOR CONDITION</span>`;
    case "NONE":
      return `<span style="background-color: #22c55e; color: white; padding: 4px 12px; border-radius: 4px; font-weight: bold;">NO IMMEDIATE CONCERNS</span>`;
    default:
      return "";
  }
};

const formatCondition = (condition: string | null): string => {
  if (!condition) return "Not Assessed";
  return condition.charAt(0) + condition.slice(1).toLowerCase();
};

const formatSeverity = (severity: string): string => {
  return severity.charAt(0) + severity.slice(1).toLowerCase();
};

const renderDefectSection = (
  title: string,
  defects: { location: string; severity: string; type?: string }[] | null
): string => {
  if (!defects || defects.length === 0) {
    return `
      <div style="margin-bottom: 16px;">
        <h4 style="color: #374151; margin: 0 0 8px 0;">${title}</h4>
        <p style="color: #22c55e; margin: 0;">✓ None observed</p>
      </div>
    `;
  }

  const rows = defects
    .map(
      (d) => `
      <tr>
        <td style="padding: 8px; border: 1px solid #e5e7eb;">${d.location}</td>
        <td style="padding: 8px; border: 1px solid #e5e7eb;">${formatSeverity(d.severity)}</td>
        ${d.type ? `<td style="padding: 8px; border: 1px solid #e5e7eb;">${d.type}</td>` : ""}
      </tr>
    `
    )
    .join("");

  return `
    <div style="margin-bottom: 16px;">
      <h4 style="color: #374151; margin: 0 0 8px 0;">${title}</h4>
      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <thead>
          <tr style="background-color: #f3f4f6;">
            <th style="padding: 8px; border: 1px solid #e5e7eb; text-align: left;">Location</th>
            <th style="padding: 8px; border: 1px solid #e5e7eb; text-align: left;">Severity</th>
            ${defects[0]?.type !== undefined ? `<th style="padding: 8px; border: 1px solid #e5e7eb; text-align: left;">Type</th>` : ""}
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
};

export function generateReportHTML(inspection: InspectionData, isClientVersion: boolean = true): string {
  const inspectionDate = inspection.completedAt
    ? format(new Date(inspection.completedAt), "MMMM d, yyyy")
    : "N/A";

  const reportTitle = isClientVersion
    ? "Sewer Scope Inspection Report"
    : "Sewer Scope Inspection Report (Admin Copy)";

  // Parse JSON fields safely
  const rootIntrusion = inspection.rootIntrusion as { severity?: string; location?: string; notes?: string } | null;
  const cracks = inspection.cracks as { location: string; severity: string; type?: string }[] | null;
  const bellies = inspection.bellies as { location: string; severity: string }[] | null;
  const offsetJoints = inspection.offsetJoints as { location: string; severity: string }[] | null;
  const blockages = inspection.blockages as { location: string; type?: string; severity: string }[] | null;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @page {
      size: A4;
      margin: 20mm;
    }
    body {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      color: #1f2937;
      line-height: 1.5;
      margin: 0;
      padding: 0;
    }
    .header {
      background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
      color: white;
      padding: 32px;
      margin: -20mm -20mm 24px -20mm;
      text-align: center;
    }
    .header h1 {
      margin: 0 0 8px 0;
      font-size: 28px;
    }
    .header p {
      margin: 0;
      opacity: 0.9;
    }
    .inspection-number {
      background: rgba(255,255,255,0.2);
      padding: 8px 16px;
      border-radius: 4px;
      display: inline-block;
      margin-top: 16px;
      font-weight: bold;
    }
    .section {
      margin-bottom: 24px;
      page-break-inside: avoid;
    }
    .section-title {
      background-color: #f3f4f6;
      padding: 12px 16px;
      margin: 0 0 16px 0;
      border-left: 4px solid #3b82f6;
      font-size: 18px;
      font-weight: bold;
      color: #1e40af;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }
    .info-item {
      margin-bottom: 12px;
    }
    .info-label {
      font-size: 12px;
      color: #6b7280;
      text-transform: uppercase;
      margin-bottom: 4px;
    }
    .info-value {
      font-size: 16px;
      font-weight: 500;
    }
    .condition-badge {
      display: inline-block;
      padding: 8px 16px;
      border-radius: 8px;
      font-weight: bold;
      font-size: 18px;
      color: white;
    }
    .rating-bar {
      display: flex;
      gap: 4px;
      margin-top: 8px;
    }
    .rating-segment {
      width: 40px;
      height: 12px;
      border-radius: 2px;
      background-color: #e5e7eb;
    }
    .rating-filled {
      background-color: #3b82f6;
    }
    .recommendations-box {
      background-color: #fef3c7;
      border: 1px solid #f59e0b;
      border-radius: 8px;
      padding: 16px;
      margin-top: 16px;
    }
    .footer {
      margin-top: 32px;
      padding-top: 16px;
      border-top: 2px solid #e5e7eb;
      font-size: 12px;
      color: #6b7280;
      text-align: center;
    }
    .signature-section {
      margin-top: 24px;
      padding: 16px;
      background-color: #f9fafb;
      border-radius: 8px;
    }
    .page-break {
      page-break-after: always;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Precision Sewer Inspections</h1>
    <p>Central Indiana's Trusted Experts</p>
    <div class="inspection-number">${reportTitle} #${inspection.inspectionNumber}</div>
  </div>

  <div class="section">
    <h2 class="section-title">Property Information</h2>
    <div class="info-grid">
      <div>
        <div class="info-item">
          <div class="info-label">Property Address</div>
          <div class="info-value">
            ${inspection.job.propertyAddress}<br>
            ${inspection.job.propertyCity}, ${inspection.job.propertyState} ${inspection.job.propertyZip}
          </div>
        </div>
        <div class="info-item">
          <div class="info-label">Client Name</div>
          <div class="info-value">${inspection.confirmedClientName || inspection.job.clientName}</div>
        </div>
      </div>
      <div>
        <div class="info-item">
          <div class="info-label">Inspection Date</div>
          <div class="info-value">${inspectionDate}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Inspector</div>
          <div class="info-value">${inspection.technician.name}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Duration</div>
          <div class="info-value">${inspection.inspectionDuration || 0} minutes</div>
        </div>
      </div>
    </div>
  </div>

  <div class="section">
    <h2 class="section-title">Property Details</h2>
    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">Home Age</div>
        <div class="info-value">${inspection.homeAge || "Unknown"}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Pipe Material</div>
        <div class="info-value">${inspection.pipeMaterial ? inspection.pipeMaterial.replace("_", " ") : "Unknown"}</div>
      </div>
      ${inspection.knownIssues ? `
      <div class="info-item" style="grid-column: span 2;">
        <div class="info-label">Known Issues (Reported by Client)</div>
        <div class="info-value">${inspection.knownIssues}</div>
      </div>
      ` : ""}
      ${inspection.backupHistory ? `
      <div class="info-item" style="grid-column: span 2;">
        <div class="info-label">Backup History</div>
        <div class="info-value">${inspection.backupHistory}</div>
      </div>
      ` : ""}
    </div>
  </div>

  <div class="section">
    <h2 class="section-title">Overall Assessment</h2>
    <div style="text-align: center; margin: 24px 0;">
      <div class="condition-badge" style="background-color: ${getConditionColor(inspection.overallCondition)};">
        ${formatCondition(inspection.overallCondition)}
      </div>
      <div style="margin-top: 16px;">
        ${getUrgencyBadge(inspection.urgencyLevel)}
      </div>
    </div>
    ${inspection.pipeConditionRating ? `
    <div style="margin-top: 16px;">
      <div class="info-label">Pipe Condition Rating</div>
      <div class="rating-bar">
        ${[1, 2, 3, 4, 5].map(n => `<div class="rating-segment ${n <= inspection.pipeConditionRating! ? 'rating-filled' : ''}"></div>`).join("")}
      </div>
      <div style="font-size: 14px; color: #6b7280; margin-top: 4px;">${inspection.pipeConditionRating} out of 5</div>
    </div>
    ` : ""}
  </div>

  <div class="section">
    <h2 class="section-title">Detailed Findings</h2>
    
    ${rootIntrusion && rootIntrusion.severity ? `
    <div style="margin-bottom: 16px;">
      <h4 style="color: #374151; margin: 0 0 8px 0;">Root Intrusion</h4>
      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <tr>
          <td style="padding: 8px; border: 1px solid #e5e7eb; width: 30%; background: #f9fafb;">Severity</td>
          <td style="padding: 8px; border: 1px solid #e5e7eb;">${formatSeverity(rootIntrusion.severity)}</td>
        </tr>
        ${rootIntrusion.location ? `
        <tr>
          <td style="padding: 8px; border: 1px solid #e5e7eb; background: #f9fafb;">Location</td>
          <td style="padding: 8px; border: 1px solid #e5e7eb;">${rootIntrusion.location}</td>
        </tr>
        ` : ""}
        ${rootIntrusion.notes ? `
        <tr>
          <td style="padding: 8px; border: 1px solid #e5e7eb; background: #f9fafb;">Notes</td>
          <td style="padding: 8px; border: 1px solid #e5e7eb;">${rootIntrusion.notes}</td>
        </tr>
        ` : ""}
      </table>
    </div>
    ` : `
    <div style="margin-bottom: 16px;">
      <h4 style="color: #374151; margin: 0 0 8px 0;">Root Intrusion</h4>
      <p style="color: #22c55e; margin: 0;">✓ None observed</p>
    </div>
    `}

    ${renderDefectSection("Cracks", cracks)}
    ${renderDefectSection("Bellies (Low Spots)", bellies)}
    ${renderDefectSection("Offset Joints", offsetJoints)}
    ${renderDefectSection("Blockages", blockages)}

    ${inspection.connectionToMain ? `
    <div style="margin-bottom: 16px;">
      <h4 style="color: #374151; margin: 0 0 8px 0;">Connection to Main</h4>
      <p style="margin: 0;">${inspection.connectionToMain}</p>
    </div>
    ` : ""}
  </div>

  <div class="section">
    <h2 class="section-title">Recommendations</h2>
    <div class="recommendations-box">
      ${inspection.recommendations || "No specific recommendations at this time."}
    </div>
  </div>

  ${inspection.clientSignature ? `
  <div class="signature-section">
    <h3 style="margin: 0 0 12px 0; color: #374151;">Client Acknowledgment</h3>
    <p style="margin: 0; font-size: 14px;">
      <strong>${inspection.clientSignature.signerName}</strong> acknowledged receipt of this inspection on 
      ${format(new Date(inspection.clientSignature.signedAt), "MMMM d, yyyy 'at' h:mm a")}.
    </p>
  </div>
  ` : ""}

  <div class="footer">
    <p><strong>Precision Sewer Inspections</strong></p>
    <p>6405 Justins Ridge Road, Nashville, IN 47448 | (317) 620-3858 | booking@precisionsewerinspections.com</p>
    <p style="margin-top: 8px;">This report is based on visual inspection via camera at the time of service. Hidden defects beyond camera reach are not covered.</p>
    <p>PSI and Indiana Drain Company are sister companies under shared ownership. Next-step guidance is available when requested. Optional service and inspection-enabling cleaning are separately quoted and approved. You may choose any provider; additional purchases do not determine the inspection findings.</p>
    <p>Report generated on ${format(new Date(), "MMMM d, yyyy")}</p>
  </div>
</body>
</html>
  `;
}
