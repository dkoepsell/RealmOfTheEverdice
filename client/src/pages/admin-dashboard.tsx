import React, { useState, useEffect, useRef } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

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
import { Loader2, Send, User, Shield, Users, Settings, Mail, MapPin, Plus } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useAdmin } from "@/hooks/use-admin";

export default function AdminDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const {
    users,
    usersLoading,
    systemStats,
    statsLoading,
    messagesForUser,
    messagesLoading,
    sendUserMessage,
    setUserRole,
    regenerateWorldMap,
    everdiceWorld,
    everdiceWorldLoading,
    getCampaignRegions,
    campaignRegions,
    campaignsWithRegions,
    isLoadingRegions,
  } = useAdmin();

  const [activeTab, setActiveTab] = useState("overview");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPromoteDialogOpen, setIsPromoteDialogOpen] = useState(false);
  const [messageSubject, setMessageSubject] = useState("");
  const [messageContent, setMessageContent] = useState("");
  const [worldLoading, setWorldLoading] = useState(false);

  // Regenerate world map
  const handleRegenerateWorld = async () => {
    if (!user?.isSuperAdmin) {
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

  // Send message to user
  const handleSendMessage = async () => {
    if (!selectedUser || !messageSubject || !messageContent) return;
    
    try {
      await sendUserMessage({
        userId: selectedUser.id,
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
  const [promoteUserLoading, setPromoteUserLoading] = useState(false);
  
  const handlePromoteUser = async () => {
    if (!selectedUser) return;
    
    if (!user?.isSuperAdmin) {
      toast({
        title: "Permission Denied",
        description: "Only superadmins can promote users to admin.",
        variant: "destructive"
      });
      return;
    }
    
    setPromoteUserLoading(true);
    
    try {
      await setUserRole(selectedUser.id, "admin");
      
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
    } finally {
      setPromoteUserLoading(false);
    }
  };

  if (!user?.isAdmin && !user?.isSuperAdmin) {
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
      <h1 className="text-3xl font-bold mb-8 bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">Admin Dashboard</h1>
      
      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-5 mb-8 w-full max-w-3xl">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="worldmap">World Map</TabsTrigger>
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
                  {usersLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : users.length}
                </div>
                <div className="text-sm text-muted-foreground">
                  {usersLoading ? (
                    <Loader2 className="h-3 w-3 animate-spin inline mr-2" />
                  ) : (
                    <>
                      <span className="font-medium">{users.filter(u => u.role === "admin").length}</span> admins
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
                {statsLoading ? (
                  <div className="flex justify-center">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    {systemStats.slice(0, 3).map((stat, i) => (
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
                  {user?.isSuperAdmin && (
                    <div>
                      <Button 
                        className="w-full justify-start" 
                        variant="outline"
                        onClick={handleRegenerateWorld}
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
                    {usersLoading ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center">
                          <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                        </TableCell>
                      </TableRow>
                    ) : (
                      users.slice(0, 6).map((user) => (
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
                              {user.role !== "admin" && user?.isSuperAdmin && (
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
                
                {!usersLoading && users.length > 6 && (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    + {users.length - 6} more users. Use the Users tab to see all users.
                  </div>
                )}
              </CardContent>
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
              disabled={promoteUserLoading}
            >
              {promoteUserLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Promote to Admin
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}