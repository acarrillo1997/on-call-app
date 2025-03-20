"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, Plus } from "lucide-react"

export default function SchedulePage() {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [view, setView] = useState("day")

  // Mock data for on-call schedule
  const teams = [
    { id: "backend", name: "Backend Team" },
    { id: "frontend", name: "Frontend Team" },
    { id: "devops", name: "DevOps Team" },
    { id: "security", name: "Security Team" },
  ]

  const schedules = [
    {
      id: "1",
      team: "backend",
      users: [
        {
          id: "user1",
          name: "John Doe",
          avatar: "/placeholder.svg?height=32&width=32",
          initials: "JD",
          schedule: [
            { date: "2025-03-20", shift: "8:00 AM - 8:00 PM" },
            { date: "2025-03-21", shift: "8:00 AM - 8:00 PM" },
          ],
        },
        {
          id: "user2",
          name: "Jane Smith",
          avatar: "/placeholder.svg?height=32&width=32",
          initials: "JS",
          schedule: [
            { date: "2025-03-22", shift: "8:00 AM - 8:00 PM" },
            { date: "2025-03-23", shift: "8:00 AM - 8:00 PM" },
          ],
        },
      ],
      rotation: "weekly",
    },
    {
      id: "2",
      team: "frontend",
      users: [
        {
          id: "user3",
          name: "Mike Johnson",
          avatar: "/placeholder.svg?height=32&width=32",
          initials: "MJ",
          schedule: [
            { date: "2025-03-20", shift: "8:00 PM - 8:00 AM" },
            { date: "2025-03-21", shift: "8:00 PM - 8:00 AM" },
          ],
        },
      ],
      rotation: "daily",
    },
  ]

  // Helper function to format date
  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  // Get on-call users for the selected date
  const getOnCallUsers = (date: Date) => {
    const dateString = date.toISOString().split("T")[0]
    const onCallUsers = []

    for (const schedule of schedules) {
      for (const user of schedule.users) {
        for (const shift of user.schedule) {
          if (shift.date === dateString) {
            onCallUsers.push({
              ...user,
              team: teams.find((t) => t.id === schedule.team)?.name || schedule.team,
              shift: shift.shift,
            })
          }
        }
      }
    }

    return onCallUsers
  }

  const onCallUsers = date ? getOnCallUsers(date) : []

  return (
    <div className="container space-y-6 p-6 md:p-10">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">On-Call Schedule</h1>
          <p className="text-muted-foreground">Manage and view on-call rotations for all teams</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Schedule
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-[300px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Calendar</CardTitle>
            <CardDescription>Select a date to view schedules</CardDescription>
          </CardHeader>
          <CardContent>
            <Calendar mode="single" selected={date} onSelect={setDate} className="rounded-md border" />
            <div className="mt-4 space-y-2">
              <div className="text-sm font-medium">Filter by team</div>
              <Select defaultValue="all">
                <SelectTrigger>
                  <SelectValue placeholder="Select team" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Teams</SelectItem>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="space-y-1">
                <CardTitle>{date ? formatDate(date) : "Select a date"}</CardTitle>
                <CardDescription>On-call schedule for the selected date</CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    if (date) {
                      const newDate = new Date(date)
                      newDate.setDate(newDate.getDate() - 1)
                      setDate(newDate)
                    }
                  }}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    if (date) {
                      const newDate = new Date(date)
                      newDate.setDate(newDate.getDate() + 1)
                      setDate(newDate)
                    }
                  }}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="list" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="list">List View</TabsTrigger>
                  <TabsTrigger value="timeline">Timeline</TabsTrigger>
                </TabsList>

                <TabsContent value="list" className="space-y-4">
                  {onCallUsers.length > 0 ? (
                    <div className="space-y-4">
                      {onCallUsers.map((user, index) => (
                        <div key={index} className="flex items-center justify-between rounded-lg border p-4">
                          <div className="flex items-center space-x-4">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={user.avatar} alt={user.name} />
                              <AvatarFallback>{user.initials}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{user.name}</p>
                              <div className="flex items-center text-sm text-muted-foreground">
                                <span>{user.team}</span>
                                <span className="mx-1">•</span>
                                <span>{user.shift}</span>
                              </div>
                            </div>
                          </div>
                          <Badge>On-Call</Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex h-[200px] items-center justify-center rounded-md border border-dashed">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">No on-call schedules for this date</p>
                        <Button variant="outline" className="mt-2">
                          <Plus className="mr-2 h-4 w-4" />
                          Add Schedule
                        </Button>
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="timeline">
                  <div className="flex h-[300px] items-center justify-center rounded-md border border-dashed">
                    <p className="text-sm text-muted-foreground">Timeline view will be implemented here</p>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Rotation Settings</CardTitle>
              <CardDescription>Configure rotation schedules and escalation policies</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Rotation Type</label>
                    <Select defaultValue="weekly">
                      <SelectTrigger>
                        <SelectValue placeholder="Select rotation" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="biweekly">Bi-weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Handoff Time</label>
                    <Select defaultValue="8am">
                      <SelectTrigger>
                        <SelectValue placeholder="Select time" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="8am">8:00 AM</SelectItem>
                        <SelectItem value="12pm">12:00 PM</SelectItem>
                        <SelectItem value="5pm">5:00 PM</SelectItem>
                        <SelectItem value="8pm">8:00 PM</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Escalation Policy</label>
                  <Select defaultValue="standard">
                    <SelectTrigger>
                      <SelectValue placeholder="Select policy" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard (15m → Manager → Team)</SelectItem>
                      <SelectItem value="urgent">Urgent (5m → Manager → Team)</SelectItem>
                      <SelectItem value="critical">Critical (5m → Manager → All Teams)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button className="w-full">Save Settings</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

