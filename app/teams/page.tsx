"use client"

import { useState, useEffect } from "react"
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
import { Plus, Search, UserPlus, X, Loader2 } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { requireAuth } from "@/lib/auth-client"

interface User {
  id: string;
  name: string | null;
  email: string | null;
  avatarUrl: string | null;
}

interface TeamMember {
  id: string;
  userId: string;
  teamId: string;
  role: string;
  user: User;
}

interface Team {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  members?: TeamMember[];
}

export default function TeamsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [showAddMemberDialog, setShowAddMemberDialog] = useState(false)
  const [createTeamDialog, setCreateTeamDialog] = useState(false)
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null)
  const [teams, setTeams] = useState<Team[]>([])
  const [teamMembers, setTeamMembers] = useState<Record<string, TeamMember[]>>({})
  const [availableUsers, setAvailableUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMembers, setLoadingMembers] = useState(false)
  const [selectedMember, setSelectedMember] = useState("")
  const [selectedRole, setSelectedRole] = useState("member")
  const [newTeamName, setNewTeamName] = useState("")
  const [newTeamDescription, setNewTeamDescription] = useState("")
  const [isAdmin, setIsAdmin] = useState(false)
  const router = useRouter()

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      try {
        await requireAuth();
      } catch (error) {
        router.push('/login');
      }
    };
    
    checkAuth();
  }, [router]);

  // Load teams
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const response = await fetch('/api/teams');
        if (!response.ok) throw new Error('Failed to fetch teams');
        
        const data = await response.json();
        setTeams(data);

        // For each team, load its members
        const membersRecord: Record<string, TeamMember[]> = {};
        for (const team of data) {
          try {
            const membersResponse = await fetch(`/api/teams/${team.id}/members`);
            if (membersResponse.ok) {
              const membersData = await membersResponse.json();
              membersRecord[team.id] = membersData;
              
              // Check if user is admin in any team
              const userMember = membersData.find((m: TeamMember) => m.role === 'admin');
              if (userMember) {
                setIsAdmin(true);
              }
            }
          } catch (error) {
            console.error(`Error fetching members for team ${team.id}:`, error);
          }
        }
        setTeamMembers(membersRecord);
      } catch (error) {
        console.error('Error fetching teams:', error);
        toast({
          title: 'Error',
          description: 'Failed to load teams',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchTeams();
  }, []);

  // Fetch available users when dialog opens
  const fetchAvailableUsers = async (teamId: string) => {
    setLoadingMembers(true);
    try {
      // Get all users
      const response = await fetch('/api/users');
      if (!response.ok) throw new Error('Failed to fetch users');
      
      const allUsers = await response.json();
      
      // Filter out users already in the team
      const teamMembersList = teamMembers[teamId] || [];
      const teamMemberIds = new Set(teamMembersList.map(member => member.userId));
      
      const availableUsersList = allUsers.filter((user: User) => !teamMemberIds.has(user.id));
      setAvailableUsers(availableUsersList);
    } catch (error) {
      console.error('Error fetching available users:', error);
      toast({
        title: 'Error',
        description: 'Failed to load available users',
        variant: 'destructive',
      });
    } finally {
      setLoadingMembers(false);
    }
  };

  // Filter teams based on search query
  const filteredTeams = teams.filter(
    (team) =>
      team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (team.description?.toLowerCase().includes(searchQuery.toLowerCase()) || false)
  );

  const handleAddMember = (teamId: string) => {
    setSelectedTeam(teamId);
    fetchAvailableUsers(teamId);
    setShowAddMemberDialog(true);
  };

  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) {
      toast({
        title: 'Error',
        description: 'Team name is required',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      const response = await fetch('/api/teams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newTeamName,
          description: newTeamDescription,
        }),
      });
      
      if (!response.ok) throw new Error('Failed to create team');
      
      const newTeam = await response.json();
      setTeams([...teams, newTeam]);
      setNewTeamName('');
      setNewTeamDescription('');
      setCreateTeamDialog(false);
      
      toast({
        title: 'Success',
        description: `Team "${newTeam.name}" created successfully`,
      });
    } catch (error) {
      console.error('Error creating team:', error);
      toast({
        title: 'Error',
        description: 'Failed to create team',
        variant: 'destructive',
      });
    }
  };

  const addMemberToTeam = async () => {
    if (!selectedTeam || !selectedMember) {
      toast({
        title: 'Error',
        description: 'Please select a user',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      const response = await fetch(`/api/teams/${selectedTeam}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: selectedMember,
          role: selectedRole,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add team member');
      }
      
      const newMember = await response.json();
      
      // Update the team members state
      setTeamMembers(prev => ({
        ...prev,
        [selectedTeam]: [...(prev[selectedTeam] || []), newMember]
      }));
      
      setSelectedMember('');
      setSelectedRole('member');
      setShowAddMemberDialog(false);
      
      toast({
        title: 'Success',
        description: `User added to team successfully`,
      });
    } catch (error) {
      console.error('Error adding team member:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add team member',
        variant: 'destructive',
      });
    }
  };

  const removeMember = async (teamId: string, userId: string) => {
    if (!confirm('Are you sure you want to remove this member from the team?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/teams/${teamId}/members?userId=${userId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to remove team member');
      }
      
      // Update the team members state
      setTeamMembers(prev => ({
        ...prev,
        [teamId]: (prev[teamId] || []).filter(member => member.userId !== userId)
      }));
      
      toast({
        title: 'Success',
        description: 'Member removed from team',
      });
    } catch (error) {
      console.error('Error removing team member:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to remove team member',
        variant: 'destructive',
      });
    }
  };

  // Get initials from user name
  const getInitials = (name: string | null) => {
    if (!name) return '??';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="container space-y-6 p-6 md:p-10">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Teams</h1>
          <p className="text-muted-foreground">Manage teams and team members</p>
        </div>
        <Button onClick={() => setCreateTeamDialog(true)}>
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
        {isAdmin && (
          <Button variant="outline" onClick={() => router.push('/teams/admin')}>
            Advanced Management
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-2 text-lg text-muted-foreground">Loading teams...</span>
        </div>
      ) : (
        <Tabs defaultValue="grid" className="space-y-4">
          <TabsList>
            <TabsTrigger value="grid">Grid View</TabsTrigger>
            <TabsTrigger value="list">List View</TabsTrigger>
          </TabsList>

          <TabsContent value="grid" className="space-y-4">
            {filteredTeams.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10">
                <p className="text-lg text-muted-foreground">No teams found.</p>
                <Button className="mt-4" onClick={() => setCreateTeamDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Team
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredTeams.map((team) => {
                  const members = teamMembers[team.id] || [];
                  return (
                    <Card key={team.id}>
                      <CardHeader>
                        <CardTitle>{team.name}</CardTitle>
                        <CardDescription>{team.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <div className="text-sm font-medium">Members ({members.length})</div>
                            <div className="flex -space-x-2">
                              {members.map((member) => (
                                <Avatar key={member.id} className="h-8 w-8 border-2 border-background">
                                  <AvatarImage src={member.user.avatarUrl || undefined} alt={member.user.name || 'Team member'} />
                                  <AvatarFallback>{getInitials(member.user.name)}</AvatarFallback>
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
                            <div className="text-sm font-medium">Roles</div>
                            <div className="flex flex-wrap gap-2">
                              {members.some(m => m.role === 'admin') && (
                                <Badge variant="outline">Admin</Badge>
                              )}
                              {members.some(m => m.role === 'member') && (
                                <Badge variant="outline">Members</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="flex justify-between">
                        <Button variant="outline" size="sm" onClick={() => router.push(`/teams/${team.id}`)}>
                          View Details
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => router.push(`/schedule?team=${team.id}`)}>
                          Manage Schedule
                        </Button>
                      </CardFooter>
                    </Card>
                  )
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="list">
            <Card>
              <CardContent className="p-6">
                {filteredTeams.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10">
                    <p className="text-lg text-muted-foreground">No teams found.</p>
                    <Button className="mt-4" onClick={() => setCreateTeamDialog(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Your First Team
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredTeams.map((team) => {
                      const members = teamMembers[team.id] || [];
                      return (
                        <div key={team.id} className="rounded-lg border p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-medium">{team.name}</h3>
                              <p className="text-sm text-muted-foreground">{team.description}</p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline">{members.length} members</Badge>
                              <Button variant="outline" size="sm" onClick={() => handleAddMember(team.id)}>
                                <UserPlus className="mr-2 h-4 w-4" />
                                Add Member
                              </Button>
                            </div>
                          </div>
                          <div className="mt-4">
                            <div className="text-sm font-medium mb-2">Team Members</div>
                            {members.length === 0 ? (
                              <p className="text-sm text-muted-foreground">No members in this team.</p>
                            ) : (
                              <div className="space-y-2">
                                {members.map((member) => (
                                  <div key={member.id} className="flex items-center justify-between rounded-md bg-muted p-2">
                                    <div className="flex items-center space-x-2">
                                      <Avatar className="h-8 w-8">
                                        <AvatarImage src={member.user.avatarUrl || undefined} alt={member.user.name || 'Team member'} />
                                        <AvatarFallback>{getInitials(member.user.name)}</AvatarFallback>
                                      </Avatar>
                                      <div>
                                        <p className="text-sm font-medium">{member.user.name || 'Unnamed User'}</p>
                                        <p className="text-xs text-muted-foreground">{member.role === 'admin' ? 'Admin' : 'Member'}</p>
                                      </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <Badge variant="outline">{member.role}</Badge>
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        onClick={() => removeMember(team.id, member.userId)}
                                        title="Remove member"
                                      >
                                        <X className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Add Member Dialog */}
      <Dialog open={showAddMemberDialog} onOpenChange={setShowAddMemberDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
            <DialogDescription>
              Add a new member to {teams.find((t) => t.id === selectedTeam)?.name || "the team"}.
            </DialogDescription>
          </DialogHeader>
          {loadingMembers ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Loading users...</span>
            </div>
          ) : (
            <>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="member" className="text-right">
                    Member
                  </Label>
                  <Select value={selectedMember} onValueChange={setSelectedMember}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select a member" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableUsers.length === 0 ? (
                        <SelectItem value="none" disabled>No available users</SelectItem>
                      ) : (
                        availableUsers.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name || user.email || user.id}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="role" className="text-right">
                    Role
                  </Label>
                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddMemberDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={addMemberToTeam} disabled={!selectedMember || availableUsers.length === 0}>
                  Add to Team
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Team Dialog */}
      <Dialog open={createTeamDialog} onOpenChange={setCreateTeamDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Team</DialogTitle>
            <DialogDescription>
              Create a new team for your organization.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="teamName" className="text-right">
                Team Name
              </Label>
              <Input
                id="teamName"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                placeholder="Enter team name"
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="teamDescription" className="text-right">
                Description
              </Label>
              <Input
                id="teamDescription"
                value={newTeamDescription}
                onChange={(e) => setNewTeamDescription(e.target.value)}
                placeholder="Enter team description (optional)"
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateTeamDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateTeam} disabled={!newTeamName.trim()}>
              Create Team
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

