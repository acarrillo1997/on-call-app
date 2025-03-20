import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";

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
    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('teamId');
    const status = searchParams.get('status');

    // Build query
    const query: any = {
      where: {},
      orderBy: {
        createdAt: 'desc' as const,
      },
      include: {
        team: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    };

    // If teamId is provided, filter by team
    if (teamId) {
      query.where.teamId = teamId;
    } else {
      // Otherwise, only show incidents for teams the user is a member of
      const userTeams = await prisma.teamMember.findMany({
        where: { userId },
        select: { teamId: true },
      });
      
      query.where.teamId = {
        in: userTeams.map(t => t.teamId),
      };
    }

    // If status filter provided, add it to the query
    if (status) {
      query.where.status = status;
    }

    // Get incidents
    const incidents = await prisma.incident.findMany(query);

    return NextResponse.json(incidents);
  } catch (error) {
    console.error("Error in incidents API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

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
    if (!data.title || !data.teamId) {
      return NextResponse.json(
        { error: "Title and team ID are required" },
        { status: 400 }
      );
    }

    // Verify user is a member of the team
    const teamMembership = await prisma.teamMember.findUnique({
      where: {
        userId_teamId: {
          userId,
          teamId: data.teamId,
        },
      },
    });

    if (!teamMembership) {
      return NextResponse.json(
        { error: "You are not a member of this team" },
        { status: 403 }
      );
    }

    // Create the incident
    const incident = await prisma.incident.create({
      data: {
        title: data.title,
        description: data.description,
        severity: data.severity,
        teamId: data.teamId,
        createdById: userId,
        status: "open",
      },
      include: {
        team: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });

    return NextResponse.json(incident, { status: 201 });
  } catch (error) {
    console.error("Error creating incident:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 