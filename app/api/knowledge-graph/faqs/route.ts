// ============================================================================
// FAQs API Routes
// CRUD operations for FAQ management
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { FAQCategory } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/knowledge-graph/faqs - List all FAQs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const publishedOnly = searchParams.get('published') === 'true';
    const category = searchParams.get('category');
    const area = searchParams.get('area'); // Filter by applicable area
    
    const where: any = {};
    if (publishedOnly) where.isPublished = true;
    if (category) where.category = category;
    
    const faqs = await prisma.fAQ.findMany({
      where,
      orderBy: [
        { category: 'asc' },
        { sortOrder: 'asc' },
        { question: 'asc' },
      ],
    });

    // Filter by area if specified
    const filteredFaqs = area 
      ? faqs.filter(faq => 
          faq.serviceAreas.length === 0 || // Empty = all areas
          faq.serviceAreas.includes(area)
        )
      : faqs;

    return NextResponse.json({
      success: true,
      data: filteredFaqs,
      count: filteredFaqs.length,
    });
  } catch (error) {
    console.error('Error fetching FAQs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch FAQs' },
      { status: 500 }
    );
  }
}

// POST /api/knowledge-graph/faqs - Create new FAQ
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      question,
      answer,
      shortAnswer,
      category = 'GENERAL',
      serviceAreas = [],
      services = [],
      keywords = [],
      sortOrder = 0,
    } = body;

    const faq = await prisma.fAQ.create({
      data: {
        question,
        answer,
        shortAnswer,
        category: category as FAQCategory,
        serviceAreas,
        services,
        keywords,
        sortOrder,
        isPublished: false, // Default to unpublished
      },
    });

    return NextResponse.json({
      success: true,
      data: faq,
      message: `FAQ created successfully. Publish it when ready.`,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating FAQ:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create FAQ' },
      { status: 500 }
    );
  }
}

// PATCH /api/knowledge-graph/faqs - Bulk operations
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ids, data } = body;

    switch (action) {
      case 'publish':
        await prisma.fAQ.updateMany({
          where: { id: { in: ids } },
          data: { isPublished: true },
        });
        return NextResponse.json({
          success: true,
          message: `Published ${ids.length} FAQs`,
        });

      case 'unpublish':
        await prisma.fAQ.updateMany({
          where: { id: { in: ids } },
          data: { isPublished: false },
        });
        return NextResponse.json({
          success: true,
          message: `Unpublished ${ids.length} FAQs`,
        });

      case 'reorder':
        await prisma.$transaction(
          data.map(({ id, sortOrder }: { id: string; sortOrder: number }) =>
            prisma.fAQ.update({
              where: { id },
              data: { sortOrder },
            })
          )
        );
        return NextResponse.json({
          success: true,
          message: `Reordered ${data.length} FAQs`,
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action. Use: publish, unpublish, reorder' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error bulk updating FAQs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to bulk update FAQs' },
      { status: 500 }
    );
  }
}
