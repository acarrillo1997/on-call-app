import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";

// Get a specific team member
export async function GET(
  request: NextRequest,
  context: { params: { id: string; userId: string } }
) {
  const { params } = await context;
  const teamId = params.id;
  const memberId = params.userId;
  
  try {
    // Verify authentication
    const { success, userId } = await verifyAuth(request);
    if (!success) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user has access to this team
    const userTeamMembership = await prisma.teamMember.findUnique({
      where: {
        userId_teamId: {
          userId,
          teamId,
        },
      },
    });

    if (!userTeamMembership) {
      return NextResponse.json(
        { error: "Forbidden - you don't have access to this team" },
        { status: 403 }
      );
    }

    // Get the requested member
    const member = await prisma.teamMember.findUnique({
      where: {
        userId_teamId: {
          userId: memberId,
          teamId,
        },
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

    if (!member) {
      return NextResponse.json(
        { error: "Team member not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(member);
  } catch (error) {
    console.error("Error fetching team member:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Update a team member's role
export async function PATCH(
  request: NextRequest,
  context: { params: { id: string; userId: string } }
) {
  const { params } = await context;
  const teamId = params.id;
  const memberToUpdateId = params.userId;
  
  try {
    // Verify authentication
    const { success, userId } = await verifyAuth(request);
    if (!success) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user is an admin of this team
    const userTeamMembership = await prisma.teamMember.findUnique({
      where: {
        userId_teamId: {
          userId,
          teamId,
        },
      },
    });

    if (!userTeamMembership || userTeamMembership.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden - only team admins can update member roles" },
        { status: 403 }
      );
    }

    // Get request body
    const data = await request.json();
    
    // Validate role
    if (!data.role || !["admin", "member"].includes(data.role)) {
      return NextResponse.json(
        { error: "Valid role (admin or member) is required" },
        { status: 400 }
      );
    }

    // Check if trying to demote self as the last admin
    if (userId === memberToUpdateId && data.role !== "admin") {
      const adminCount = await prisma.teamMember.count({
        where: {
          teamId,
          role: "admin",
        },
      });

      if (adminCount <= 1) {
        return NextResponse.json(
          { error: "Cannot remove the last admin from the team" },
          { status: 400 }
        );
      }
    }

    // Update the member's role
    const updatedMember = await prisma.teamMember.update({
      where: {
        userId_teamId: {
          userId: memberToUpdateId,
          teamId,
        },
      },
      data: {
        role: data.role,
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

    return NextResponse.json(updatedMember);
  } catch (error) {
    console.error("Error updating team member:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 