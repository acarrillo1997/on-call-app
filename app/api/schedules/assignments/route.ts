import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { format, addDays, startOfDay, endOfDay, parseISO } from "date-fns";

// Get all assignments
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const { success } = await verifyAuth(request);
    if (!success) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get query parameters
    const url = new URL(request.url);
    const scheduleId = url.searchParams.get("scheduleId");
    const userId = url.searchParams.get("userId");
    const startDate = url.searchParams.get("startDate");
    const endDate = url.searchParams.get("endDate");

    // Build query
    const where: any = {};
    
    if (scheduleId) {
      where.scheduleId = scheduleId;
    }
    
    if (userId) {
      where.userId = userId;
    }
    
    if (startDate) {
      where.date = {
        ...(where.date || {}),
        gte: new Date(startDate)
      };
    }
    
    if (endDate) {
      where.date = {
        ...(where.date || {}),
        lte: new Date(endDate)
      };
    }

    // Get assignments from database
    const assignments = await prisma.assignment.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        schedule: {
          select: {
            id: true,
            name: true,
            teamId: true,
            team: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        date: 'asc',
      },
    });

    return NextResponse.json(assignments);
  } catch (error) {
    console.error("Error in assignments API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Create a new assignment
export async function POST(request: NextRequest) {
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
    
    // Validate required fields
    if (!data.scheduleId || !data.userId || !data.date) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if user has permission to modify the schedule
    const schedule = await prisma.schedule.findUnique({
      where: { id: data.scheduleId },
      include: {
        team: {
          include: {
            members: {
              where: {
                userId,
                role: "admin",
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

    // Check if user is admin of the team
    if (schedule.team.members.length === 0) {
      return NextResponse.json(
        { error: "You don't have permission to update this schedule" },
        { status: 403 }
      );
    }

    // Parse date - ensure we're using startOfDay for consistent date handling
    const dayDate = startOfDay(new Date(data.date));
    console.log(`Processing assignment for date: ${dayDate.toISOString()} (from input: ${data.date})`);

    // Delete any existing assignments for this date and schedule
    const deletedAssignments = await prisma.assignment.deleteMany({
      where: {
        scheduleId: data.scheduleId,
        date: {
          gte: startOfDay(dayDate),
          lt: endOfDay(dayDate),
        },
      },
    });
    
    console.log(`Deleted ${deletedAssignments.count} existing assignments for this date`);

    // Create new assignment with the normalized date
    const assignment = await prisma.assignment.create({
      data: {
        scheduleId: data.scheduleId,
        userId: data.userId,
        date: dayDate,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });

    return NextResponse.json(assignment);
  } catch (error) {
    console.error("Error in create assignment API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Delete an assignment
export async function DELETE(request: NextRequest) {
  try {
    // Verify authentication
    const { success, userId } = await verifyAuth(request);
    if (!success) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get query parameters
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    
    if (!id) {
      return NextResponse.json(
        { error: "Assignment ID is required" },
        { status: 400 }
      );
    }

    // Get assignment
    const assignment = await prisma.assignment.findUnique({
      where: { id },
      include: {
        schedule: {
          include: {
            team: {
              include: {
                members: {
                  where: {
                    userId,
                    role: "admin",
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!assignment) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 }
      );
    }

    // Check if user is admin of the team
    if (assignment.schedule.team.members.length === 0) {
      return NextResponse.json(
        { error: "You don't have permission to delete this assignment" },
        { status: 403 }
      );
    }

    // Delete assignment
    await prisma.assignment.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: "Assignment deleted successfully" }
    );
  } catch (error) {
    console.error("Error in delete assignment API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 