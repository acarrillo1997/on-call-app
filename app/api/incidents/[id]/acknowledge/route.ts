import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";

// Acknowledge an incident
export async function POST(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const { id } = await context.params;

  try {
    // Get request body
    const data = await request.json();
    
    // Check if this is an external acknowledgment (via token) or a web acknowledgment (via auth)
    let userId: string;
    
    if (data.token) {
      // Verify the token for external acknowledgments (SMS, Slack, Voice)
      // In a real app, you would validate the token against a stored token
      // For this demo, we'll just check if the userId is provided
      if (!data.userId) {
        return NextResponse.json(
          { error: "Invalid acknowledgment token" },
          { status: 401 }
        );
      }
      
      userId = data.userId;
    } else {
      // For web acknowledgments, use standard auth
      const { success, userId: authUserId } = await verifyAuth(request);
      if (!success || !authUserId) {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        );
      }
      
      userId = authUserId;
    }

    // Get the incident
    const incident = await prisma.incident.findUnique({
      where: { id }
    });

    if (!incident) {
      return NextResponse.json(
        { error: "Incident not found" },
        { status: 404 }
      );
    }
    
    // Don't re-acknowledge already acknowledged incidents
    if (incident.status === "acknowledged") {
      return NextResponse.json({
        message: "Incident already acknowledged",
        incident
      });
    }

    // Determine the acknowledgment channel
    const channel = data.channel || "web"; // web, slack, sms, voice

    // Create an acknowledgment record
    await prisma.incidentAcknowledgment.create({
      data: {
        incidentId: id,
        userId: userId,
        channel: channel,
        acknowledgedAt: new Date(),
      }
    });
    
    // Create an incident update
    await prisma.incidentUpdate.create({
      data: {
        incidentId: id,
        userId,
        message: `Incident acknowledged by ${(await prisma.user.findUnique({ where: { id: userId }, select: { name: true } }))?.name || userId} via ${channel}`,
        type: 'ACKNOWLEDGMENT'
      }
    });

    // Update the incident status
    const updatedIncident = await prisma.incident.update({
      where: { id },
      data: {
        status: "acknowledged",
        acknowledgedAt: new Date(),
        acknowledgedById: userId
      },
      include: {
        team: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        acknowledgedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    });

    return NextResponse.json({
      message: "Incident acknowledged successfully",
      incident: updatedIncident
    });
  } catch (error) {
    console.error("Error in incident acknowledgment API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 