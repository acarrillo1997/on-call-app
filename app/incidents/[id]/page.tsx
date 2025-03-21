"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/use-toast";
import { Separator } from "@/components/ui/separator";
import { formatDistanceToNow } from "date-fns";

export default function IncidentPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [incident, setIncident] = useState<any>(null);
  const [auditLog, setAuditLog] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAcknowledging, setIsAcknowledging] = useState(false);
  const [isResolving, setIsResolving] = useState(false);

  useEffect(() => {
    const fetchIncident = async () => {
      try {
        const response = await fetch(`/api/incidents/${params.id}`);
        if (response.ok) {
          const data = await response.json();
          setIncident(data);
        } else {
          toast({
            title: "Error",
            description: "Could not load incident details.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error fetching incident:", error);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchAuditLog = async () => {
      try {
        const response = await fetch(`/api/incidents/${params.id}/audit`);
        if (response.ok) {
          const data = await response.json();
          setAuditLog(data.auditLog || []);
        }
      } catch (error) {
        console.error("Error fetching audit log:", error);
      }
    };

    fetchIncident();
    fetchAuditLog();
  }, [params.id]);

  const handleAcknowledge = async () => {
    setIsAcknowledging(true);
    try {
      const response = await fetch(`/api/incidents/${params.id}/acknowledge`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ channel: "web" }),
      });

      if (response.ok) {
        const data = await response.json();
        setIncident(data.incident);
        toast({
          title: "Success",
          description: "Incident acknowledged successfully!",
        });
        // Refresh audit log
        const auditResponse = await fetch(`/api/incidents/${params.id}/audit`);
        if (auditResponse.ok) {
          const auditData = await auditResponse.json();
          setAuditLog(auditData.auditLog || []);
        }
      } else {
        const error = await response.json();
        throw new Error(error.error || "Failed to acknowledge incident");
      }
    } catch (error: any) {
      console.error("Error acknowledging incident:", error);
      toast({
        title: "Error",
        description: error.message || "Could not acknowledge incident.",
        variant: "destructive",
      });
    } finally {
      setIsAcknowledging(false);
    }
  };

  const handleResolve = async () => {
    setIsResolving(true);
    try {
      const response = await fetch(`/api/incidents/${params.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "resolved", resolvedAt: new Date().toISOString() }),
      });

      if (response.ok) {
        const data = await response.json();
        setIncident(data);
        toast({
          title: "Success",
          description: "Incident resolved successfully!",
        });
        // Refresh audit log
        const auditResponse = await fetch(`/api/incidents/${params.id}/audit`);
        if (auditResponse.ok) {
          const auditData = await auditResponse.json();
          setAuditLog(auditData.auditLog || []);
        }
      } else {
        const error = await response.json();
        throw new Error(error.error || "Failed to resolve incident");
      }
    } catch (error: any) {
      console.error("Error resolving incident:", error);
      toast({
        title: "Error",
        description: error.message || "Could not resolve incident.",
        variant: "destructive",
      });
    } finally {
      setIsResolving(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-500";
      case "high":
        return "bg-orange-500";
      case "medium":
        return "bg-yellow-500";
      case "low":
        return "bg-green-500";
      default:
        return "bg-blue-500";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-red-500";
      case "acknowledged":
        return "bg-blue-500";
      case "resolved":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <p>Loading incident details...</p>
        </div>
      </div>
    );
  }

  if (!incident) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex flex-col items-center justify-center h-64">
          <h1 className="text-2xl font-bold mb-4">Incident Not Found</h1>
          <Button onClick={() => router.push("/incidents")}>
            Back to Incidents
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Incident Details</h1>
        <div className="space-x-2">
          <Button
            variant="outline"
            onClick={() => router.push("/incidents")}
          >
            Back
          </Button>
          {incident.status === "open" && (
            <Button 
              onClick={handleAcknowledge}
              disabled={isAcknowledging}
              className="bg-blue-500 hover:bg-blue-600"
            >
              {isAcknowledging ? "Acknowledging..." : "Acknowledge Incident"}
            </Button>
          )}
          {incident.status !== "resolved" && (
            <Button 
              variant="default"
              className="bg-green-500 hover:bg-green-600"
              onClick={handleResolve}
              disabled={isResolving}
            >
              {isResolving ? "Resolving..." : "Resolve Incident"}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl">{incident.title}</CardTitle>
                  <CardDescription>
                    Created {formatTimestamp(incident.createdAt)} by {incident.createdBy?.name || "Unknown"}
                  </CardDescription>
                </div>
                <div className="flex space-x-2">
                  <Badge className={getSeverityColor(incident.severity)}>
                    {incident.severity?.toUpperCase() || "UNKNOWN"}
                  </Badge>
                  <Badge className={getStatusColor(incident.status)}>
                    {incident.status?.toUpperCase() || "UNKNOWN"}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <h3 className="text-lg font-medium mb-2">Description</h3>
                <p className="text-gray-600">
                  {incident.description || "No description provided."}
                </p>
              </div>

              <Separator className="my-4" />

              {incident.acknowledgedAt && (
                <div className="mb-4">
                  <h3 className="text-lg font-medium mb-2">Acknowledgment</h3>
                  <p className="text-gray-600">
                    Acknowledged {formatTimestamp(incident.acknowledgedAt)} by{" "}
                    {incident.acknowledgedBy?.name || "Unknown"}
                  </p>
                </div>
              )}

              {incident.resolvedAt && (
                <div className="mb-4">
                  <h3 className="text-lg font-medium mb-2">Resolution</h3>
                  <p className="text-gray-600">
                    Resolved {formatTimestamp(incident.resolvedAt)}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Tabs defaultValue="timeline" className="mt-6">
            <TabsList>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="escalations">Escalations</TabsTrigger>
            </TabsList>
            <TabsContent value="timeline">
              <Card>
                <CardHeader>
                  <CardTitle>Incident Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  {auditLog.length === 0 ? (
                    <p className="text-gray-500">No timeline events available.</p>
                  ) : (
                    <ul className="space-y-4">
                      {auditLog.map((entry, index) => (
                        <li key={index} className="border-l-2 border-gray-200 pl-4 py-2">
                          <div className="flex justify-between">
                            <div>
                              {entry.type === 'update' && (
                                <p>
                                  <span className="font-medium">{entry.data.user?.name || "Unknown"}</span>:{" "}
                                  {entry.data.message}
                                </p>
                              )}
                              {entry.type === 'acknowledgment' && (
                                <p>
                                  <span className="font-medium">{entry.data.user?.name || "Unknown"}</span>{" "}
                                  acknowledged the incident via {entry.data.channel}
                                </p>
                              )}
                              {entry.type === 'notification' && (
                                <p>
                                  Notification sent to{" "}
                                  <span className="font-medium">{entry.data.user?.name || "Unknown"}</span>{" "}
                                  via {entry.data.channel} ({entry.data.status})
                                </p>
                              )}
                              {entry.type === 'escalation' && (
                                <p>
                                  Escalation level {entry.data.level}{" "}
                                  triggered to {entry.data.targetType.toLowerCase()}{" "}
                                  {entry.data.targetId}
                                </p>
                              )}
                            </div>
                            <span className="text-gray-500 text-sm">
                              {formatTimestamp(entry.timestamp)}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="notifications">
              <Card>
                <CardHeader>
                  <CardTitle>Notification Log</CardTitle>
                </CardHeader>
                <CardContent>
                  {auditLog.filter(entry => entry.type === 'notification').length === 0 ? (
                    <p className="text-gray-500">No notifications recorded.</p>
                  ) : (
                    <ul className="space-y-4">
                      {auditLog
                        .filter(entry => entry.type === 'notification')
                        .map((entry, index) => (
                          <li key={index} className="border-l-2 border-gray-200 pl-4 py-2">
                            <div className="flex justify-between">
                              <p>
                                Notification sent to{" "}
                                <span className="font-medium">{entry.data.user?.name || "Unknown"}</span>{" "}
                                via {entry.data.channel} ({entry.data.status})
                              </p>
                              <span className="text-gray-500 text-sm">
                                {formatTimestamp(entry.timestamp)}
                              </span>
                            </div>
                          </li>
                        ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="escalations">
              <Card>
                <CardHeader>
                  <CardTitle>Escalation Log</CardTitle>
                </CardHeader>
                <CardContent>
                  {auditLog.filter(entry => entry.type === 'escalation').length === 0 ? (
                    <p className="text-gray-500">No escalations recorded.</p>
                  ) : (
                    <ul className="space-y-4">
                      {auditLog
                        .filter(entry => entry.type === 'escalation')
                        .map((entry, index) => (
                          <li key={index} className="border-l-2 border-gray-200 pl-4 py-2">
                            <div className="flex justify-between">
                              <p>
                                Escalation level {entry.data.level}{" "}
                                triggered to {entry.data.targetType.toLowerCase()}{" "}
                                {entry.data.targetId}
                              </p>
                              <span className="text-gray-500 text-sm">
                                {formatTimestamp(entry.timestamp)}
                              </span>
                            </div>
                          </li>
                        ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Incident Details</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm text-gray-500">Team</dt>
                  <dd className="font-medium">{incident.team?.name || "Unknown"}</dd>
                </div>
                {incident.service && (
                  <div>
                    <dt className="text-sm text-gray-500">Service</dt>
                    <dd className="font-medium">{incident.service.name}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-sm text-gray-500">Created by</dt>
                  <dd className="font-medium">{incident.createdBy?.name || "Unknown"}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Created at</dt>
                  <dd className="font-medium">{new Date(incident.createdAt).toLocaleString()}</dd>
                </div>
                {incident.assignee && (
                  <div>
                    <dt className="text-sm text-gray-500">Assigned to</dt>
                    <dd className="font-medium">{incident.assignee.name}</dd>
                  </div>
                )}
                {incident.acknowledgedAt && (
                  <div>
                    <dt className="text-sm text-gray-500">Acknowledged by</dt>
                    <dd className="font-medium">{incident.acknowledgedBy?.name || "Unknown"}</dd>
                  </div>
                )}
                {incident.acknowledgedAt && (
                  <div>
                    <dt className="text-sm text-gray-500">Acknowledged at</dt>
                    <dd className="font-medium">{new Date(incident.acknowledgedAt).toLocaleString()}</dd>
                  </div>
                )}
              </dl>
            </CardContent>
            <CardFooter>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => router.push(`/incidents/${params.id}/edit`)}
              >
                Edit Incident
              </Button>
            </CardFooter>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Acknowledgment Options</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500 mb-4">
                On-call responders can acknowledge this incident via multiple channels:
              </p>
              <ul className="space-y-2 text-sm">
                <li>• Web dashboard</li>
                <li>• Slack message (if configured)</li>
                <li>• SMS response (if configured)</li>
                <li>• Voice call (if configured)</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 