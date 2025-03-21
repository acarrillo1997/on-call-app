import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";

// Define types for audit log entries
type AuditLogEntry = {
  type: 'update' | 'notification' | 'escalation' | 'acknowledgment';
  timestamp: Date;
  data: any;
};

// Get the audit log for an incident
export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const { id } = await context.params;

  try {
    // Verify authentication
    const { success } = await verifyAuth(request);
    if (!success) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if incident exists
    const incident = await prisma.incident.findUnique({
      where: { id }
    });

    if (!incident) {
      return NextResponse.json(
        { error: "Incident not found" },
        { status: 404 }
      );
    }

    // Get all the audit data
    const [updates, notifications, escalations, acknowledgments] = await Promise.all([
      // Get incident updates
      prisma.incidentUpdate.findMany({
        where: { incidentId: id },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      
      // Get notification logs
      prisma.notificationLog.findMany({
        where: { incidentId: id },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          }
        },
        orderBy: { sentAt: 'desc' }
      }),
      
      // Get escalation logs
      prisma.escalationLog.findMany({
        where: { incidentId: id },
        orderBy: { triggeredAt: 'desc' }
      }),
      
      // Get acknowledgments
      prisma.incidentAcknowledgment.findMany({
        where: { incidentId: id },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          }
        },
        orderBy: { acknowledgedAt: 'desc' }
      })
    ]);

    // Combine all the audit data and sort by timestamp
    const auditLog: AuditLogEntry[] = [
      ...updates.map((item: any) => ({
        type: 'update' as const,
        timestamp: item.createdAt,
        data: item
      })),
      ...notifications.map((item: any) => ({
        type: 'notification' as const,
        timestamp: item.sentAt,
        data: item
      })),
      ...escalations.map((item: any) => ({
        type: 'escalation' as const,
        timestamp: item.triggeredAt,
        data: item
      })),
      ...acknowledgments.map((item: any) => ({
        type: 'acknowledgment' as const,
        timestamp: item.acknowledgedAt,
        data: item
      }))
    ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return NextResponse.json({
      incident,
      auditLog
    });
  } catch (error) {
    console.error("Error in incident audit log API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 