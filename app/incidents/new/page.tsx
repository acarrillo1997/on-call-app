"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { Label } from "@/components/ui/label";

export default function NewIncidentPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [teams, setTeams] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [policies, setPolicies] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    severity: "medium",
    teamId: "",
    serviceId: "none",
    escalationPolicyId: "none",
  });

  // Fetch teams the user belongs to
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const response = await fetch("/api/teams");
        if (response.ok) {
          const data = await response.json();
          setTeams(data);
          
          // Set default team if only one team exists
          if (data.length === 1) {
            setFormData(prev => ({ ...prev, teamId: data[0].id }));
            fetchServicesAndPolicies(data[0].id);
          }
        }
      } catch (error) {
        console.error("Error fetching teams:", error);
        toast({
          title: "Error",
          description: "Could not load teams. Please try again.",
          variant: "destructive",
        });
      }
    };

    fetchTeams();
  }, []);

  // Fetch services and escalation policies when team changes
  const fetchServicesAndPolicies = async (teamId: string) => {
    try {
      const [servicesResponse, policiesResponse] = await Promise.all([
        fetch(`/api/teams/${teamId}/services`),
        fetch(`/api/teams/${teamId}/escalation-policies`)
      ]);

      if (servicesResponse.ok) {
        const servicesData = await servicesResponse.json();
        setServices(servicesData);
      }

      if (policiesResponse.ok) {
        const policiesData = await policiesResponse.json();
        setPolicies(policiesData);
      }
    } catch (error) {
      console.error("Error fetching services or policies:", error);
    }
  };

  const handleTeamChange = (teamId: string) => {
    setFormData(prev => ({ ...prev, teamId, serviceId: "none", escalationPolicyId: "none" }));
    fetchServicesAndPolicies(teamId);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Create a copy of the form data for submission
      const submissionData = { ...formData };
      
      // For API submission, convert "none" to null
      if (submissionData.serviceId === "none") {
        // Use any type to bypass TypeScript check for this specific operation
        (submissionData as any).serviceId = null;
      }
      
      if (submissionData.escalationPolicyId === "none") {
        // Use any type to bypass TypeScript check for this specific operation
        (submissionData as any).escalationPolicyId = null;
      }

      const response = await fetch("/api/incidents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submissionData),
      });

      if (response.ok) {
        const incident = await response.json();
        toast({
          title: "Success",
          description: "Incident created successfully!",
        });
        router.push(`/incidents/${incident.id}`);
      } else {
        const error = await response.json();
        throw new Error(error.error || "Failed to create incident");
      }
    } catch (error: any) {
      console.error("Error creating incident:", error);
      toast({
        title: "Error",
        description: error.message || "Could not create incident. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Log New Incident</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Incident Details</CardTitle>
          <CardDescription>
            Enter information about the incident to notify the on-call team.
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                name="title"
                required
                placeholder="Brief description of the incident"
                value={formData.title}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Detailed information about what happened"
                rows={4}
                value={formData.description}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="team">Team</Label>
              <Select
                value={formData.teamId}
                onValueChange={(value) => handleTeamChange(value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select team" />
                </SelectTrigger>
                <SelectContent>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="service">Service (Optional)</Label>
              <Select
                value={formData.serviceId}
                onValueChange={(value) => handleSelectChange("serviceId", value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select service" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {services.map((service) => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="severity">Severity</Label>
              <Select
                value={formData.severity}
                onValueChange={(value) => handleSelectChange("severity", value)}
              >
                <SelectTrigger className="w-full">
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
              <Label htmlFor="escalationPolicy">Escalation Policy (Optional)</Label>
              <Select
                value={formData.escalationPolicyId}
                onValueChange={(value) => handleSelectChange("escalationPolicyId", value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select escalation policy" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {policies.map((policy) => (
                    <SelectItem key={policy.id} value={policy.id}>
                      {policy.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-between">
            <Button variant="outline" type="button" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Incident"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
} 