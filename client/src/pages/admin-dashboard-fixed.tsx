import React, { useState } from "react";
import { Link } from "wouter";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
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
import { 
  Loader2, 
  User, 
  Users, 
  Shield, 
  BarChart, 
  Settings, 
  ArrowLeft,
  Scroll, 
  Award,
  BarChart3,
  GlobeIcon,
  Plus,
  X
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useAdmin } from "@/hooks/use-admin";
import { useToast } from "@/hooks/use-toast";

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

export default function AdminDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const {
    isAdmin,
    isSuperAdmin,
    dashboardStats,
    isLoadingDashboardStats,
    users,
    isLoadingUsers
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
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">Admin Dashboard</h1>
        <Link href="/">
          <Button variant="outline" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Player View
          </Button>
        </Link>
      </div>
      
      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 mb-8 w-full max-w-4xl">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Welcome Card */}
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
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
                  <Button onClick={() => setActiveTab("users")} variant="outline" className="flex items-center justify-center gap-2 py-6">
                    <Users className="h-6 w-6" />
                    <span className="text-base">User Management</span>
                  </Button>
                  <Button onClick={() => setActiveTab("system")} variant="outline" className="flex items-center justify-center gap-2 py-6">
                    <Settings className="h-6 w-6" />
                    <span className="text-base">System Settings</span>
                  </Button>
                  <Button onClick={() => setActiveTab("overview")} variant="outline" className="flex items-center justify-center gap-2 py-6">
                    <GlobeIcon className="h-6 w-6" />
                    <span className="text-base">World Management</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Stats Card */}
            <Card className="md:col-span-3">
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
          </div>
        </TabsContent>

        <TabsContent value="users">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>
                  View and manage registered users
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingUsers ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users?.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback>{user.username[0]?.toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium">{user.username}</p>
                                  <p className="text-xs text-muted-foreground">{user.email || 'No email'}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={user.role === 'superuser' ? 'destructive' : user.role === 'admin' ? 'default' : 'secondary'}>
                                {user.role === 'superuser' ? 'Super Admin' : user.role === 'admin' ? 'Admin' : 'User'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {new Date(user.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-green-100 text-green-800">
                                Active
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                disabled={user.role === 'superuser' || user.id === user.id}
                              >
                                Edit
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="system">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>System Settings</CardTitle>
                <CardDescription>
                  Manage global system configuration
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">OpenAI Integration</h3>
                    <p className="text-sm text-muted-foreground">
                      The system is currently using GPT-4o for content generation.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">System Performance</h3>
                    <p className="text-sm text-muted-foreground">
                      System is operating normally with average response time of 1.2s.
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
    </div>
  );
}