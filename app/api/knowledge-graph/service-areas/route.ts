// ============================================================================
// Service Areas API Routes
// CRUD operations for service area management
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/knowledge-graph/service-areas - List all service areas
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active') === 'true';
    
    const where = activeOnly ? { isActive: true } : {};
    
    const areas = await prisma.serviceArea.findMany({
      where,
      orderBy: [
        { priority: 'desc' },
        { name: 'asc' },
      ],
      include: {
        _count: {
          select: { technicians: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: areas,
      count: areas.length,
    });
  } catch (error) {
    console.error('Error fetching service areas:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch service areas' },
      { status: 500 }
    );
  }
}

// POST /api/knowledge-graph/service-areas - Create new service area
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      name,
      city,
      state = 'IN',
      zipCodes,
      description,
      localKeywords,
      geoBounds,
      population,
      priority = 0,
    } = body;

    // Generate slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const area = await prisma.serviceArea.create({
      data: {
        name,
        slug,
        city,
        state,
        zipCodes: zipCodes || [],
        description,
        localKeywords: localKeywords || [],
        geoBounds,
        population,
        priority,
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: area,
      message: `Service area "${name}" created successfully`,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating service area:', error);
    
    // Handle unique constraint violation
    if (error.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'A service area with this name already exists' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to create service area' },
      { status: 500 }
    );
  }
}

// PATCH /api/knowledge-graph/service-areas - Bulk update priorities
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { updates } = body;

    if (!Array.isArray(updates)) {
      return NextResponse.json(
        { success: false, error: 'Updates must be an array of {id, priority} objects' },
        { status: 400 }
      );
    }

    // Update priorities in a transaction
    await prisma.$transaction(
      updates.map(({ id, priority }: { id: string; priority: number }) =>
        prisma.serviceArea.update({
          where: { id },
          data: { priority },
        })
      )
    );

    return NextResponse.json({
      success: true,
      message: `Updated priorities for ${updates.length} service areas`,
    });
  } catch (error) {
    console.error('Error updating service areas:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update service areas' },
      { status: 500 }
    );
  }
}
