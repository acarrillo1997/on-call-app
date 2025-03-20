import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { AlertCircle, CheckCircle2 } from "lucide-react"

export function ActiveIncidents() {
  const incidents = [
    {
      id: "INC-001",
      title: "API Service Outage",
      status: "critical",
      time: "10 min ago",
      assignee: {
        name: "John Doe",
        avatar: "/placeholder.svg?height=32&width=32",
        initials: "JD",
      },
      acknowledged: false,
    },
    {
      id: "INC-002",
      title: "Database Connection Failure",
      status: "high",
      time: "25 min ago",
      assignee: {
        name: "Jane Smith",
        avatar: "/placeholder.svg?height=32&width=32",
        initials: "JS",
      },
      acknowledged: true,
    },
    {
      id: "INC-003",
      title: "Website Performance Degradation",
      status: "medium",
      time: "45 min ago",
      assignee: {
        name: "Mike Johnson",
        avatar: "/placeholder.svg?height=32&width=32",
        initials: "MJ",
      },
      acknowledged: false,
    },
  ]

  return (
    <div className="space-y-4">
      {incidents.map((incident) => (
        <div key={incident.id} className="flex items-center justify-between rounded-lg border p-4">
          <div className="flex items-center space-x-4">
            {incident.acknowledged ? (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-500" />
            )}
            <div>
              <div className="flex items-center space-x-2">
                <p className="font-medium">{incident.title}</p>
                <Badge
                  variant={
                    incident.status === "critical"
                      ? "destructive"
                      : incident.status === "high"
                        ? "destructive"
                        : incident.status === "medium"
                          ? "default"
                          : "outline"
                  }
                >
                  {incident.status}
                </Badge>
              </div>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <span>{incident.id}</span>
                <span>•</span>
                <span>{incident.time}</span>
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
      ))}
    </div>
  )
}

