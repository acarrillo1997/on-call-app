"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { useRouter, useSearchParams } from "next/navigation"
import { requireAuth } from "@/lib/auth-client"
import { AlertCircle, Check, Loader } from "lucide-react"

export default function AcceptInvitationPage() {
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [teamName, setTeamName] = useState<string | null>(null)
  const [teamId, setTeamId] = useState<string | null>(null)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await requireAuth();
      } catch (error) {
        // If not logged in, redirect to login with a return URL
        router.push(`/login?returnUrl=${encodeURIComponent(`/invitations/accept?token=${token}`)}`);
        return;
      }

      if (!token) {
        setError("Invalid invitation link");
        setLoading(false);
        return;
      }

      // Accept the invitation
      try {
        const response = await fetch('/api/invitations/accept', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (!response.ok) {
          // Special case for already being a member
          if (response.status === 409 && data.team) {
            setTeamName(data.team.name);
            setTeamId(data.team.id);
            setError(data.error);
            setLoading(false);
            return;
          }

          setError(data.error || "Failed to accept invitation");
          setLoading(false);
          return;
        }

        setSuccess(true);
        setTeamName(data.teamName);
        setTeamId(data.teamId);
        setLoading(false);

        // Show success toast
        toast({
          title: "Invitation accepted",
          description: `You've successfully joined ${data.teamName}`,
        });
      } catch (error) {
        console.error("Error accepting invitation:", error);
        setError("An unexpected error occurred");
        setLoading(false);
      }
    };

    checkAuth();
  }, [router, token, toast]);

  const handleGoToTeam = () => {
    router.push(`/teams`);
  };

  return (
    <div className="container flex items-center justify-center min-h-screen py-10">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Team Invitation</CardTitle>
          <CardDescription>
            Join a team to collaborate with others
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {loading ? (
            <div className="flex flex-col items-center justify-center p-8 space-y-4">
              <Loader className="h-8 w-8 animate-spin text-primary" />
              <p>Processing your invitation...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center p-6 space-y-4 text-center">
              <div className="rounded-full bg-destructive/10 p-3">
                <AlertCircle className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Invitation Error</h3>
                <p className="text-muted-foreground">{error}</p>
              </div>
            </div>
          ) : success ? (
            <div className="flex flex-col items-center justify-center p-6 space-y-4 text-center">
              <div className="rounded-full bg-emerald-100 p-3">
                <Check className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Invitation Accepted</h3>
                <p className="text-muted-foreground">
                  You have successfully joined {teamName}.
                </p>
              </div>
            </div>
          ) : null}
        </CardContent>
        
        <CardFooter className="flex justify-center">
          {(success || (error && teamId)) && (
            <Button onClick={handleGoToTeam}>
              Go to Teams
            </Button>
          )}
          {error && !teamId && (
            <Button variant="outline" onClick={() => router.push('/teams')}>
              Back to Teams
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
} 