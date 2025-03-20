"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import HankoProfile from "@/components/HankoProfile"
import { useToast } from "@/components/ui/use-toast"
import { getCurrentUserId } from "@/lib/auth-client"

// Define types for settings
interface NotificationSettings {
  emailNotifications: boolean;
  smsNotifications: boolean;
  slackNotifications: boolean;
  voiceNotifications: boolean;
  incidentAssignmentChannel: string;
  scheduleChangeChannel: string;
  escalationChannel: string;
  webhookUrl: string | null;
}

interface UserProfile {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  timezone: string | null;
  avatarUrl: string | null;
}

export default function SettingsPage() {
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // User profile - initialize with empty values to allow input even when API fails
  const [profile, setProfile] = useState<UserProfile>({
    id: '',
    name: '',
    email: '',
    phone: '',
    timezone: 'UTC',
    avatarUrl: null,
  });
  
  // Notification settings
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    smsNotifications: true,
    slackNotifications: false,
    voiceNotifications: false,
    incidentAssignmentChannel: "all",
    scheduleChangeChannel: "email",
    escalationChannel: "all",
    webhookUrl: null,
  });

  // Get user ID on component mount
  useEffect(() => {
    async function getUserId() {
      try {
        const id = await getCurrentUserId();
        
        if (id) {
          setUserId(id);
          // Fetch user profile and settings
          await Promise.all([
            fetchUserProfile(id),
            fetchUserSettings(id)
          ]);
        } else {
          // If we can't get a user ID, use a temporary ID for local-only changes
          console.log("No user ID found, using local-only mode");
          const tempId = "temp-" + Date.now();
          setUserId(tempId);
          
          // Load from local storage if available
          const savedProfile = localStorage.getItem('tempUserProfile');
          if (savedProfile) {
            try {
              const parsedProfile = JSON.parse(savedProfile);
              setProfile(prev => ({
                ...prev,
                ...parsedProfile
              }));
            } catch (e) {
              console.error("Error parsing saved profile:", e);
            }
          }
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching user data:", error);
        // Use a temporary ID on error too
        const tempId = "temp-" + Date.now();
        setUserId(tempId);
        setIsLoading(false);
      }
    }
    
    getUserId();
  }, []);
  
  // Fetch user profile
  async function fetchUserProfile(id: string) {
    try {
      const response = await fetch(`/api/users/${id}`);
      if (response.ok) {
        const data = await response.json();
        setProfile(prev => ({
          ...prev,
          ...data
        }));
      } else if (response.status === 401) {
        // If unauthorized, try to load from localStorage
        console.warn("Unauthorized API access, checking for local data");
        const localData = localStorage.getItem('user-' + id);
        
        if (localData) {
          try {
            const parsedProfile = JSON.parse(localData);
            setProfile(prev => ({
              ...prev,
              ...parsedProfile
            }));
            console.log("Loaded profile from local storage");
          } catch (e) {
            console.error("Error parsing local profile data:", e);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      
      // Try to load from localStorage on error
      const localData = localStorage.getItem('user-' + id);
      if (localData) {
        try {
          const parsedProfile = JSON.parse(localData);
          setProfile(prev => ({
            ...prev,
            ...parsedProfile
          }));
          console.log("Loaded profile from local storage after API error");
        } catch (e) {
          console.error("Error parsing local profile data:", e);
        }
      }
    }
  }
  
  // Fetch user settings
  async function fetchUserSettings(id: string) {
    try {
      const response = await fetch(`/api/users/${id}/settings`);
      if (response.ok) {
        const data = await response.json();
        setNotificationSettings(data);
      } else if (response.status === 401) {
        // If unauthorized, try to load from localStorage
        const localData = localStorage.getItem('settings-' + id);
        if (localData) {
          try {
            const parsedSettings = JSON.parse(localData);
            setNotificationSettings(parsedSettings);
          } catch (e) {
            console.error("Error parsing local settings data:", e);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching user settings:", error);
      
      // Try to load from localStorage on error
      const localData = localStorage.getItem('settings-' + id);
      if (localData) {
        try {
          const parsedSettings = JSON.parse(localData);
          setNotificationSettings(parsedSettings);
        } catch (e) {
          console.error("Error parsing local settings data:", e);
        }
      }
    }
  }

  // Handle notification setting changes
  const handleNotificationChange = (key: keyof NotificationSettings) => {
    if (typeof notificationSettings[key] === 'boolean') {
      setNotificationSettings((prev) => ({
        ...prev,
        [key]: !prev[key as keyof typeof prev],
      }));
    }
  };
  
  // Save notification settings
  const saveNotificationSettings = async () => {
    if (!userId) return;
    
    try {
      setIsSaving(true);
      
      // If using temporary ID, save to localStorage
      if (userId.startsWith('temp-')) {
        localStorage.setItem('tempUserSettings', JSON.stringify(notificationSettings));
        
        toast({
          title: "Settings saved locally",
          description: "Your notification preferences have been saved locally.",
        });
        
        setIsSaving(false);
        return;
      }
      
      const response = await fetch(`/api/users/${userId}/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(notificationSettings),
      });
      
      if (response.ok) {
        toast({
          title: "Settings saved",
          description: "Your notification preferences have been updated.",
        });
      } else if (response.status === 401) {
        // Authentication failed, fallback to local storage
        localStorage.setItem('settings-' + userId, JSON.stringify(notificationSettings));
        
        toast({
          title: "Settings saved locally",
          description: "Authentication failed. Your settings have been saved locally only.",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to save settings. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      
      // On error, save to localStorage
      localStorage.setItem('settings-' + userId, JSON.stringify(notificationSettings));
      
      toast({
        title: "Saved locally only",
        description: "Could not connect to server. Your settings were saved locally.",
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  // Save profile
  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    
    try {
      setIsSaving(true);
      
      // Check if we're using a temporary ID (local mode)
      if (userId.startsWith('temp-')) {
        // Store profile data in local storage
        localStorage.setItem('tempUserProfile', JSON.stringify(profile));
        
        toast({
          title: "Profile saved locally",
          description: "Your profile has been saved locally. Create an account to save permanently.",
        });
        
        setIsSaving(false);
        return;
      }
      
      // Regular API save for authenticated users
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: profile.name,
          email: profile.email,
          phone: profile.phone,
          timezone: profile.timezone,
        }),
      });
      
      if (response.ok) {
        toast({
          title: "Profile saved",
          description: "Your profile has been updated.",
        });
      } else if (response.status === 401) {
        // Authentication failed, fall back to local storage
        console.warn("Authentication failed, saving profile locally");
        localStorage.setItem('user-' + userId, JSON.stringify(profile));
        
        toast({
          title: "Profile saved locally",
          description: "Authentication failed. Your profile has been saved locally only.",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to save profile. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      
      // On error, still try to save locally
      localStorage.setItem('user-' + userId, JSON.stringify(profile));
      
      toast({
        title: "Saved locally only",
        description: "Could not connect to server. Your profile was saved locally.",
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  // Handle profile field changes
  const handleProfileChange = (field: keyof UserProfile, value: string) => {
    setProfile({
      ...profile,
      [field]: value,
    });
  };

  if (isLoading) {
    return <div className="container p-6 md:p-10">Loading...</div>;
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
              <div className="space-y-4">
                <h3 className="font-medium">Hanko Authentication Settings</h3>
                <p className="text-sm text-muted-foreground">Manage your passkeys, email, and authentication settings.</p>
                <HankoProfile />
              </div>
              
              <Separator />
              
              <div className="flex items-center space-x-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={profile?.avatarUrl || "/placeholder.svg?height=64&width=64"} alt={profile?.name || "User"} />
                  <AvatarFallback>{profile?.name?.charAt(0) || "U"}</AvatarFallback>
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

              <form onSubmit={saveProfile} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input 
                      id="name"
                      value={profile?.name || ""}
                      onChange={(e) => handleProfileChange("name", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email"
                      value={profile?.email || ""}
                      onChange={(e) => handleProfileChange("email", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input 
                      id="phone"
                      value={profile?.phone || ""}
                      onChange={(e) => handleProfileChange("phone", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select 
                      value={profile?.timezone || "UTC"}
                      onValueChange={(value) => handleProfileChange("timezone", value)}
                    >
                      <SelectTrigger id="timezone">
                        <SelectValue placeholder="Select timezone" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UTC-8">Pacific Time (UTC-8)</SelectItem>
                        <SelectItem value="UTC-5">Eastern Time (UTC-5)</SelectItem>
                        <SelectItem value="UTC">UTC</SelectItem>
                        <SelectItem value="UTC+1">Central European Time (UTC+1)</SelectItem>
                        <SelectItem value="UTC+8">China Standard Time (UTC+8)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </form>
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
                      checked={notificationSettings.emailNotifications}
                      onCheckedChange={() => handleNotificationChange("emailNotifications")}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="sms-notifications">SMS Notifications</Label>
                      <p className="text-sm text-muted-foreground">Receive notifications via SMS</p>
                    </div>
                    <Switch
                      id="sms-notifications"
                      checked={notificationSettings.smsNotifications}
                      onCheckedChange={() => handleNotificationChange("smsNotifications")}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="slack-notifications">Slack Notifications</Label>
                      <p className="text-sm text-muted-foreground">Receive notifications via Slack</p>
                    </div>
                    <Switch
                      id="slack-notifications"
                      checked={notificationSettings.slackNotifications}
                      onCheckedChange={() => handleNotificationChange("slackNotifications")}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="voice-notifications">Voice Notifications</Label>
                      <p className="text-sm text-muted-foreground">Receive notifications via phone call</p>
                    </div>
                    <Switch
                      id="voice-notifications"
                      checked={notificationSettings.voiceNotifications}
                      onCheckedChange={() => handleNotificationChange("voiceNotifications")}
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
                    <Select 
                      value={notificationSettings.incidentAssignmentChannel}
                      onValueChange={(value) => setNotificationSettings(prev => ({
                        ...prev,
                        incidentAssignmentChannel: value
                      }))}
                    >
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
                    <Select 
                      value={notificationSettings.scheduleChangeChannel}
                      onValueChange={(value) => setNotificationSettings(prev => ({
                        ...prev,
                        scheduleChangeChannel: value
                      }))}
                    >
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
                    <Select 
                      value={notificationSettings.escalationChannel}
                      onValueChange={(value) => setNotificationSettings(prev => ({
                        ...prev,
                        escalationChannel: value
                      }))}
                    >
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
                <Button onClick={saveNotificationSettings} disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save Preferences"}
                </Button>
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

