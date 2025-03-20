"use client"

import { useState } from "react"
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

export default function IncidentsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [showCreateIncidentDialog, setShowCreateIncidentDialog] = useState(false)

  // Mock data for incidents
  const incidents = [
    {
      id: "INC-001",
      title: "API Service Outage",
      description: "The main API service is not responding to requests.",
      status: "active",
      severity: "critical",
      createdAt: "2025-03-20T10:30:00Z",
      assignee: {
        name: "John Doe",
        avatar: "/placeholder.svg?height=32&width=32",
        initials: "JD",
      },
      acknowledged: false,
      team: "Backend",
    },
    {
      id: "INC-002",
      title: "Database Connection Failure",
      description: "Unable to connect to the primary database cluster.",
      status: "active",
      severity: "high",
      createdAt: "2025-03-20T09:15:00Z",
      assignee: {
        name: "Jane Smith",
        avatar: "/placeholder.svg?height=32&width=32",
        initials: "JS",
      },
      acknowledged: true,
      team: "Backend",
    },
    {
      id: "INC-003",
      title: "Website Performance Degradation",
      description: "The website is loading slowly for users in the EU region.",
      status: "active",
      severity: "medium",
      createdAt: "2025-03-20T08:45:00Z",
      assignee: {
        name: "Mike Johnson",
        avatar: "/placeholder.svg?height=32&width=32",
        initials: "MJ",
      },
      acknowledged: false,
      team: "Frontend",
    },
    {
      id: "INC-004",
      title: "Payment Processing Error",
      description: "Some users are unable to complete payments.",
      status: "resolved",
      severity: "high",
      createdAt: "2025-03-19T14:20:00Z",
      resolvedAt: "2025-03-19T16:45:00Z",
      assignee: {
        name: "Sarah Williams",
        avatar: "/placeholder.svg?height=32&width=32",
        initials: "SW",
      },
      acknowledged: true,
      team: "Backend",
    },
  ]

  // Filter incidents based on search query
  const filteredIncidents = incidents.filter(
    (incident) =>
      incident.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      incident.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      incident.id.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  // Group incidents by status
  const activeIncidents = filteredIncidents.filter((incident) => incident.status === "active")
  const resolvedIncidents = filteredIncidents.filter((incident) => incident.status === "resolved")

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  // Calculate time since creation
  const getTimeSince = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 60) {
      return `${diffMins} min ago`
    } else if (diffMins < 1440) {
      return `${Math.floor(diffMins / 60)} hours ago`
    } else {
      return `${Math.floor(diffMins / 1440)} days ago`
    }
  }

  return (
    <div className="container space-y-6 p-6 md:p-10">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Incidents</h1>
          <p className="text-muted-foreground">Manage and respond to incidents</p>
        </div>
        <Button onClick={() => setShowCreateIncidentDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Incident
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search incidents..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

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
                        {incident.acknowledged ? (
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
                              {incident.severity}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{incident.description}</p>
                          <div className="flex items-center space-x-2 text-sm text-muted-foreground mt-2">
                            <span>{incident.id}</span>
                            <span>•</span>
                            <span>{incident.team}</span>
                            <span>•</span>
                            <span>{getTimeSince(incident.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={incident.assignee.avatar} alt={incident.assignee.name} />
                          <AvatarFallback>{incident.assignee.initials}</AvatarFallback>
                        </Avatar>
                        {!incident.acknowledged && (
                          <Button size="sm" variant="outline">
                            Acknowledge
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
                          <p className="text-sm text-muted-foreground mt-1">{incident.description}</p>
                          <div className="flex items-center space-x-2 text-sm text-muted-foreground mt-2">
                            <span>{incident.id}</span>
                            <span>•</span>
                            <span>{incident.team}</span>
                            <span>•</span>
                            <span>Resolved {incident.resolvedAt ? getTimeSince(incident.resolvedAt) : ""}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={incident.assignee.avatar} alt={incident.assignee.name} />
                          <AvatarFallback>{incident.assignee.initials}</AvatarFallback>
                        </Avatar>
                        <Button size="sm" variant="outline">
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
                        {incident.status === "active" ? (
                          incident.acknowledged ? (
                            <CheckCircle2 className="mt-1 h-5 w-5 text-green-500" />
                          ) : (
                            <AlertCircle className="mt-1 h-5 w-5 text-red-500" />
                          )
                        ) : (
                          <CheckCircle2 className="mt-1 h-5 w-5 text-green-500" />
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
                              {incident.status === "resolved" ? "Resolved" : incident.severity}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{incident.description}</p>
                          <div className="flex items-center space-x-2 text-sm text-muted-foreground mt-2">
                            <span>{incident.id}</span>
                            <span>•</span>
                            <span>{incident.team}</span>
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
                          <AvatarImage src={incident.assignee.avatar} alt={incident.assignee.name} />
                          <AvatarFallback>{incident.assignee.initials}</AvatarFallback>
                        </Avatar>
                        <Button size="sm" variant="outline">
                          {incident.status === "active" && !incident.acknowledged ? "Acknowledge" : "View Details"}
                        </Button>
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

      <Dialog open={showCreateIncidentDialog} onOpenChange={setShowCreateIncidentDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New Incident</DialogTitle>
            <DialogDescription>Report a new incident that requires attention.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" placeholder="Brief description of the incident" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" placeholder="Detailed information about the incident" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="severity">Severity</Label>
                <Select defaultValue="medium">
                  <SelectTrigger id="severity">
                    <SelectValue placeholder="Select severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="team">Assign to Team</Label>
                <Select defaultValue="backend">
                  <SelectTrigger id="team">
                    <SelectValue placeholder="Select team" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="backend">Backend Team</SelectItem>
                    <SelectItem value="frontend">Frontend Team</SelectItem>
                    <SelectItem value="devops">DevOps Team</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="escalation">Escalation Policy</Label>
              <Select defaultValue="standard">
                <SelectTrigger id="escalation">
                  <SelectValue placeholder="Select policy" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard (15m → Manager → Team)</SelectItem>
                  <SelectItem value="urgent">Urgent (5m → Manager → Team)</SelectItem>
                  <SelectItem value="critical">Critical (5m → Manager → All Teams)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateIncidentDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => setShowCreateIncidentDialog(false)}>Create Incident</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

