import React, { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useAdmin } from "@/hooks/use-admin";
import { Redirect, Link } from "wouter";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2, 
  UserIcon, 
  MessageSquare, 
  BarChart, 
  Shield, 
  Book, 
  BookOpenCheck,
  Map, 
  MapPin,
  Users, 
  Clock, 
  Globe, 
  CheckCircle, 
  XCircle,
  LogIn,
  ChevronsUpDown,
  ZoomIn,
  ZoomOut,
  Maximize
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const AdminDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { 
    isSuperuser, 
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
    refetchEverdiceWorld,
    campaignRegions,
    isLoadingCampaignRegions,
    refetchCampaignRegions,
    sendMessage,
    promoteUser,
    promoteUserLoading
  } = useAdmin();
  
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [messageSubject, setMessageSubject] = useState("");
  const [messageContent, setMessageContent] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPromoteDialogOpen, setIsPromoteDialogOpen] = useState(false);
  const [isInitializingWorld, setIsInitializingWorld] = useState(false);
  
  // Map interaction state
  const [selectedRegion, setSelectedRegion] = useState<any>(null);
  const [regionNameDialog, setRegionNameDialog] = useState(false);
  const [isMapFullscreen, setIsMapFullscreen] = useState(false);
  
  // Redirect if not a superuser
  if (!user) {
    return <Redirect to="/auth" />;
  }
  
  if (!isSuperuser) {
    return <Redirect to="/" />;
  }
  
  const handleSendMessage = () => {
    if (!selectedUser) return;
    
    sendMessage({
      recipientId: selectedUser.id,
      subject: messageSubject,
      content: messageContent,
    });
    
    setMessageSubject("");
    setMessageContent("");
    setIsDialogOpen(false);
  };
  
  const openMessageDialog = (user: any) => {
    setSelectedUser(user);
    setIsDialogOpen(true);
  };
  
  const handlePromoteUser = () => {
    if (!selectedUser) return;
    
    promoteUser(selectedUser.id);
    setIsPromoteDialogOpen(false);
  };
  
  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Shield className="h-8 w-8 mr-2 text-amber-600" />
          <h1 className="text-3xl font-bold">Dungeon Master's Admin Console</h1>
        </div>
        <div className="flex space-x-2">
          <Link href="/">
            <Button 
              variant="outline" 
              className="flex items-center"
            >
              <Book className="h-4 w-4 mr-2" />
              Player View
            </Button>
          </Link>
          <Link href="/tavern-board">
            <Button 
              variant="default" 
              className="flex items-center" 
            >
              <BookOpenCheck className="h-4 w-4 mr-2" />
              Tavern Board
            </Button>
          </Link>
        </div>
      </div>
      
      <p className="text-muted-foreground mb-6">
        Welcome KoeppyLoco the Weird, your superuser powers allow you to monitor and manage the entire realm.
      </p>
      
      <Tabs defaultValue="users">
        <TabsList className="grid w-full grid-cols-5 mb-8">
          <TabsTrigger value="users" className="flex items-center">
            <UserIcon className="h-4 w-4 mr-2" />
            Users
          </TabsTrigger>
          <TabsTrigger value="campaigns" className="flex items-center">
            <Book className="h-4 w-4 mr-2" />
            Campaigns
          </TabsTrigger>
          <TabsTrigger value="everdice" className="flex items-center">
            <Globe className="h-4 w-4 mr-2" />
            Everdice World
          </TabsTrigger>
          <TabsTrigger value="logins" className="flex items-center">
            <LogIn className="h-4 w-4 mr-2" />
            Login Activity
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex items-center">
            <BarChart className="h-4 w-4 mr-2" />
            System Stats
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Registered Adventurers</CardTitle>
              <CardDescription>
                View and manage all registered users in the realm.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingUsers ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Username</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user: any) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.id}</TableCell>
                        <TableCell className="font-medium">{user.username}</TableCell>
                        <TableCell>{user.email || "No email"}</TableCell>
                        <TableCell>
                          <span 
                            className={user.role === "superuser" 
                              ? "text-amber-600 font-semibold" 
                              : user.role === "admin" 
                                ? "text-blue-600 font-semibold" 
                                : "text-green-600"
                            }
                          >
                            {user.role}
                          </span>
                        </TableCell>
                        <TableCell>
                          {new Date(user.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => openMessageDialog(user)}
                            >
                              <MessageSquare className="h-4 w-4 mr-1" />
                              Message
                            </Button>
                            
                            {user.role === "user" && (
                              <Button 
                                variant="secondary" 
                                size="sm"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setIsPromoteDialogOpen(true);
                                }}
                              >
                                <Shield className="h-4 w-4 mr-1" />
                                Promote
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="stats">
          <Card>
            <CardHeader>
              <CardTitle>System Statistics</CardTitle>
              <CardDescription>
                View usage statistics across the platform.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingStats ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : stats.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">
                  No statistics recorded yet.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead>Timestamp</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats.map((stat: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell>{stat.userId || "System"}</TableCell>
                        <TableCell className="font-medium">{stat.action}</TableCell>
                        <TableCell>
                          {stat.metadata ? (
                            <pre className="text-xs bg-muted p-2 rounded">
                              {JSON.stringify(stat.metadata, null, 2)}
                            </pre>
                          ) : (
                            "No details"
                          )}
                        </TableCell>
                        <TableCell>
                          {new Date(stat.timestamp).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="campaigns">
          <Card>
            <CardHeader>
              <CardTitle>Active Campaigns</CardTitle>
              <CardDescription>
                View all ongoing campaigns in the Everdice realm.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingCampaigns ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : campaigns?.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">
                  No campaigns created yet.
                </p>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Total Campaigns</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="text-3xl font-bold">{campaigns?.length || 0}</div>
                        <p className="text-sm text-muted-foreground">Active adventures in Everdice</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">AI DM Campaigns</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="text-3xl font-bold">
                          {campaigns?.filter((c: any) => c.isAiDm).length || 0}
                        </div>
                        <p className="text-sm text-muted-foreground">AI-powered adventures</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Human DM Campaigns</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="text-3xl font-bold">
                          {campaigns?.filter((c: any) => !c.isAiDm).length || 0}
                        </div>
                        <p className="text-sm text-muted-foreground">Human-led adventures</p>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Campaign Name</TableHead>
                        <TableHead>DM</TableHead>
                        <TableHead>Players</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Map</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {campaigns?.map((campaign: any) => (
                        <TableRow key={campaign.id}>
                          <TableCell>{campaign.id}</TableCell>
                          <TableCell className="font-medium">
                            <Link href={`/campaign/${campaign.id}`}>
                              {campaign.name}
                            </Link>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              {campaign.isAiDm ? 
                                <Badge variant="outline" className="bg-purple-50 text-purple-700 hover:bg-purple-50 border-purple-200">
                                  AI DM
                                </Badge> : 
                                <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-50 border-blue-200">
                                  Human DM
                                </Badge>
                              }
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge>{campaign.playerCount || 0}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={
                                campaign.status === "active" ? "default" : 
                                campaign.status === "paused" ? "secondary" : 
                                "outline"
                              }
                              className={
                                campaign.status === "active" ? "bg-green-100 text-green-800 hover:bg-green-100 border-green-200" : 
                                campaign.status === "paused" ? "bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-200" : 
                                "bg-gray-100 text-gray-800 hover:bg-gray-100 border-gray-200"
                              }
                            >
                              {campaign.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {campaign.createdAt ? new Date(campaign.createdAt).toLocaleDateString() : "N/A"}
                          </TableCell>
                          <TableCell>
                            {campaign.hasWorldMap ? (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                      <Map className="h-4 w-4 text-green-600" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>World map available</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            ) : (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                      <Map className="h-4 w-4 text-muted-foreground" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>No world map</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="everdice">
          <Card>
            <CardHeader>
              <CardTitle>Everdice Superworld</CardTitle>
              <CardDescription>
                Monitor the interconnected superworld where all campaigns exist.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingEverdiceWorld || isLoadingCampaignRegions ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : !everdiceWorld ? (
                <div className="text-center py-8">
                  <h3 className="text-lg font-semibold mb-2">No Everdice World Data</h3>
                  <p className="text-muted-foreground mb-4">
                    The Everdice superworld hasn't been initialized yet.
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      if (window.confirm("Are you sure you want to initialize the Everdice superworld? This will create the global map all campaigns exist within.")) {
                        // Call the initialize Everdice world function
                        fetch('/api/admin/initialize-everdice', { 
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' }
                        })
                        .then(response => {
                          if (!response.ok) throw new Error('Failed to initialize Everdice');
                          alert('Everdice world initialized successfully! Refreshing...');
                          window.location.reload();
                        })
                        .catch(err => {
                          console.error(err);
                          alert('Failed to initialize Everdice world.');
                        });
                      }
                    }}
                  >
                    <Globe className="h-4 w-4 mr-2" />
                    Initialize Everdice World
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-6">
                  <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
                    <div className="flex items-start">
                      <Globe className="h-6 w-6 text-amber-600 mr-2 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-medium text-amber-900">The World of {everdiceWorld.name}</h4>
                        <p className="text-amber-800 mt-1">
                          {everdiceWorld.description || "Every campaign exists within this shared superworld. This unified geography connects all player adventures into a coherent universe."}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">World Statistics</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <dl className="space-y-2">
                          <div className="flex justify-between">
                            <dt className="text-muted-foreground">Age:</dt>
                            <dd className="font-medium">{everdiceWorld.age || "Unknown"} years</dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-muted-foreground">Continents:</dt>
                            <dd className="font-medium">{everdiceWorld.continents?.length || 0}</dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-muted-foreground">Major Regions:</dt>
                            <dd className="font-medium">{(everdiceWorld.continents?.reduce((sum: number, continent: any) => 
                              sum + (continent.regions?.length || 0), 0)) || 0}</dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-muted-foreground">Known Species:</dt>
                            <dd className="font-medium">{everdiceWorld.species?.length || 0}</dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-muted-foreground">Major Deities:</dt>
                            <dd className="font-medium">{everdiceWorld.deities?.length || 0}</dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-muted-foreground">Campaign Coverage:</dt>
                            <dd className="font-medium">
                              {campaignRegions && Array.isArray(campaignRegions.campaigns) ? 
                                `${(campaignRegions.campaigns.length || 0)} campaigns in ${Math.min(
                                  (Array.isArray(campaignRegions.uniqueRegions) ? campaignRegions.uniqueRegions.length : 0), 
                                  (everdiceWorld?.continents?.reduce((sum: number, continent: any) => 
                                  sum + (Array.isArray(continent.regions) ? continent.regions.length : 0), 0) || 1)
                                )} regions` :
                                '0 campaigns'}
                            </dd>
                          </div>
                        </dl>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-muted">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Interactive World Map</CardTitle>
                        <CardDescription>
                          Explore the world of Everdice and manage its regions
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-0">
                        {everdiceWorld?.mapUrl ? (
                          <div className="relative">
                            <div className="overflow-hidden rounded-md">
                              <div className={`relative ${isMapFullscreen ? 'fixed inset-0 bg-background z-50 p-4' : ''}`} style={{ height: isMapFullscreen ? "100%" : "450px" }}>
                                {/* Map controls toolbar with clear labeling */}
                                <div className="absolute top-2 right-2 z-10 flex flex-col gap-2 bg-background/80 p-2 rounded-md shadow-lg border border-border">
                                  <div className="text-xs font-medium mb-1 text-center">Map Controls</div>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    className="flex items-center justify-between w-full"
                                    onClick={() => {
                                      const map = document.getElementById('everdice-map-container');
                                      if (map) {
                                        const currentScale = map.style.transform ? 
                                          parseFloat(map.style.transform.replace('scale(', '').replace(')', '')) || 1 : 1;
                                        const newScale = Math.min(currentScale + 0.2, 3);
                                        map.style.transform = `scale(${newScale})`;
                                      }
                                    }}
                                  >
                                    <ZoomIn className="h-4 w-4 mr-1" />
                                    Zoom In
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    className="flex items-center justify-between w-full"
                                    onClick={() => {
                                      const map = document.getElementById('everdice-map-container');
                                      if (map) {
                                        const currentScale = map.style.transform ? 
                                          parseFloat(map.style.transform.replace('scale(', '').replace(')', '')) || 1 : 1;
                                        const newScale = Math.max(currentScale - 0.2, 0.5);
                                        map.style.transform = `scale(${newScale})`;
                                      }
                                    }}
                                  >
                                    <ZoomOut className="h-4 w-4 mr-1" />
                                    Zoom Out
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    className="flex items-center justify-between w-full"
                                    onClick={() => {
                                      const map = document.getElementById('everdice-map-container');
                                      if (map) {
                                        map.style.transform = 'scale(1)';
                                        map.style.left = '0';
                                        map.style.top = '0';
                                      }
                                    }}
                                  >
                                    <Maximize className="h-4 w-4 mr-1" />
                                    Reset View
                                  </Button>
                                  <Button 
                                    variant={isMapFullscreen ? "default" : "outline"}
                                    size="sm"
                                    className="flex items-center justify-between w-full mt-2"
                                    onClick={() => setIsMapFullscreen(!isMapFullscreen)}
                                  >
                                    <Maximize className="h-4 w-4 mr-1" />
                                    {isMapFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                                  </Button>
                                </div>
                                
                                {/* Editing instructions notice */}
                                <div className="absolute bottom-2 left-2 z-10 bg-amber-50 p-2 rounded-md shadow border border-amber-200 max-w-sm">
                                  <div className="text-sm font-semibold mb-1 text-amber-900">Region Editing</div>
                                  <div className="text-xs text-amber-800">
                                    Click on any region marker to edit its name and details. 
                                    <br />Drag the map to explore different areas.
                                  </div>
                                </div>
                                
                                {/* Interactive map with draggable functionality */}
                                <div 
                                  id="everdice-map-container"
                                  className="absolute cursor-move origin-center transition-transform duration-100"
                                  style={{ 
                                    width: "100%", 
                                    height: "100%",
                                  }}
                                  onMouseDown={(e) => {
                                    const map = e.currentTarget;
                                    const startX = e.clientX;
                                    const startY = e.clientY;
                                    const startLeft = map.offsetLeft;
                                    const startTop = map.offsetTop;
                                    
                                    const onMouseMove = (moveEvent: MouseEvent) => {
                                      const dx = moveEvent.clientX - startX;
                                      const dy = moveEvent.clientY - startY;
                                      map.style.left = `${startLeft + dx}px`;
                                      map.style.top = `${startTop + dy}px`;
                                    };
                                    
                                    const onMouseUp = () => {
                                      document.removeEventListener('mousemove', onMouseMove);
                                      document.removeEventListener('mouseup', onMouseUp);
                                    };
                                    
                                    document.addEventListener('mousemove', onMouseMove);
                                    document.addEventListener('mouseup', onMouseUp);
                                  }}
                                >
                                  <img 
                                    src={everdiceWorld?.mapUrl?.startsWith('/') 
                                      ? everdiceWorld.mapUrl 
                                      : (everdiceWorld?.mapUrl || '/assets/placeholder-map.jpg')} 
                                    alt="Everdice World Map" 
                                    className="w-full h-full object-contain"
                                    onError={(e) => {
                                      e.currentTarget.src = '/assets/placeholder-map.jpg';
                                      console.log('Fallback to placeholder map');
                                    }}
                                  />
                                  
                                  {/* Map region markers - highlight campaign regions */}
                                  {campaignRegions && 
                                   campaignRegions.uniqueRegions && 
                                   Array.isArray(campaignRegions.uniqueRegions) && 
                                   campaignRegions.uniqueRegions.length > 0 && 
                                   campaignRegions.uniqueRegions.map((regionName: string, index: number) => {
                                    if (!regionName) return null;
                                    
                                    // Find campaigns in this region
                                    const campaignsInRegion = campaignRegions.campaigns?.filter(
                                      (c: any) => c.regionName === regionName
                                    ) || [];
                                    
                                    // Create a campaign object for display purposes
                                    const campaign = {
                                      id: campaignsInRegion[0]?.id || index + 1,
                                      region: regionName,
                                      name: campaignsInRegion.length > 0 
                                        ? `${campaignsInRegion.length} campaign${campaignsInRegion.length > 1 ? 's' : ''} in ${regionName}`
                                        : `Region: ${regionName}`
                                    };
                                    
                                    return (
                                      <div 
                                        key={`region-${index}`}
                                        className="absolute flex items-center justify-center"
                                        style={{
                                          left: `${Math.random() * 80 + 10}%`,
                                          top: `${Math.random() * 80 + 10}%`,
                                          transform: 'translate(-50%, -50%)'
                                        }}
                                      >
                                        <div 
                                          className="group relative"
                                          onClick={() => {
                                            setSelectedRegion(campaign);
                                            setRegionNameDialog(true);
                                          }}
                                        >
                                          {/* Pulsing region marker */}
                                          <div className="absolute -inset-3 rounded-full bg-primary/30 animate-pulse group-hover:bg-primary/60 transition-all"></div>
                                          <div className="absolute -inset-1 rounded-full bg-amber-400/50 group-hover:bg-amber-400/80"></div>
                                          <button className="relative h-6 w-6 rounded-full bg-amber-600 shadow-md hover:bg-amber-700 transition-colors flex items-center justify-center">
                                            <MapPin className="h-3 w-3 text-white" />
                                          </button>
                                          
                                          {/* Tooltips */}
                                          <div className="absolute opacity-0 group-hover:opacity-100 bottom-8 bg-background/90 shadow-md rounded-md px-3 py-2 text-xs transition-opacity whitespace-nowrap z-20 border border-amber-200">
                                            <div className="font-semibold text-amber-900">{campaign.region || 'Unnamed Region'}</div>
                                            <div className="text-[10px] text-muted-foreground mt-1">
                                              {campaign.name || 'Campaign'} • Click to edit
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                                
                                <div className="absolute bottom-2 right-2 bg-background/80 p-1 px-2 rounded text-xs">
                                  The World of Everdice
                                </div>
                              </div>
                            </div>
                            
                            {/* Region name editing dialog */}
                            <Dialog open={regionNameDialog} onOpenChange={setRegionNameDialog}>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Edit Region</DialogTitle>
                                  <DialogDescription>
                                    Change details for this region of the Everdice world.
                                  </DialogDescription>
                                </DialogHeader>
                                
                                {selectedRegion && (
                                  <div className="space-y-4 py-2">
                                    <div className="space-y-2">
                                      <Label htmlFor="region-name">Region Name</Label>
                                      <Input 
                                        id="region-name"
                                        placeholder="Enter region name" 
                                        value={selectedRegion.region || ''} 
                                        onChange={(e) => setSelectedRegion({
                                          ...selectedRegion,
                                          region: e.target.value
                                        })}
                                      />
                                    </div>
                                    
                                    <div className="space-y-2">
                                      <Label htmlFor="region-description">Region Description</Label>
                                      <Textarea 
                                        id="region-description"
                                        placeholder="Describe this region"
                                        value={selectedRegion.description || ''}
                                        onChange={(e) => setSelectedRegion({
                                          ...selectedRegion,
                                          description: e.target.value
                                        })}
                                        rows={3}
                                      />
                                    </div>
                                    
                                    <div className="space-y-2">
                                      <Label>Connected Campaigns</Label>
                                      <div className="text-sm text-muted-foreground">
                                        {selectedRegion.name || 'This campaign'} is located in this region
                                      </div>
                                    </div>
                                  </div>
                                )}
                                
                                <div className="my-2 p-2 bg-amber-50 rounded-md border border-amber-200">
                                  <div className="flex items-center mb-2">
                                    <MapPin className="h-4 w-4 text-amber-600 mr-2" />
                                    <span className="text-sm font-medium text-amber-900">Region ID: {selectedRegion?.id}</span>
                                  </div>
                                  <p className="text-xs text-amber-800">
                                    Naming regions helps create a consistent world map for all campaigns. 
                                    Region names and descriptions will be visible to players exploring the world.
                                  </p>
                                </div>
                                
                                <DialogFooter>
                                  <Button
                                    variant="outline"
                                    onClick={() => setRegionNameDialog(false)}
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    className="bg-amber-600 hover:bg-amber-700"
                                    onClick={() => {
                                      if (selectedRegion) {
                                        // Save region info
                                        fetch(`/api/admin/update-region`, {
                                          method: 'POST',
                                          headers: {
                                            'Content-Type': 'application/json',
                                          },
                                          body: JSON.stringify({
                                            campaignId: selectedRegion.id,
                                            regionName: selectedRegion.region,
                                            description: selectedRegion.description
                                          })
                                        })
                                        .then(response => {
                                          if (!response.ok) throw new Error('Failed to update region');
                                          return response.json();
                                        })
                                        .then(() => {
                                          toast({
                                            title: 'Region Updated',
                                            description: 'The region information has been saved successfully.'
                                          });
                                          if (refetchCampaignRegions) refetchCampaignRegions();
                                          setRegionNameDialog(false);
                                        })
                                        .catch(error => {
                                          console.error('Error updating region:', error);
                                          toast({
                                            title: 'Error',
                                            description: error.message,
                                            variant: 'destructive'
                                          });
                                        });
                                      }
                                    }}
                                  >
                                    Save Changes
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          </div>
                        ) : (
                          <div className="p-8 rounded-md flex flex-col items-center justify-center h-full">
                            <div className="text-center">
                              <Globe className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                              <p className="text-muted-foreground mb-4">World map not available</p>
                              
                              <Button 
                                onClick={() => {
                                  setIsInitializingWorld(true);
                                  
                                  fetch('/api/admin/initialize-everdice', {
                                    method: 'POST',
                                    headers: {
                                      'Content-Type': 'application/json'
                                    }
                                  })
                                  .then(response => {
                                    if (!response.ok) {
                                      throw new Error('Failed to initialize Everdice world');
                                    }
                                    return response.json();
                                  })
                                  .then(data => {
                                    toast({
                                      title: 'Success!',
                                      description: 'Everdice world initialized successfully.',
                                    });
                                    // Refresh the data
                                    if (refetchEverdiceWorld) refetchEverdiceWorld();
                                    if (refetchCampaignRegions) refetchCampaignRegions();
                                    setIsInitializingWorld(false);
                                  })
                                  .catch(error => {
                                    console.error('Error initializing Everdice world:', error);
                                    toast({
                                      title: 'Error',
                                      description: error.message,
                                      variant: 'destructive',
                                    });
                                    setIsInitializingWorld(false);
                                  });
                                }}
                                disabled={isInitializingWorld}
                              >
                                {isInitializingWorld ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Initializing...
                                  </>
                                ) : (
                                  <>
                                    <MapPin className="mr-2 h-4 w-4" />
                                    Create Everdice World
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div>
                    <h3 className="font-bold text-lg mb-3">Continental Regions</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {everdiceWorld.continents?.map((continent: any, index: number) => (
                        <Card key={index}>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-base">{continent.name}</CardTitle>
                            <CardDescription>{continent.climate || "Varied climate"}</CardDescription>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <p className="text-sm text-muted-foreground">
                              {campaignRegions && Array.isArray(campaignRegions.uniqueRegions) && Array.isArray(continent.regions) ? 
                                `${campaignRegions.uniqueRegions.filter((regionName: string) => 
                                  regionName && continent.regions.some((r: any) => r.name === regionName)).length || 0} active regions` :
                                "0 active regions"}
                            </p>
                            {continent.regions && continent.regions.length > 0 && (
                              <div className="mt-2">
                                <Collapsible>
                                  <CollapsibleTrigger asChild>
                                    <Button variant="ghost" size="sm" className="p-0 h-auto text-xs text-muted-foreground flex items-center">
                                      <ChevronsUpDown className="h-3 w-3 mr-1" />
                                      {continent.regions.length} regions
                                    </Button>
                                  </CollapsibleTrigger>
                                  <CollapsibleContent>
                                    <ul className="text-xs space-y-1 mt-1 text-muted-foreground">
                                      {continent.regions.map((region: any, i: number) => (
                                        <li key={i} className="flex items-center">
                                          <span className={campaignRegions && 
                                            Array.isArray(campaignRegions.uniqueRegions) && 
                                            campaignRegions.uniqueRegions.includes(region.name) ? 
                                            "text-amber-700 font-medium" : ""}>
                                            {region.name}
                                          </span>
                                          {campaignRegions && 
                                            Array.isArray(campaignRegions.uniqueRegions) && 
                                            campaignRegions.uniqueRegions.includes(region.name) && (
                                            <Badge variant="outline" className="ml-2 h-5 text-[10px]">
                                              Active
                                            </Badge>
                                          )}
                                        </li>
                                      ))}
                                    </ul>
                                  </CollapsibleContent>
                                </Collapsible>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="logins">
          <Card>
            <CardHeader>
              <CardTitle>Login Activity</CardTitle>
              <CardDescription>
                Track user login patterns and activity across the realm.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingLoginActivity ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : loginActivity?.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">
                  No login activity recorded yet.
                </p>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Active Today</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="text-3xl font-bold">
                          {loginActivity?.filter((login: any) => {
                            const loginDate = new Date(login.timestamp);
                            const today = new Date();
                            return loginDate.getDate() === today.getDate() &&
                                   loginDate.getMonth() === today.getMonth() &&
                                   loginDate.getFullYear() === today.getFullYear();
                          }).length || 0}
                        </div>
                        <p className="text-sm text-muted-foreground">Users logged in today</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Weekly Users</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="text-3xl font-bold">
                          {loginActivity?.filter((login: any) => {
                            const loginDate = new Date(login.timestamp);
                            const weekAgo = new Date();
                            weekAgo.setDate(weekAgo.getDate() - 7);
                            return loginDate >= weekAgo;
                          }).length || 0}
                        </div>
                        <p className="text-sm text-muted-foreground">Users active this week</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Total Sessions</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="text-3xl font-bold">
                          {loginActivity?.length || 0}
                        </div>
                        <p className="text-sm text-muted-foreground">Total login sessions</p>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Login Time</TableHead>
                        <TableHead>Session Duration</TableHead>
                        <TableHead>IP Address</TableHead>
                        <TableHead>Platform</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loginActivity?.slice(0, 10).map((login: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">
                            {login.username || `User ${login.userId}`}
                          </TableCell>
                          <TableCell>
                            {new Date(login.timestamp).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            {login.duration ? `${Math.round(login.duration / 60)} minutes` : 'Active'}
                          </TableCell>
                          <TableCell>
                            <span className="text-sm font-mono">
                              {login.ipAddress?.replace(/(\d+\.\d+)\.\d+\.\d+/, '$1.**.***') || 'Unknown'}
                            </span>
                          </TableCell>
                          <TableCell>
                            {login.platform || 'Unknown'}
                          </TableCell>
                          <TableCell>
                            {login.active ? (
                              <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">
                                Active
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-slate-500">
                                Logged Out
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  
                  {loginActivity && loginActivity.length > 10 && (
                    <div className="text-center text-sm text-muted-foreground">
                      Showing 10 of {loginActivity.length} login records
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="messages">
          <Card>
            <CardHeader>
              <CardTitle>Message Center</CardTitle>
              <CardDescription>
                Send messages to any user in the realm. Your messages appear as official DM communications.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-bold mb-2">Select a user to message:</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {users.slice(0, 6).map((user: any) => (
                      <Button 
                        key={user.id}
                        variant="outline"
                        className="h-auto py-3 justify-start"
                        onClick={() => openMessageDialog(user)}
                      >
                        <UserIcon className="h-4 w-4 mr-2" />
                        <div className="text-left">
                          <div className="font-medium">{user.username}</div>
                          <div className="text-xs text-muted-foreground">ID: {user.id}</div>
                        </div>
                      </Button>
                    ))}
                  </div>
                  {users.length > 6 && (
                    <p className="text-sm text-muted-foreground mt-2">
                      + {users.length - 6} more users. Use the Users tab to see all users.
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send message to {selectedUser?.username}</DialogTitle>
            <DialogDescription>
              This message will be delivered as an official Dungeon Master communication.
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
              <Label htmlFor="content">Message</Label>
              <Textarea
                id="content"
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
              Only you, as the superuser, can grant admin privileges.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mb-4">
              <div className="flex">
                <Shield className="h-5 w-5 text-amber-600 mr-2 mt-0.5" />
                <div>
                  <h4 className="font-medium text-amber-900">Important Note</h4>
                  <p className="text-amber-800 text-sm">
                    Admin privileges should only be granted to trusted individuals. 
                    Admins will have management rights but cannot promote others to admin or superuser.
                    Only KoeppyLoco the Weird (you) can hold superuser powers in the realm.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsPromoteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="default"
              onClick={handlePromoteUser}
              disabled={promoteUserLoading}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {promoteUserLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Promote to Admin
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;