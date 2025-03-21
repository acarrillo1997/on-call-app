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
import { UserPlus, Search, ClipboardList, Users, Plus, Loader2, X } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { requireAuth } from "@/lib/auth-client"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

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
  const [showInviteDialog, setShowInviteDialog] = useState(false)
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null)
  const [teams, setTeams] = useState<Team[]>([])
  const [teamMembers, setTeamMembers] = useState<Record<string, TeamMember[]>>({})
  const [availableUsers, setAvailableUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMembers, setLoadingMembers] = useState(false)
  const [selectedMember, setSelectedMember] = useState("")
  const [selectedRole, setSelectedRole] = useState("member")
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState("member")
  const [inviteSending, setInviteSending] = useState(false)
  const [newTeamName, setNewTeamName] = useState("")
  const [newTeamDescription, setNewTeamDescription] = useState("")
  const [isAdmin, setIsAdmin] = useState(false)
  const [teamAdminStatus, setTeamAdminStatus] = useState<Record<string, boolean>>({})
  const [removalConfirmOpen, setRemovalConfirmOpen] = useState(false)
  const [memberToRemove, setMemberToRemove] = useState<{ teamId: string, userId: string } | null>(null)
  const [isRemoving, setIsRemoving] = useState(false)
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
        const adminStatusRecord: Record<string, boolean> = {};
        
        // Get current user
        const userResponse = await fetch('/api/user');
        if (!userResponse.ok) throw new Error('Failed to fetch user');
        const userData = await userResponse.json();
        const currentUserId = userData.id;
        
        let isAdminOfAnyTeam = false;
        
        for (const team of data) {
          try {
            const membersResponse = await fetch(`/api/teams/${team.id}/members`);
            if (membersResponse.ok) {
              const membersData = await membersResponse.json();
              membersRecord[team.id] = membersData;
              
              // Check if user is admin in this specific team
              const isAdminOfThisTeam = membersData.some((m: TeamMember) => 
                m.userId === currentUserId && m.role === 'admin'
              );
              
              adminStatusRecord[team.id] = isAdminOfThisTeam;
              
              if (isAdminOfThisTeam) {
                isAdminOfAnyTeam = true;
              }
            }
          } catch (error) {
            console.error(`Error fetching members for team ${team.id}:`, error);
          }
        }
        
        setTeamMembers(membersRecord);
        setTeamAdminStatus(adminStatusRecord);
        setIsAdmin(isAdminOfAnyTeam);
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
    if (!teamAdminStatus[teamId]) {
      toast({
        title: "Permission Denied",
        description: "Only team admins can add members",
        variant: "destructive",
      });
      return;
    }
    
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
    if (!teamAdminStatus[teamId]) {
      toast({
        title: "Permission Denied",
        description: "Only team admins can remove members",
        variant: "destructive",
      });
      return;
    }
    
    setRemovalConfirmOpen(true);
    setMemberToRemove({ teamId, userId });
  };

  const confirmRemoveMember = async () => {
    if (!memberToRemove) return;
    
    try {
      setIsRemoving(true);
      const { teamId, userId } = memberToRemove;
      
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
    } finally {
      setIsRemoving(false);
      setRemovalConfirmOpen(false);
      setMemberToRemove(null);
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

  // Add this new function for sending invitations
  const sendInvitation = async () => {
    if (!selectedTeam || !teamAdminStatus[selectedTeam]) {
      toast({
        title: "Permission Denied",
        description: "Only team admins can invite new members",
        variant: "destructive",
      });
      return;
    }
    
    if (!selectedTeam || !inviteEmail) return;
    
    setInviteSending(true);
    try {
      const response = await fetch(`/api/teams/${selectedTeam}/invitations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: inviteEmail,
          role: inviteRole,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        toast({
          title: 'Error',
          description: data.error || 'Failed to send invitation',
          variant: 'destructive',
        });
        return;
      }
      
      toast({
        title: 'Invitation sent',
        description: `An invitation has been sent to ${inviteEmail}`,
      });
      
      setInviteEmail('');
      setInviteRole('member');
      setShowInviteDialog(false);
    } catch (error) {
      console.error('Error sending invitation:', error);
      toast({
        title: 'Error',
        description: 'Failed to send invitation',
        variant: 'destructive',
      });
    } finally {
      setInviteSending(false);
    }
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
                                disabled={!teamAdminStatus[team.id]}
                                title={teamAdminStatus[team.id] ? "Add member" : "Only admins can add members"}
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
                      {teamAdminStatus[team.id] && (
                        <div className="flex gap-2 px-6 pb-6">
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={() => {
                              setSelectedTeam(team.id);
                              setShowAddMemberDialog(true);
                              fetchAvailableUsers(team.id);
                            }}
                          >
                            <UserPlus className="h-4 w-4 mr-1" />
                            Add Member
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={() => {
                              setSelectedTeam(team.id);
                              setShowInviteDialog(true);
                            }}
                          >
                            <UserPlus className="h-4 w-4 mr-1" />
                            Invite by Email
                          </Button>
                        </div>
                      )}
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
                              {teamAdminStatus[team.id] && (
                                <>
                                  <Button variant="outline" size="sm" onClick={() => handleAddMember(team.id)}>
                                    <UserPlus className="mr-2 h-4 w-4" />
                                    Add Member
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedTeam(team.id);
                                      setShowInviteDialog(true);
                                    }}
                                  >
                                    <UserPlus className="mr-2 h-4 w-4" />
                                    Invite
                                  </Button>
                                </>
                              )}
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
                                      {teamAdminStatus[team.id] && (
                                        <Button 
                                          variant="ghost" 
                                          size="icon" 
                                          onClick={() => removeMember(team.id, member.userId)}
                                          title="Remove member"
                                        >
                                          <X className="h-4 w-4" />
                                        </Button>
                                      )}
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
            <DialogTitle>Create Team</DialogTitle>
            <DialogDescription>
              Add a new team to collaborate with your colleagues.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Team Name</Label>
              <Input
                id="name"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                placeholder="Enter team name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Input
                id="description"
                value={newTeamDescription}
                onChange={(e) => setNewTeamDescription(e.target.value)}
                placeholder="Enter team description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateTeamDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateTeam}>Create Team</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invite by Email Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
            <DialogDescription>
              Send an email invitation to join this team.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="colleague@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={inviteRole}
                onValueChange={setInviteRole}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="member">Member</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={sendInvitation}
              disabled={!inviteEmail || inviteSending}
            >
              {inviteSending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Invitation"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Member Confirmation Dialog */}
      <AlertDialog open={removalConfirmOpen} onOpenChange={setRemovalConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this member from the team? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRemoving}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                confirmRemoveMember();
              }}
              disabled={isRemoving}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isRemoving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Removing...
                </>
              ) : (
                'Remove'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

