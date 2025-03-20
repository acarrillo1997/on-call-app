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

    // Check if user has admin role in any team (admin users can see all users)
    const userTeamMemberships = await prisma.teamMember.findMany({
      where: {
        userId,
        role: "admin",
      },
    });
    
    const isAdmin = userTeamMemberships.length > 0;
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Forbidden - Only admins can view all users" },
        { status: 403 }
      );
    }

    // Get all users from database
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 