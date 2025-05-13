import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "./use-auth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "./use-toast";
import { useState } from "react";

// Define types for the analytics data
interface DashboardStats {
  totalUsers: number;
  newUsersLast30Days: number;
  totalCampaigns: number;
  activeCampaigns: number;
  totalCharacters: number;
  totalNpcs: number;
  totalAdventures: number;
  totalGameLogs: number;
  averageLogsPerCampaign: number;
  totalAiDmCampaigns: number;
  totalHumanDmCampaigns: number;
  messageCount: number;
  averageMessagesPerCampaign: number;
}

interface UserLoginStats {
  dailyLogins: { date: string; count: number }[];
  activeUsers: { timeframe: string; count: number }[];
  returnRate: number;
}

interface CampaignActivityStats {
  campaignCreationsByDay: { date: string; count: number }[];
  mostActiveCampaigns: { id: number; name: string; dmId: number; logCount: number }[];
  campaignsByStatus: { status: string; count: number }[];
  campaignStatusDistribution: {
    active: number;
    completed: number;
    onHold: number;
  };
  averageMessagesPerCampaign: number;
}

export function useAdmin() {
  const { user } = useAuth();
  const { toast } = useToast();
  const isSuperAdmin = user?.isSuperAdmin;
  const isAdmin = user?.isAdmin;
  
  // State for world management
  const [selectedWorldId, setSelectedWorldId] = useState<number | null>(null);
  
  // Get dashboard stats
  const {
    data: dashboardStats,
    isLoading: isLoadingDashboardStats,
    error: dashboardStatsError
  } = useQuery<DashboardStats, Error>({
    queryKey: ["/api/admin/dashboard-stats"],
    queryFn: async () => {
      if (!isAdmin && !isSuperAdmin) throw new Error("Unauthorized");
      const res = await apiRequest("GET", "/api/admin/dashboard-stats");
      return await res.json();
    },
    enabled: !!(isAdmin || isSuperAdmin)
  });
  
  // Get user login stats
  const {
    data: userLoginStats,
    isLoading: isLoadingUserLoginStats,
    error: userLoginStatsError
  } = useQuery<UserLoginStats, Error>({
    queryKey: ["/api/admin/user-login-stats"],
    queryFn: async () => {
      if (!isAdmin && !isSuperAdmin) throw new Error("Unauthorized");
      const res = await apiRequest("GET", "/api/admin/user-login-stats");
      return await res.json();
    },
    enabled: !!(isAdmin || isSuperAdmin)
  });
  
  // Get campaign activity stats
  const {
    data: campaignActivityStats,
    isLoading: isLoadingCampaignActivityStats,
    error: campaignActivityStatsError
  } = useQuery<CampaignActivityStats, Error>({
    queryKey: ["/api/admin/campaign-activity-stats"],
    queryFn: async () => {
      if (!isAdmin && !isSuperAdmin) throw new Error("Unauthorized");
      const res = await apiRequest("GET", "/api/admin/campaign-activity-stats");
      return await res.json();
    },
    enabled: !!(isAdmin || isSuperAdmin)
  });

  // Get all users
  const {
    data: users = [],
    isLoading: isLoadingUsers,
    error: usersError,
  } = useQuery({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      if (!isAdmin && !isSuperAdmin) return [];
      const res = await apiRequest("GET", "/api/admin/users");
      return await res.json();
    },
    enabled: !!(isAdmin || isSuperAdmin)
  });

  // Get system stats
  const {
    data: stats = [],
    isLoading: isLoadingStats,
    error: statsError,
  } = useQuery({
    queryKey: ["/api/admin/stats"],
    queryFn: async () => {
      if (!isAdmin) return [];
      const res = await apiRequest("GET", "/api/admin/stats");
      return await res.json();
    },
    enabled: !!isAdmin,
  });
  
  // Get all campaigns
  const {
    data: campaigns = [],
    isLoading: isLoadingCampaigns,
    error: campaignsError,
  } = useQuery({
    queryKey: ["/api/admin/campaigns"],
    queryFn: async () => {
      if (!isAdmin) return [];
      const res = await apiRequest("GET", "/api/admin/campaigns");
      return await res.json();
    },
    enabled: !!isAdmin,
  });
  
  // Get unique login activity
  const {
    data: loginActivity = [],
    isLoading: isLoadingLoginActivity,
    error: loginActivityError,
  } = useQuery({
    queryKey: ["/api/admin/logins"],
    queryFn: async () => {
      if (!isAdmin) return [];
      const res = await apiRequest("GET", "/api/admin/logins");
      return await res.json();
    },
    enabled: !!isAdmin,
  });
  
  // Get Everdice world map data
  const {
    data: everdiceWorld,
    isLoading: isLoadingEverdiceWorld,
    error: everdiceWorldError,
    refetch: refetchEverdiceWorld
  } = useQuery({
    queryKey: ["/api/everdice/world"],
    queryFn: async () => {
      if (!isAdmin && !isSuperAdmin) return null;
      try {
        const res = await apiRequest("GET", "/api/everdice/world");
        if (!res.ok) {
          console.error("Error fetching Everdice world map:", res.status, res.statusText);
          return null;
        }
        const data = await res.json();
        console.log("Everdice world data received:", data);
        return data;
      } catch (error) {
        console.error("Exception fetching Everdice world:", error);
        return null;
      }
    },
    enabled: !!(isAdmin || isSuperAdmin),
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
  });
  
  // Get all campaign regions within Everdice
  const {
    data: campaignRegions,
    isLoading: isLoadingCampaignRegions,
    error: campaignRegionsError,
    refetch: refetchCampaignRegions
  } = useQuery({
    queryKey: ["/api/admin/campaign-regions"],
    queryFn: async () => {
      if (!isAdmin && !isSuperAdmin) return { campaigns: [], uniqueRegions: [] };
      try {
        const res = await apiRequest("GET", "/api/admin/campaign-regions");
        if (!res.ok) {
          console.error("Error fetching campaign regions:", res.status, res.statusText);
          return { campaigns: [], uniqueRegions: [] };
        }
        const data = await res.json();
        console.log("Campaign regions data received:", data);
        return data;
      } catch (error) {
        console.error("Exception fetching campaign regions:", error);
        return { campaigns: [], uniqueRegions: [] };
      }
    },
    enabled: !!(isAdmin || isSuperAdmin),
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
  });

  // Send admin message
  const sendMessageMutation = useMutation({
    mutationFn: async (message: {
      recipientId: number;
      subject: string;
      content: string;
    }) => {
      const res = await apiRequest("POST", "/api/admin/messages", message);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Message sent",
        description: "Your message has been sent successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send message",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Promote user to admin
  const promoteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const res = await apiRequest("POST", "/api/admin/promote", { userId });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "User promoted",
        description: "The user has been granted admin privileges.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to promote user",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Log system stat
  const logStatMutation = useMutation({
    mutationFn: async (stat: {
      action: string;
      metadata?: any;
    }) => {
      const res = await apiRequest("POST", "/api/stats", {
        ...stat,
        userId: user?.id,
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
    },
  });
  
  // Regenerate world map
  const regenerateWorldMapMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/regenerate-world-map");
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "World map regenerated",
        description: "The Everdice world map has been successfully regenerated.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/everdice/world"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to regenerate world map",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Get all Everdice worlds
  const {
    data: worlds = [],
    isLoading: worldsLoading,
    error: worldsError,
    refetch: refetchWorlds
  } = useQuery({
    queryKey: ["/api/admin/worlds"],
    queryFn: async () => {
      if (!(isAdmin || isSuperAdmin)) return [];
      const res = await apiRequest("GET", "/api/admin/worlds");
      return await res.json();
    },
    enabled: !!(isAdmin || isSuperAdmin)
  });
  
  // Get world users
  const {
    data: worldUsers = [],
    isLoading: worldUsersLoading,
    error: worldUsersError,
    refetch: refetchWorldUsers
  } = useQuery({
    queryKey: ["/api/admin/worlds", selectedWorldId, "access"],
    queryFn: async () => {
      if (!(selectedWorldId && (isAdmin || isSuperAdmin))) return [];
      const res = await apiRequest("GET", `/api/admin/worlds/${selectedWorldId}/users`);
      return await res.json();
    },
    enabled: !!(selectedWorldId && (isAdmin || isSuperAdmin))
  });
  
  // Create a new Everdice world
  const createWorldMutation = useMutation({
    mutationFn: async (worldData: any) => {
      const res = await apiRequest("POST", "/api/admin/worlds/create", worldData);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "World created",
        description: "New Everdice world has been created successfully",
      });
      refetchWorlds();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create world",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Update an existing Everdice world
  const updateWorldMutation = useMutation({
    mutationFn: async ({ worldId, data }: { worldId: number; data: any }) => {
      const res = await apiRequest("PUT", `/api/admin/worlds/${worldId}`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "World updated",
        description: "Everdice world has been updated successfully",
      });
      refetchWorlds();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update world",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Grant access to a world
  const grantWorldAccessMutation = useMutation({
    mutationFn: async ({ worldId, userId, accessLevel }: { worldId: number; userId: number; accessLevel: string }) => {
      const res = await apiRequest("POST", `/api/admin/worlds/${worldId}/access`, { userId, accessLevel });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Access granted",
        description: "User access to world has been granted successfully",
      });
      refetchWorldUsers();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to grant access",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Update world access
  const updateWorldAccessMutation = useMutation({
    mutationFn: async ({ worldId, userId, accessLevel }: { worldId: number; userId: number; accessLevel: string }) => {
      const res = await apiRequest("PUT", `/api/admin/worlds/${worldId}/access/${userId}`, { accessLevel });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Access updated",
        description: "User access to world has been updated successfully",
      });
      refetchWorldUsers();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update access",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Remove access to a world
  const removeWorldAccessMutation = useMutation({
    mutationFn: async ({ worldId, userId }: { worldId: number; userId: number }) => {
      await apiRequest("DELETE", `/api/admin/worlds/${worldId}/access/${userId}`);
    },
    onSuccess: () => {
      toast({
        title: "Access removed",
        description: "User access to world has been removed successfully",
      });
      refetchWorldUsers();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to remove access",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  return {
    isAdmin,
    isSuperAdmin,
    
    // Analytics data
    dashboardStats,
    isLoadingDashboardStats,
    dashboardStatsError,
    userLoginStats,
    isLoadingUserLoginStats,
    userLoginStatsError,
    campaignActivityStats,
    isLoadingCampaignActivityStats,
    campaignActivityStatsError,
    
    users,
    isLoadingUsers,
    usersError,
    stats,
    isLoadingStats,
    statsError,
    campaigns,
    isLoadingCampaigns,
    campaignsError,
    loginActivity,
    isLoadingLoginActivity,
    loginActivityError,
    everdiceWorld,
    isLoadingEverdiceWorld,
    everdiceWorldError,
    refetchEverdiceWorld,
    worlds,
    worldsLoading,
    worldsError,
    refetchWorlds,
    selectedWorldId,
    setSelectedWorldId,
    campaignRegions,
    isLoadingCampaignRegions,
    campaignRegionsError,
    refetchCampaignRegions,
    sendMessage: sendMessageMutation.mutate,
    sendMessageLoading: sendMessageMutation.isPending,
    promoteUser: promoteUserMutation.mutate,
    promoteUserLoading: promoteUserMutation.isPending,
    logStat: logStatMutation.mutate,
    regenerateWorldMap: regenerateWorldMapMutation.mutate,
    regenerateWorldMapLoading: regenerateWorldMapMutation.isPending,
    
    // World management
    worldUsers,
    worldUsersLoading,
    worldUsersError,
    refetchWorldUsers,
    createWorld: createWorldMutation.mutate,
    createWorldLoading: createWorldMutation.isPending,
    updateWorld: updateWorldMutation.mutate,
    updateWorldLoading: updateWorldMutation.isPending,
    grantWorldAccess: grantWorldAccessMutation.mutate,
    grantWorldAccessLoading: grantWorldAccessMutation.isPending,
    updateWorldAccess: updateWorldAccessMutation.mutate,
    updateWorldAccessLoading: updateWorldAccessMutation.isPending,
    removeWorldAccess: removeWorldAccessMutation.mutate,
    removeWorldAccessLoading: removeWorldAccessMutation.isPending
  };
}