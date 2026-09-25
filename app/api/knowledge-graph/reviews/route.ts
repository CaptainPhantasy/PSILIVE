// ============================================================================
// Reviews API Routes
// Aggregate, manage, and respond to reviews
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { ReviewResponseGenerator, analyzeSentiment, Review } from '@/lib/reviews/response-generator';

const prisma = new PrismaClient();

// GET /api/knowledge-graph/reviews - List all reviews
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const source = searchParams.get('source');
    const needsResponse = searchParams.get('needsResponse') === 'true';
    const sentiment = searchParams.get('sentiment');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: any = {};
    if (source) where.source = source;
    if (needsResponse) where.needsResponse = true;
    if (sentiment) where.sentiment = sentiment;

    const reviews = await prisma.aggregatedReview.findMany({
      where,
      orderBy: { reviewDate: 'desc' },
      take: limit,
    });

    // Calculate stats
    const stats = await calculateReviewStats();

    return NextResponse.json({
      success: true,
      data: reviews,
      stats,
      count: reviews.length,
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}

// POST /api/knowledge-graph/reviews - Create/import review
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      source,
      sourceReviewId,
      rating,
      title,
      content,
      authorName,
      reviewDate,
    } = body;

    // Analyze sentiment
    const sentimentResult = analyzeSentiment({ id: '', rating, content, source });

    const review = await prisma.aggregatedReview.create({
      data: {
        source: source as any,
        sourceReviewId,
        rating,
        title,
        content,
        authorName,
        reviewDate: new Date(reviewDate),
        sentiment: sentimentResult.sentiment as any,
        sentimentScore: sentimentResult.score,
        themes: sentimentResult.themes,
        needsResponse: rating < 5, // Auto-flag for response if not 5-star
        isResponded: false,
      },
    });

    return NextResponse.json({
      success: true,
      data: review,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating review:', error);
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'This review has already been imported' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to create review' },
      { status: 500 }
    );
  }
}

// POST /api/knowledge-graph/reviews/generate-response - Generate AI response
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { reviewId, responseText } = body;

    const review = await prisma.aggregatedReview.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      return NextResponse.json(
        { success: false, error: 'Review not found' },
        { status: 404 }
      );
    }

    // Generate response if not provided
    let finalResponse = responseText;
    if (!finalResponse) {
      const generator = new ReviewResponseGenerator();
      // Map Prisma type (null) to Review interface (undefined)
      const reviewInput: Review = {
        id: review.id,
        rating: review.rating,
        content: review.content,
        authorName: review.authorName ?? undefined,
        source: review.source,
      };
      const result = await generator.generate(reviewInput);
      finalResponse = result.response;
    }

    return NextResponse.json({
      success: true,
      data: {
        reviewId,
        generatedResponse: finalResponse,
      },
    });
  } catch (error) {
    console.error('Error generating response:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate response' },
      { status: 500 }
    );
  }}

// Helper function to calculate review statistics
async function calculateReviewStats() {
  const reviews = await prisma.aggregatedReview.findMany();
  
  const total = reviews.length;
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  const average = total > 0 ? sum / total : 0;
  
  const bySource = reviews.reduce((acc, r) => {
    acc[r.source] = (acc[r.source] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const bySentiment = reviews.reduce((acc, r) => {
    const sentiment = r.sentiment || 'NEUTRAL';
    acc[sentiment] = (acc[sentiment] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const needsResponse = reviews.filter(r => r.needsResponse && !r.isResponded).length;

  return {
    total,
    average: Math.round(average * 10) / 10,
    bySource,
    bySentiment,
    needsResponse,
  };
}
