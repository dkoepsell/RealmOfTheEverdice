import React, { useState, useEffect, useRef } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Bar
} from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Send, User, Shield, Users, Settings, Mail, Plus, Trash, BarChart, BarChart3, Scroll, Award, Compass, Map, Activity } from "lucide-react";

// Dashboard stat component for the analytics tab
const DashboardStat = ({ 
  title, 
  value, 
  isLoading, 
  icon 
}: { 
  title: string; 
  value: string | number; 
  isLoading: boolean;
  icon: React.ReactNode;
}) => {
  return (
    <div className="bg-muted rounded p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="text-primary">
          {icon}
        </div>
        <h3 className="text-sm font-medium">{title}</h3>
      </div>
      <p className="text-2xl font-bold">
        {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : value}
      </p>
    </div>
  );
};
import { useAuth } from "@/hooks/use-auth";
import { useAdmin } from "@/hooks/use-admin";

export default function AdminDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const {
    isAdmin,
    isSuperAdmin,
    
    // Analytics data
    dashboardStats,
    isLoadingDashboardStats,
    dashboardStatsError,
    userLoginStats,
    isLoadingUserLoginStats,
    userLoginStatsError,
    campaignActivityStats,
    isLoadingCampaignActivityStats,
    campaignActivityStatsError,
    
    users,
    isLoadingUsers,
    stats,
    isLoadingStats,
    campaigns,
    isLoadingCampaigns,
    loginActivity,
    isLoadingLoginActivity,
    everdiceWorld,
    isLoadingEverdiceWorld,
    campaignRegions,
    isLoadingCampaignRegions,
    sendMessage,
    promoteUser,
    regenerateWorldMap,
    regenerateWorldMapLoading,
    
    // World management
    worlds,
    worldsLoading,
    refetchWorlds,
    selectedWorldId,
    setSelectedWorldId,
    worldUsers,
    worldUsersLoading,
    refetchWorldUsers,
    createWorld,
    createWorldLoading,
    updateWorld,
    updateWorldLoading,
    grantWorldAccess,
    grantWorldAccessLoading,
    updateWorldAccess,
    updateWorldAccessLoading,
    removeWorldAccess,
    removeWorldAccessLoading
  } = useAdmin();

  const [activeTab, setActiveTab] = useState("overview");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPromoteDialogOpen, setIsPromoteDialogOpen] = useState(false);
  const [messageSubject, setMessageSubject] = useState("");
  const [messageContent, setMessageContent] = useState("");
  const [showCreateWorldDialog, setShowCreateWorldDialog] = useState(false);
  const [worldName, setWorldName] = useState("");
  const [worldDescription, setWorldDescription] = useState("");
  const [isMainWorld, setIsMainWorld] = useState(false);
  const [showGrantAccessDialog, setShowGrantAccessDialog] = useState(false);
  const [accessUserId, setAccessUserId] = useState<number | null>(null);
  const [accessLevel, setAccessLevel] = useState<string>("player");
  
  // Set the initial selectedWorldId when worlds load
  useEffect(() => {
    if (worlds && worlds.length > 0 && !selectedWorldId) {
      // Select the main world if available, otherwise select the first world
      const mainWorld = worlds.find(w => w.isMainWorld);
      if (mainWorld) {
        setSelectedWorldId(mainWorld.id);
      } else if (worlds[0]) {
        setSelectedWorldId(worlds[0].id);
      }
    }
  }, [worlds, selectedWorldId, setSelectedWorldId]);
  
  // Create a new world
  const handleCreateWorld = async () => {
    if (!worldName.trim()) {
      toast({
        title: "Validation Error",
        description: "World name is required",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await createWorld({
        name: worldName,
        description: worldDescription || null,
        isMainWorld: isMainWorld
      });
      
      // Reset form
      setWorldName("");
      setWorldDescription("");
      setIsMainWorld(false);
      setShowCreateWorldDialog(false);
      
      toast({
        title: "Success",
        description: "World created successfully",
      });
    } catch (error) {
      console.error("Create world error:", error);
      toast({
        title: "Error",
        description: "Failed to create world",
        variant: "destructive",
      });
    }
  };
  
  // Grant access to a world
  const handleGrantAccess = async () => {
    if (!selectedWorldId || !accessUserId) {
      toast({
        title: "Validation Error",
        description: "Please select a world and user",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await grantWorldAccess({
        worldId: selectedWorldId,
        userId: accessUserId,
        accessLevel: accessLevel
      });
      
      // Reset form
      setAccessUserId(null);
      setAccessLevel("player");
      setShowGrantAccessDialog(false);
      
      toast({
        title: "Success",
        description: "Access granted successfully",
      });
    } catch (error) {
      console.error("Grant access error:", error);
      toast({
        title: "Error",
        description: "Failed to grant access",
        variant: "destructive",
      });
    }
  };

  // Send message to user
  const handleSendMessage = async () => {
    if (!selectedUser || !messageSubject || !messageContent) return;
    
    try {
      await sendMessage({
        recipientId: selectedUser.id,
        subject: messageSubject,
        content: messageContent,
      });
      
      setIsDialogOpen(false);
      setMessageSubject("");
      setMessageContent("");
      
      toast({
        title: "Message Sent",
        description: `Your message has been sent to ${selectedUser.username}.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message.",
        variant: "destructive"
      });
    }
  };

  // Promote user to admin
  const handlePromoteUser = async () => {
    if (!selectedUser) return;
    
    if (user?.role !== "superuser") {
      toast({
        title: "Permission Denied",
        description: "Only superadmins can promote users to admin.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      await promoteUser(selectedUser.id);
      
      setIsPromoteDialogOpen(false);
      
      toast({
        title: "User Promoted",
        description: `${selectedUser.username} has been promoted to admin.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to promote user.",
        variant: "destructive"
      });
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-[350px]">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You do not have permission to view this page.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>This area is restricted to administrators only.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">Admin Dashboard</h1>
        <Link href="/">
          <Button variant="outline" className="flex items-center gap-2">
            <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
            Back to Player View
          </Button>
        </Link>
      </div>
      
      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-5 mb-8 w-full max-w-4xl">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            <Card className="md:col-span-3 mb-4">
              <CardHeader>
                <CardTitle className="text-3xl">Welcome to Admin Dashboard</CardTitle>
                <CardDescription className="text-lg">
                  Manage your Everdice worlds, users, and system settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Use this dashboard to manage all aspects of the Realm of Everdice platform. You can view user statistics, 
                  manage world access permissions, and monitor system performance from this central interface.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mt-2">
                  <Button onClick={() => setActiveTab("users")} variant="outline" className="flex items-center justify-center gap-2 py-6">
                    <Users className="h-6 w-6" />
                    <span className="text-base">User Management</span>
                  </Button>
                  <Button onClick={() => setActiveTab("analytics")} variant="outline" className="flex items-center justify-center gap-2 py-6">
                    <BarChart3 className="h-6 w-6" />
                    <span className="text-base">Analytics</span>
                  </Button>
                  <Button onClick={() => setActiveTab("system")} variant="outline" className="flex items-center justify-center gap-2 py-6">
                    <Scroll className="h-6 w-6" />
                    <span className="text-base">System Management</span>
                  </Button>
                  <Button onClick={() => setActiveTab("settings")} variant="outline" className="flex items-center justify-center gap-2 py-6">
                    <Settings className="h-6 w-6" />
                    <span className="text-base">Settings</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="mr-2 h-5 w-5" />
                  User Statistics
                </CardTitle>
                <CardDescription>
                  Detailed user information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Users</p>
                    <p className="text-3xl font-bold">
                      {isLoadingUsers ? <Loader2 className="h-6 w-6 animate-spin" /> : users.length}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Admins</p>
                      <p className="text-xl font-semibold">
                        {isLoadingUsers ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          users.filter((u: any) => u.role === "admin").length
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Online Now</p>
                      <p className="text-xl font-semibold">
                        {isLoadingUsers ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          users.filter((u: any) => u.isOnline).length
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart className="mr-2 h-5 w-5" />
                  Activity Summary
                </CardTitle>
                <CardDescription>
                  Recent system activity
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingStats ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-3">
                    {stats.slice(0, 5).map((stat: {name: string, value: string}, i: number) => (
                      <div key={i} className="flex justify-between items-center pb-2 border-b border-border last:border-0">
                        <span className="text-sm">{stat.name}</span>
                        <span className="font-medium">{stat.value}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Award className="mr-2 h-5 w-5" />
                  Campaign Insights
                </CardTitle>
                <CardDescription>
                  Campaign statistics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Campaigns</p>
                    <p className="text-3xl font-bold">
                      {isLoadingCampaigns ? <Loader2 className="h-6 w-6 animate-spin" /> : campaigns.length}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Active</p>
                      <p className="text-xl font-semibold">
                        {isLoadingCampaigns ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          campaigns.filter((c: any) => c.status === "active").length
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">AI DM</p>
                      <p className="text-xl font-semibold">
                        {isLoadingCampaigns ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          campaigns.filter((c: any) => c.isAiDm).length
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div>
            <h3 className="font-bold text-lg mb-3 mt-6">Recent Users</h3>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Username</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingUsers ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center">
                          <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                        </TableCell>
                      </TableRow>
                    ) : (
                      users.slice(0, 6).map((user: any) => (
                        <TableRow key={user.id}>
                          <TableCell>{user.username}</TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              {user.role === "admin" ? (
                                <Shield className="h-4 w-4 mr-1 text-primary" />
                              ) : (
                                <User className="h-4 w-4 mr-1 text-muted-foreground" />
                              )}
                              {user.role}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <div className={`h-2 w-2 rounded-full mr-2 ${
                                user.isOnline ? "bg-green-500" : "bg-gray-300"
                              }`} />
                              {user.isOnline ? "Online" : "Offline"}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setIsDialogOpen(true);
                                }}
                              >
                                <Mail className="h-4 w-4" />
                              </Button>
                              {user.role !== "admin" && isSuperAdmin && (
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setIsPromoteDialogOpen(true);
                                  }}
                                >
                                  <Shield className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
                
                {!isLoadingUsers && users.length > 6 && (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    + {users.length - 6} more users. Use the Users tab to see all users.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>All Users</CardTitle>
                <CardDescription>
                  Complete list of registered users
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Username</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Last Active</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoadingUsers ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center">
                            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                          </TableCell>
                        </TableRow>
                      ) : (
                        users.map((user: any) => (
                          <TableRow key={user.id}>
                            <TableCell>{user.username}</TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                {user.role === "admin" ? (
                                  <Shield className="h-4 w-4 mr-1 text-primary" />
                                ) : (
                                  <User className="h-4 w-4 mr-1 text-muted-foreground" />
                                )}
                                {user.role}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <div className={`h-2 w-2 rounded-full mr-2 ${
                                  user.isOnline ? "bg-green-500" : "bg-gray-300"
                                }`} />
                                {user.isOnline ? "Now" : user.lastActive || "Unknown"}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setIsDialogOpen(true);
                                  }}
                                >
                                  <Mail className="h-4 w-4" />
                                </Button>
                                {user.role !== "admin" && isSuperAdmin && (
                                  <Button 
                                    size="sm" 
                                    variant="ghost"
                                    onClick={() => {
                                      setSelectedUser(user);
                                      setIsPromoteDialogOpen(true);
                                    }}
                                  >
                                    <Shield className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* World Map tab removed */}

        <TabsContent value="system">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>System Activity</CardTitle>
                <CardDescription>
                  Recent system events
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingLoginActivity ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {loginActivity?.length > 0 ? (
                      loginActivity.map((activity: any, index: number) => (
                        <div key={index} className="flex justify-between items-center p-2 border-b last:border-0">
                          <div>
                            <p className="font-medium">{activity.username || 'Unknown user'}</p>
                            <p className="text-sm text-muted-foreground">{activity.action}</p>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {activity.timestamp || 'Unknown time'}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-muted-foreground">No recent activity</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Campaign Stats</CardTitle>
                <CardDescription>
                  Overview of campaign activity
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingCampaigns ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="rounded-md border p-4">
                        <div className="text-2xl font-bold">{campaigns?.length || 0}</div>
                        <div className="text-sm text-muted-foreground">Total Campaigns</div>
                      </div>
                      <div className="rounded-md border p-4">
                        <div className="text-2xl font-bold">
                          {campaigns?.filter((c: any) => c.isActive)?.length || 0}
                        </div>
                        <div className="text-sm text-muted-foreground">Active Campaigns</div>
                      </div>
                    </div>
                    
                    <h4 className="text-sm font-medium pt-2">Recent Campaigns</h4>
                    {campaigns?.length > 0 ? (
                      campaigns.slice(0, 5).map((campaign: any) => (
                        <div key={campaign.id} className="flex justify-between items-center p-2 border-b last:border-0">
                          <div>
                            <p className="font-medium">{campaign.name || 'Unnamed campaign'}</p>
                            <p className="text-sm text-muted-foreground">
                              {campaign.playerCount || 0} {campaign.playerCount === 1 ? 'player' : 'players'}
                            </p>
                          </div>
                          <div className={`px-2 py-1 text-xs rounded-full ${
                            campaign.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {campaign.isActive ? 'Active' : 'Inactive'}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-muted-foreground">No campaigns found</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Worlds tab removed */}
        
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {worlds.map(world => (
                  <Card 
                    key={world.id} 
                    className={`overflow-hidden ${selectedWorldId === world.id ? 'border-primary border-2' : 'border'}`}
                    onClick={() => setSelectedWorldId(world.id)}
                  >
                    <div className="relative aspect-video w-full overflow-hidden">
                      {world.mapUrl ? (
                        <div className="w-full h-full relative">
                          {/* Image placeholder while loading */}
                          <div className="absolute inset-0 flex items-center justify-center bg-accent/10">
                            <Loader2 className="h-12 w-12 animate-spin text-primary/50" />
                          </div>
                          
                          {/* Actual image - handle data URLs, absolute URLs, and relative paths */}
                          <img
                            src={world.mapUrl && (world.mapUrl.startsWith('data:') || world.mapUrl.startsWith('http')) 
                                 ? world.mapUrl 
                                 : `/api/admin/worlds/${world.id}/map-image`}
                            alt={world.name}
                            className="object-cover w-full h-full relative z-10"
                            onLoad={(e) => {
                              // Successfully loaded - ensure full visibility
                              e.currentTarget.style.opacity = '1';
                              console.log("Successfully loaded world map");
                            }}
                            onError={(e) => {
                              // Replace broken image with a map icon and log the error
                              console.error("Failed to load world map image:", world.mapUrl);
                              e.currentTarget.style.display = 'none';
                              
                              // Access the parent container to add a fallback
                              const container = e.currentTarget.parentElement;
                              if (container) {
                                // Create fallback element
                                const fallback = document.createElement('div');
                                fallback.className = "absolute inset-0 bg-accent/20 flex flex-col items-center justify-center z-20";
                                fallback.innerHTML = `
                                  <div class="text-accent/50">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-16 w-16"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" x2="9" y1="3" y2="18"/><line x1="15" x2="15" y1="6" y2="21"/></svg>
                                  </div>
                                  <p class="mt-2 text-sm text-muted-foreground">Map image not available</p>
                                  <p class="mt-1 text-xs text-muted-foreground">Map will be regenerated with OpenAI</p>
                                  <button class="mt-3 px-3 py-1.5 bg-primary hover:bg-primary/90 text-white rounded-md text-sm font-medium regenerate-world-btn" data-world-id="${world.id}">
                                    Generate New Map
                                  </button>
                                `;
                                
                                // Add event listener to the regenerate button
                                setTimeout(() => {
                                  const regenerateBtn = container.querySelector('.regenerate-world-btn');
                                  if (regenerateBtn) {
                                    regenerateBtn.addEventListener('click', async (event) => {
                                      event.preventDefault();
                                      event.stopPropagation();
                                      
                                      // Get the world ID
                                      const worldId = regenerateBtn.getAttribute('data-world-id');
                                      if (!worldId) return;
                                      
                                      // Show loading state
                                      regenerateBtn.textContent = 'Generating with OpenAI...';
                                      regenerateBtn.setAttribute('disabled', 'true');
                                      regenerateBtn.classList.add('opacity-70');
                                      
                                      try {
                                        // Call the API to regenerate just this world's map
                                        const response = await apiRequest('POST', `/api/admin/worlds/${worldId}/regenerate-map`);
                                        
                                        // Show success message
                                        regenerateBtn.textContent = 'Map Created Successfully! ✓';
                                        regenerateBtn.classList.add('bg-green-500');
                                        
                                        // Add refresh message
                                        const refreshMsg = document.createElement('p');
                                        refreshMsg.className = 'text-xs text-muted-foreground mt-2';
                                        refreshMsg.textContent = 'Page will refresh in 3 seconds...';
                                        regenerateBtn.after(refreshMsg);
                                        
                                        // Reload worlds after a delay and force refresh
                                        setTimeout(() => {
                                          queryClient.invalidateQueries({ queryKey: ['/api/admin/worlds'] });
                                          window.location.reload(); // Force a full refresh to ensure map is loaded
                                        }, 3000);
                                      } catch (error) {
                                        // Show error message
                                        console.error('Failed to regenerate map:', error);
                                        regenerateBtn.textContent = 'Failed, try again';
                                        regenerateBtn.classList.add('bg-destructive');
                                        regenerateBtn.classList.remove('opacity-70');
                                        regenerateBtn.removeAttribute('disabled');
                                      }
                                    });
                                  }
                                }, 100);
                                container.appendChild(fallback);
                              }
                            }}
                          />
                          
                          {/* Regenerate button overlay (always visible) */}
                          <div className="absolute bottom-2 right-2 z-30">
                            <Button 
                              size="sm" 
                              variant="secondary"
                              className="bg-white/80 hover:bg-white shadow-sm text-xs"
                              onClick={async (e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                
                                if (!confirm('Generate a new world map with OpenAI? This may take a moment.')) {
                                  return;
                                }
                                
                                // Call the API to regenerate the world map
                                try {
                                  // Show toast for loading state
                                  toast({
                                    title: "Regenerating world map",
                                    description: "Please wait while OpenAI creates a new map...",
                                  });
                                  
                                  const response = await apiRequest('POST', `/api/admin/worlds/${world.id}/regenerate-map`);
                                  
                                  // Show success toast
                                  toast({
                                    title: "Map created successfully!",
                                    description: "The world map has been regenerated with OpenAI.",
                                  });
                                  
                                  // Refresh data
                                  setTimeout(() => {
                                    queryClient.invalidateQueries({ queryKey: ['/api/admin/worlds'] });
                                    window.location.reload(); // Force reload to refresh image cache
                                  }, 2000);
                                } catch (error) {
                                  // Show error toast
                                  toast({
                                    title: "Failed to regenerate",
                                    description: "There was an error creating the new map. Please try again.",
                                    variant: "destructive",
                                  });
                                }
                              }}
                            >
                              <RefreshCw className="h-3 w-3 mr-1" /> Regenerate
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-accent/20 w-full h-full flex flex-col items-center justify-center">
                          <Map className="h-16 w-16 text-accent/50" />
                          <p className="mt-2 text-sm text-muted-foreground">No map available</p>
                          {isSuperAdmin && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="mt-4"
                              onClick={() => setShowRegenerateWorldDialog(true)}
                            >
                              <RefreshCw className="h-3 w-3 mr-1" /> Generate Map
                            </Button>
                          )}
                        </div>
                      )}
                      {world.isMainWorld && (
                        <div className="absolute top-2 right-2 bg-primary text-white text-xs px-2 py-1 rounded">
                          Main World
                        </div>
                      )}
                    </div>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        {world.name} 
                      </CardTitle>
                      <CardDescription>
                        Created {new Date(world.createdAt).toLocaleDateString()}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm line-clamp-3 mb-2">
                        {world.description || "No description available."}
                      </p>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <span className="flex items-center">
                          <Map className="h-4 w-4 mr-1" />
                          {world.continents?.length || 0} continents
                        </span>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleManageWorldUsers(world.id)}
                      >
                        Manage Users
                      </Button>
                      
                      {isSuperAdmin && (
                        <Button 
                          variant="default" 
                          size="sm"
                          onClick={() => handleEditWorld(world)}
                        >
                          Edit Details
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                ))}
                
                {worlds.length === 0 && (
                  <div className="col-span-2 text-center py-12 bg-accent/5 rounded-lg border border-accent/20">
                    <Compass className="h-12 w-12 mx-auto text-accent/40 mb-4" />
                    <h3 className="text-xl font-medium mb-2">No Worlds Available</h3>
                    <p className="text-muted-foreground max-w-md mx-auto mb-6">
                      There are no Everdice worlds in the system yet. Create a world to get started.
                    </p>
                    
                    {isSuperAdmin && (
                      <Button onClick={() => setShowCreateWorldDialog(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Create New World
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}
            
            {/* World Users panel - only show when a world is selected */}
            {selectedWorldId && (
              <Card className="mt-8">
                <CardHeader>
                  <CardTitle>World Access</CardTitle>
                  <CardDescription>
                    Manage which users have access to the selected world
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {worldUsersLoading ? (
                    <div className="flex justify-center py-6">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : (
                    <div className="relative overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Username</TableHead>
                            <TableHead>Access Level</TableHead>
                            <TableHead>Granted On</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {worldUsers.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center">
                                No users have access to this world yet.
                              </TableCell>
                            </TableRow>
                          ) : (
                            worldUsers.map((worldUser) => (
                              <TableRow key={worldUser.id}>
                                <TableCell>{worldUser.username}</TableCell>
                                <TableCell>
                                  <Select
                                    defaultValue={worldUser.accessLevel}
                                    disabled={!isSuperAdmin}
                                    onValueChange={(value) => {
                                      if (isSuperAdmin && selectedWorldId) {
                                        updateWorldAccess({
                                          worldId: selectedWorldId,
                                          userId: worldUser.userId,
                                          accessLevel: value
                                        });
                                      }
                                    }}
                                  >
                                    <SelectTrigger className="w-32">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="admin">Admin</SelectItem>
                                      <SelectItem value="player">Player</SelectItem>
                                      <SelectItem value="viewer">Viewer</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </TableCell>
                                <TableCell>
                                  {worldUser.createdAt ? new Date(worldUser.createdAt).toLocaleDateString() : 'Unknown'}
                                </TableCell>
                                <TableCell>
                                  {isSuperAdmin && (
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      onClick={() => {
                                        if (confirm("Are you sure you want to remove this user's access?")) {
                                          removeWorldAccess({
                                            worldId: selectedWorldId!,
                                            userId: worldUser.userId
                                          });
                                        }
                                      }}
                                    >
                                      <Trash className="h-4 w-4" />
                                    </Button>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
                {isSuperAdmin && (
                  <CardFooter>
                    <Button
                      variant="outline"
                      onClick={() => setShowGrantAccessDialog(true)}
                    >
                      <Plus className="mr-2 h-4 w-4" /> Grant Access
                    </Button>
                  </CardFooter>
                )}
              </Card>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="analytics">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* General Dashboard Stats */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="mr-2 h-5 w-5" />
                  Platform Overview
                </CardTitle>
                <CardDescription>
                  Key metrics for the Realm of Everdice platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <DashboardStat 
                    title="Total Users" 
                    value={dashboardStats?.totalUsers || 0} 
                    isLoading={isLoadingDashboardStats}
                    icon={<Users className="h-4 w-4" />} 
                  />
                  <DashboardStat 
                    title="Active Campaigns" 
                    value={dashboardStats?.activeCampaigns || 0} 
                    isLoading={isLoadingDashboardStats}
                    icon={<Scroll className="h-4 w-4" />} 
                  />
                  <DashboardStat 
                    title="Characters Created" 
                    value={dashboardStats?.totalCharacters || 0} 
                    isLoading={isLoadingDashboardStats}
                    icon={<User className="h-4 w-4" />} 
                  />
                  <DashboardStat 
                    title="Adventures Completed" 
                    value={dashboardStats?.totalAdventures || 0} 
                    isLoading={isLoadingDashboardStats}
                    icon={<Award className="h-4 w-4" />} 
                  />
                </div>
              </CardContent>
            </Card>
            
            {/* User Activity Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="mr-2 h-5 w-5" />
                  User Activity
                </CardTitle>
                <CardDescription>
                  User engagement statistics
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium">Active Users</h3>
                  <div className="grid grid-cols-3 gap-4 mt-2">
                    {isLoadingUserLoginStats ? (
                      <>
                        <div className="bg-muted rounded p-3 text-center">
                          <p className="text-xs text-muted-foreground">24 Hours</p>
                          <p className="text-2xl font-bold">
                            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                          </p>
                        </div>
                        <div className="bg-muted rounded p-3 text-center">
                          <p className="text-xs text-muted-foreground">7 Days</p>
                          <p className="text-2xl font-bold">
                            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                          </p>
                        </div>
                        <div className="bg-muted rounded p-3 text-center">
                          <p className="text-xs text-muted-foreground">30 Days</p>
                          <p className="text-2xl font-bold">
                            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                          </p>
                        </div>
                      </>
                    ) : (
                      userLoginStats?.activeUsers.map((activity, index) => (
                        <div key={activity.timeframe} className="bg-muted rounded p-3 text-center">
                          <p className="text-xs text-muted-foreground">{activity.timeframe}</p>
                          <p className="text-2xl font-bold">{activity.count}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium">User Return Rate</h3>
                  <div className="bg-muted rounded mt-2 p-4 flex items-center justify-between">
                    <p className="text-2xl font-bold">
                      {isLoadingUserLoginStats ? (
                        <Loader2 className="h-6 w-6 animate-spin" />
                      ) : (
                        `${(userLoginStats?.returnRate || 0) * 100}%`
                      )}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      of users returned in the last 30 days
                    </p>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium">New Users (Last 30 Days)</h3>
                  <div className="bg-muted rounded mt-2 p-4 flex items-center justify-between">
                    <p className="text-2xl font-bold">
                      {isLoadingDashboardStats ? (
                        <Loader2 className="h-6 w-6 animate-spin" />
                      ) : (
                        dashboardStats?.newUsersLast30Days || 0
                      )}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      new registrations
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Campaign Activity Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Scroll className="mr-2 h-5 w-5" />
                  Campaign Activity
                </CardTitle>
                <CardDescription>
                  Campaign and adventure metrics
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium">Campaign Distribution</h3>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div className="bg-muted rounded p-3">
                      <p className="text-xs text-muted-foreground text-center">Human DM</p>
                      <p className="text-2xl font-bold text-center">
                        {isLoadingDashboardStats ? (
                          <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                        ) : (
                          dashboardStats?.totalHumanDmCampaigns || 0
                        )}
                      </p>
                    </div>
                    <div className="bg-muted rounded p-3">
                      <p className="text-xs text-muted-foreground text-center">AI DM</p>
                      <p className="text-2xl font-bold text-center">
                        {isLoadingDashboardStats ? (
                          <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                        ) : (
                          dashboardStats?.totalAiDmCampaigns || 0
                        )}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium">Campaign Status</h3>
                  <div className="space-y-2 mt-2">
                    <div className="bg-muted rounded p-3 flex justify-between items-center">
                      <span className="text-sm">Active</span>
                      <span className="font-medium">
                        {isLoadingCampaignActivityStats ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          campaignActivityStats?.campaignStatusDistribution.active || 0
                        )}
                      </span>
                    </div>
                    <div className="bg-muted rounded p-3 flex justify-between items-center">
                      <span className="text-sm">Completed</span>
                      <span className="font-medium">
                        {isLoadingCampaignActivityStats ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          campaignActivityStats?.campaignStatusDistribution.completed || 0
                        )}
                      </span>
                    </div>
                    <div className="bg-muted rounded p-3 flex justify-between items-center">
                      <span className="text-sm">On Hold</span>
                      <span className="font-medium">
                        {isLoadingCampaignActivityStats ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          campaignActivityStats?.campaignStatusDistribution.onHold || 0
                        )}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium">Average Messages Per Campaign</h3>
                  <div className="bg-muted rounded mt-2 p-4 flex items-center justify-between">
                    <p className="text-2xl font-bold">
                      {isLoadingCampaignActivityStats ? (
                        <Loader2 className="h-6 w-6 animate-spin" />
                      ) : (
                        campaignActivityStats?.averageMessagesPerCampaign.toFixed(1) || 0
                      )}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      messages per campaign
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium">Campaign Creation Trend</h3>
                  <div className="mt-2 bg-muted rounded p-4">
                    {isLoadingCampaignActivityStats ? (
                      <div className="h-64 w-full flex items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin" />
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={250}>
                        <LineChart
                          data={campaignActivityStats?.campaignCreationsByDay || []}
                          margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="date" 
                            tickFormatter={(date) => {
                              const d = new Date(date);
                              return `${d.getMonth()+1}/${d.getDate()}`;
                            }}
                          />
                          <YAxis />
                          <Tooltip 
                            formatter={(value) => [`${value} campaigns`, 'Created']}
                            labelFormatter={(date) => `Date: ${new Date(date).toLocaleDateString()}`}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="count" 
                            name="Campaigns Created" 
                            stroke="#6366f1" 
                            activeDot={{ r: 8 }} 
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings">
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>System Settings</CardTitle>
                <CardDescription>
                  Configure system-wide settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="playerLimit">Player Limit Per Campaign</Label>
                    <div className="flex space-x-2">
                      <Input
                        id="playerLimit"
                        type="number"
                        placeholder="e.g. 6"
                        min={1}
                        max={20}
                        defaultValue={6}
                      />
                      <Button>Save</Button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Maximum number of players allowed in a single campaign.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="aiSettings">AI Narrative Settings</Label>
                    <Select defaultValue="balanced">
                      <SelectTrigger id="aiSettings">
                        <SelectValue placeholder="Select a setting" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="creative">Creative (more varied, less consistent)</SelectItem>
                        <SelectItem value="balanced">Balanced (default)</SelectItem>
                        <SelectItem value="consistent">Consistent (less varied, more consistent)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                      Controls the creativity vs. consistency balance in AI narration.
                    </p>
                  </div>
                  
                  <div className="space-y-2 pt-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="maintenance">Maintenance Mode</Label>
                      <Button variant="outline" size="sm">
                        Enable
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      When enabled, only administrators can access the system.
                    </p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t p-6">
                <Button onClick={() => {
                  toast({
                    title: "Settings Saved",
                    description: "System settings have been updated successfully.",
                  });
                }}>
                  Save All Settings
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

      </Tabs>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send message to {selectedUser?.username}</DialogTitle>
            <DialogDescription>
              This message will be delivered to the user's inbox.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                placeholder="Message subject"
                value={messageSubject}
                onChange={(e) => setMessageSubject(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                placeholder="Write your message here..."
                rows={5}
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendMessage}
              disabled={!messageSubject || !messageContent}
            >
              <Send className="h-4 w-4 mr-2" />
              Send Message
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isPromoteDialogOpen} onOpenChange={setIsPromoteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Promote {selectedUser?.username} to Admin</DialogTitle>
            <DialogDescription>
              This will grant admin privileges to {selectedUser?.username}, allowing them to manage content and users.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to promote this user to admin? This action can only be performed by superadmins.
            </p>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsPromoteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handlePromoteUser}
            >
              <Shield className="h-4 w-4 mr-2" />
              Promote to Admin
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create World Dialog */}
      {showCreateWorldDialog && (
        <Dialog
          open={showCreateWorldDialog}
          onOpenChange={(open) => {
            if (!open) setShowCreateWorldDialog(false);
          }}
        >
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>Create New Everdice World</DialogTitle>
              <DialogDescription>
                Create a new alternate Everdice world for campaigns to take place in.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="worldName">World Name</Label>
                <Input 
                  id="worldName" 
                  placeholder="Enter world name..." 
                  value={worldName}
                  onChange={(e) => setWorldName(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="worldDescription">Description</Label>
                <Textarea 
                  id="worldDescription" 
                  placeholder="Describe your world..." 
                  className="min-h-[100px]"
                  value={newWorldDescription}
                  onChange={(e) => setNewWorldDescription(e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  Provide details about your world's history, magic system, or distinctive features.
                </p>
              </div>
            </div>
            
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowCreateWorldDialog(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleCreateWorld}
                disabled={createWorldMutation.isPending || !worldName.trim()}
              >
                {createWorldMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>Create World</>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* World regeneration dialog removed */}
      
      {/* Create World Dialog */}
      <Dialog open={showCreateWorldDialog} onOpenChange={setShowCreateWorldDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Everdice World</DialogTitle>
            <DialogDescription>
              Create a new world within the Everdice cosmos.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="worldName">World Name</Label>
              <Input 
                id="worldName" 
                placeholder="Enter world name..." 
                className="w-full" 
                value={worldName}
                onChange={(e) => setWorldName(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="worldDescription">Description</Label>
              <Textarea
                id="worldDescription"
                placeholder="Describe this world..."
                className="min-h-[100px]"
                value={worldDescription}
                onChange={(e) => setWorldDescription(e.target.value)}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="isMainWorld" 
                checked={isMainWorld} 
                onCheckedChange={(checked) => {
                  if (typeof checked === 'boolean') {
                    setIsMainWorld(checked)
                  }
                }}
              />
              <Label 
                htmlFor="isMainWorld"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Set as Main World
              </Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateWorldDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateWorld}
              disabled={!worldName.trim() || createWorldLoading}
            >
              {createWorldLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>Create World</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Grant Access Dialog */}
      <Dialog open={showGrantAccessDialog} onOpenChange={setShowGrantAccessDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Grant World Access</DialogTitle>
            <DialogDescription>
              Grant access to a user for this Everdice world.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="userId">Select User</Label>
              <Select
                value={accessUserId?.toString() || ""}
                onValueChange={(value) => setAccessUserId(parseInt(value))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a user" />
                </SelectTrigger>
                <SelectContent>
                  {users.map(user => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.username}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="accessLevel">Access Level</Label>
              <Select
                value={accessLevel}
                onValueChange={(value) => setAccessLevel(value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="player">Player</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGrantAccessDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleGrantAccess}
              disabled={!accessUserId || grantWorldAccessLoading}
            >
              {grantWorldAccessLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Granting...
                </>
              ) : (
                <>Grant Access</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}