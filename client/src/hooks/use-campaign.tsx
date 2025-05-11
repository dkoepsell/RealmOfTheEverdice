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
      // First check if character is already in campaign
      if (campaignId) {
        const existingCharsResponse = await apiRequest(
          "GET",
          `/api/campaigns/${campaignId}/characters`
        );
        const existingChars = await existingCharsResponse.json();
        
        // Check if character is already in campaign
        const isDuplicate = existingChars.some((char: any) => char.characterId === characterId);
        if (isDuplicate) {
          throw new Error("This character is already in this campaign");
        }
        
        // Also get character details to check for duplicate names
        const characterResponse = await apiRequest(
          "GET",
          `/api/characters/${characterId}`
        );
        const character = await characterResponse.json();
        
        // Check for duplicate character names
        const duplicateName = existingChars.some((campaignChar: any) => {
          // Need to fetch the actual character details for each campaign character
          if (campaignChar.characterDetails && campaignChar.characterDetails.name) {
            return campaignChar.characterDetails.name.toLowerCase() === character.name.toLowerCase();
          }
          return false;
        });
        
        if (duplicateName) {
          throw new Error("A character with this name is already in this campaign");
        }
      }
      
      // If no duplicates found, proceed with adding character
      const res = await apiRequest(
        "POST",
        `/api/campaigns/${campaignId}/characters`,
        { characterId }
      );
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/campaigns/${campaignId}/characters`] });
      
      // Check if response indicates character was already in campaign
      if (data.message && data.message.includes("already in this campaign")) {
        toast({
          title: "Already Added",
          description: "This character was already in the campaign.",
          variant: "default",
        });
      } else {
        toast({
          title: "Character Added",
          description: "Character has been added to the campaign!",
        });
      }
    },
    onError: (error: Error) => {
      console.error("Error adding character to campaign:", error);
      toast({
        title: "Cannot Add Character",
        description: error.message || "Failed to add character to campaign",
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
