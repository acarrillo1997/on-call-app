import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";

// Get a single schedule by ID
export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const { params } = context;
  const id = params.id;

  try {
    // Verify authentication
    const { success } = await verifyAuth(request);
    if (!success) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get schedule from database
    const schedule = await prisma.schedule.findUnique({
      where: { id },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!schedule) {
      return NextResponse.json(
        { error: "Schedule not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(schedule);
  } catch (error) {
    console.error("Error in schedule API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Update a schedule
export async function PATCH(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const { params } = context;
  const id = params.id;

  try {
    // Verify authentication
    const { success } = await verifyAuth(request);
    if (!success) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get request body
    const data = await request.json();

    // Validate allowed fields
    const allowedFields = [
      "name",
      "description",
      "rotationFrequency",
      "rotationUnit",
      "startDate",
      "endDate",
      "timezone",
    ];
    
    const sanitizedData: Record<string, any> = {};
    
    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        sanitizedData[field] = data[field];
      }
    }

    // Update schedule in database
    const schedule = await prisma.schedule.update({
      where: { id },
      data: sanitizedData,
    });

    return NextResponse.json(schedule);
  } catch (error) {
    console.error("Error in update schedule API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Delete a schedule
export async function DELETE(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const { params } = context;
  const id = params.id;

  try {
    // Verify authentication
    const { success } = await verifyAuth(request);
    if (!success) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Delete schedule from database
    await prisma.schedule.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: "Schedule deleted successfully" }
    );
  } catch (error) {
    console.error("Error in delete schedule API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 