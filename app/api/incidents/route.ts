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
    
    // Sanitize the data
    const sanitizedData = { ...data };
    
    // Handle serviceId - if it's 'none' or empty string, set it to null
    if (!sanitizedData.serviceId || sanitizedData.serviceId === 'none') {
      sanitizedData.serviceId = null;
    }
    
    // Handle escalationPolicyId - if it's 'none' or empty string, set it to null
    if (!sanitizedData.escalationPolicyId || sanitizedData.escalationPolicyId === 'none') {
      sanitizedData.escalationPolicyId = null;
    }
    
    // Validate required fields
    if (!sanitizedData.title || !sanitizedData.teamId) {
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
          teamId: sanitizedData.teamId,
        },
      },
    });

    if (!teamMembership) {
      return NextResponse.json(
        { error: "You are not a member of this team" },
        { status: 403 }
      );
    }

    // Start a transaction to create the incident and related records
    const incident = await prisma.$transaction(async (tx) => {
      // Create the incident
      const createdIncident = await tx.incident.create({
        data: {
          title: sanitizedData.title,
          description: sanitizedData.description,
          severity: sanitizedData.severity,
          teamId: sanitizedData.teamId,
          createdById: userId,
          // Only include serviceId if it's not null
          ...(sanitizedData.serviceId ? { serviceId: sanitizedData.serviceId } : {}),
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

      // Create an incident update for the creation
      await tx.incidentUpdate.create({
        data: {
          incidentId: createdIncident.id,
          userId,
          message: `Incident created by ${createdIncident.createdBy.name || userId}`,
          type: 'CREATED'
        }
      });

      // Handle escalation policy if provided
      if (sanitizedData.escalationPolicyId) {
        // Get the escalation policy
        const escalationPolicy = await tx.escalationPolicy.findUnique({
          where: { id: sanitizedData.escalationPolicyId }
        });

        if (escalationPolicy) {
          // Parse the escalation steps
          const steps = escalationPolicy.steps as any[];
          
          // For each step, create an escalation log
          let level = 1;
          for (const step of steps) {
            await tx.escalationLog.create({
              data: {
                incidentId: createdIncident.id,
                level,
                targetId: step.targetId,
                targetType: step.targetType,
                status: 'triggered'
              }
            });
            level++;
          }

          // For the first step, create notifications
          if (steps.length > 0) {
            const firstStep = steps[0];
            
            if (firstStep.targetType === 'USER') {
              // Get user settings to determine notification channels
              const userSettings = await tx.userSettings.findUnique({
                where: { userId: firstStep.targetId }
              });
              
              if (userSettings) {
                // Create notification logs based on user preferences
                if (userSettings.emailNotifications) {
                  await tx.notificationLog.create({
                    data: {
                      incidentId: createdIncident.id,
                      userId: firstStep.targetId,
                      channel: 'email',
                      status: 'sent'
                    }
                  });
                }
                
                if (userSettings.smsNotifications) {
                  await tx.notificationLog.create({
                    data: {
                      incidentId: createdIncident.id,
                      userId: firstStep.targetId,
                      channel: 'sms',
                      status: 'sent'
                    }
                  });
                }
                
                if (userSettings.slackNotifications) {
                  await tx.notificationLog.create({
                    data: {
                      incidentId: createdIncident.id,
                      userId: firstStep.targetId,
                      channel: 'slack',
                      status: 'sent'
                    }
                  });
                }
                
                if (userSettings.voiceNotifications) {
                  await tx.notificationLog.create({
                    data: {
                      incidentId: createdIncident.id,
                      userId: firstStep.targetId,
                      channel: 'voice',
                      status: 'sent'
                    }
                  });
                }
              }
            } else if (firstStep.targetType === 'TEAM') {
              // Get all team members
              const teamMembers = await tx.teamMember.findMany({
                where: { teamId: firstStep.targetId },
                select: { userId: true }
              });
              
              // Create notification logs for each team member
              for (const member of teamMembers) {
                // Get user settings
                const userSettings = await tx.userSettings.findUnique({
                  where: { userId: member.userId }
                });
                
                if (userSettings) {
                  // Create notification logs based on user preferences
                  if (userSettings.emailNotifications) {
                    await tx.notificationLog.create({
                      data: {
                        incidentId: createdIncident.id,
                        userId: member.userId,
                        channel: 'email',
                        status: 'sent'
                      }
                    });
                  }
                  
                  // Add other notification channels as needed
                }
              }
            }
          }
        }
      }

      return createdIncident;
    });

    return NextResponse.json(incident, { status: 201 });
  } catch (error) {
    console.error("Error creating incident:", error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 