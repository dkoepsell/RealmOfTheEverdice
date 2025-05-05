import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Campaign, Character, GameLog, Adventure } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { useCampaign } from "@/hooks/use-campaign";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/navbar";
import { CharacterPanel } from "@/components/character-panel";
import { GameArea } from "@/components/game-area";
import { WorldInfoPanel } from "@/components/world-info-panel";
import { AddCharacterDialog } from "@/components/add-character-dialog";
import { Button } from "@/components/ui/button";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, UserPlus } from "lucide-react";

export default function CampaignPage() {
  const { id } = useParams();
  const campaignId = parseInt(id);
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedCharacterId, setSelectedCharacterId] = useState<number | null>(null);
  const [gameLogs, setGameLogs] = useState<GameLog[]>([]);
  const [showAddCharacterDialog, setShowAddCharacterDialog] = useState(false);
  
  // Fetch campaign data
  const { 
    data: campaign,
    isLoading: campaignLoading,
    error: campaignError
  } = useQuery<Campaign>({
    queryKey: [`/api/campaigns/${campaignId}`],
    enabled: !!campaignId && !!user,
  });
  
  // Fetch campaign characters
  const {
    data: campaignCharacters,
    isLoading: charactersLoading,
    error: charactersError
  } = useQuery<Character[]>({
    queryKey: [`/api/campaigns/${campaignId}/characters`],
    enabled: !!campaignId && !!user,
  });
  
  // Fetch adventures
  const {
    data: adventures,
    isLoading: adventuresLoading,
    error: adventuresError
  } = useQuery<Adventure[]>({
    queryKey: [`/api/campaigns/${campaignId}/adventures`],
    enabled: !!campaignId && !!user,
  });
  
  // Fetch game logs
  const {
    data: fetchedLogs,
    isLoading: logsLoading,
    error: logsError
  } = useQuery<GameLog[]>({
    queryKey: [`/api/campaigns/${campaignId}/logs`],
    enabled: !!campaignId && !!user,
    onSuccess: (data) => {
      // Sort logs by timestamp in descending order
      const sortedLogs = [...data].sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      setGameLogs(sortedLogs);
    }
  });
  
  // Use the first character as the selected character initially
  useEffect(() => {
    if (campaignCharacters && campaignCharacters.length > 0 && !selectedCharacterId) {
      setSelectedCharacterId(campaignCharacters[0].id);
    }
  }, [campaignCharacters, selectedCharacterId]);
  
  // Generate adventure mutation
  const generateAdventureMutation = useMutation({
    mutationFn: async (options: { theme?: string; setting?: string }) => {
      const res = await apiRequest("POST", "/api/generate/adventure", options);
      return await res.json();
    },
    onSuccess: (data) => {
      // Create a new adventure in the database
      createAdventureMutation.mutate({
        campaignId,
        title: data.title,
        description: data.description,
        location: data.setting,
        status: "in_progress"
      });
      
      // Add the adventure intro to game logs
      const narrativeLog: Partial<GameLog> = {
        campaignId,
        content: data.description,
        type: "narrative"
      };
      
      createLogMutation.mutate(narrativeLog);
      
      toast({
        title: "Adventure Generated",
        description: `"${data.title}" has begun!`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to generate adventure: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Create adventure mutation
  const createAdventureMutation = useMutation({
    mutationFn: async (adventure: Partial<Adventure>) => {
      const res = await apiRequest("POST", `/api/campaigns/${campaignId}/adventures`, adventure);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/campaigns/${campaignId}/adventures`] });
    }
  });
  
  // Create game log mutation
  const createLogMutation = useMutation({
    mutationFn: async (log: Partial<GameLog>) => {
      const res = await apiRequest("POST", `/api/campaigns/${campaignId}/logs`, log);
      return await res.json();
    },
    onSuccess: (newLog) => {
      // Add new log to the beginning of the array
      setGameLogs([newLog, ...gameLogs]);
      queryClient.invalidateQueries({ queryKey: [`/api/campaigns/${campaignId}/logs`] });
    }
  });
  
  // Add a game log
  const handleAddGameLog = (log: GameLog) => {
    setGameLogs([log, ...gameLogs]);
  };
  
  // Start a new adventure
  const startNewAdventure = () => {
    const campaignSetting = campaign?.setting || "fantasy world";
    generateAdventureMutation.mutate({ setting: campaignSetting });
  };
  
  // Get current character
  const currentCharacter = campaignCharacters?.find(character => character.id === selectedCharacterId);
  
  // Get current adventure
  const currentAdventure = adventures?.[0];
  
  // Loading state
  const isLoading = campaignLoading || charactersLoading || adventuresLoading || logsLoading;
  
  // Error state
  const hasError = campaignError || charactersError || adventuresError || logsError;
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-lg font-medieval">Loading campaign...</p>
          </div>
        </div>
      </div>
    );
  }
  
  if (hasError || !campaign) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center max-w-md p-6 bg-destructive/10 rounded-lg">
            <h2 className="text-2xl font-medieval text-destructive mb-2">Campaign Error</h2>
            <p className="mb-4">There was an error loading the campaign. Please try again later.</p>
            <Button variant="default" onClick={() => window.location.href = "/"}>
              Return Home
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  // If no character is selected or found
  if (!currentCharacter) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center max-w-md p-6 bg-accent/10 rounded-lg">
            <h2 className="text-2xl font-medieval text-accent mb-2">No Character Found</h2>
            <p className="mb-4">You don't have any characters in this campaign.</p>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button variant="outline" onClick={() => window.location.href = "/characters/create"}>
                Create New Character
              </Button>
              <Button 
                variant="default" 
                onClick={() => setShowAddCharacterDialog(true)}
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Add Existing Character
              </Button>
            </div>
            
            {/* Add Character Dialog */}
            <AddCharacterDialog
              campaignId={campaignId}
              open={showAddCharacterDialog}
              onOpenChange={setShowAddCharacterDialog}
              onCharacterAdded={() => {
                // Refresh campaign data
                queryClient.invalidateQueries({ 
                  queryKey: [`/api/campaigns/${campaignId}/characters`] 
                });
              }}
            />
          </div>
        </div>
      </div>
    );
  }
  
  // If no adventure exists
  if (!currentAdventure && !generateAdventureMutation.isPending) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-grow container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl font-medieval text-primary mb-4">{campaign.name}</h1>
            <p className="text-lg mb-8">{campaign.description}</p>
            
            <div className="bg-parchment p-8 rounded-lg medieval-border">
              <h2 className="text-2xl font-medieval text-secondary mb-4">Begin Your Adventure</h2>
              <p className="mb-6">Your party is assembled and ready. What adventures await?</p>
              <Button 
                size="lg" 
                onClick={startNewAdventure}
                disabled={generateAdventureMutation.isPending}
              >
                {generateAdventureMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Adventure...
                  </>
                ) : (
                  "Start New Adventure"
                )}
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }
  
  // Calculate character summaries for party display
  const partyMembers = campaignCharacters?.map(character => ({
    id: character.id,
    name: character.name,
    race: character.race,
    class: character.class,
    level: character.level,
    hp: character.hp,
    maxHp: character.maxHp
  })) || [];
  
  // Reverse game logs for display (newest at the bottom)
  const displayLogs = [...gameLogs].reverse();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-grow flex flex-col lg:flex-row overflow-hidden">
        {/* Character Panel */}
        <CharacterPanel character={currentCharacter} />
        
        {/* Game Area */}
        <GameArea 
          campaign={campaign} 
          currentAdventure={currentAdventure} 
          currentCharacter={currentCharacter}
          gameLogs={displayLogs}
          onAddGameLog={handleAddGameLog}
        />
        
        {/* World Info Panel */}
        <WorldInfoPanel 
          campaign={campaign}
          partyMembers={partyMembers}
          currentAdventure={currentAdventure}
          currentLocation={currentAdventure?.location || "Unknown"}
          quests={[]} // Quests would be fetched in a real implementation
        />
      </main>
    </div>
  );
}
