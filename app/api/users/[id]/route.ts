import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(
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

    // Access control - users can only access their own data
    if (userId !== id) {
      return NextResponse.json(
        { error: "Forbidden - you can only access your own profile" },
        { status: 403 }
      );
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id },
    });

    // If user doesn't exist, create a new one
    if (!user) {
      const newUser = await prisma.user.create({
        data: {
          id,
          createdAt: new Date(),
        },
      });
      return NextResponse.json(newUser);
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error in user profile API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

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

    // Access control - users can only update their own data
    if (userId !== id) {
      return NextResponse.json(
        { error: "Forbidden - you can only update your own profile" },
        { status: 403 }
      );
    }

    // Get body data
    const data = await request.json();

    // Validate and sanitize inputs
    const allowedFields = ["name", "avatarUrl", "email", "phone", "timezone"];
    const sanitizedData: Record<string, any> = {};
    
    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        sanitizedData[field] = data[field];
      }
    }

    // Update user profile in database
    let user = await prisma.user.findUnique({
      where: { id },
    });

    if (user) {
      // Update existing user
      user = await prisma.user.update({
        where: { id },
        data: sanitizedData,
      });
    } else {
      // Create new user if they don't exist
      user = await prisma.user.create({
        data: {
          id,
          ...sanitizedData,
        },
      });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error in update user profile API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const { id } = await context.params;
  const idToDelete = id;
  
  try {
    // Verify authentication
    const { success, userId } = await verifyAuth(request);
    if (!success) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get the user's team memberships to check for admin privileges
    const userTeamMemberships = await prisma.teamMember.findMany({
      where: {
        userId,
        role: "admin",
      },
    });

    // Users can delete their own account, admins can delete users
    const isAdmin = userTeamMemberships.length > 0;
    if (userId !== idToDelete && !isAdmin) {
      return NextResponse.json(
        { error: "Forbidden - only administrators can delete other users" },
        { status: 403 }
      );
    }

    // Check if user exists
    const userToDelete = await prisma.user.findUnique({
      where: { id: idToDelete },
    });

    if (!userToDelete) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Delete the user
    await prisma.user.delete({
      where: { id: idToDelete },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 