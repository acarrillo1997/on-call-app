import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";

// Mock database for demonstration
const userProfiles: Record<string, any> = {};

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    if (userId !== params.id) {
      return NextResponse.json(
        { error: "Forbidden - you can only access your own profile" },
        { status: 403 }
      );
    }

    // Get user profile from "database" or create a placeholder
    const userProfile = userProfiles[params.id] || {
      id: params.id,
      name: null,
      avatarUrl: null,
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json(userProfile);
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
  { params }: { params: { id: string } }
) {
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
    if (userId !== params.id) {
      return NextResponse.json(
        { error: "Forbidden - you can only update your own profile" },
        { status: 403 }
      );
    }

    // Get body data
    const data = await request.json();

    // Validate and sanitize inputs
    const allowedFields = ["name", "avatarUrl"];
    const sanitizedData: Record<string, any> = {};
    
    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        sanitizedData[field] = data[field];
      }
    }

    // Update user profile
    userProfiles[params.id] = {
      ...userProfiles[params.id] || { id: params.id, createdAt: new Date().toISOString() },
      ...sanitizedData,
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json(userProfiles[params.id]);
  } catch (error) {
    console.error("Error in update user profile API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 