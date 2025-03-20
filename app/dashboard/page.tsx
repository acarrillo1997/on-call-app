import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, Bell, ShieldAlert, Clock } from "lucide-react"
import { DashboardStats } from "@/components/dashboard-stats"
import { ActiveIncidents } from "@/components/active-incidents"
import { OnCallSchedule } from "@/components/on-call-schedule"
import Link from "next/link"
import { Icons } from "@/components/icons"

export default function DashboardPage() {
  return (
    <div className="container space-y-6 p-6 md:p-10">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your on-call schedules, incidents, and team status.</p>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="incidents">Incidents</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <DashboardStats
              title="Active Incidents"
              value="3"
              description="2 unacknowledged"
              icon={ShieldAlert}
              trend="+2 from yesterday"
              trendValue="negative"
            />
            <DashboardStats
              title="On-Call Now"
              value="2"
              description="From 2 teams"
              icon={Users}
              trend="Same as last week"
              trendValue="neutral"
            />
            <DashboardStats
              title="Avg Response Time"
              value="5m"
              description="Last 30 days"
              icon={Clock}
              trend="-2m from last month"
              trendValue="positive"
            />
            <DashboardStats
              title="Notifications"
              value="24"
              description="Sent today"
              icon={Bell}
              trend="+5 from yesterday"
              trendValue="neutral"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Active Incidents</CardTitle>
                <CardDescription>Current incidents requiring attention</CardDescription>
              </CardHeader>
              <CardContent>
                <ActiveIncidents />
              </CardContent>
            </Card>
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>On-Call Now</CardTitle>
                <CardDescription>Personnel currently on-call</CardDescription>
              </CardHeader>
              <CardContent>
                <OnCallSchedule />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Administration</CardTitle>
              <CardDescription>
                Manage your organization's users and teams
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div>
                <Link href="/users" className="flex items-center -mx-2 p-2 hover:bg-gray-100 rounded-md transition">
                  <Icons.users className="w-5 h-5 mr-3" />
                  <span>User Management</span>
                </Link>
                <Link href="/teams/admin" className="flex items-center -mx-2 p-2 hover:bg-gray-100 rounded-md transition">
                  <Icons.group className="w-5 h-5 mr-3" />
                  <span>Team Administration</span>
                </Link>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="incidents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Incidents</CardTitle>
              <CardDescription>View and manage all incidents</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Detailed incident management view will be displayed here.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>On-Call Schedule</CardTitle>
              <CardDescription>View and manage on-call schedules</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Detailed schedule management view will be displayed here.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

