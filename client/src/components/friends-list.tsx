import { useState } from "react";
import { useFriendships } from "@/hooks/use-friendships";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { useAuth } from "@/hooks/use-auth";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { UserCircle, UserPlus, UserX, Search, CheckCircle, XCircle } from "lucide-react";
import { queryClient } from "@/lib/queryClient";

export const FriendsList = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [addFriendDialogOpen, setAddFriendDialogOpen] = useState(false);
  const [friendIdToAdd, setFriendIdToAdd] = useState<string>("");

  const {
    friendships,
    isLoadingFriendships,
    pendingRequests,
    acceptedFriendships,
    sendRequestMutation,
    acceptRequestMutation,
    rejectRequestMutation,
    removeFriendMutation,
  } = useFriendships();

  const {
    isUserOnline,
    getUserStatus
  } = useOnlineStatus();

  const handleSendFriendRequest = async () => {
    if (!friendIdToAdd) {
      toast({
        title: "Error",
        description: "Please enter a friend ID",
        variant: "destructive",
      });
      return;
    }

    try {
      await sendRequestMutation.mutateAsync(parseInt(friendIdToAdd));
      setAddFriendDialogOpen(false);
      setFriendIdToAdd("");
    } catch (error) {
      console.error("Failed to send friend request:", error);
    }
  };

  const handleAcceptRequest = async (userId: number) => {
    try {
      await acceptRequestMutation.mutateAsync(userId);
    } catch (error) {
      console.error("Failed to accept friend request:", error);
    }
  };

  const handleRejectRequest = async (userId: number) => {
    try {
      await rejectRequestMutation.mutateAsync(userId);
    } catch (error) {
      console.error("Failed to reject friend request:", error);
    }
  };

  const handleRemoveFriend = async (userId: number) => {
    try {
      await removeFriendMutation.mutateAsync(userId);
    } catch (error) {
      console.error("Failed to remove friend:", error);
    }
  };

  const getStatusColor = (userId: number) => {
    const status = getUserStatus(userId);
    switch (status) {
      case "online":
        return "bg-green-500";
      case "away":
        return "bg-yellow-500";
      case "busy":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusText = (userId: number) => {
    const status = getUserStatus(userId);
    switch (status) {
      case "online":
        return "Online";
      case "away":
        return "Away";
      case "busy":
        return "Busy";
      default:
        return "Offline";
    }
  };

  if (isLoadingFriendships) {
    return <div className="p-4">Loading friends...</div>;
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Friends</span>
          <Dialog open={addFriendDialogOpen} onOpenChange={setAddFriendDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <UserPlus className="mr-2 h-4 w-4" />
                Add Friend
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Friend</DialogTitle>
                <DialogDescription>
                  Enter the ID of the friend you want to add. They will receive a friend request.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="flex items-center gap-4">
                  <Input
                    placeholder="Friend ID"
                    value={friendIdToAdd}
                    onChange={(e) => setFriendIdToAdd(e.target.value)}
                    type="number"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button 
                  onClick={handleSendFriendRequest}
                  disabled={sendRequestMutation.isPending}
                >
                  {sendRequestMutation.isPending ? "Sending..." : "Send Request"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardTitle>
        <CardDescription>Manage your friends and requests</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="friends">
          <TabsList className="mb-4">
            <TabsTrigger value="friends">
              Friends
              {acceptedFriendships.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {acceptedFriendships.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="requests">
              Requests
              {pendingRequests.length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {pendingRequests.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="friends">
            {acceptedFriendships.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <UserCircle className="mx-auto h-12 w-12 mb-2" />
                <p>No friends yet</p>
                <p className="text-sm">Add friends to see them here</p>
              </div>
            ) : (
              <div className="space-y-2">
                {acceptedFriendships.map((friendship) => {
                  const friendId = friendship.userId === user?.id 
                    ? friendship.friendId 
                    : friendship.userId;
                  
                  return (
                    <div 
                      key={friendship.id} 
                      className="flex items-center justify-between p-2 rounded-md border"
                    >
                      <div className="flex items-center gap-2">
                        <div className={`h-3 w-3 rounded-full ${getStatusColor(friendId)}`} />
                        <span>{`Friend #${friendId}`}</span>
                        <Badge variant="outline">{getStatusText(friendId)}</Badge>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="ghost">
                            <UserX className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remove Friend</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to remove this friend? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleRemoveFriend(friendId)}
                              className="bg-destructive text-destructive-foreground"
                            >
                              Remove
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="requests">
            {pendingRequests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <UserCircle className="mx-auto h-12 w-12 mb-2" />
                <p>No pending requests</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingRequests.map((request) => (
                  <div 
                    key={request.id} 
                    className="flex items-center justify-between p-3 rounded-md border"
                  >
                    <div>
                      <p className="font-medium">{`User #${request.userId}`}</p>
                      <p className="text-sm text-muted-foreground">Sent you a friend request</p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleAcceptRequest(request.userId)}
                        disabled={acceptRequestMutation.isPending}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Accept
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleRejectRequest(request.userId)}
                        disabled={rejectRequestMutation.isPending}
                        className="text-destructive"
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};