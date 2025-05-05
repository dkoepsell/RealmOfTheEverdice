import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { FriendsList } from "@/components/friends-list";
import { CampaignInvitations } from "@/components/campaign-invitations";
import { OnlineStatusSelector } from "@/components/online-status-selector";
import Navbar from "@/components/navbar";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useCampaignInvitations } from "@/hooks/use-campaign-invitations";
import { Users, Bell, UserCircle } from "lucide-react";

export default function SocialPage() {
  const { user } = useAuth();
  const { pendingInvitations } = useCampaignInvitations();
  
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <div className="flex-grow container max-w-screen-lg mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Social</h1>
          <OnlineStatusSelector />
        </div>
      
        <div className="grid gap-6 md:grid-cols-[1fr_400px]">
          <Tabs defaultValue="friends" className="space-y-6">
            <TabsList>
              <TabsTrigger value="friends" className="flex gap-2">
                <Users className="h-4 w-4" />
                <span>Friends</span>
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex gap-2">
                <Bell className="h-4 w-4" />
                <span>Notifications</span>
                {pendingInvitations.length > 0 && (
                  <Badge variant="destructive" className="ml-1">
                    {pendingInvitations.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="friends">
              <FriendsList />
            </TabsContent>
            
            <TabsContent value="notifications">
              {pendingInvitations.length > 0 ? (
                <CampaignInvitations />
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Notifications</CardTitle>
                    <CardDescription>
                      You'll see campaign invitations and other notifications here
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground">
                    <Bell className="h-12 w-12 mb-2" />
                    <p>No pending notifications</p>
                    <p className="text-sm">When someone invites you to a campaign, you'll see it here</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
          
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCircle className="h-5 w-5" />
                  Profile
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Username</h3>
                    <p>{user.username}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">User ID</h3>
                    <p>#{user.id}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Member Since</h3>
                    <p>{user.createdAt ? new Date(user.createdAt as Date).toLocaleDateString() : 'N/A'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>D&D Quick Tips</CardTitle>
                <CardDescription>Helpful reminders for your adventures</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 text-sm">
                  <div>
                    <h3 className="font-medium">Making Ability Checks</h3>
                    <p className="text-muted-foreground">
                      Roll a d20, add your ability modifier and proficiency (if applicable).
                    </p>
                  </div>
                  <Separator />
                  <div>
                    <h3 className="font-medium">Combat Actions</h3>
                    <p className="text-muted-foreground">
                      You can take one action, one bonus action, and movement on your turn.
                    </p>
                  </div>
                  <Separator />
                  <div>
                    <h3 className="font-medium">Spell Slots</h3>
                    <p className="text-muted-foreground">
                      Spell slots are consumed when casting spells of 1st level or higher.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}