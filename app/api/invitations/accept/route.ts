import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PrismaClient } from "@prisma/client";

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const { success, userId, email } = await verifyAuth(request);
    if (!success) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get request body
    const data = await request.json();
    
    // Validate required fields
    if (!data.token) {
      return NextResponse.json(
        { error: "Invitation token is required" },
        { status: 400 }
      );
    }

    // Find the invitation by token
    const invitation = await prisma.teamInvitation.findUnique({
      where: { token: data.token },
      include: {
        team: true,
      },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: "Invalid or expired invitation" },
        { status: 404 }
      );
    }

    // Check if invitation has expired
    if (invitation.status !== "pending" || new Date() > invitation.expiresAt) {
      return NextResponse.json(
        { error: "This invitation has expired" },
        { status: 410 }
      );
    }

    // Check if the authenticated user's email matches the invitation email
    if (email && email.toLowerCase() !== invitation.email.toLowerCase()) {
      return NextResponse.json(
        { error: "This invitation was sent to a different email address" },
        { status: 403 }
      );
    }

    // Check if the user is already a member of the team
    const existingMembership = await prisma.teamMember.findUnique({
      where: {
        userId_teamId: {
          userId,
          teamId: invitation.teamId,
        },
      },
    });

    if (existingMembership) {
      // Mark invitation as accepted
      await prisma.teamInvitation.update({
        where: { id: invitation.id },
        data: { status: "accepted" },
      });

      return NextResponse.json(
        { error: "You are already a member of this team", team: invitation.team },
        { status: 409 }
      );
    }

    // Start a transaction to add the user to the team and mark the invitation as accepted
    const result = await prisma.$transaction(async (tx: PrismaClient) => {
      // Add user to the team
      const teamMember = await tx.teamMember.create({
        data: {
          userId,
          teamId: invitation.teamId,
          role: invitation.role,
        },
      });

      // Mark invitation as accepted
      const updatedInvitation = await tx.teamInvitation.update({
        where: { id: invitation.id },
        data: { status: "accepted" },
      });

      return { teamMember, invitation: updatedInvitation };
    });

    return NextResponse.json({
      message: "Invitation accepted successfully",
      teamId: invitation.teamId,
      teamName: invitation.team.name,
    });
  } catch (error) {
    console.error("Error accepting invitation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 