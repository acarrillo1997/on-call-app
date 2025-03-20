import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

export function OnCallSchedule() {
  const onCallUsers = [
    {
      name: "John Doe",
      team: "Backend",
      avatar: "/placeholder.svg?height=32&width=32",
      initials: "JD",
      until: "Today, 8:00 PM",
      status: "active",
    },
    {
      name: "Jane Smith",
      team: "Frontend",
      avatar: "/placeholder.svg?height=32&width=32",
      initials: "JS",
      until: "Tomorrow, 8:00 AM",
      status: "active",
    },
    {
      name: "Mike Johnson",
      team: "DevOps",
      avatar: "/placeholder.svg?height=32&width=32",
      initials: "MJ",
      until: "Tomorrow, 8:00 PM",
      status: "upcoming",
    },
  ]

  return (
    <div className="space-y-4">
      {onCallUsers.map((user, index) => (
        <div key={index} className="flex items-center space-x-4 rounded-lg border p-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback>{user.initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">{user.name}</p>
              <Badge variant={user.status === "active" ? "default" : "outline"}>
                {user.status === "active" ? "On-Call" : "Upcoming"}
              </Badge>
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              <span>{user.team}</span>
              <span className="mx-1">•</span>
              <span>Until {user.until}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

