import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";

// Get a single incident by ID
export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const { id } = await context.params;
  
  try {
    // Verify authentication
    const { success } = await verifyAuth(request);
    if (!success) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get incident from database
    const incident = await prisma.incident.findUnique({
      where: { id },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        service: true,
        updates: {
          orderBy: {
            createdAt: 'desc'
          }
        }
      },
    });

    if (!incident) {
      return NextResponse.json(
        { error: "Incident not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(incident);
  } catch (error) {
    console.error("Error in incident API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Update an incident
export async function PATCH(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const { id } = await context.params;

  try {
    // Verify authentication
    const { success, userId } = await verifyAuth(request);
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
      "title",
      "description",
      "status",
      "severity",
      "assigneeId",
      "serviceId",
    ];
    
    const sanitizedData: Record<string, any> = {};
    
    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        sanitizedData[field] = data[field];
      }
    }

    // Get the current incident to check if status changed
    const currentIncident = await prisma.incident.findUnique({
      where: { id }
    });

    if (!currentIncident) {
      return NextResponse.json(
        { error: "Incident not found" },
        { status: 404 }
      );
    }

    // If status changed, create an incident update
    if (data.status && data.status !== currentIncident.status) {
      await prisma.incidentUpdate.create({
        data: {
          incidentId: id,
          userId,
          message: `Status changed from ${currentIncident.status} to ${data.status}`,
          type: 'STATUS_CHANGE'
        }
      });
    }

    // If assignee changed, create an incident update
    if (data.assigneeId && data.assigneeId !== currentIncident.assigneeId) {
      const newAssignee = await prisma.user.findUnique({
        where: { id: data.assigneeId },
        select: { name: true }
      });
      
      const oldAssigneeName = currentIncident.assigneeId ? 
        (await prisma.user.findUnique({
          where: { id: currentIncident.assigneeId },
          select: { name: true }
        }))?.name || 'unassigned' : 
        'unassigned';

      await prisma.incidentUpdate.create({
        data: {
          incidentId: id,
          userId,
          message: `Assignee changed from ${oldAssigneeName} to ${newAssignee?.name || 'unassigned'}`,
          type: 'ASSIGNMENT_CHANGE'
        }
      });
    }

    // Update incident in database
    const incident = await prisma.incident.update({
      where: { id },
      data: sanitizedData,
    });

    return NextResponse.json(incident);
  } catch (error) {
    console.error("Error in update incident API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Delete an incident
export async function DELETE(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const { id } = await context.params;
  
  try {
    // Verify authentication
    const { success } = await verifyAuth(request);
    if (!success) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Delete incident from database
    await prisma.incident.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: "Incident deleted successfully" }
    );
  } catch (error) {
    console.error("Error in delete incident API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 