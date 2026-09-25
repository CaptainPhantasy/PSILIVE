// ============================================================================
// Single Service Area API Routes
// GET, PUT, DELETE for individual service areas
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/knowledge-graph/service-areas/[id]
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const area = await prisma.serviceArea.findUnique({
      where: { id },
      include: {
        technicians: {
          include: {
            technician: true,
          },
        },
        services: {
          include: {
            service: true,
          },
        },
      },
    });

    if (!area) {
      return NextResponse.json(
        { success: false, error: 'Service area not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: area,
    });
  } catch (error) {
    console.error('Error fetching service area:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch service area' },
      { status: 500 }
    );
  }
}

// PUT /api/knowledge-graph/service-areas/[id]
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    const area = await prisma.serviceArea.update({
      where: { id },
      data: {
        name: body.name,
        city: body.city,
        state: body.state,
        zipCodes: body.zipCodes,
        description: body.description,
        localKeywords: body.localKeywords,
        geoBounds: body.geoBounds,
        population: body.population,
        priority: body.priority,
        isActive: body.isActive,
      },
    });

    return NextResponse.json({
      success: true,
      data: area,
      message: `Service area "${area.name}" updated successfully`,
    });
  } catch (error: any) {
    console.error('Error updating service area:', error);
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { success: false, error: 'Service area not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to update service area' },
      { status: 500 }
    );
  }
}

// DELETE /api/knowledge-graph/service-areas/[id]
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Check if area has linked technicians or services
    const area = await prisma.serviceArea.findUnique({
      where: { id },
      include: {
        _count: {
          select: { technicians: true, services: true },
        },
      },
    });

    if (!area) {
      return NextResponse.json(
        { success: false, error: 'Service area not found' },
        { status: 404 }
      );
    }

    // Soft delete by default - just mark inactive
    // Only hard delete if explicitly requested and no dependencies
    const { searchParams } = new URL(request.url);
    const forceDelete = searchParams.get('force') === 'true';

    if (forceDelete && (area._count.technicians > 0 || area._count.services > 0)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Cannot hard delete service area with linked technicians or services. Remove links first or use soft delete.',
        },
        { status: 400 }
      );
    }

    if (forceDelete) {
      await prisma.serviceArea.delete({ where: { id } });
      return NextResponse.json({
        success: true,
        message: 'Service area permanently deleted',
      });
    } else {
      // Soft delete
      await prisma.serviceArea.update({
        where: { id },
        data: { isActive: false },
      });
      return NextResponse.json({
        success: true,
        message: 'Service area deactivated (soft deleted)',
      });
    }
  } catch (error) {
    console.error('Error deleting service area:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete service area' },
      { status: 500 }
    );
  }
}
