// ============================================================================
// Services API Routes
// CRUD operations for service offerings
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/knowledge-graph/services - List all services
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active') === 'true';
    const featuredOnly = searchParams.get('featured') === 'true';
    
    const where: any = {};
    if (activeOnly) where.isActive = true;
    if (featuredOnly) where.isFeatured = true;
    
    const services = await prisma.serviceOffering.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: services,
      count: services.length,
    });
  } catch (error) {
    console.error('Error fetching services:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch services' },
      { status: 500 }
    );
  }
}

// POST /api/knowledge-graph/services - Create new service
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      name,
      description,
      shortDescription,
      basePrice,
      priceUnit,
      features,
      avgDuration,
      icon,
      isFeatured = false,
      sortOrder = 0,
    } = body;

    // Generate slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const service = await prisma.serviceOffering.create({
      data: {
        name,
        slug,
        description,
        shortDescription,
        basePrice: basePrice || 0,
        priceUnit,
        features: features || [],
        avgDuration: avgDuration || 60,
        icon,
        isFeatured,
        sortOrder,
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: service,
      message: `Service "${name}" created successfully`,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating service:', error);
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'A service with this name already exists' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to create service' },
      { status: 500 }
    );
  }
}
