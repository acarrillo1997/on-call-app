"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import HankoProfile from "@/components/HankoProfile"
import { useUserData } from "@/hooks/useUserData"

export default function ProfilePage() {
  const userData = useUserData()

  return (
    <div className="container space-y-6 p-6 md:p-10">
      <div className="space-y-0.5">
        <h1 className="text-3xl font-bold tracking-tight">Account Profile</h1>
        <p className="text-muted-foreground">
          Manage your authentication settings and account preferences.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>Your personal account details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Email</div>
              <div className="font-medium">{userData.email || "No email available"}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Authentication Settings</CardTitle>
            <CardDescription>Manage your authentication methods and security</CardDescription>
          </CardHeader>
          <CardContent>
            <HankoProfile />
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 