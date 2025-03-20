// This route is for DEVELOPMENT ONLY and should be removed in production
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "This endpoint is only available in development" },
      { status: 403 }
    );
  }

  try {
    // Get request body
    const data = await request.json();
    
    // Create a development user
    const userId = data.userId || `dev-${Date.now()}`;
    
    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!user) {
      // Create new user
      user = await prisma.user.create({
        data: {
          id: userId,
          name: data.name || "Development User",
          email: data.email || "dev@example.com",
          timezone: data.timezone || "UTC",
          createdAt: new Date(),
        },
      });
      
      console.log("Debug user created:", user);
    } else {
      console.log("Debug user already exists:", user);
    }
    
    // Create default settings
    const settings = await prisma.userSettings.upsert({
      where: { userId },
      update: {},
      create: {
        userId,
        emailNotifications: true,
        smsNotifications: true,
      }
    });
    
    return NextResponse.json({
      message: "Debug user created successfully",
      user,
      userId,
      settings
    });
  } catch (error) {
    console.error("Error creating debug user:", error);
    return NextResponse.json(
      { error: "Error creating debug user" },
      { status: 500 }
    );
  }
} 