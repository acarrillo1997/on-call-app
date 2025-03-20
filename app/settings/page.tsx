"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function SettingsPage() {
  const [notificationSettings, setNotificationSettings] = useState({
    email: true,
    sms: true,
    slack: true,
    voice: false,
  })

  const handleNotificationChange = (key: keyof typeof notificationSettings) => {
    setNotificationSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  return (
    <div className="container space-y-6 p-6 md:p-10">
      <div className="space-y-0.5">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your account settings and preferences.</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="api">API</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Manage your personal information and preferences.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src="/placeholder.svg?height=64&width=64" alt="@user" />
                  <AvatarFallback>JD</AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <h3 className="font-medium">Profile Picture</h3>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      Upload
                    </Button>
                    <Button variant="outline" size="sm">
                      Remove
                    </Button>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" defaultValue="John Doe" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" defaultValue="john.doe@example.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" defaultValue="+1 (555) 123-4567" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select defaultValue="utc-8">
                    <SelectTrigger id="timezone">
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="utc-8">Pacific Time (UTC-8)</SelectItem>
                      <SelectItem value="utc-5">Eastern Time (UTC-5)</SelectItem>
                      <SelectItem value="utc+0">UTC</SelectItem>
                      <SelectItem value="utc+1">Central European Time (UTC+1)</SelectItem>
                      <SelectItem value="utc+8">China Standard Time (UTC+8)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <h3 className="font-medium">Password</h3>
                <p className="text-sm text-muted-foreground">Update your password to keep your account secure.</p>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="current-password">Current Password</Label>
                    <Input id="current-password" type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input id="new-password" type="password" />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button>Save Changes</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Configure how you want to receive notifications.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-medium">Notification Channels</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="email-notifications">Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                    </div>
                    <Switch
                      id="email-notifications"
                      checked={notificationSettings.email}
                      onCheckedChange={() => handleNotificationChange("email")}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="sms-notifications">SMS Notifications</Label>
                      <p className="text-sm text-muted-foreground">Receive notifications via SMS</p>
                    </div>
                    <Switch
                      id="sms-notifications"
                      checked={notificationSettings.sms}
                      onCheckedChange={() => handleNotificationChange("sms")}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="slack-notifications">Slack Notifications</Label>
                      <p className="text-sm text-muted-foreground">Receive notifications via Slack</p>
                    </div>
                    <Switch
                      id="slack-notifications"
                      checked={notificationSettings.slack}
                      onCheckedChange={() => handleNotificationChange("slack")}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="voice-notifications">Voice Notifications</Label>
                      <p className="text-sm text-muted-foreground">Receive notifications via phone call</p>
                    </div>
                    <Switch
                      id="voice-notifications"
                      checked={notificationSettings.voice}
                      onCheckedChange={() => handleNotificationChange("voice")}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-medium">Notification Types</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Incident Assignments</Label>
                      <p className="text-sm text-muted-foreground">When you are assigned to an incident</p>
                    </div>
                    <Select defaultValue="all">
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All channels</SelectItem>
                        <SelectItem value="email">Email only</SelectItem>
                        <SelectItem value="sms">SMS only</SelectItem>
                        <SelectItem value="none">None</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Schedule Changes</Label>
                      <p className="text-sm text-muted-foreground">When your on-call schedule changes</p>
                    </div>
                    <Select defaultValue="email">
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All channels</SelectItem>
                        <SelectItem value="email">Email only</SelectItem>
                        <SelectItem value="sms">SMS only</SelectItem>
                        <SelectItem value="none">None</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Escalations</Label>
                      <p className="text-sm text-muted-foreground">When an incident is escalated to you</p>
                    </div>
                    <Select defaultValue="all">
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All channels</SelectItem>
                        <SelectItem value="email">Email only</SelectItem>
                        <SelectItem value="sms">SMS only</SelectItem>
                        <SelectItem value="none">None</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button>Save Preferences</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Integrations</CardTitle>
              <CardDescription>Connect external services for notifications and incident creation.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h3 className="font-medium">Slack</h3>
                    <p className="text-sm text-muted-foreground">
                      Connect to Slack for notifications and incident management
                    </p>
                  </div>
                  <Button variant="outline">Connect</Button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h3 className="font-medium">Microsoft Teams</h3>
                    <p className="text-sm text-muted-foreground">Connect to Microsoft Teams for notifications</p>
                  </div>
                  <Button variant="outline">Connect</Button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h3 className="font-medium">Twilio</h3>
                    <p className="text-sm text-muted-foreground">Connect to Twilio for SMS and voice notifications</p>
                  </div>
                  <Button variant="outline">Connect</Button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h3 className="font-medium">PagerDuty</h3>
                    <p className="text-sm text-muted-foreground">Import schedules and incidents from PagerDuty</p>
                  </div>
                  <Button variant="outline">Connect</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>API Access</CardTitle>
              <CardDescription>Manage API keys and access to the system.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-medium">API Keys</h3>
                <div className="rounded-md border">
                  <div className="flex items-center justify-between p-4">
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium">Production API Key</p>
                      <p className="text-xs text-muted-foreground">Created on Mar 15, 2025</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        Show
                      </Button>
                      <Button variant="outline" size="sm">
                        Revoke
                      </Button>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between p-4">
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium">Development API Key</p>
                      <p className="text-xs text-muted-foreground">Created on Mar 10, 2025</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        Show
                      </Button>
                      <Button variant="outline" size="sm">
                        Revoke
                      </Button>
                    </div>
                  </div>
                </div>
                <Button>Generate New API Key</Button>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-medium">Webhooks</h3>
                <div className="space-y-2">
                  <Label htmlFor="webhook-url">Webhook URL</Label>
                  <div className="flex space-x-2">
                    <Input id="webhook-url" placeholder="https://your-service.com/webhook" />
                    <Button>Save</Button>
                  </div>
                  <p className="text-xs text-muted-foreground">Receive incident notifications via webhook</p>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-medium">API Documentation</h3>
                <p className="text-sm text-muted-foreground">
                  Access our API documentation to integrate with our service.
                </p>
                <div className="flex space-x-2">
                  <Button variant="outline">View Documentation</Button>
                  <Button variant="outline">Download OpenAPI Spec</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

