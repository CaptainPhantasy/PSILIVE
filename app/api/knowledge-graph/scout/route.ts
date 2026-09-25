// ============================================================================
// Scout API Routes
// AI visibility monitoring endpoints
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { CitationTracker, trackMention, getReport } from '@/lib/scout/citation-tracker';

// GET /api/knowledge-graph/scout - Get visibility report
export async function GET() {
  try {
    const report = await getReport();

    return NextResponse.json({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error('Error fetching visibility report:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch visibility report' },
      { status: 500 }
    );
  }
}

// POST /api/knowledge-graph/scout/track - Track a specific query
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, location, engine } = body;

    if (!query || !location) {
      return NextResponse.json(
        { success: false, error: 'Query and location are required' },
        { status: 400 }
      );
    }

    const result = await trackMention(
      query,
      location,
      engine || 'CHATGPT'
    );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error tracking query:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to track query' },
      { status: 500 }
    );
  }
}
