import React, { useState, useEffect, useRef } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";

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
import { Loader2, Send, User, Shield, Users, Settings, Mail, MapPin, Plus, Trash, Map } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useAdmin } from "@/hooks/use-admin";

export default function AdminDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const {
    isAdmin,
    isSuperAdmin,
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
  const [worldLoading, setWorldLoading] = useState(false);
  const [showCreateWorldDialog, setShowCreateWorldDialog] = useState(false);
  const [showRegenerateWorldDialog, setShowRegenerateWorldDialog] = useState(false);
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

  // Regenerate world map
  const handleRegenerateWorld = async () => {
    if (!isSuperAdmin) {
      toast({
        title: "Permission Denied",
        description: "Only superadmins can regenerate the world map.",
        variant: "destructive"
      });
      return;
    }
    
    setWorldLoading(true);
    
    try {
      const result = await regenerateWorldMap();
      toast({
        title: "World Map Regenerated",
        description: "The Everdice world map has been regenerated successfully.",
      });
      // Close any open dialogs related to world regeneration
      setShowRegenerateWorldDialog(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to regenerate world map.",
        variant: "destructive"
      });
    } finally {
      setWorldLoading(false);
    }
  };
  
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
    
    if (!isSuperAdmin) {
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

  if (!isAdmin && !isSuperAdmin) {
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
        <TabsList className="grid grid-cols-6 mb-8 w-full max-w-4xl">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="worldmap">World Map</TabsTrigger>
          <TabsTrigger value="worlds">Worlds</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          
            <Card>
              <CardHeader>
                <CardTitle>Users</CardTitle>
                <CardDescription>
                  Registered users in the system
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold mb-2">
                  {isLoadingUsers ? <Loader2 className="h-6 w-6 animate-spin" /> : users.length}
                </div>
                <div className="text-sm text-muted-foreground">
                  {isLoadingUsers ? (
                    <Loader2 className="h-3 w-3 animate-spin inline mr-2" />
                  ) : (
                    <>
                      <span className="font-medium">{users.filter((u: any) => u.role === "admin").length}</span> admins
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Latest system statistics
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingStats ? (
                  <div className="flex justify-center">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    {stats.slice(0, 3).map((stat: {name: string, value: string}, i: number) => (
                      <div key={i} className="flex justify-between items-center">
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
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Common administrative tasks
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button className="w-full justify-start" variant="outline">
                    <Users className="mr-2 h-4 w-4" />
                    User Management
                  </Button>
                  {isSuperAdmin && (
                    <div>
                      <Button 
                        className="w-full justify-start" 
                        variant="outline"
                        onClick={() => setShowRegenerateWorldDialog(true)}
                        disabled={worldLoading}
                      >
                        {worldLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <MapPin className="mr-2 h-4 w-4" />
                            Regenerate Everdice World
                          </>
                        )}
                      </Button>
                    </div>
                  )}
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

        <TabsContent value="worldmap">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Everdice World Map</CardTitle>
                    <CardDescription>
                      The master world map for all campaigns
                    </CardDescription>
                  </div>
                  {isSuperAdmin && (
                    <>
                      <Button
                        disabled={worldLoading}
                        size="sm"
                        variant="secondary"
                        onClick={() => setShowRegenerateWorldDialog(true)}
                      >
                        {worldLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <MapPin className="mr-2 h-4 w-4" />
                            Regenerate World
                          </>
                        )}
                      </Button>
                      
                      <Dialog 
                        open={showRegenerateWorldDialog} 
                        onOpenChange={setShowRegenerateWorldDialog}
                      >
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Regenerate Everdice World</DialogTitle>
                            <DialogDescription>
                              <p className="mt-2">
                                This will create a completely new Everdice world map with new continents and regions.
                              </p>
                              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
                                <h4 className="text-amber-800 font-semibold flex items-center">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><path d="M12 9v4"></path><path d="M12 17h.01"></path></svg>
                                  Warning
                                </h4>
                                <p className="text-amber-700 text-sm mt-1">
                                  All existing campaigns are linked to the current world map. Regenerating the world map will break these connections, and campaign region placements will no longer accurately reflect their position in the Everdice world.
                                </p>
                                {campaigns.length > 0 && (
                                  <p className="text-amber-800 font-medium text-sm mt-2">
                                    There are currently {campaigns.length} active campaigns that will be affected.
                                  </p>
                                )}
                              </div>
                            </DialogDescription>
                          </DialogHeader>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setShowRegenerateWorldDialog(false)}>
                              Cancel
                            </Button>
                            <Button 
                              variant="destructive" 
                              onClick={async () => {
                                await handleRegenerateWorld();
                                setShowRegenerateWorldDialog(false);
                              }}
                            >
                              Yes, Regenerate World
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingEverdiceWorld ? (
                  <div className="h-[400px] flex justify-center items-center">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : (
                  <div className="rounded-md overflow-hidden border">
                    {everdiceWorld?.mapUrl ? (
                      <div className="relative h-[400px] w-full overflow-hidden">
                        <img 
                          src={everdiceWorld.mapUrl} 
                          alt="Everdice World Map" 
                          className="w-full h-full object-contain sm:object-cover"
                          style={{ 
                            maxWidth: '100%', 
                            maxHeight: '100%',
                            margin: '0 auto',
                            display: 'block'
                          }}
                          onError={(e) => {
                            console.error(`Failed to load image from: ${everdiceWorld.mapUrl}`);
                            // Handle the error gracefully with a fallback
                            e.currentTarget.style.display = 'none';
                            
                            // Access the parent container to add a fallback
                            const container = e.currentTarget.parentElement;
                            if (container) {
                              // Create fallback element
                              const fallback = document.createElement('div');
                              fallback.className = "bg-accent/20 w-full h-full flex flex-col items-center justify-center";
                              fallback.innerHTML = `
                                <div class="text-accent/50">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" class="h-24 w-24"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" x2="9" y1="3" y2="18"/><line x1="15" x2="15" y1="6" y2="21"/></svg>
                                </div>
                                <p class="mt-4 text-lg text-muted-foreground">Everdice World Map could not be loaded</p>
                                <p class="text-sm text-muted-foreground mb-4">The image URL may be invalid or inaccessible</p>
                                <button id="regenerate-map-btn" class="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-md text-sm font-medium">
                                  Regenerate World Map
                                </button>
                              `;
                              
                              // Add event listener to the regenerate button
                              setTimeout(() => {
                                const regenerateBtn = container.querySelector('#regenerate-map-btn');
                                if (regenerateBtn) {
                                  regenerateBtn.addEventListener('click', async (event) => {
                                    event.preventDefault();
                                    event.stopPropagation();
                                    
                                    // Show loading state
                                    regenerateBtn.textContent = 'Regenerating...';
                                    regenerateBtn.setAttribute('disabled', 'true');
                                    regenerateBtn.classList.add('opacity-70');
                                    
                                    try {
                                      // Call the regenerate function
                                      await regenerateWorldMap();
                                      
                                      // Show success message
                                      const successMsg = document.createElement('p');
                                      successMsg.className = 'text-green-500 text-sm mt-2';
                                      successMsg.textContent = 'Map regenerated! Refresh the page.';
                                      regenerateBtn.after(successMsg);
                                    } catch (error) {
                                      // Show error message
                                      console.error('Failed to regenerate map:', error);
                                      regenerateBtn.textContent = 'Regenerate Failed';
                                      regenerateBtn.classList.add('bg-destructive');
                                      
                                      const errorMsg = document.createElement('p');
                                      errorMsg.className = 'text-destructive text-sm mt-2';
                                      errorMsg.textContent = 'Error regenerating map. Try again later.';
                                      regenerateBtn.after(errorMsg);
                                    }
                                  });
                                }
                              }, 100);
                              container.appendChild(fallback);
                            }
                          }}
                          loading="eager"
                        />
                        {/* Overlay of campaign regions */}
                        {!isLoadingCampaignRegions && campaignRegions?.uniqueRegions?.length > 0 && (
                          <div className="absolute inset-0">
                            {campaignRegions.uniqueRegions.map((region: any, index: number) => (
                              <div 
                                key={index}
                                className="absolute"
                                style={{
                                  left: `${(region.position?.[0] || 50) * 100}%`,
                                  top: `${(region.position?.[1] || 50) * 100}%`,
                                  transform: 'translate(-50%, -50%)'
                                }}
                              >
                                {/* Region marker */}
                                <div 
                                  className="w-6 h-6 rounded-full bg-primary animate-pulse ring-2 ring-white shadow-lg flex items-center justify-center cursor-pointer hover:scale-110 transition-transform z-10"
                                  title={`${region.regionName || "Unnamed region"} - ${region.campaignName || ""}`}
                                  onClick={() => {
                                    toast({
                                      title: region.campaignName || "Campaign",
                                      description: `Located in the ${region.regionName || "unknown"} region`,
                                    });
                                  }}
                                >
                                  <MapPin className="h-3 w-3 text-white" />
                                </div>
                                
                                {/* Region label */}
                                <div className="absolute mt-4 -ml-12 w-24 text-center whitespace-nowrap">
                                  <span className="bg-background/80 px-1 py-0.5 text-xs font-semibold rounded shadow-sm">{region.regionName || "Unknown"}</span>
                                </div>
                                
                                {/* Region boundary to indicate area */}
                                <div 
                                  className="absolute -inset-6 border-2 border-dashed border-primary/50 rounded-md opacity-80 hover:opacity-100 hover:border-primary transition-all"
                                  style={{
                                    width: '35px',
                                    height: '35px',
                                    top: '-17.5px',
                                    left: '-17.5px'
                                  }}
                                />
                                
                                {/* Region name label */}
                                <div 
                                  className="absolute whitespace-nowrap text-xs font-semibold bg-white/90 text-primary px-1 rounded shadow-sm"
                                  style={{
                                    top: '10px',
                                    left: '50%',
                                    transform: 'translateX(-50%)'
                                  }}
                                >
                                  {region.regionName || "Unknown Region"}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="h-[400px] flex justify-center items-center bg-muted">
                        <p>No world map available</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Active Campaign Regions</CardTitle>
                <CardDescription>
                  Regions with active campaigns
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingCampaignRegions ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {campaignRegions?.uniqueRegions?.length > 0 ? (
                      campaignRegions.uniqueRegions.map((region: any, index: number) => (
                        <div key={index} className="p-4 border rounded-md">
                          <h4 className="font-medium">{region.regionName || "Unnamed region"}</h4>
                          <p className="text-sm text-muted-foreground">
                            {region.campaignCount || 0} {region.campaignCount === 1 ? 'campaign' : 'campaigns'} in this region
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-muted-foreground">No active campaign regions found</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

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
        
        <TabsContent value="worlds">
          <div className="bg-white p-6 rounded-lg">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold">Everdice Worlds</h2>
                <p className="text-muted-foreground">Manage multiple Everdice worlds for your campaigns.</p>
              </div>
              
              {isSuperAdmin && (
                <Button onClick={() => setShowCreateWorldDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" /> Create New World
                </Button>
              )}
            </div>
            
            {worldsLoading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
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
                          
                          {/* Actual image */}
                          <img
                            src={world.mapUrl}
                            alt={world.name}
                            className="object-cover w-full h-full relative z-10"
                            onLoad={(e) => {
                              // Successfully loaded - ensure full visibility
                              e.currentTarget.style.opacity = '1';
                              console.log("Successfully loaded world map:", world.mapUrl);
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
                                  <p class="mt-1 text-xs text-muted-foreground">URL: ${world.mapUrl ? world.mapUrl.substring(0, 50) + '...' : 'No URL'}</p>
                                  <button class="mt-3 px-3 py-1.5 bg-primary hover:bg-primary/90 text-white rounded-md text-sm font-medium regenerate-world-btn" data-world-id="${world.id}">
                                    Regenerate Map
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
                                      regenerateBtn.textContent = 'Generating...';
                                      regenerateBtn.setAttribute('disabled', 'true');
                                      regenerateBtn.classList.add('opacity-70');
                                      
                                      try {
                                        // Call the API to regenerate just this world's map
                                        const response = await apiRequest('POST', `/api/admin/worlds/${worldId}/regenerate-map`);
                                        
                                        // Show success message
                                        regenerateBtn.textContent = 'Success! ✓';
                                        regenerateBtn.classList.add('bg-green-500');
                                        
                                        // Add refresh message
                                        const refreshMsg = document.createElement('p');
                                        refreshMsg.className = 'text-xs text-muted-foreground mt-2';
                                        refreshMsg.textContent = 'Page will refresh shortly...';
                                        regenerateBtn.after(refreshMsg);
                                        
                                        // Reload worlds after a delay and force refresh
                                        setTimeout(() => {
                                          queryClient.invalidateQueries({ queryKey: ['/api/admin/worlds'] });
                                          window.location.reload(); // Force a full refresh to ensure map is loaded
                                        }, 2000);
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
                                
                                if (!confirm('Regenerate this world map? This may take a moment.')) {
                                  return;
                                }
                                
                                // Call the API to regenerate the world map
                                try {
                                  // Show toast for loading state
                                  toast({
                                    title: "Regenerating map",
                                    description: "Please wait while we create a new map...",
                                  });
                                  
                                  const response = await apiRequest('POST', `/api/admin/worlds/${world.id}/regenerate-map`);
                                  
                                  // Show success toast
                                  toast({
                                    title: "Map regenerated!",
                                    description: "The world map has been regenerated successfully.",
                                    variant: "success",
                                  });
                                  
                                  // Refresh data
                                  setTimeout(() => {
                                    queryClient.invalidateQueries({ queryKey: ['/api/admin/worlds'] });
                                    window.location.reload(); // Force reload to refresh image cache
                                  }, 1500);
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
                        onClick={() => setActiveTab("worldmap")}
                      >
                        View Map
                      </Button>
                      
                      {isSuperAdmin && (
                        <Button 
                          variant="default" 
                          size="sm"
                          onClick={() => setShowRegenerateWorldDialog(true)}
                          disabled={worldLoading}
                        >
                          {worldLoading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Regenerating...
                            </>
                          ) : (
                            <>Regenerate</>
                          )}
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                ))}
                
                {worlds.length === 0 && (
                  <div className="col-span-2 text-center py-12 bg-accent/5 rounded-lg border border-accent/20">
                    <Map className="h-12 w-12 mx-auto text-accent/40 mb-4" />
                    <h3 className="text-xl font-medium mb-2">No World Available</h3>
                    <p className="text-muted-foreground max-w-md mx-auto mb-6">
                      There is no Everdice world in the system yet. Generate a world to get started.
                    </p>
                    
                    {isSuperAdmin && (
                      <Button onClick={() => setShowRegenerateWorldDialog(true)} disabled={worldLoading}>
                        {worldLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Plus className="mr-2 h-4 w-4" /> Generate World
                          </>
                        )}
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

      {/* Global Regenerate World Dialog */}
      <Dialog 
        open={showRegenerateWorldDialog} 
        onOpenChange={setShowRegenerateWorldDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Regenerate Everdice World</DialogTitle>
            <DialogDescription>
              <p className="mt-2">
                This will create a completely new Everdice world map with new continents and regions.
              </p>
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
                <h4 className="text-amber-800 font-semibold flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><path d="M12 9v4"></path><path d="M12 17h.01"></path></svg>
                  Warning
                </h4>
                <p className="text-amber-700 text-sm mt-1">
                  All existing campaigns are linked to the current world map. Regenerating the world map will break these connections, and campaign region placements will no longer accurately reflect their position in the Everdice world.
                </p>
                {campaigns.length > 0 && (
                  <p className="text-amber-800 font-medium text-sm mt-2">
                    There are currently {campaigns.length} active campaigns that will be affected.
                  </p>
                )}
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRegenerateWorldDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={async () => {
                await handleRegenerateWorld();
                setShowRegenerateWorldDialog(false);
              }}
            >
              Yes, Regenerate World
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
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