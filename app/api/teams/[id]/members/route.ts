import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";

// Get all team members
export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const { params } = context;
  const teamId = params.id;
  
  try {
    // Verify authentication
    const { success, userId } = await verifyAuth(request);
    if (!success) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user has access to this team (is a member of the team)
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

    // Get all team members
    const members = await prisma.teamMember.findMany({
      where: {
        teamId,
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

    return NextResponse.json(members);
  } catch (error) {
    console.error("Error fetching team members:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Add a member to the team
export async function POST(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const { params } = context;
  const teamId = params.id;
  
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
        { error: "Forbidden - only team admins can add members" },
        { status: 403 }
      );
    }

    // Get request body
    const data = await request.json();
    
    // Validate required fields
    if (!data.userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Check if user exists
    const userExists = await prisma.user.findUnique({
      where: { id: data.userId },
    });

    if (!userExists) {
      return NextResponse.json(
        { error: "User does not exist" },
        { status: 404 }
      );
    }

    // Check if user is already a member
    const existingMembership = await prisma.teamMember.findUnique({
      where: {
        userId_teamId: {
          userId: data.userId,
          teamId,
        },
      },
    });

    if (existingMembership) {
      return NextResponse.json(
        { error: "User is already a member of this team" },
        { status: 409 }
      );
    }

    // Add user to team
    const teamMember = await prisma.teamMember.create({
      data: {
        userId: data.userId,
        teamId,
        role: data.role || "member", // Default to 'member' if no role specified
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

    return NextResponse.json(teamMember, { status: 201 });
  } catch (error) {
    console.error("Error adding team member:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Remove a member from the team
export async function DELETE(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const { params } = context;
  const teamId = params.id;
  
  try {
    // Verify authentication
    const { success, userId } = await verifyAuth(request);
    if (!success) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get the userId to remove from the query parameters
    const url = new URL(request.url);
    const memberIdToRemove = url.searchParams.get("userId");
    
    if (!memberIdToRemove) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Check if the requesting user is an admin of this team
    const userTeamMembership = await prisma.teamMember.findUnique({
      where: {
        userId_teamId: {
          userId,
          teamId,
        },
      },
    });

    // Non-admins can only remove themselves
    if (!userTeamMembership) {
      return NextResponse.json(
        { error: "Forbidden - you don't have access to this team" },
        { status: 403 }
      );
    }
    
    if (userTeamMembership.role !== "admin" && userId !== memberIdToRemove) {
      return NextResponse.json(
        { error: "Forbidden - only team admins can remove other members" },
        { status: 403 }
      );
    }

    // Prevent removing the last admin
    if (memberIdToRemove === userId && userTeamMembership.role === "admin") {
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

    // Remove user from team
    await prisma.teamMember.delete({
      where: {
        userId_teamId: {
          userId: memberIdToRemove,
          teamId,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing team member:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 