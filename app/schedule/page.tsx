"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Loader2, ChevronLeft, ChevronRight, Plus, Edit, Save, Calendar as CalendarIcon, User, Users, X, Clock, RotateCw, Info } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { requireAuth } from "@/lib/auth-client"
import { useRouter, useSearchParams } from "next/navigation"
import { format, addDays, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isSameDay, addMonths, subMonths, isSameMonth, parseISO } from "date-fns"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Label } from "@/components/ui/label"
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

// Type definitions
interface User {
  id: string;
  name: string | null;
  email: string | null;
  avatarUrl: string | null;
}

interface Team {
  id: string;
  name: string;
}

interface Assignment {
  id: string;
  scheduleId: string;
  userId: string;
  date: string;
  user: User;
  createdAt?: string;
}

interface Schedule {
  id: string;
  name: string;
  description: string | null;
  rotationFrequency: number;
  rotationUnit: string;
  startDate: string;
  endDate: string | null;
  teamId: string;
  team: Team;
  assignments: Assignment[];
}

export default function SchedulePage() {
  // URL params
  const searchParams = useSearchParams()
  const initialTeamId = searchParams.get("team")
  
  // State variables
  const [date, setDate] = useState<Date>(new Date())
  const [view, setView] = useState("week")
  const [teams, setTeams] = useState<Team[]>([])
  const [selectedTeam, setSelectedTeam] = useState<string | null>(initialTeamId)
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [teamMembers, setTeamMembers] = useState<Record<string, User[]>>({})
  const [loading, setLoading] = useState(true)
  const [loadingTeamMembers, setLoadingTeamMembers] = useState(false)
  const [createScheduleOpen, setCreateScheduleOpen] = useState(false)
  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null)
  const [selectedUser, setSelectedUser] = useState<string | null>(null)
  const [deleteAssignmentOpen, setDeleteAssignmentOpen] = useState(false)
  const [assignmentToDelete, setAssignmentToDelete] = useState<string | null>(null)
  const [isLoadingAction, setIsLoadingAction] = useState(false)
  
  // New schedule form
  const [newScheduleName, setNewScheduleName] = useState("")
  const [newScheduleDescription, setNewScheduleDescription] = useState("")
  const [newScheduleTeam, setNewScheduleTeam] = useState<string>("")
  const [newScheduleStartDate, setNewScheduleStartDate] = useState<Date>(new Date())
  const [newScheduleEndDate, setNewScheduleEndDate] = useState<Date | undefined>(undefined)
  const [newScheduleFrequency, setNewScheduleFrequency] = useState(1)
  const [newScheduleUnit, setNewScheduleUnit] = useState("weekly")
  const [newScheduleMembers, setNewScheduleMembers] = useState<string[]>([])
  
  // After existing state variables
  const [editScheduleOpen, setEditScheduleOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [deleteScheduleOpen, setDeleteScheduleOpen] = useState(false);
  const [scheduleToDelete, setScheduleToDelete] = useState<string | null>(null);
  
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
        
        const teamsData = await response.json();
        setTeams(teamsData);
        
        // Set default team if not already set by URL param
        if (!selectedTeam && teamsData.length > 0) {
          setSelectedTeam(teamsData[0].id);
        }
      } catch (error) {
        console.error('Error fetching teams:', error);
        toast({
          title: 'Error',
          description: 'Failed to load teams',
          variant: 'destructive',
        });
      }
    };
    
    fetchTeams();
  }, [selectedTeam]);
  
  // Load schedules when team changes
  const fetchSchedules = async () => {
    if (!selectedTeam) return;
    
    setLoading(true);
    try {
      // Add a timestamp to prevent caching
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/schedules?teamId=${selectedTeam}&t=${timestamp}`);
      if (!response.ok) throw new Error('Failed to fetch schedules');
      
      const schedulesData = await response.json();
      console.log(`Fetched ${schedulesData.length} schedules with their assignments`);
      
      // Log details about assignments for debugging
      schedulesData.forEach((schedule: any) => {
        console.log(`Schedule ${schedule.id} has ${schedule.assignments?.length || 0} assignments`);
      });
      
      setSchedules(schedulesData);
    } catch (error) {
      console.error('Error fetching schedules:', error);
      toast({
        title: 'Error',
        description: 'Failed to load schedules',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchSchedules();
  }, [selectedTeam]);
  
  // Load team members when team changes
  useEffect(() => {
    const fetchTeamMembers = async () => {
      if (!selectedTeam) return;
      
      setLoadingTeamMembers(true);
      try {
        const response = await fetch(`/api/teams/${selectedTeam}/members`);
        if (!response.ok) throw new Error('Failed to fetch team members');
        
        const membersData = await response.json();
        const users = membersData.map((member: any) => member.user);
        
        setTeamMembers(prev => ({
          ...prev,
          [selectedTeam]: users
        }));
      } catch (error) {
        console.error('Error fetching team members:', error);
      } finally {
        setLoadingTeamMembers(false);
      }
    };
    
    if (selectedTeam && !teamMembers[selectedTeam]) {
      fetchTeamMembers();
    }
  }, [selectedTeam, teamMembers]);
  
  // Helper function to format date
  const formatDate = (date: Date) => {
    return format(date, "PPPP");
  };
  
  // Helper function to get month name
  const getMonthYearHeader = (date: Date) => {
    return format(date, "MMMM yyyy");
  };
  
  // Helper function to format rotation frequency
  const formatRotationFrequency = (frequency: number, unit: string) => {
    const unitText = {
      daily: frequency === 1 ? 'day' : 'days',
      weekly: frequency === 1 ? 'week' : 'weeks',
      biweekly: frequency === 1 ? 'bi-week' : 'bi-weeks',
      monthly: frequency === 1 ? 'month' : 'months',
    }[unit] || unit;
    
    return `${frequency} ${unitText}`;
  };
  
  // Function to get assignments for the current view
  const getCurrentViewAssignments = () => {
    let startDate: Date;
    let endDate: Date;
    
    if (view === "day") {
      startDate = date;
      endDate = date;
    } else if (view === "week") {
      startDate = startOfWeek(date, { weekStartsOn: 1 });
      endDate = endOfWeek(date, { weekStartsOn: 1 });
    } else if (view === "month") {
      startDate = startOfMonth(date);
      endDate = endOfMonth(date);
    } else {
      startDate = date;
      endDate = date;
    }
    
    const assignmentsByDate: Record<string, { user: User, schedule: Schedule }[]> = {};
    
    // Generate all dates in range
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateKey = format(currentDate, "yyyy-MM-dd");
      assignmentsByDate[dateKey] = [];
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Group assignments by schedule and date to handle potential duplicates
    const groupedAssignments = new Map<string, Map<string, Assignment>>();
    
    // First pass: organize assignments by schedule and date, keeping only the most recent one
    schedules.forEach(schedule => {
      const scheduleMap = new Map<string, Assignment>();
      groupedAssignments.set(schedule.id, scheduleMap);
      
      // Sort assignments by createdAt to ensure we get the most recent one
      const sortedAssignments = [...schedule.assignments].sort((a, b) => 
        new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      );
      
      sortedAssignments.forEach(assignment => {
        const assignmentDate = new Date(assignment.date);
        const dateKey = format(assignmentDate, "yyyy-MM-dd");
        
        // Only keep one assignment per date per schedule
        if (!scheduleMap.has(dateKey)) {
          scheduleMap.set(dateKey, assignment);
        }
      });
    });
    
    // Second pass: populate the assignments by date
    schedules.forEach(schedule => {
      const scheduleMap = groupedAssignments.get(schedule.id);
      if (!scheduleMap) return;
      
      // Convert map to array and process
      for (const [dateKey, assignment] of scheduleMap.entries()) {
        const assignmentDate = new Date(assignment.date);
        
        // Check if the date is in our current view range
        if (
          (view === "day" && isSameDay(assignmentDate, startDate)) || 
          (view !== "day" && assignmentDate >= startDate && assignmentDate <= endDate)
        ) {
          if (!assignmentsByDate[dateKey]) {
            assignmentsByDate[dateKey] = [];
          }
          
          assignmentsByDate[dateKey].push({
            user: assignment.user,
            schedule: schedule
          });
        }
      }
    });
    
    return assignmentsByDate;
  };
  
  // Calculate current view assignments
  const assignmentsByDate = useMemo(
    getCurrentViewAssignments,
    [schedules, date, view]
  );
  
  // Calculate days in current view for week and month views
  const daysInView = useMemo(() => {
    if (view === "week") {
      const start = startOfWeek(date, { weekStartsOn: 1 });
      return Array.from({ length: 7 }, (_, i) => addDays(start, i));
    } else if (view === "month") {
      const start = startOfMonth(date);
      const end = endOfMonth(date);
      const daysCount = end.getDate();
      
      return Array.from({ length: daysCount }, (_, i) => addDays(start, i));
    }
    return [date];
  }, [date, view]);
  
  // Get assignments for a specific date
  const getAssignmentsForDate = (date: Date) => {
    const dateKey = format(date, "yyyy-MM-dd");
    const assignments = assignmentsByDate[dateKey] || [];
    return assignments;
  };
  
  // Handle creating a new schedule
  const handleCreateSchedule = async () => {
    if (!newScheduleName || !newScheduleTeam || !newScheduleStartDate || !newScheduleUnit) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoadingAction(true);
    
    try {
      const response = await fetch('/api/schedules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newScheduleName,
          description: newScheduleDescription,
          teamId: newScheduleTeam,
          rotationFrequency: Number(newScheduleFrequency),
          rotationUnit: newScheduleUnit,
          startDate: newScheduleStartDate.toISOString(),
          endDate: newScheduleEndDate?.toISOString() || null,
          members: newScheduleMembers,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create schedule');
      }
      
      const newSchedule = await response.json();
      
      // Add new schedule to state
      setSchedules(prev => [...prev, newSchedule]);
      
      // Reset form
      setNewScheduleName("");
      setNewScheduleDescription("");
      setNewScheduleStartDate(new Date());
      setNewScheduleEndDate(undefined);
      setNewScheduleFrequency(1);
      setNewScheduleUnit("weekly");
      setNewScheduleMembers([]);
      
      setCreateScheduleOpen(false);
      
      toast({
        title: "Schedule created",
        description: "Your new on-call schedule has been created successfully",
      });
    } catch (error) {
      console.error('Error creating schedule:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create schedule",
        variant: "destructive"
      });
    } finally {
      setIsLoadingAction(false);
    }
  };
  
  // Handle assignment updates
  const handleUpdateAssignment = async () => {
    if (!selectedSchedule || !selectedDate || !selectedUser) {
      toast({
        title: "Missing information",
        description: "Please select a schedule, date, and user",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoadingAction(true);
    
    try {
      const response = await fetch('/api/schedules/assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scheduleId: selectedSchedule.id,
          userId: selectedUser,
          date: format(selectedDate, "yyyy-MM-dd"),
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update assignment');
      }
      
      // After successful update, fetch fresh data
      await fetchSchedules();
      
      setAssignmentDialogOpen(false);
      
      toast({
        title: "Assignment updated",
        description: "The on-call assignment has been updated successfully",
      });
    } catch (error) {
      console.error('Error updating assignment:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update assignment",
        variant: "destructive"
      });
    } finally {
      setIsLoadingAction(false);
    }
  };
  
  // Handle assignment deletion
  const handleDeleteAssignment = async () => {
    if (!assignmentToDelete) return;
    
    setIsLoadingAction(true);
    
    try {
      const response = await fetch(`/api/schedules/assignments?id=${assignmentToDelete}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete assignment');
      }
      
      // After successful deletion, fetch fresh data
      await fetchSchedules();
      
      setDeleteAssignmentOpen(false);
      setAssignmentToDelete(null);
      
      toast({
        title: "Assignment deleted",
        description: "The on-call assignment has been removed",
      });
    } catch (error) {
      console.error('Error deleting assignment:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete assignment",
        variant: "destructive"
      });
    } finally {
      setIsLoadingAction(false);
    }
  };
  
  // Initialize assignment dialog
  const openAssignmentDialog = (scheduleId: string, date: Date) => {
    console.log(`Opening assignment dialog for schedule ${scheduleId} and date ${format(date, "yyyy-MM-dd")}`);
    
    const schedule = schedules.find(s => s.id === scheduleId);
    if (!schedule) {
      console.error(`Schedule with ID ${scheduleId} not found`);
      return;
    }
    
    setSelectedSchedule(schedule);
    setSelectedDate(date);
    
    // Check if an assignment already exists for this date and schedule
    // Debug: log all assignments for this date
    const assignmentsForDate = schedule.assignments.filter(
      a => isSameDay(new Date(a.date), date)
    );
    
    console.log(`Found ${assignmentsForDate.length} assignments for this date:`, 
      assignmentsForDate.map(a => ({ id: a.id, userId: a.userId, date: a.date }))
    );
    
    const existingAssignment = assignmentsForDate[0]; // Take the first one if multiple exist
    
    if (existingAssignment) {
      console.log(`Setting selected user to ${existingAssignment.userId} from existing assignment`);
      setSelectedUser(existingAssignment.userId);
    } else {
      console.log(`No existing assignment, resetting selected user`);
      setSelectedUser("");
    }
    
    setAssignmentDialogOpen(true);
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
  
  // Navigate views
  const navigatePrevious = () => {
    if (view === 'day') {
      setDate(subDays(date, 1));
    } else if (view === 'week') {
      setDate(subDays(date, 7));
    } else if (view === 'month') {
      setDate(subMonths(date, 1));
    }
  };
  
  const navigateNext = () => {
    if (view === 'day') {
      setDate(addDays(date, 1));
    } else if (view === 'week') {
      setDate(addDays(date, 7));
    } else if (view === 'month') {
      setDate(addMonths(date, 1));
    }
  };
  
  // Add functions to handle schedule editing and deletion
  const handleEditSchedule = (schedule: Schedule) => {
    setEditingSchedule(schedule);
    setNewScheduleName(schedule.name);
    setNewScheduleDescription(schedule.description || "");
    setNewScheduleTeam(schedule.teamId);
    setNewScheduleStartDate(new Date(schedule.startDate));
    setNewScheduleEndDate(schedule.endDate ? new Date(schedule.endDate) : undefined);
    setNewScheduleFrequency(schedule.rotationFrequency);
    setNewScheduleUnit(schedule.rotationUnit);
    
    // Extract members currently in the rotation
    const memberIds = Array.from(new Set(schedule.assignments.map(a => a.userId)));
    setNewScheduleMembers(memberIds);
    
    setEditScheduleOpen(true);
  };

  const handleUpdateSchedule = async () => {
    if (!editingSchedule || !newScheduleName || !newScheduleTeam || !newScheduleStartDate || !newScheduleUnit) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoadingAction(true);
    
    try {
      const response = await fetch(`/api/schedules`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: editingSchedule.id,
          name: newScheduleName,
          description: newScheduleDescription,
          rotationFrequency: Number(newScheduleFrequency),
          rotationUnit: newScheduleUnit,
          startDate: newScheduleStartDate.toISOString(),
          endDate: newScheduleEndDate?.toISOString() || null,
          members: newScheduleMembers,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update schedule');
      }
      
      const updatedSchedule = await response.json();
      
      // Update schedules in state
      setSchedules(prev => prev.map(s => s.id === updatedSchedule.id ? updatedSchedule : s));
      
      // Reset form
      setEditingSchedule(null);
      setNewScheduleName("");
      setNewScheduleDescription("");
      setNewScheduleStartDate(new Date());
      setNewScheduleEndDate(undefined);
      setNewScheduleFrequency(1);
      setNewScheduleUnit("weekly");
      setNewScheduleMembers([]);
      
      setEditScheduleOpen(false);
      
      toast({
        title: "Schedule updated",
        description: "Your on-call schedule has been updated successfully",
      });
    } catch (error) {
      console.error('Error updating schedule:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update schedule",
        variant: "destructive"
      });
    } finally {
      setIsLoadingAction(false);
    }
  };

  const handleDeleteSchedule = async () => {
    if (!scheduleToDelete) return;
    
    setIsLoadingAction(true);
    
    try {
      const response = await fetch(`/api/schedules?id=${scheduleToDelete}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete schedule');
      }
      
      // Remove schedule from state
      setSchedules(prev => prev.filter(s => s.id !== scheduleToDelete));
      
      setDeleteScheduleOpen(false);
      setScheduleToDelete(null);
      
      toast({
        title: "Schedule deleted",
        description: "The on-call schedule has been deleted",
      });
    } catch (error) {
      console.error('Error deleting schedule:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete schedule",
        variant: "destructive"
      });
    } finally {
      setIsLoadingAction(false);
    }
  };
  
  return (
    <div className="container max-w-screen-xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">On-Call Schedule</h1>
          <p className="text-muted-foreground mt-1">Manage and view on-call rotations for your teams</p>
        </div>
        <Button className="gap-1 bg-black hover:bg-black/90 text-white" onClick={() => setCreateScheduleOpen(true)}>
          <Plus className="h-4 w-4" />
          New Schedule
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] items-center gap-4">
        <div>
          <Select
            value={selectedTeam || ""}
            onValueChange={setSelectedTeam}
          >
            <SelectTrigger className="w-full md:w-72 border-gray-300">
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
        
        <div className="flex items-center gap-1 justify-self-start md:justify-self-end">
          <Button variant="outline" size="sm" onClick={navigatePrevious} className="h-9 px-2">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setDate(new Date())} className="h-9">
            Today
          </Button>
          <Button variant="outline" size="sm" onClick={navigateNext} className="h-9 px-2">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="justify-self-start md:justify-self-end">
          <div className="flex items-center gap-4">
            <div className="hidden md:block text-right">
              <h2 className="font-semibold">
                {view === "month" ? format(date, "MMMM yyyy") : format(date, "MMMM yyyy")}
              </h2>
              <p className="text-muted-foreground text-sm">
                {format(startOfWeek(date, { weekStartsOn: 1 }), "d MMM")} - {format(endOfWeek(date, { weekStartsOn: 1 }), "d MMM")}
              </p>
            </div>
            
            <div className="flex border rounded-md overflow-hidden">
              <Button 
                variant={view === "day" ? "default" : "ghost"} 
                onClick={() => setView("day")} 
                className={`rounded-none ${view === "day" ? "bg-black text-white" : "text-gray-500"}`}
              >
                Day
              </Button>
              <Button 
                variant={view === "week" ? "default" : "ghost"} 
                onClick={() => setView("week")} 
                className={`rounded-none ${view === "week" ? "bg-black text-white" : "text-gray-500"}`}
              >
                Week
              </Button>
              <Button 
                variant={view === "month" ? "default" : "ghost"} 
                onClick={() => setView("month")} 
                className={`rounded-none ${view === "month" ? "bg-black text-white" : "text-gray-500"}`}
              >
                Month
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {loading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-2 text-lg text-muted-foreground">Loading schedules...</span>
        </div>
      ) : (
        <>
          {view === "day" && (
            <Card>
              <CardHeader>
                <CardTitle>{formatDate(date)}</CardTitle>
                <CardDescription>On-call assignments for today</CardDescription>
              </CardHeader>
              <CardContent>
                {getAssignmentsForDate(date).length > 0 ? (
                  <div className="space-y-4">
                    {getAssignmentsForDate(date).map((assignment, index) => (
                      <div key={index} className="flex items-center justify-between rounded-lg border p-4">
                        <div className="flex items-center space-x-4">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={assignment.user.avatarUrl || undefined} alt={assignment.user.name || "User"} />
                            <AvatarFallback>{getInitials(assignment.user.name)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{assignment.user.name}</p>
                            <div className="flex items-center text-sm text-muted-foreground">
                              <span>{assignment.schedule.name}</span>
                              <span className="mx-1">•</span>
                              <span>{assignment.schedule.team.name}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge>On-Call</Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openAssignmentDialog(assignment.schedule.id, date)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex h-[200px] items-center justify-center rounded-md border border-dashed">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">No on-call assignments for this date</p>
                      {schedules.length > 0 && (
                        <div className="mt-4 flex gap-2 justify-center">
                          {schedules.map(schedule => (
                            <Button 
                              key={schedule.id} 
                              variant="outline" 
                              size="sm"
                              onClick={() => openAssignmentDialog(schedule.id, date)}
                            >
                              <Plus className="mr-2 h-4 w-4" />
                              Add to {schedule.name}
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          
          {view === "week" && (
            <Card className="shadow-md border-0">
              <CardHeader className="border-b bg-muted/20 pb-2">
                <CardTitle>Week View</CardTitle>
                <CardDescription>On-call schedule for the week</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="grid grid-cols-7 divide-x">
                  {daysInView.map((day, index) => {
                    const assignments = getAssignmentsForDate(day);
                    const isToday = isSameDay(day, new Date());
                    const dateString = format(day, "d");
                    const dayString = format(day, "EEE");
                    
                    return (
                      <div 
                        key={index} 
                        className={`min-h-48 ${isToday ? 'bg-black text-white' : ''}`}
                      >
                        <div className={`text-center py-4 ${isToday ? '' : 'text-muted-foreground'}`}>
                          <div className="font-medium">{dayString}</div>
                          <div className="text-xl font-bold">{dateString}</div>
                        </div>
                        
                        <div className="px-2 pb-4 space-y-2">
                          {assignments.length > 0 ? (
                            assignments.map((assignment, aIndex) => (
                              <div
                                key={aIndex}
                                className="flex items-center p-2 rounded-md bg-muted hover:bg-muted/70 cursor-pointer"
                                onClick={() => openAssignmentDialog(assignment.schedule.id, day)}
                              >
                                <Avatar className="h-6 w-6 mr-2">
                                  <AvatarImage 
                                    src={assignment.user.avatarUrl || undefined} 
                                    alt={assignment.user.name || "User"} 
                                  />
                                  <AvatarFallback>{getInitials(assignment.user.name)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium truncate text-sm">
                                    {assignment.user.name}
                                  </div>
                                  <div className="truncate text-xs text-muted-foreground">
                                    {assignment.schedule.name}
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full h-auto py-2 px-1 mt-2 text-xs justify-start border-dashed border text-muted-foreground border-muted-foreground/30"
                              onClick={() => schedules.length > 0 && openAssignmentDialog(schedules[0].id, day)}
                              disabled={!schedules.length}
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Assign on-call
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
          
          {view === "month" && (
            <Card>
              <CardHeader>
                <CardTitle>Month View</CardTitle>
                <CardDescription>On-call schedule for {format(date, "MMMM yyyy")}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-1 text-center">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                    <div key={day} className="font-medium p-2">{day}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: startOfMonth(date).getDay() - 1 }).map((_, index) => (
                    <div key={`empty-start-${index}`} className="h-24 p-1 border rounded-md opacity-50" />
                  ))}
                  
                  {daysInView.map((day, index) => (
                    <div
                      key={index}
                      className={`h-24 p-1 border rounded-md overflow-hidden ${
                        isSameDay(day, new Date()) ? 'border-primary bg-primary/5' : ''
                      }`}
                    >
                      <div className="text-right font-medium text-sm mb-1">{format(day, "d")}</div>
                      <div className="space-y-1 overflow-y-auto max-h-[67px]">
                        {getAssignmentsForDate(day).map((assignment, aIndex) => (
                          <div
                            key={aIndex}
                            className="rounded-md bg-muted p-1 text-xs cursor-pointer hover:bg-muted/80 truncate"
                            onClick={() => openAssignmentDialog(assignment.schedule.id, day)}
                            title={`${assignment.user.name} - ${assignment.schedule.name}`}
                          >
                            {assignment.user.name?.split(' ')[0]}
                          </div>
                        ))}
                        {getAssignmentsForDate(day).length === 0 && isSameMonth(day, date) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full h-5 p-0 text-[10px]"
                            onClick={() => openAssignmentDialog(schedules[0]?.id, day)}
                            disabled={!schedules.length}
                          >
                            <Plus className="h-2 w-2 mr-1" />
                            Add
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          
          {schedules.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Active Schedules</CardTitle>
                <CardDescription>Current on-call rotation schedules</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {schedules.map((schedule) => {
                    // Find current on-call user
                    const today = new Date();
                    const currentAssignment = schedule.assignments.find(a => 
                      isSameDay(parseISO(a.date), today)
                    );
                    
                    return (
                      <div key={schedule.id} className="rounded-lg border p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium">{schedule.name}</h3>
                            <p className="text-sm text-muted-foreground">{schedule.description}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline">
                                <RotateCw className="h-3 w-3 mr-1" />
                                {formatRotationFrequency(schedule.rotationFrequency, schedule.rotationUnit)}
                              </Badge>
                              <Badge variant="outline">
                                <Users className="h-3 w-3 mr-1" />
                                {new Set(schedule.assignments.map(a => a.userId)).size} members
                              </Badge>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge className="mb-2">{schedule.team.name}</Badge>
                            {currentAssignment && (
                              <div className="flex items-center justify-end mt-1">
                                <span className="text-sm mr-2">Current on-call:</span>
                                <Avatar className="h-6 w-6">
                                  <AvatarImage src={currentAssignment.user.avatarUrl || undefined} alt={currentAssignment.user.name || "User"} />
                                  <AvatarFallback>{getInitials(currentAssignment.user.name)}</AvatarFallback>
                                </Avatar>
                                <span className="text-sm font-medium ml-1">{currentAssignment.user.name}</span>
                              </div>
                            )}
                            <div className="flex gap-2 mt-3 justify-end">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleEditSchedule(schedule)}
                              >
                                <Edit className="h-3.5 w-3.5 mr-1" />
                                Edit
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="text-red-600 hover:text-red-700"
                                onClick={() => {
                                  setScheduleToDelete(schedule.id);
                                  setDeleteScheduleOpen(true);
                                }}
                              >
                                <X className="h-3.5 w-3.5 mr-1" />
                                Delete
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
          
          {schedules.length === 0 && !loading && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-6">
                <div className="text-center space-y-4">
                  <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto" />
                  <h3 className="text-lg font-medium">No schedules found</h3>
                  <p className="text-sm text-muted-foreground">
                    Get started by creating your first on-call rotation schedule
                  </p>
                  <Button onClick={() => setCreateScheduleOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Schedule
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
      
      {/* Create Schedule Dialog */}
      <Dialog open={createScheduleOpen} onOpenChange={setCreateScheduleOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl">Create New Schedule</DialogTitle>
            <DialogDescription>
              Set up a rotation schedule for your team
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-5 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name" className="font-medium">Schedule Name</Label>
              <Input
                id="name"
                value={newScheduleName}
                onChange={(e) => setNewScheduleName(e.target.value)}
                placeholder="Primary On-Call"
                className="border-gray-300"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="description" className="font-medium">Description (optional)</Label>
              <Input
                id="description"
                value={newScheduleDescription}
                onChange={(e) => setNewScheduleDescription(e.target.value)}
                placeholder="24/7 production support rotation"
                className="border-gray-300"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="team" className="font-medium">Team</Label>
              <Select
                value={newScheduleTeam}
                onValueChange={setNewScheduleTeam}
              >
                <SelectTrigger id="team" className="border-gray-300">
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
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label className="font-medium">Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal border-gray-300"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {newScheduleStartDate ? format(newScheduleStartDate, "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={newScheduleStartDate}
                      onSelect={(date) => date && setNewScheduleStartDate(date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="grid gap-2">
                <Label className="font-medium">End Date (optional)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal border-gray-300"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {newScheduleEndDate ? format(newScheduleEndDate, "PPP") : "No end date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={newScheduleEndDate}
                      onSelect={(date) => setNewScheduleEndDate(date)}
                      initialFocus
                      disabled={(date) => date < newScheduleStartDate}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="frequency" className="font-medium">Rotation Frequency</Label>
                <Input
                  id="frequency"
                  type="number"
                  min="1"
                  value={newScheduleFrequency}
                  onChange={(e) => setNewScheduleFrequency(parseInt(e.target.value) || 1)}
                  className="border-gray-300"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="unit" className="font-medium">Rotation Unit</Label>
                <Select
                  value={newScheduleUnit}
                  onValueChange={setNewScheduleUnit}
                >
                  <SelectTrigger id="unit" className="border-gray-300">
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="biweekly">Bi-weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="text-sm text-muted-foreground">
              <p>Team members will be assigned based on your rotation frequency. For example, with a weekly rotation, each member will be on-call for a full week before rotating to the next person.</p>
            </div>
            
            {newScheduleTeam && teamMembers[newScheduleTeam] && (
              <div className="grid gap-2">
                <Label className="font-medium">Team Members in Rotation</Label>
                <div className="border rounded-md p-4 max-h-[200px] overflow-y-auto border-gray-300">
                  {teamMembers[newScheduleTeam].map((member) => (
                    <div key={member.id} className="flex items-center space-x-2 py-1">
                      <input
                        type="checkbox"
                        id={`member-${member.id}`}
                        checked={newScheduleMembers.includes(member.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewScheduleMembers([...newScheduleMembers, member.id]);
                          } else {
                            setNewScheduleMembers(newScheduleMembers.filter(id => id !== member.id));
                          }
                        }}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <Label htmlFor={`member-${member.id}`} className="cursor-pointer">
                        <div className="flex items-center">
                          <Avatar className="h-6 w-6 mr-2">
                            <AvatarImage src={member.avatarUrl || undefined} alt={member.name || "Team member"} />
                            <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                          </Avatar>
                          <span>{member.name}</span>
                        </div>
                      </Label>
                    </div>
                  ))}
                  {teamMembers[newScheduleTeam].length === 0 && (
                    <p className="text-sm text-muted-foreground py-2">No members in this team</p>
                  )}
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCreateScheduleOpen(false)} className="border-gray-300">
              Cancel
            </Button>
            <Button onClick={handleCreateSchedule} disabled={isLoadingAction} className="bg-black hover:bg-black/90">
              {isLoadingAction ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Schedule"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Assignment Management Dialog */}
      <Dialog open={assignmentDialogOpen} onOpenChange={setAssignmentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-xl">Manage Assignment</DialogTitle>
            <DialogDescription>
              {selectedDate && `Assign someone for ${format(selectedDate, "PPPP")}`}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-5 py-4">
            <div className="grid gap-2">
              <Label className="font-medium">Schedule</Label>
              {selectedSchedule && (
                <div className="flex items-center space-x-2 p-3 border rounded-md border-gray-300">
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  <span>{selectedSchedule.name}</span>
                </div>
              )}
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="user" className="font-medium">Assign User</Label>
              <Select
                value={selectedUser || ""}
                onValueChange={setSelectedUser}
              >
                <SelectTrigger id="user" className="border-gray-300">
                  <SelectValue placeholder="Select user" />
                </SelectTrigger>
                <SelectContent>
                  {selectedSchedule && teamMembers[selectedSchedule.teamId]?.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      <div className="flex items-center">
                        <Avatar className="h-6 w-6 mr-2">
                          <AvatarImage src={user.avatarUrl || undefined} alt={user.name || "User"} />
                          <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                        </Avatar>
                        <span>{user.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Delete existing assignment if found */}
            {selectedSchedule && selectedDate && selectedSchedule.assignments.some(
              a => new Date(a.date).toDateString() === selectedDate.toDateString()
            ) && (
              <Button
                variant="destructive"
                onClick={() => {
                  const assignment = selectedSchedule.assignments.find(
                    a => new Date(a.date).toDateString() === selectedDate.toDateString()
                  );
                  if (assignment) {
                    setAssignmentToDelete(assignment.id);
                    setDeleteAssignmentOpen(true);
                  }
                }}
                className="mt-2"
              >
                <X className="mr-2 h-4 w-4" />
                Remove Assignment
              </Button>
            )}
          </div>
          
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setAssignmentDialogOpen(false)} className="border-gray-300">
              Cancel
            </Button>
            <Button onClick={handleUpdateAssignment} disabled={!selectedUser || isLoadingAction} className="bg-black hover:bg-black/90">
              {isLoadingAction ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Assignment"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Assignment Confirmation */}
      <AlertDialog open={deleteAssignmentOpen} onOpenChange={setDeleteAssignmentOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl">Delete Assignment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this on-call assignment?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel disabled={isLoadingAction} className="border-gray-300">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDeleteAssignment();
              }}
              disabled={isLoadingAction}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isLoadingAction ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Edit Schedule Dialog */}
      <Dialog open={editScheduleOpen} onOpenChange={setEditScheduleOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl">Edit Schedule</DialogTitle>
            <DialogDescription>
              Update the settings for this rotation schedule
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-5 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name" className="font-medium">Schedule Name</Label>
              <Input
                id="edit-name"
                value={newScheduleName}
                onChange={(e) => setNewScheduleName(e.target.value)}
                placeholder="Primary On-Call"
                className="border-gray-300"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="edit-description" className="font-medium">Description (optional)</Label>
              <Input
                id="edit-description"
                value={newScheduleDescription}
                onChange={(e) => setNewScheduleDescription(e.target.value)}
                placeholder="24/7 production support rotation"
                className="border-gray-300"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-frequency" className="font-medium">Rotation Frequency</Label>
                <Input
                  id="edit-frequency"
                  type="number"
                  min="1"
                  value={newScheduleFrequency}
                  onChange={(e) => setNewScheduleFrequency(parseInt(e.target.value) || 1)}
                  className="border-gray-300"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="edit-unit" className="font-medium">Rotation Unit</Label>
                <Select
                  value={newScheduleUnit}
                  onValueChange={setNewScheduleUnit}
                >
                  <SelectTrigger id="edit-unit" className="border-gray-300">
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="biweekly">Bi-weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="text-sm text-muted-foreground">
              <p>Team members will be assigned based on your rotation frequency. For example, with a weekly rotation, each member will be on-call for a full week before rotating to the next person.</p>
            </div>
            
            {editingSchedule && teamMembers[editingSchedule.teamId] && (
              <div className="grid gap-2">
                <Label className="font-medium">Team Members in Rotation</Label>
                <div className="border rounded-md p-4 max-h-[200px] overflow-y-auto border-gray-300">
                  {teamMembers[editingSchedule.teamId].map((member) => (
                    <div key={member.id} className="flex items-center space-x-2 py-1">
                      <input
                        type="checkbox"
                        id={`edit-member-${member.id}`}
                        checked={newScheduleMembers.includes(member.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewScheduleMembers([...newScheduleMembers, member.id]);
                          } else {
                            setNewScheduleMembers(newScheduleMembers.filter(id => id !== member.id));
                          }
                        }}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <Label htmlFor={`edit-member-${member.id}`} className="cursor-pointer">
                        <div className="flex items-center">
                          <Avatar className="h-6 w-6 mr-2">
                            <AvatarImage src={member.avatarUrl || undefined} alt={member.name || "Team member"} />
                            <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                          </Avatar>
                          <span>{member.name}</span>
                        </div>
                      </Label>
                    </div>
                  ))}
                  {teamMembers[editingSchedule.teamId].length === 0 && (
                    <p className="text-sm text-muted-foreground py-2">No members in this team</p>
                  )}
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditScheduleOpen(false)} className="border-gray-300">
              Cancel
            </Button>
            <Button onClick={handleUpdateSchedule} disabled={isLoadingAction} className="bg-black hover:bg-black/90">
              {isLoadingAction ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Schedule"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Schedule Confirmation */}
      <AlertDialog open={deleteScheduleOpen} onOpenChange={setDeleteScheduleOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl">Delete Schedule</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this schedule? This will remove all assignments and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel disabled={isLoadingAction} className="border-gray-300">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDeleteSchedule();
              }}
              disabled={isLoadingAction}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isLoadingAction ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Schedule"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

