import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import crypto from "crypto";

// Get user API keys
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

    // Access control - users can only access their own API keys
    if (userId !== params.id) {
      return NextResponse.json(
        { error: "Forbidden - you can only access your own API keys" },
        { status: 403 }
      );
    }

    // Get API keys from database (excluding the actual key for security)
    const apiKeys = await prisma.apiKey.findMany({
      where: { 
        userId: params.id,
        revoked: false
      },
      select: {
        id: true,
        name: true,
        createdAt: true,
        lastUsed: true,
        // Don't return the actual key value
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(apiKeys);
  } catch (error) {
    console.error("Error in user API keys API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Create new API key
export async function POST(
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

    // Access control - users can only create their own API keys
    if (userId !== params.id) {
      return NextResponse.json(
        { error: "Forbidden - you can only create API keys for your own account" },
        { status: 403 }
      );
    }

    // Get request body
    const data = await request.json();
    
    // Validate required fields
    if (!data.name) {
      return NextResponse.json(
        { error: "API key name is required" },
        { status: 400 }
      );
    }

    // Generate a secure API key
    const apiKeyValue = crypto.randomBytes(32).toString('hex');
    
    // Create the API key
    const apiKey = await prisma.apiKey.create({
      data: {
        userId: params.id,
        name: data.name,
        key: apiKeyValue,
      },
    });

    // Return the API key information with the key (user will only see it once)
    return NextResponse.json({
      id: apiKey.id,
      name: apiKey.name,
      key: apiKeyValue, // Only return the key value on creation
      createdAt: apiKey.createdAt,
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating API key:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Revoke API key
export async function DELETE(
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

    // Access control - users can only revoke their own API keys
    if (userId !== params.id) {
      return NextResponse.json(
        { error: "Forbidden - you can only revoke your own API keys" },
        { status: 403 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const keyId = searchParams.get('keyId');

    if (!keyId) {
      return NextResponse.json(
        { error: "API key ID is required" },
        { status: 400 }
      );
    }

    // Verify ownership of the API key
    const apiKey = await prisma.apiKey.findUnique({
      where: { id: keyId },
    });

    if (!apiKey) {
      return NextResponse.json(
        { error: "API key not found" },
        { status: 404 }
      );
    }

    if (apiKey.userId !== userId) {
      return NextResponse.json(
        { error: "Forbidden - you can only revoke your own API keys" },
        { status: 403 }
      );
    }

    // Revoke the API key (we don't actually delete it for audit trail)
    await prisma.apiKey.update({
      where: { id: keyId },
      data: { revoked: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error revoking API key:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 