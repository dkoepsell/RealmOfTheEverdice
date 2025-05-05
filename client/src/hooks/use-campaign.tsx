import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Campaign, InsertCampaign, Adventure, Character, GameLog } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "./use-toast";

export function useCampaign(campaignId?: number) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Get a single campaign
  const {
    data: campaign,
    isLoading,
    error,
  } = useQuery<Campaign>({
    queryKey: [`/api/campaigns/${campaignId}`],
    enabled: !!campaignId,
  });

  // Get all campaigns for the user
  const {
    data: campaigns,
    isLoading: campaignsLoading,
    error: campaignsError,
  } = useQuery<Campaign[]>({
    queryKey: ["/api/campaigns"],
  });

  // Get characters in a campaign
  const {
    data: campaignCharacters,
    isLoading: charactersLoading,
    error: charactersError,
  } = useQuery<Character[]>({
    queryKey: [`/api/campaigns/${campaignId}/characters`],
    enabled: !!campaignId,
  });

  // Get adventures in a campaign
  const {
    data: adventures,
    isLoading: adventuresLoading,
    error: adventuresError,
  } = useQuery<Adventure[]>({
    queryKey: [`/api/campaigns/${campaignId}/adventures`],
    enabled: !!campaignId,
  });

  // Get game logs for a campaign
  const {
    data: gameLogs,
    isLoading: logsLoading,
    error: logsError,
  } = useQuery<GameLog[]>({
    queryKey: [`/api/campaigns/${campaignId}/logs`],
    enabled: !!campaignId,
  });

  // Create campaign mutation
  const createCampaignMutation = useMutation({
    mutationFn: async (campaign: InsertCampaign) => {
      const res = await apiRequest("POST", "/api/campaigns", campaign);
      return await res.json();
    },
    onSuccess: (newCampaign) => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      toast({
        title: "Campaign Created",
        description: `${newCampaign.name} has been created successfully!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to create campaign: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Add character to campaign mutation
  const addCharacterToCampaignMutation = useMutation({
    mutationFn: async ({ campaignId, characterId }: { campaignId: number; characterId: number }) => {
      const res = await apiRequest(
        "POST",
        `/api/campaigns/${campaignId}/characters`,
        { characterId }
      );
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/campaigns/${campaignId}/characters`] });
      toast({
        title: "Character Added",
        description: "Character has been added to the campaign!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to add character to campaign: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Create adventure mutation
  const createAdventureMutation = useMutation({
    mutationFn: async (adventure: Partial<Adventure>) => {
      const res = await apiRequest(
        "POST", 
        `/api/campaigns/${campaignId}/adventures`,
        adventure
      );
      return await res.json();
    },
    onSuccess: (newAdventure) => {
      queryClient.invalidateQueries({ queryKey: [`/api/campaigns/${campaignId}/adventures`] });
      toast({
        title: "Adventure Created",
        description: `${newAdventure.title} has been created!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to create adventure: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Add game log mutation
  const addGameLogMutation = useMutation({
    mutationFn: async (log: { content: string; type: string }) => {
      const res = await apiRequest(
        "POST", 
        `/api/campaigns/${campaignId}/logs`,
        { ...log, campaignId }
      );
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/campaigns/${campaignId}/logs`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to add game log: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Generate adventure using AI
  const generateAdventureMutation = useMutation({
    mutationFn: async (options: { theme?: string; setting?: string }) => {
      const res = await apiRequest("POST", "/api/generate/adventure", options);
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Adventure Generated",
        description: `${data.title} has been generated!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to generate adventure: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  return {
    campaign,
    isLoading,
    error,
    campaigns,
    campaignsLoading,
    campaignsError,
    campaignCharacters,
    charactersLoading,
    charactersError,
    adventures,
    adventuresLoading,
    adventuresError,
    gameLogs,
    logsLoading,
    logsError,
    createCampaign: createCampaignMutation.mutate,
    addCharacterToCampaign: addCharacterToCampaignMutation.mutate,
    createAdventure: createAdventureMutation.mutate,
    addGameLog: addGameLogMutation.mutate,
    generateAdventure: generateAdventureMutation.mutate,
    isCreatingCampaign: createCampaignMutation.isPending,
    isAddingCharacter: addCharacterToCampaignMutation.isPending,
    isCreatingAdventure: createAdventureMutation.isPending,
    isAddingLog: addGameLogMutation.isPending,
    isGeneratingAdventure: generateAdventureMutation.isPending,
  };
}
