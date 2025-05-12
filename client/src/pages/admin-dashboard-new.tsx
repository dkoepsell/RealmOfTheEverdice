import React, { useState } from "react";
import { Link } from "wouter";
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Loader2, User, Users, Shield, BarChart, Settings, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useAdmin } from "@/hooks/use-admin";
import { useToast } from "@/hooks/use-toast";

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
  } = useAdmin();

  const [activeTab, setActiveTab] = useState("overview");

  if (!isAdmin && !isSuperAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Shield className="h-16 w-16 text-gray-400 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Admin Access Required</h1>
        <p className="text-center text-muted-foreground mb-6">
          You need administrator privileges to access this page.
        </p>
        <Button asChild>
          <Link href="/">Return to Homepage</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center mb-8">
        <Button variant="ghost" size="sm" asChild className="mr-4">
          <Link href="/">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to App
          </Link>
        </Button>
        
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Manage Realm of Everdice settings, users, and campaigns
          </p>
        </div>
      </div>
      
      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 mb-8 w-full max-w-4xl">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-3 mb-4">
              <CardHeader>
                <CardTitle className="text-3xl">Welcome to Admin Dashboard</CardTitle>
                <CardDescription className="text-lg">
                  Manage your Everdice platform, users, and system settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Use this dashboard to manage all aspects of the Realm of Everdice platform. You can view user statistics, 
                  manage campaigns, and configure system settings.
                </p>
              </CardContent>
            </Card>

            {/* Stats Card: Users */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center text-lg">
                  <Users className="h-5 w-5 mr-2 text-primary" />
                  User Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingStats ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Total Users</span>
                      <span className="font-bold">{stats?.userCount || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Active Users (30d)</span>
                      <span className="font-bold">{stats?.activeUserCount || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">New Users (7d)</span>
                      <span className="font-bold">{stats?.newUserCount || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Admins</span>
                      <span className="font-bold">{stats?.adminCount || 0}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Stats Card: Characters */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center text-lg">
                  <User className="h-5 w-5 mr-2 text-primary" />
                  Character Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingStats ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Total Characters</span>
                      <span className="font-bold">{stats?.characterCount || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Average Level</span>
                      <span className="font-bold">{stats?.averageCharacterLevel || 1}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Most Popular Race</span>
                      <span className="font-bold">{stats?.mostPopularRace || "Human"}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Most Popular Class</span>
                      <span className="font-bold">{stats?.mostPopularClass || "Fighter"}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Stats Card: Campaigns */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center text-lg">
                  <BarChart className="h-5 w-5 mr-2 text-primary" />
                  Campaign Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingStats ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Total Campaigns</span>
                      <span className="font-bold">{stats?.campaignCount || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Active Campaigns</span>
                      <span className="font-bold">{stats?.activeCampaignCount || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Average Party Size</span>
                      <span className="font-bold">{stats?.averagePartySize || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Total Game Logs</span>
                      <span className="font-bold">{stats?.totalGameLogs || 0}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users">
          <div className="bg-white p-6 rounded-lg">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">User Management</h2>
              {isLoadingUsers && <Loader2 className="h-6 w-6 animate-spin text-primary" />}
            </div>
            
            {isLoadingUsers ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="relative overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Campaigns</TableHead>
                      <TableHead>Characters</TableHead>
                      <TableHead>Last Login</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users && users.length > 0 ? (
                      users.map(user => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback>{user.username.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <div>{user.username}</div>
                                <div className="text-xs text-muted-foreground">{user.email}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {user.isSuperAdmin ? (
                              <Badge>Super Admin</Badge>
                            ) : user.isAdmin ? (
                              <Badge variant="outline">Admin</Badge>
                            ) : (
                              <span className="text-muted-foreground text-sm">User</span>
                            )}
                          </TableCell>
                          <TableCell>{user.campaignCount || 0}</TableCell>
                          <TableCell>{user.characterCount || 0}</TableCell>
                          <TableCell>{user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                // View user details or perform actions
                              }}
                            >
                              <User className="h-4 w-4" />
                              <span className="sr-only">View User</span>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                          No users found in the system
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
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
                    {loginActivity && loginActivity.length > 0 ? (
                      loginActivity.map((activity, index) => (
                        <div key={index} className="flex items-start space-x-3 pb-3 border-b">
                          <div className="bg-primary/10 p-2 rounded-full">
                            <User className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium">{activity.username || 'Unknown user'}</div>
                            <div className="text-sm text-muted-foreground">{activity.action}</div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(activity.timestamp).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4 text-muted-foreground">
                        No recent system activity
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Health</CardTitle>
                <CardDescription>
                  Current system status and metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Environment</span>
                    <Badge variant="outline">Production</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Database Status</span>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      Connected
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">API Status</span>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      Operational
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Server Time</span>
                    <span className="text-sm">{new Date().toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">API Version</span>
                    <span className="text-sm">1.0.0</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings">
          <div className="bg-white p-6 rounded-lg">
            <h2 className="text-2xl font-bold mb-6">System Settings</h2>
            <Card>
              <CardHeader>
                <CardTitle>Application Settings</CardTitle>
                <CardDescription>
                  Configure global application settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-lg font-medium mb-2">Authentication</h3>
                      <p className="text-muted-foreground text-sm mb-4">
                        Session and login settings
                      </p>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span>Session Timeout</span>
                          <span>24 hours</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Maximum Login Attempts</span>
                          <span>5</span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium mb-2">AI Configuration</h3>
                      <p className="text-muted-foreground text-sm mb-4">
                        OpenAI integration settings
                      </p>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span>AI Model</span>
                          <Badge>GPT-4o</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>AI Temperature</span>
                          <span>0.7</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}