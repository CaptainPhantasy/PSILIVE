// ============================================================================
// Single Service API Routes
// GET, PUT, DELETE for individual services
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/knowledge-graph/services/[id]
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const service = await prisma.serviceOffering.findUnique({
      where: { id },
      include: {
        areas: {
          include: {
            serviceArea: true,
          },
        },
      },
    });

    if (!service) {
      return NextResponse.json(
        { success: false, error: 'Service not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: service,
    });
  } catch (error) {
    console.error('Error fetching service:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch service' },
      { status: 500 }
    );
  }
}

// PUT /api/knowledge-graph/services/[id]
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    const service = await prisma.serviceOffering.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description,
        shortDescription: body.shortDescription,
        basePrice: body.basePrice,
        priceUnit: body.priceUnit,
        features: body.features,
        avgDuration: body.avgDuration,
        icon: body.icon,
        isFeatured: body.isFeatured,
        isActive: body.isActive,
        sortOrder: body.sortOrder,
      },
    });

    return NextResponse.json({
      success: true,
      data: service,
      message: `Service "${service.name}" updated successfully`,
    });
  } catch (error: any) {
    console.error('Error updating service:', error);
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { success: false, error: 'Service not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to update service' },
      { status: 500 }
    );
  }
}

// DELETE /api/knowledge-graph/services/[id]
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const forceDelete = searchParams.get('force') === 'true';

    const service = await prisma.serviceOffering.findUnique({
      where: { id },
      include: {
        _count: {
          select: { areas: true },
        },
      },
    });

    if (!service) {
      return NextResponse.json(
        { success: false, error: 'Service not found' },
        { status: 404 }
      );
    }

    if (forceDelete && service._count.areas > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Cannot delete service with linked areas. Remove links first.',
        },
        { status: 400 }
      );
    }

    if (forceDelete) {
      await prisma.serviceOffering.delete({ where: { id } });
      return NextResponse.json({
        success: true,
        message: 'Service permanently deleted',
      });
    } else {
      await prisma.serviceOffering.update({
        where: { id },
        data: { isActive: false },
      });
      return NextResponse.json({
        success: true,
        message: 'Service deactivated (soft deleted)',
      });
    }
  } catch (error) {
    console.error('Error deleting service:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete service' },
      { status: 500 }
    );
  }
}
