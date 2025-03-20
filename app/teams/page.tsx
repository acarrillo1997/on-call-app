"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Search, UserPlus, X } from "lucide-react"

export default function TeamsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [showAddMemberDialog, setShowAddMemberDialog] = useState(false)
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null)

  // Mock data for teams
  const teams = [
    {
      id: "backend",
      name: "Backend Team",
      description: "API and database services",
      members: [
        {
          id: "user1",
          name: "John Doe",
          email: "john.doe@example.com",
          avatar: "/placeholder.svg?height=32&width=32",
          initials: "JD",
          role: "Team Lead",
        },
        {
          id: "user2",
          name: "Jane Smith",
          email: "jane.smith@example.com",
          avatar: "/placeholder.svg?height=32&width=32",
          initials: "JS",
          role: "Senior Developer",
        },
      ],
    },
    {
      id: "frontend",
      name: "Frontend Team",
      description: "UI and user experience",
      members: [
        {
          id: "user3",
          name: "Mike Johnson",
          email: "mike.johnson@example.com",
          avatar: "/placeholder.svg?height=32&width=32",
          initials: "MJ",
          role: "Team Lead",
        },
      ],
    },
    {
      id: "devops",
      name: "DevOps Team",
      description: "Infrastructure and deployment",
      members: [
        {
          id: "user4",
          name: "Sarah Williams",
          email: "sarah.williams@example.com",
          avatar: "/placeholder.svg?height=32&width=32",
          initials: "SW",
          role: "DevOps Engineer",
        },
      ],
    },
  ]

  // Mock data for users not in the selected team
  const availableUsers = [
    {
      id: "user5",
      name: "David Brown",
      email: "david.brown@example.com",
      avatar: "/placeholder.svg?height=32&width=32",
      initials: "DB",
      role: "Developer",
    },
    {
      id: "user6",
      name: "Emily Davis",
      email: "emily.davis@example.com",
      avatar: "/placeholder.svg?height=32&width=32",
      initials: "ED",
      role: "QA Engineer",
    },
  ]

  // Filter teams based on search query
  const filteredTeams = teams.filter(
    (team) =>
      team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      team.description.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleAddMember = (teamId: string) => {
    setSelectedTeam(teamId)
    setShowAddMemberDialog(true)
  }

  return (
    <div className="container space-y-6 p-6 md:p-10">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Teams</h1>
          <p className="text-muted-foreground">Manage teams and team members</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Team
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search teams..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <Tabs defaultValue="grid" className="space-y-4">
        <TabsList>
          <TabsTrigger value="grid">Grid View</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
        </TabsList>

        <TabsContent value="grid" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredTeams.map((team) => (
              <Card key={team.id}>
                <CardHeader>
                  <CardTitle>{team.name}</CardTitle>
                  <CardDescription>{team.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Members ({team.members.length})</div>
                      <div className="flex -space-x-2">
                        {team.members.map((member) => (
                          <Avatar key={member.id} className="h-8 w-8 border-2 border-background">
                            <AvatarImage src={member.avatar} alt={member.name} />
                            <AvatarFallback>{member.initials}</AvatarFallback>
                          </Avatar>
                        ))}
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 rounded-full"
                          onClick={() => handleAddMember(team.id)}
                        >
                          <UserPlus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm font-medium">On-Call Status</div>
                      <Badge variant="outline">Active Schedule</Badge>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                  <Button variant="outline" size="sm">
                    Manage Schedule
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="list">
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                {filteredTeams.map((team) => (
                  <div key={team.id} className="rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{team.name}</h3>
                        <p className="text-sm text-muted-foreground">{team.description}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">{team.members.length} members</Badge>
                        <Button variant="outline" size="sm" onClick={() => handleAddMember(team.id)}>
                          <UserPlus className="mr-2 h-4 w-4" />
                          Add Member
                        </Button>
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="text-sm font-medium mb-2">Team Members</div>
                      <div className="space-y-2">
                        {team.members.map((member) => (
                          <div key={member.id} className="flex items-center justify-between rounded-md bg-muted p-2">
                            <div className="flex items-center space-x-2">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={member.avatar} alt={member.name} />
                                <AvatarFallback>{member.initials}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-medium">{member.name}</p>
                                <p className="text-xs text-muted-foreground">{member.role}</p>
                              </div>
                            </div>
                            <Button variant="ghost" size="icon">
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showAddMemberDialog} onOpenChange={setShowAddMemberDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
            <DialogDescription>
              Add a new member to {teams.find((t) => t.id === selectedTeam)?.name || "the team"}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="member">Select Member</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select a member" />
                </SelectTrigger>
                <SelectContent>
                  {availableUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      <div className="flex items-center">
                        <span>{user.name}</span>
                        <span className="ml-2 text-xs text-muted-foreground">({user.email})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select defaultValue="member">
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lead">Team Lead</SelectItem>
                  <SelectItem value="senior">Senior Developer</SelectItem>
                  <SelectItem value="member">Team Member</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddMemberDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => setShowAddMemberDialog(false)}>Add Member</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

