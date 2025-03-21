"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { AlertCircle, CheckCircle2, Plus, Search, ShieldAlert } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

interface Incident {
  id: string;
  title: string;
  description: string | null;
  status: string;
  severity: string | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  acknowledgedAt: string | null;
  team: {
    id: string;
    name: string;
  };
  createdBy: {
    id: string;
    name: string | null;
    avatarUrl: string | null;
  };
  assignee?: {
    id: string;
    name: string | null;
    email: string | null;
  } | null;
  acknowledgedBy?: {
    id: string;
    name: string | null;
    email: string | null;
  } | null;
}

export default function IncidentsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("")
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        const response = await fetch("/api/incidents");
        if (response.ok) {
          const data = await response.json();
          setIncidents(data);
        } else {
          toast({
            title: "Error",
            description: "Failed to load incidents. Please try again.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error fetching incidents:", error);
        toast({
          title: "Error",
          description: "Failed to load incidents. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchIncidents();
  }, []);

  // Filter incidents based on search query
  const filteredIncidents = incidents.filter(
    (incident) =>
      incident.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (incident.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
      incident.id.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  // Group incidents by status
  const activeIncidents = filteredIncidents.filter((incident) => incident.status === "open" || incident.status === "acknowledged");
  const resolvedIncidents = filteredIncidents.filter((incident) => incident.status === "resolved");

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  }

  // Calculate time since creation
  const getTimeSince = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 60) {
      return `${diffMins} min ago`;
    } else if (diffMins < 1440) {
      return `${Math.floor(diffMins / 60)} hours ago`;
    } else {
      return `${Math.floor(diffMins / 1440)} days ago`;
    }
  }

  // Handle incident acknowledgment
  const handleAcknowledge = async (incidentId: string) => {
    try {
      const response = await fetch(`/api/incidents/${incidentId}/acknowledge`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ channel: "web" }),
      });

      if (response.ok) {
        // Refresh the incidents list
        const updatedIncidentsResponse = await fetch("/api/incidents");
        if (updatedIncidentsResponse.ok) {
          const data = await updatedIncidentsResponse.json();
          setIncidents(data);
        }
        
        toast({
          title: "Success",
          description: "Incident acknowledged successfully!",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to acknowledge incident. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error acknowledging incident:", error);
      toast({
        title: "Error",
        description: "Failed to acknowledge incident. Please try again.",
        variant: "destructive",
      });
    }
  }

  // Navigate to incident details
  const navigateToIncident = (incidentId: string) => {
    router.push(`/incidents/${incidentId}`);
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Incidents</h1>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search incidents..."
              className="pl-8 w-[200px] md:w-[300px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button onClick={() => router.push("/incidents/new")}>
            <Plus className="mr-2 h-4 w-4" />
            New Incident
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <p>Loading incidents...</p>
        </div>
      ) : (
        <Tabs defaultValue="active" className="space-y-4">
          <TabsList>
            <TabsTrigger value="active">Active ({activeIncidents.length})</TabsTrigger>
            <TabsTrigger value="resolved">Resolved ({resolvedIncidents.length})</TabsTrigger>
            <TabsTrigger value="all">All ({filteredIncidents.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Active Incidents</CardTitle>
                <CardDescription>Incidents that require attention or are in progress</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activeIncidents.length > 0 ? (
                    activeIncidents.map((incident) => (
                      <div key={incident.id} className="flex items-start justify-between rounded-lg border p-4">
                        <div className="flex items-start space-x-4">
                          {incident.status === "acknowledged" ? (
                            <CheckCircle2 className="mt-1 h-5 w-5 text-green-500" />
                          ) : (
                            <AlertCircle className="mt-1 h-5 w-5 text-red-500" />
                          )}
                          <div>
                            <div className="flex items-center space-x-2">
                              <p className="font-medium">{incident.title}</p>
                              <Badge
                                variant={
                                  incident.severity === "critical"
                                    ? "destructive"
                                    : incident.severity === "high"
                                      ? "destructive"
                                      : incident.severity === "medium"
                                        ? "default"
                                        : "outline"
                                }
                              >
                                {incident.severity || "Unknown"}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{incident.description || "No description"}</p>
                            <div className="flex items-center space-x-2 text-sm text-muted-foreground mt-2">
                              <span>{incident.id}</span>
                              <span>•</span>
                              <span>{incident.team?.name || "Unknown team"}</span>
                              <span>•</span>
                              <span>{getTimeSince(incident.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={incident.createdBy?.avatarUrl || ""} alt={incident.createdBy?.name || "Unknown"} />
                            <AvatarFallback>
                              {incident.createdBy?.name
                                ? incident.createdBy.name.split(" ").map(n => n[0]).join("").toUpperCase()
                                : "?"}
                            </AvatarFallback>
                          </Avatar>
                          {incident.status === "open" ? (
                            <Button size="sm" variant="outline" onClick={() => handleAcknowledge(incident.id)}>
                              Acknowledge
                            </Button>
                          ) : (
                            <Button size="sm" variant="outline" onClick={() => navigateToIncident(incident.id)}>
                              View Details
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex h-[200px] items-center justify-center rounded-md border border-dashed">
                      <div className="text-center">
                        <ShieldAlert className="mx-auto h-8 w-8 text-muted-foreground" />
                        <p className="mt-2 text-sm text-muted-foreground">No active incidents</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="resolved" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Resolved Incidents</CardTitle>
                <CardDescription>Incidents that have been resolved</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {resolvedIncidents.length > 0 ? (
                    resolvedIncidents.map((incident) => (
                      <div key={incident.id} className="flex items-start justify-between rounded-lg border p-4">
                        <div className="flex items-start space-x-4">
                          <CheckCircle2 className="mt-1 h-5 w-5 text-green-500" />
                          <div>
                            <div className="flex items-center space-x-2">
                              <p className="font-medium">{incident.title}</p>
                              <Badge variant="outline">Resolved</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{incident.description || "No description"}</p>
                            <div className="flex items-center space-x-2 text-sm text-muted-foreground mt-2">
                              <span>{incident.id}</span>
                              <span>•</span>
                              <span>{incident.team?.name || "Unknown team"}</span>
                              <span>•</span>
                              <span>Resolved {incident.resolvedAt ? getTimeSince(incident.resolvedAt) : ""}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={incident.createdBy?.avatarUrl || ""} alt={incident.createdBy?.name || "Unknown"} />
                            <AvatarFallback>
                              {incident.createdBy?.name
                                ? incident.createdBy.name.split(" ").map(n => n[0]).join("").toUpperCase()
                                : "?"}
                            </AvatarFallback>
                          </Avatar>
                          <Button size="sm" variant="outline" onClick={() => navigateToIncident(incident.id)}>
                            View Details
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex h-[200px] items-center justify-center rounded-md border border-dashed">
                      <div className="text-center">
                        <ShieldAlert className="mx-auto h-8 w-8 text-muted-foreground" />
                        <p className="mt-2 text-sm text-muted-foreground">No resolved incidents</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="all">
            <Card>
              <CardHeader>
                <CardTitle>All Incidents</CardTitle>
                <CardDescription>View all incidents in the system</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredIncidents.length > 0 ? (
                    filteredIncidents.map((incident) => (
                      <div key={incident.id} className="flex items-start justify-between rounded-lg border p-4">
                        <div className="flex items-start space-x-4">
                          {incident.status === "resolved" ? (
                            <CheckCircle2 className="mt-1 h-5 w-5 text-green-500" />
                          ) : incident.status === "acknowledged" ? (
                            <CheckCircle2 className="mt-1 h-5 w-5 text-blue-500" />
                          ) : (
                            <AlertCircle className="mt-1 h-5 w-5 text-red-500" />
                          )}
                          <div>
                            <div className="flex items-center space-x-2">
                              <p className="font-medium">{incident.title}</p>
                              <Badge
                                variant={
                                  incident.status === "resolved"
                                    ? "outline"
                                    : incident.severity === "critical"
                                      ? "destructive"
                                      : incident.severity === "high"
                                        ? "destructive"
                                        : incident.severity === "medium"
                                          ? "default"
                                          : "outline"
                                }
                              >
                                {incident.status === "resolved" ? "Resolved" : incident.severity || "Unknown"}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{incident.description || "No description"}</p>
                            <div className="flex items-center space-x-2 text-sm text-muted-foreground mt-2">
                              <span>{incident.id}</span>
                              <span>•</span>
                              <span>{incident.team?.name || "Unknown team"}</span>
                              <span>•</span>
                              <span>
                                {incident.status === "resolved"
                                  ? `Resolved ${incident.resolvedAt ? getTimeSince(incident.resolvedAt) : ""}`
                                  : getTimeSince(incident.createdAt)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={incident.createdBy?.avatarUrl || ""} alt={incident.createdBy?.name || "Unknown"} />
                            <AvatarFallback>
                              {incident.createdBy?.name
                                ? incident.createdBy.name.split(" ").map(n => n[0]).join("").toUpperCase()
                                : "?"}
                            </AvatarFallback>
                          </Avatar>
                          {incident.status === "open" ? (
                            <Button size="sm" variant="outline" onClick={() => handleAcknowledge(incident.id)}>
                              Acknowledge
                            </Button>
                          ) : (
                            <Button size="sm" variant="outline" onClick={() => navigateToIncident(incident.id)}>
                              View Details
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex h-[200px] items-center justify-center rounded-md border border-dashed">
                      <div className="text-center">
                        <ShieldAlert className="mx-auto h-8 w-8 text-muted-foreground" />
                        <p className="mt-2 text-sm text-muted-foreground">No incidents found</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}

