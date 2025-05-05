import { useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { UserSession } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export type OnlineStatus = "online" | "away" | "busy" | "offline";

export function useOnlineStatus() {
  const { toast } = useToast();
  
  // Get all online users
  const { 
    data: onlineUsers = [], 
    isLoading: isLoadingOnlineUsers,
    error: onlineUsersError,
    refetch: refetchOnlineUsers
  } = useQuery({
    queryKey: ["/api/users/online"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/users/online");
      return await res.json() as UserSession[];
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Update user's own status
  const updateStatusMutation = useMutation({
    mutationFn: async (status: OnlineStatus) => {
      const res = await apiRequest("POST", "/api/users/status", { status });
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/online"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update status",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update user status to online on initial load
  useEffect(() => {
    const user = queryClient.getQueryData(["/api/user"]);
    if (user) {
      const updateOnlineStatus = async () => {
        try {
          await updateStatusMutation.mutateAsync("online");
        } catch (error) {
          console.error("Failed to set initial online status:", error);
        }
      };
      
      updateOnlineStatus();
      
      // Set up event listeners for user activity/inactivity
      let activityTimeout: NodeJS.Timeout | null = null;
      
      const resetActivityTimer = () => {
        if (activityTimeout) {
          clearTimeout(activityTimeout);
        }
        
        activityTimeout = setTimeout(() => {
          updateStatusMutation.mutate("away");
        }, 5 * 60 * 1000); // 5 minutes of inactivity sets status to away
      };
      
      // Add activity event listeners
      const activityEvents = ["mousedown", "keydown", "touchstart", "scroll"];
      activityEvents.forEach(event => {
        window.addEventListener(event, resetActivityTimer);
      });
      
      // Set up beforeunload handler to update status to offline
      const handleBeforeUnload = () => {
        // Using a synchronous fetch to try to update status before page unload
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/api/users/status", false); // false for synchronous
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.send(JSON.stringify({ status: "offline" }));
      };
      
      window.addEventListener("beforeunload", handleBeforeUnload);
      
      // Start initial activity timer
      resetActivityTimer();
      
      // Clean up
      return () => {
        if (activityTimeout) {
          clearTimeout(activityTimeout);
        }
        activityEvents.forEach(event => {
          window.removeEventListener(event, resetActivityTimer);
        });
        window.removeEventListener("beforeunload", handleBeforeUnload);
      };
    }
  }, []);

  // Get current user's status
  const currentUserSession = onlineUsers.find(session => 
    session.userId === (queryClient.getQueryData(["/api/user"]) as any)?.id
  );
  
  const currentStatus = currentUserSession?.status as OnlineStatus || "offline";

  // Check if a specific user is online
  const isUserOnline = (userId: number) => {
    return onlineUsers.some(session => 
      session.userId === userId && 
      (session.status === "online" || session.status === "away" || session.status === "busy")
    );
  };

  // Get a specific user's status
  const getUserStatus = (userId: number): OnlineStatus => {
    const session = onlineUsers.find(session => session.userId === userId);
    return (session?.status as OnlineStatus) || "offline";
  };

  return {
    onlineUsers,
    isLoadingOnlineUsers,
    onlineUsersError,
    refetchOnlineUsers,
    updateStatusMutation,
    currentStatus,
    isUserOnline,
    getUserStatus
  };
}