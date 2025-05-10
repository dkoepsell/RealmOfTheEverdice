import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "./use-auth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "./use-toast";

export function useAdmin() {
  const { user } = useAuth();
  const { toast } = useToast();
  const isSuperAdmin = user?.isSuperAdmin;
  const isAdmin = user?.isAdmin;

  // Get all users
  const {
    data: users = [],
    isLoading: isLoadingUsers,
    error: usersError,
  } = useQuery({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      if (!isAdmin) return [];
      const res = await apiRequest("GET", "/api/admin/users");
      return await res.json();
    },
    enabled: !!isAdmin,
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
    queryKey: ["/api/admin/everdice"],
    queryFn: async () => {
      if (!isSuperAdmin) return null;
      const res = await apiRequest("GET", "/api/admin/everdice");
      return await res.json();
    },
    enabled: !!isSuperAdmin,
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
      if (!isSuperAdmin) return { campaigns: [], uniqueRegions: [] };
      const res = await apiRequest("GET", "/api/admin/campaign-regions");
      return await res.json();
    },
    enabled: !!isSuperAdmin,
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
      queryClient.invalidateQueries({ queryKey: ["/api/admin/everdice"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to regenerate world map",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    isAdmin,
    isSuperAdmin,
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
  };
}