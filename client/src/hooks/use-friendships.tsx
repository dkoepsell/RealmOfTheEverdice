import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Friendship } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function useFriendships() {
  const { toast } = useToast();
  const [searchUsername, setSearchUsername] = useState("");
  
  // Get friendships
  const { 
    data: friendships = [], 
    isLoading: isLoadingFriendships,
    error: friendshipsError
  } = useQuery({
    queryKey: ["/api/friends"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/friends");
      return await res.json() as Friendship[];
    }
  });

  // Get pending friend requests (where user is the recipient)
  const pendingRequests = friendships.filter(f => 
    f.status === "pending" && f.friendId === (queryClient.getQueryData(["/api/user"]) as any)?.id
  );

  // Get accepted friendships
  const acceptedFriendships = friendships.filter(f => f.status === "accepted");

  // Send friend request
  const sendRequestMutation = useMutation({
    mutationFn: async (friendId: number) => {
      const res = await apiRequest("POST", "/api/friends", { friendId });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Friend request sent",
        description: "Your friend request has been sent successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/friends"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send friend request",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Accept friend request
  const acceptRequestMutation = useMutation({
    mutationFn: async (friendId: number) => {
      const res = await apiRequest("PUT", `/api/friends/${friendId}`, { status: "accepted" });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Friend request accepted",
        description: "You are now friends!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/friends"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to accept friend request",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Reject friend request
  const rejectRequestMutation = useMutation({
    mutationFn: async (friendId: number) => {
      const res = await apiRequest("PUT", `/api/friends/${friendId}`, { status: "rejected" });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Friend request rejected",
        description: "The friend request has been rejected.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/friends"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to reject friend request",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Remove friend
  const removeFriendMutation = useMutation({
    mutationFn: async (friendId: number) => {
      await apiRequest("DELETE", `/api/friends/${friendId}`);
    },
    onSuccess: () => {
      toast({
        title: "Friend removed",
        description: "The friend has been removed from your friends list.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/friends"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to remove friend",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Search users (this would need a proper API endpoint, using a placeholder for now)
  const searchUsers = async () => {
    // This would be replaced with an actual API call to search users
    toast({
      title: "User search",
      description: "This functionality will be implemented in a future update.",
    });
  };

  return {
    friendships,
    isLoadingFriendships,
    friendshipsError,
    pendingRequests,
    acceptedFriendships,
    searchUsername,
    setSearchUsername,
    searchUsers,
    sendRequestMutation,
    acceptRequestMutation,
    rejectRequestMutation,
    removeFriendMutation,
  };
}