import React, { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useAdmin } from "@/hooks/use-admin";
import { Redirect } from "wouter";
import {
  Card,
  CardContent,
  CardDescription,
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
import { Loader2, UserIcon, MessageSquare, BarChart, Shield } from "lucide-react";

const AdminDashboard = () => {
  const { user } = useAuth();
  const { 
    isSuperuser, 
    users, 
    isLoadingUsers, 
    stats, 
    isLoadingStats, 
    sendMessage,
    promoteUser,
    promoteUserLoading
  } = useAdmin();
  
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [messageSubject, setMessageSubject] = useState("");
  const [messageContent, setMessageContent] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPromoteDialogOpen, setIsPromoteDialogOpen] = useState(false);
  
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
      <div className="flex items-center mb-6">
        <Shield className="h-8 w-8 mr-2 text-amber-600" />
        <h1 className="text-3xl font-bold">Dungeon Master's Admin Console</h1>
      </div>
      
      <p className="text-muted-foreground mb-6">
        Welcome KoeppyLoco the Weird, your superuser powers allow you to monitor and manage the entire realm.
      </p>
      
      <Tabs defaultValue="users">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="users" className="flex items-center">
            <UserIcon className="h-4 w-4 mr-2" />
            Users
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex items-center">
            <BarChart className="h-4 w-4 mr-2" />
            System Stats
          </TabsTrigger>
          <TabsTrigger value="messages" className="flex items-center">
            <MessageSquare className="h-4 w-4 mr-2" />
            Message Center
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