import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";

// Get user settings
export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const { params } = await context;
  const id = params.id;

  try {
    // Verify authentication
    const { success, userId } = await verifyAuth(request);
    if (!success) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Access control - users can only access their own settings
    if (userId !== id) {
      return NextResponse.json(
        { error: "Forbidden - you can only access your own settings" },
        { status: 403 }
      );
    }

    // Get user settings from database
    const settings = await prisma.userSettings.findUnique({
      where: { userId: id },
    });

    // If settings don't exist, return default settings
    if (!settings) {
      return NextResponse.json({
        userId: id,
        emailNotifications: true,
        smsNotifications: true,
        slackNotifications: false,
        voiceNotifications: false,
        incidentAssignmentChannel: "all",
        scheduleChangeChannel: "email",
        escalationChannel: "all",
        webhookUrl: null,
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error in user settings API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Update user settings
export async function PUT(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const { params } = context;
  const id = params.id;
  
  try {
    // Verify authentication
    const { success, userId } = await verifyAuth(request);
    if (!success) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Access control - users can only update their own settings
    if (userId !== id) {
      return NextResponse.json(
        { error: "Forbidden - you can only update your own settings" },
        { status: 403 }
      );
    }

    // Get request body
    const data = await request.json();

    // Validate allowed fields
    const allowedFields = [
      "emailNotifications",
      "smsNotifications",
      "slackNotifications",
      "voiceNotifications",
      "incidentAssignmentChannel",
      "scheduleChangeChannel",
      "escalationChannel",
      "webhookUrl",
    ];
    
    const sanitizedData: Record<string, any> = {};
    
    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        sanitizedData[field] = data[field];
      }
    }

    // Update or create settings in database
    const settings = await prisma.userSettings.upsert({
      where: { 
        userId: id 
      },
      update: sanitizedData,
      create: {
        userId: id,
        ...sanitizedData,
      },
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error in update user settings API:", error);
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
  const { params } = await context;
  const id = params.id;
  
  try {
    // Verify authentication
    const { success, userId } = await verifyAuth(request);
    if (!success) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Access control - users can only update their own settings
    if (userId !== id) {
      return NextResponse.json(
        { error: "Forbidden - you can only update your own settings" },
        { status: 403 }
      );
    }

    // Get request body
    const data = await request.json();

    // Validate allowed fields
    const allowedFields = [
      "emailNotifications",
      "smsNotifications",
      "slackNotifications",
      "voiceNotifications",
      "incidentAssignmentChannel",
      "scheduleChangeChannel",
      "escalationChannel",
      "webhookUrl",
    ];
    
    const sanitizedData: Record<string, any> = {};
    
    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        sanitizedData[field] = data[field];
      }
    }

    // Update or create settings in database
    const settings = await prisma.userSettings.upsert({
      where: { 
        userId: id 
      },
      update: sanitizedData,
      create: {
        userId: id,
        ...sanitizedData,
      },
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error in update user settings API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 