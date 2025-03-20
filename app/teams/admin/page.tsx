'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/components/ui/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { requireAuth } from '@/lib/auth-client';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

interface Team {
  id: string;
  name: string;
  description: string | null;
}

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

export default function TeamsAdmin() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(true);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [newTeamDialogOpen, setNewTeamDialogOpen] = useState(false);
  const [addMemberDialogOpen, setAddMemberDialogOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDescription, setNewTeamDescription] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState('member');
  const [removalConfirmOpen, setRemovalConfirmOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<string | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [bulkRemoveConfirmOpen, setBulkRemoveConfirmOpen] = useState(false);
  const [isBulkRemoving, setIsBulkRemoving] = useState(false);
  const [isAdminOfSelectedTeam, setIsAdminOfSelectedTeam] = useState(false);
  const router = useRouter();
  
  // Check authentication and admin status
  useEffect(() => {
    const checkAuth = async () => {
      try {
        await requireAuth();
        
        // Check if user is an admin in any team
        const response = await fetch('/api/teams');
        if (response.ok) {
          const teams = await response.json();
          
          // For each team, check if user is admin
          let isAdmin = false;
          for (const team of teams) {
            const membersResponse = await fetch(`/api/teams/${team.id}/members`);
            if (membersResponse.ok) {
              const members = await membersResponse.json();
              const currentUserMember = members.find((m: TeamMember) => m.role === 'admin');
              
              if (currentUserMember) {
                isAdmin = true;
                break;
              }
            }
          }
          
          if (!isAdmin) {
            toast({
              title: "Access Denied",
              description: "You must be a team admin to access this page",
              variant: "destructive",
            });
            router.push('/teams');
          }
        }
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
        
        // Select first team by default if available
        if (data.length > 0 && !selectedTeam) {
          setSelectedTeam(data[0]);
        }
      } catch (error) {
        console.error('Error fetching teams:', error);
        toast({
          title: 'Error',
          description: 'Failed to load teams',
          variant: 'destructive',
        });
      } finally {
        setLoadingTeams(false);
      }
    };
    
    fetchTeams();
  }, [selectedTeam]);

  // Load team members when a team is selected
  useEffect(() => {
    if (!selectedTeam) return;
    
    const fetchTeamMembers = async () => {
      setLoadingMembers(true);
      try {
        const response = await fetch(`/api/teams/${selectedTeam.id}/members`);
        if (!response.ok) throw new Error('Failed to fetch team members');
        
        const data = await response.json();
        setTeamMembers(data);
        
        // Check if current user is admin of this specific team
        // We need to fetch the current user's ID and then check if they are an admin
        const userResponse = await fetch('/api/user');
        if (userResponse.ok) {
          const userData = await userResponse.json();
          const currentUserId = userData.id;
          
          // Find if the current user is an admin in this team
          const isAdmin = data.some((member: TeamMember) => 
            member.userId === currentUserId && member.role === 'admin'
          );
          
          setIsAdminOfSelectedTeam(isAdmin);
        }
      } catch (error) {
        console.error('Error fetching team members:', error);
        toast({
          title: 'Error',
          description: 'Failed to load team members',
          variant: 'destructive',
        });
      } finally {
        setLoadingMembers(false);
      }
    };
    
    fetchTeamMembers();
  }, [selectedTeam]);

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
      setSelectedTeam(newTeam);
      setNewTeamName('');
      setNewTeamDescription('');
      setNewTeamDialogOpen(false);
      
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

  const handleAddMember = async () => {
    if (!selectedTeam || !selectedUserId) {
      toast({
        title: 'Error',
        description: 'Please select a user',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      const response = await fetch(`/api/teams/${selectedTeam.id}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: selectedUserId,
          role: selectedRole,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add team member');
      }
      
      const newMember = await response.json();
      setTeamMembers([...teamMembers, newMember]);
      setSelectedUserId('');
      setSelectedRole('member');
      setAddMemberDialogOpen(false);
      
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

  const handleRemoveMember = async (memberId: string) => {
    if (!selectedTeam) return;
    
    setRemovalConfirmOpen(true);
    setMemberToRemove(memberId);
  };

  const confirmRemoveMember = async () => {
    if (!selectedTeam || !memberToRemove) return;
    
    try {
      setIsRemoving(true);
      const response = await fetch(`/api/teams/${selectedTeam.id}/members?userId=${memberToRemove}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to remove team member');
      }
      
      // Remove member from local state
      setTeamMembers(teamMembers.filter(member => member.userId !== memberToRemove));
      
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

  const handleUpdateMemberRole = async (memberId: string, newRole: string) => {
    if (!selectedTeam) return;
    
    try {
      const response = await fetch(`/api/teams/${selectedTeam.id}/members/${memberId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: newRole,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update member role');
      }
      
      const updatedMember = await response.json();
      
      // Update the member in local state
      setTeamMembers(members => 
        members.map(member => 
          member.userId === memberId ? updatedMember : member
        )
      );
      
      toast({
        title: 'Success',
        description: `Role updated to ${newRole}`,
      });
    } catch (error) {
      console.error('Error updating member role:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update member role',
        variant: 'destructive',
      });
    }
  };
  
  // Fetch all users for adding to team
  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      if (!response.ok) throw new Error('Failed to fetch users');
      
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Error',
        description: 'Failed to load users',
        variant: 'destructive',
      });
    }
  };

  // Open add member dialog and load users
  const openAddMemberDialog = () => {
    fetchUsers();
    setAddMemberDialogOpen(true);
  };

  // Get initials from user name
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const handleSelectMember = (userId: string) => {
    setSelectedMembers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId) 
        : [...prev, userId]
    );
  };

  const handleSelectAllMembers = () => {
    if (selectedMembers.length === teamMembers.length) {
      setSelectedMembers([]);
    } else {
      setSelectedMembers(teamMembers.map(member => member.userId));
    }
  };

  const handleBulkRemove = () => {
    if (selectedMembers.length === 0) return;
    
    setBulkRemoveConfirmOpen(true);
  };

  const confirmBulkRemove = async () => {
    if (!selectedTeam || selectedMembers.length === 0) return;
    
    try {
      setIsBulkRemoving(true);
      
      // Check if removing all admins
      const adminMembers = teamMembers.filter(member => 
        member.role === 'admin' && selectedMembers.includes(member.userId)
      );
      
      const allAdminsSelected = adminMembers.length === teamMembers.filter(m => m.role === 'admin').length;
      
      if (allAdminsSelected) {
        toast({
          title: 'Error',
          description: 'Cannot remove all admin members from the team',
          variant: 'destructive',
        });
        return;
      }
      
      // Process each removal
      const results = await Promise.all(
        selectedMembers.map(async (memberId) => {
          try {
            const response = await fetch(`/api/teams/${selectedTeam.id}/members?userId=${memberId}`, {
              method: 'DELETE',
            });
            
            return { 
              userId: memberId, 
              success: response.ok 
            };
          } catch (error) {
            return { 
              userId: memberId, 
              success: false 
            };
          }
        })
      );
      
      // Update UI based on results
      const successCount = results.filter(r => r.success).length;
      const failCount = results.length - successCount;
      
      // Update team members state to remove successful deletions
      const successfulUserIds = results.filter(r => r.success).map(r => r.userId);
      setTeamMembers(prev => prev.filter(member => !successfulUserIds.includes(member.userId)));
      
      // Show toast with results
      toast({
        title: 'Bulk Remove Complete',
        description: `Successfully removed ${successCount} members${failCount > 0 ? `, failed to remove ${failCount} members` : ''}`,
        variant: successCount > 0 ? 'default' : 'destructive',
      });
      
      // Clear selections
      setSelectedMembers([]);
    } catch (error) {
      console.error('Error removing team members:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove team members',
        variant: 'destructive',
      });
    } finally {
      setIsBulkRemoving(false);
      setBulkRemoveConfirmOpen(false);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Team Administration</h1>
      
      <div className="flex flex-col md:flex-row gap-6">
        {/* Teams List */}
        <div className="w-full md:w-1/3">
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>Teams</span>
                <Dialog open={newTeamDialogOpen} onOpenChange={setNewTeamDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">Create Team</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Team</DialogTitle>
                      <DialogDescription>
                        Add a new team to your organization.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="name">Team Name</Label>
                        <Input 
                          id="name" 
                          value={newTeamName}
                          onChange={(e) => setNewTeamName(e.target.value)}
                          placeholder="Enter team name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="description">Description (Optional)</Label>
                        <Input 
                          id="description" 
                          value={newTeamDescription}
                          onChange={(e) => setNewTeamDescription(e.target.value)}
                          placeholder="Enter team description"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setNewTeamDialogOpen(false)}>Cancel</Button>
                      <Button onClick={handleCreateTeam}>Create Team</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardTitle>
              <CardDescription>
                Select a team to manage members
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingTeams ? (
                <div className="text-center py-4">Loading teams...</div>
              ) : teams.length === 0 ? (
                <Alert>
                  <AlertDescription>
                    No teams found. Create your first team to get started.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-2">
                  {teams.map((team) => (
                    <Button
                      key={team.id}
                      variant={selectedTeam?.id === team.id ? "default" : "outline"}
                      className="w-full justify-start"
                      onClick={() => setSelectedTeam(team)}
                    >
                      {team.name}
                    </Button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Team Members */}
        <div className="w-full md:w-2/3">
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>
                  {selectedTeam ? `${selectedTeam.name} Members` : 'Team Members'}
                </span>
                {selectedTeam && isAdminOfSelectedTeam && (
                  <Dialog open={addMemberDialogOpen} onOpenChange={setAddMemberDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" onClick={openAddMemberDialog}>Add Member</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Team Member</DialogTitle>
                        <DialogDescription>
                          Add a new member to {selectedTeam.name}.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="userId">Select User</Label>
                          <select
                            id="userId"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={selectedUserId}
                            onChange={(e) => setSelectedUserId(e.target.value)}
                          >
                            <option value="">Select a user</option>
                            {users.map((user) => (
                              <option key={user.id} value={user.id}>
                                {user.name || user.email || user.id}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <Label htmlFor="role">Role</Label>
                          <select
                            id="role"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={selectedRole}
                            onChange={(e) => setSelectedRole(e.target.value)}
                          >
                            <option value="member">Member</option>
                            <option value="admin">Admin</option>
                          </select>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setAddMemberDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleAddMember}>
                          Add Member
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </CardTitle>
              <CardDescription>
                {selectedTeam?.description || 'Manage team members and their roles'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!selectedTeam ? (
                <Alert>
                  <AlertDescription>
                    Please select a team to view its members.
                  </AlertDescription>
                </Alert>
              ) : loadingMembers ? (
                <div className="text-center py-4">Loading members...</div>
              ) : teamMembers.length === 0 ? (
                <Alert>
                  <AlertDescription>
                    No members in this team yet. Add members to get started.
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          {isAdminOfSelectedTeam && (
                            <Checkbox 
                              checked={selectedMembers.length === teamMembers.length && teamMembers.length > 0} 
                              data-state={selectedMembers.length > 0 && selectedMembers.length < teamMembers.length ? "indeterminate" : ""}
                              onCheckedChange={handleSelectAllMembers}
                              aria-label="Select all members"
                            />
                          )}
                        </TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {teamMembers.map((member) => (
                        <TableRow key={member.id} className={member.role === 'admin' ? 'bg-muted/50' : ''}>
                          <TableCell>
                            {isAdminOfSelectedTeam && (
                              <Checkbox 
                                checked={selectedMembers.includes(member.userId)}
                                onCheckedChange={() => handleSelectMember(member.userId)}
                                aria-label={`Select ${member.user.name || 'member'}`}
                              />
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={member.user.avatarUrl || undefined} alt={member.user.name || 'Team member'} />
                                <AvatarFallback>{member.user.name ? getInitials(member.user.name) : '??'}</AvatarFallback>
                              </Avatar>
                              <span>{member.user.name || 'Unnamed User'}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {member.user.email || 'No email'}
                          </TableCell>
                          <TableCell>
                            <Badge variant={member.role === 'admin' ? 'default' : 'outline'}>
                              {member.role === 'admin' ? 'Admin' : 'Member'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {isAdminOfSelectedTeam ? (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    Actions
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  {member.role === 'admin' ? (
                                    <DropdownMenuItem onClick={() => handleUpdateMemberRole(member.userId, 'member')}>
                                      Make Member
                                    </DropdownMenuItem>
                                  ) : (
                                    <DropdownMenuItem onClick={() => handleUpdateMemberRole(member.userId, 'admin')}>
                                      Make Admin
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    className="text-red-600"
                                    onClick={() => handleRemoveMember(member.userId)}
                                  >
                                    Remove from Team
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            ) : (
                              <span className="text-muted-foreground text-sm">No actions available</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {selectedMembers.length > 0 && isAdminOfSelectedTeam && (
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-sm text-muted-foreground">
                        {selectedMembers.length} {selectedMembers.length === 1 ? 'member' : 'members'} selected
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleBulkRemove}
                      >
                        Remove Selected
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
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
      {/* Bulk Remove Confirmation Dialog */}
      <AlertDialog open={bulkRemoveConfirmOpen} onOpenChange={setBulkRemoveConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Team Members</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {selectedMembers.length} {selectedMembers.length === 1 ? 'member' : 'members'} from the team? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBulkRemoving}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                confirmBulkRemove();
              }}
              disabled={isBulkRemoving}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isBulkRemoving ? (
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