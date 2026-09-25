export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { isFieldOperatorRole } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ inspectionId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !isFieldOperatorRole(user?.role)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { inspectionId } = await params;
    const { type } = await request.json(); // "findings" | "recommendations" | "full"

    // Fetch inspection data
    const inspection = await prisma.inspection.findUnique({
      where: { id: inspectionId },
      include: {
        job: true,
        technician: { select: { name: true } },
      },
    });

    if (!inspection) {
      return NextResponse.json({ success: false, error: "Inspection not found" }, { status: 404 });
    }

    // Build context from inspection data
    const rootIntrusion = inspection.rootIntrusion as { severity?: string; location?: string; notes?: string } | null;
    const cracks = inspection.cracks as { location: string; severity: string; type?: string }[] | null;
    const bellies = inspection.bellies as { location: string; severity: string }[] | null;
    const offsetJoints = inspection.offsetJoints as { location: string; severity: string }[] | null;
    const blockages = inspection.blockages as { location: string; type?: string; severity: string }[] | null;

    const inspectionContext = `
Property Information:
- Address: ${inspection.job.propertyAddress}, ${inspection.job.propertyCity}, ${inspection.job.propertyState}
- Home Age: ${inspection.homeAge || "Unknown"}
- Pipe Material: ${inspection.pipeMaterial?.replace("_", " ") || "Unknown"}
- Known Issues Reported: ${inspection.knownIssues || "None reported"}
- Backup History: ${inspection.backupHistory || "None reported"}

Inspection Findings:
- Overall Condition: ${inspection.overallCondition || "Not yet assessed"}
- Pipe Condition Rating: ${inspection.pipeConditionRating ? `${inspection.pipeConditionRating}/5` : "Not rated"}
- Root Intrusion: ${rootIntrusion?.severity ? `${rootIntrusion.severity} at ${rootIntrusion.location || "various locations"}. ${rootIntrusion.notes || ""}` : "None observed"}
- Cracks: ${cracks && cracks.length > 0 ? cracks.map(c => `${c.severity} ${c.type || "crack"} at ${c.location}`).join("; ") : "None observed"}
- Bellies/Low Spots: ${bellies && bellies.length > 0 ? bellies.map(b => `${b.severity} at ${b.location}`).join("; ") : "None observed"}
- Offset Joints: ${offsetJoints && offsetJoints.length > 0 ? offsetJoints.map(o => `${o.severity} at ${o.location}`).join("; ") : "None observed"}
- Blockages: ${blockages && blockages.length > 0 ? blockages.map(b => `${b.severity} ${b.type || "blockage"} at ${b.location}`).join("; ") : "None observed"}
- Connection to Main: ${inspection.connectionToMain || "Not documented"}
- Current Recommendations: ${inspection.recommendations || "None yet"}
- Urgency Level: ${inspection.urgencyLevel || "Not set"}
`;

    let prompt = "";

    switch (type) {
      case "findings":
        prompt = `You are a professional sewer inspection technician writing a summary for a client. Based on the following inspection data, write a clear, plain-language summary of the findings (2-3 paragraphs). Avoid technical jargon - explain things as if speaking to a homeowner who knows nothing about plumbing. Be professional and factual.

${inspectionContext}

Write a plain-language summary of the findings:`;
        break;

      case "recommendations":
        prompt = `You are a professional sewer inspection technician. Based on the following inspection findings, provide clear, actionable recommendations for the property owner (3-5 bullet points). Include priority/urgency and estimated timeframes where appropriate. Be honest but not alarmist.

${inspectionContext}

Provide recommendations in plain language:`;
        break;

      case "full":
      default:
        prompt = `You are a professional sewer inspection technician writing a complete summary for a client. Based on the following inspection data, write:
1. A brief overview of what was found (1 paragraph)
2. Key concerns, if any (bullet points)
3. Recommendations for the homeowner (bullet points)
4. Overall assessment in one sentence

Keep it professional, clear, and avoid unnecessary technical jargon. Be honest about any issues but don't be alarmist.

${inspectionContext}

Write the complete summary:`;
    }

    // Call LLM API
    const response = await fetch("https://apps.abacus.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.ABACUSAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        messages: [
          {
            role: "system",
            content:
              "You are a helpful sewer inspection technician assistant. You help write clear, professional summaries for clients. Always be factual and professional.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      console.error("LLM API error:", await response.text());
      return NextResponse.json(
        { success: false, error: "Failed to generate summary" },
        { status: 500 }
      );
    }

    const data = await response.json();
    const summary = data.choices?.[0]?.message?.content || "";

    return NextResponse.json({
      success: true,
      summary,
      type,
    });
  } catch (error) {
    console.error("Error generating summary:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate summary" },
      { status: 500 }
    );
  }
}
