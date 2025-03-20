import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";

// Get all schedules
export async function GET(request: NextRequest) {
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
    const teamId = url.searchParams.get("teamId");
    const userIdParam = url.searchParams.get("userId");
    const startDate = url.searchParams.get("startDate");
    const endDate = url.searchParams.get("endDate");

    // Build query filter
    const filter: any = {};

    if (teamId) {
      filter.teamId = teamId;
    }

    if (startDate || endDate) {
      filter.assignments = {
        some: {}
      };
      
      if (startDate) {
        filter.assignments.some.date = {
          gte: new Date(startDate)
        };
      }
      
      if (endDate) {
        if (!filter.assignments.some.date) {
          filter.assignments.some.date = {};
        }
        filter.assignments.some.date.lte = new Date(endDate);
      }
    }

    // User specific schedules
    if (userIdParam) {
      if (!filter.assignments) {
        filter.assignments = { some: {} };
      }
      filter.assignments.some.userId = userIdParam;
    }

    // Get schedules from database
    const schedules = await prisma.schedule.findMany({
      where: filter,
      include: {
        team: {
          select: {
            id: true,
            name: true,
          },
        },
        assignments: {
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
          orderBy: {
            date: 'asc',
          }
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(schedules);
  } catch (error) {
    console.error("Error in schedules API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Create a new schedule
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
    if (!data.name || !data.teamId || !data.rotationFrequency || !data.rotationUnit || !data.startDate) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if user is admin of the team
    const isMember = await prisma.teamMember.findFirst({
      where: {
        teamId: data.teamId,
        userId: userId,
        role: "admin",
      },
    });

    if (!isMember) {
      return NextResponse.json(
        { error: "You don't have permission to create schedules for this team" },
        { status: 403 }
      );
    }

    // Create schedule in database
    let schedule;
    try {
      schedule = await prisma.schedule.create({
        data: {
          name: data.name,
          description: data.description || null,
          rotationFrequency: parseInt(data.rotationFrequency.toString()),
          rotationUnit: data.rotationUnit,
          startDate: new Date(data.startDate),
          endDate: data.endDate ? new Date(data.endDate) : null,
          timezone: data.timezone || "UTC",
          teamId: data.teamId,
        },
      });
    } catch (err) {
      console.error("Error creating schedule:", err);
      return NextResponse.json(
        { error: "Failed to create schedule", details: err instanceof Error ? err.message : "Unknown error" },
        { status: 500 }
      );
    }

    // Create initial rotation if members are provided
    if (data.members && Array.isArray(data.members) && data.members.length > 0) {
      try {
        // Generate assignments based on rotation settings
        const startDate = new Date(data.startDate);
        const endDate = data.endDate ? new Date(data.endDate) : 
          new Date(startDate.getTime() + (90 * 24 * 60 * 60 * 1000)); // Default to 90 days if no end date
        
        const assignments = generateRotationAssignments(
          data.members,
          startDate,
          endDate,
          parseInt(data.rotationFrequency.toString()),
          data.rotationUnit
        );
        
        // Create all assignments in batches to avoid overloading the database
        for (let i = 0; i < assignments.length; i += 100) {
          const batch = assignments.slice(i, i + 100);
          await prisma.assignment.createMany({
            data: batch.map(assignment => ({
              scheduleId: schedule.id,
              userId: assignment.userId,
              date: assignment.date,
            })),
          });
        }
      } catch (err) {
        console.error("Error creating assignments:", err);
        // We don't fail the request if assignments creation fails
        // The schedule is already created, and assignments can be added later
      }
    }

    // Return created schedule with assignments
    try {
      const createdSchedule = await prisma.schedule.findUnique({
        where: { id: schedule.id },
        include: {
          team: {
            select: {
              id: true,
              name: true,
            },
          },
          assignments: {
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
            orderBy: {
              date: 'asc',
            },
            take: 100, // Limit to avoid large responses
          },
        },
      });
      
      return NextResponse.json(createdSchedule);
    } catch (err) {
      // If we can't fetch the complete schedule, just return the basic one
      console.error("Error fetching created schedule:", err);
      return NextResponse.json(schedule);
    }
  } catch (error) {
    console.error("Error in create schedule API:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// Helper function to generate rotation assignments
function generateRotationAssignments(
  members: string[],
  startDate: Date,
  endDate: Date,
  frequency: number,
  unit: string
) {
  const assignments = [];
  const currentDate = new Date(startDate);
  let memberIndex = 0;
  
  // Calculate rotation duration in days
  let rotationDays;
  
  switch (unit) {
    case 'daily':
      rotationDays = frequency;
      break;
    case 'weekly':
      rotationDays = frequency * 7;
      break;
    case 'biweekly':
      rotationDays = frequency * 14;
      break;
    case 'monthly':
      rotationDays = frequency * 30; // Approximation
      break;
    default:
      rotationDays = frequency * 7; // Default to weekly
  }
  
  // Generate assignments until end date
  while (currentDate <= endDate) {
    const userId = members[memberIndex];
    
    // Create assignment for the current date
    assignments.push({
      userId,
      date: new Date(currentDate)
    });
    
    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
    
    // Check if we need to rotate to the next member
    const daysSinceStart = Math.floor((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceStart % rotationDays === 0) {
      memberIndex = (memberIndex + 1) % members.length;
    }
  }
  
  return assignments;
}

// Add route for deleting schedules
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
        { error: "Schedule ID is required" },
        { status: 400 }
      );
    }

    // Get schedule
    const schedule = await prisma.schedule.findUnique({
      where: { id },
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
        { error: "You don't have permission to delete this schedule" },
        { status: 403 }
      );
    }

    // Delete all assignments first (Prisma cascade doesn't always work as expected)
    await prisma.assignment.deleteMany({
      where: { scheduleId: id },
    });

    // Delete schedule
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

// Add route for updating schedules
export async function PATCH(request: NextRequest) {
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
    if (!data.id) {
      return NextResponse.json(
        { error: "Schedule ID is required" },
        { status: 400 }
      );
    }

    // Get schedule
    const schedule = await prisma.schedule.findUnique({
      where: { id: data.id },
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

    // Prepare update data with only allowed fields
    const updateData: any = {};
    
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.rotationFrequency !== undefined) updateData.rotationFrequency = parseInt(data.rotationFrequency.toString());
    if (data.rotationUnit !== undefined) updateData.rotationUnit = data.rotationUnit;
    if (data.startDate !== undefined) updateData.startDate = new Date(data.startDate);
    if (data.endDate !== undefined) updateData.endDate = data.endDate ? new Date(data.endDate) : null;
    if (data.timezone !== undefined) updateData.timezone = data.timezone;

    // Update schedule
    const updatedSchedule = await prisma.schedule.update({
      where: { id: data.id },
      data: updateData,
      include: {
        team: {
          select: {
            id: true,
            name: true,
          },
        },
        assignments: {
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
          orderBy: {
            date: 'asc',
          },
          take: 100, // Limit to avoid large responses
        },
      },
    });

    // If rotationFrequency or rotationUnit changed, and members are provided, regenerate future assignments
    if ((data.rotationFrequency !== undefined || data.rotationUnit !== undefined) && 
        data.members && Array.isArray(data.members) && data.members.length > 0) {
      try {
        // Delete all future assignments starting from today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        await prisma.assignment.deleteMany({
          where: { 
            scheduleId: data.id,
            date: {
              gte: today
            }
          },
        });
        
        // Generate new assignments from today to end date or 90 days
        const startDate = today;
        const endDate = updatedSchedule.endDate || 
          new Date(startDate.getTime() + (90 * 24 * 60 * 60 * 1000));
        
        const assignments = generateRotationAssignments(
          data.members,
          startDate,
          endDate,
          updatedSchedule.rotationFrequency,
          updatedSchedule.rotationUnit
        );
        
        // Create all assignments in batches
        for (let i = 0; i < assignments.length; i += 100) {
          const batch = assignments.slice(i, i + 100);
          await prisma.assignment.createMany({
            data: batch.map(assignment => ({
              scheduleId: updatedSchedule.id,
              userId: assignment.userId,
              date: assignment.date,
            })),
          });
        }
      } catch (err) {
        console.error("Error regenerating assignments:", err);
        // We don't fail the request if assignments regeneration fails
      }
    }

    return NextResponse.json(updatedSchedule);
  } catch (error) {
    console.error("Error in update schedule API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 