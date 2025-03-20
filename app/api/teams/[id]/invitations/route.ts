import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendTeamInvitation } from "@/lib/email";
import crypto from 'crypto';

// Get all pending invitations for a team
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

    // Check if user is a member of this team
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

    // Get all pending invitations
    const invitations = await prisma.teamInvitation.findMany({
      where: {
        teamId,
      },
      include: {
        invitedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(invitations);
  } catch (error) {
    console.error("Error fetching team invitations:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Send an invitation
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
        { error: "Forbidden - only team admins can send invitations" },
        { status: 403 }
      );
    }

    // Get the team information
    const team = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team) {
      return NextResponse.json(
        { error: "Team not found" },
        { status: 404 }
      );
    }

    // Get request body
    const data = await request.json();
    
    // Validate required fields
    if (!data.email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Check if there's already a pending invitation for this email
    const existingInvitation = await prisma.teamInvitation.findFirst({
      where: {
        email: data.email,
        teamId,
        status: "pending",
      },
    });

    if (existingInvitation) {
      return NextResponse.json(
        { error: "An invitation has already been sent to this email" },
        { status: 409 }
      );
    }

    // Check if the user is already a member of the team
    const user = await prisma.user.findFirst({
      where: { email: data.email },
    });

    if (user) {
      const isMember = await prisma.teamMember.findUnique({
        where: {
          userId_teamId: {
            userId: user.id,
            teamId,
          },
        },
      });

      if (isMember) {
        return NextResponse.json(
          { error: "This user is already a member of the team" },
          { status: 409 }
        );
      }
    }

    // Get the inviter's name
    const inviter = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });

    // Generate a secure token
    const token = crypto.randomBytes(32).toString('hex');
    
    // Set expiration date (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Create the invitation
    const invitation = await prisma.teamInvitation.create({
      data: {
        email: data.email,
        teamId,
        invitedById: userId,
        role: data.role || "member",
        token,
        expiresAt,
      },
    });

    // Generate invitation link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `http://localhost:3000`;
    const inviteLink = `${baseUrl}/invitations/accept?token=${token}`;

    // Send invitation email
    await sendTeamInvitation(
      data.email,
      team.name,
      inviter?.name || "A team admin",
      inviteLink
    );

    return NextResponse.json(invitation, { status: 201 });
  } catch (error) {
    console.error("Error sending invitation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Delete an invitation
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
        { error: "Forbidden - only team admins can cancel invitations" },
        { status: 403 }
      );
    }

    // Get the invitation ID from the query parameters
    const url = new URL(request.url);
    const invitationId = url.searchParams.get("id");
    
    if (!invitationId) {
      return NextResponse.json(
        { error: "Invitation ID is required" },
        { status: 400 }
      );
    }

    // Check if the invitation exists and belongs to this team
    const invitation = await prisma.teamInvitation.findFirst({
      where: {
        id: invitationId,
        teamId,
      },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: "Invitation not found" },
        { status: 404 }
      );
    }

    // Delete the invitation
    await prisma.teamInvitation.delete({
      where: { id: invitationId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error cancelling invitation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 