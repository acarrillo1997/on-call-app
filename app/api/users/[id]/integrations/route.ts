import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";

// Get user integrations
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
    const { success, userId } = await verifyAuth(request);
    if (!success) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Access control - users can only access their own integrations
    if (userId !== params.id) {
      return NextResponse.json(
        { error: "Forbidden - you can only access your own integrations" },
        { status: 403 }
      );
    }

    // Get integrations from database 
    const integrations = await prisma.integration.findMany({
      where: { 
        userId: params.id,
      },
      orderBy: {
        service: 'asc'
      }
    });

    return NextResponse.json(integrations);
  } catch (error) {
    console.error("Error in user integrations API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Create or update integration
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
    const { success, userId } = await verifyAuth(request);
    if (!success) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Access control - users can only update their own integrations
    if (userId !== params.id) {
      return NextResponse.json(
        { error: "Forbidden - you can only update your own integrations" },
        { status: 403 }
      );
    }

    // Get request body
    const data = await request.json();
    
    // Validate required fields
    if (!data.service) {
      return NextResponse.json(
        { error: "Service name is required" },
        { status: 400 }
      );
    }

    // Validate service type
    const validServices = ['slack', 'teams', 'twilio', 'pagerduty'];
    if (!validServices.includes(data.service)) {
      return NextResponse.json(
        { error: "Invalid service. Allowed services: " + validServices.join(', ') },
        { status: 400 }
      );
    }

    // Create or update the integration
    const integration = await prisma.integration.upsert({
      where: {
        userId_service: {
          userId: params.id,
          service: data.service,
        },
      },
      update: {
        configuration: data.configuration || {},
        enabled: data.enabled !== undefined ? data.enabled : true,
      },
      create: {
        userId: params.id,
        service: data.service,
        configuration: data.configuration || {},
        enabled: data.enabled !== undefined ? data.enabled : true,
      },
    });

    return NextResponse.json(integration);
  } catch (error) {
    console.error("Error updating integration:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Delete integration
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
    const { success, userId } = await verifyAuth(request);
    if (!success) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Access control - users can only delete their own integrations
    if (userId !== params.id) {
      return NextResponse.json(
        { error: "Forbidden - you can only delete your own integrations" },
        { status: 403 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const service = searchParams.get('service');

    if (!service) {
      return NextResponse.json(
        { error: "Service name is required" },
        { status: 400 }
      );
    }

    // Verify integration exists
    const integration = await prisma.integration.findUnique({
      where: {
        userId_service: {
          userId: params.id,
          service: service,
        },
      },
    });

    if (!integration) {
      return NextResponse.json(
        { error: "Integration not found" },
        { status: 404 }
      );
    }

    // Delete the integration
    await prisma.integration.delete({
      where: {
        userId_service: {
          userId: params.id,
          service: service,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting integration:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 