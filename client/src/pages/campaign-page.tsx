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
import { CampaignChat } from "@/components/campaign-chat";
import { DiceRoller, DiceType } from "@/components/dice-roll";
import { DiceRollResults, DiceRollResult } from "@/components/dice-roll-results";
import { AddCharacterDialog } from "@/components/add-character-dialog";
import { InviteToCampaignDialog } from "@/components/invite-to-campaign-dialog";
import { PartyVoting } from "@/components/party-voting";
import { PartyManagement } from "@/components/party-management";
import { PartyPlanning } from "@/components/party-planning";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useCampaignDiceHistory } from "@/hooks/use-dice-history";
import { 
  Loader2, UserPlus, Users, Bot, UserCog, 
  MessageSquare, DicesIcon, Vote, Split, 
  ClipboardList
} from "lucide-react";

export default function CampaignPage() {
  const { id } = useParams();
  const campaignId = parseInt(id || "0");
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedCharacterId, setSelectedCharacterId] = useState<number | null>(null);
  const [gameLogs, setGameLogs] = useState<GameLog[]>([]);
  const [showAddCharacterDialog, setShowAddCharacterDialog] = useState(false);
  const [isAutoDmMode, setIsAutoDmMode] = useState(true); // Auto-DM is enabled by default
  const [rightPanelTab, setRightPanelTab] = useState<"info" | "chat" | "party" | "voting" | "planning">("info");
  // Temporarily remove party name until DB schema is updated
  // const [partyName, setPartyName] = useState<string>(""); 
  // const [isEditingPartyName, setIsEditingPartyName] = useState(false);
  
  // Dice roll history
  const { campaignRolls, addCampaignRoll, clearCampaignRolls } = useCampaignDiceHistory();
  
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
    enabled: !!campaignId && !!user
  });
  
  // Update game logs when fetchedLogs changes
  useEffect(() => {
    if (fetchedLogs) {
      // Sort logs by timestamp in descending order
      const sortedLogs = [...fetchedLogs].sort((a, b) => 
        new Date(b.timestamp || new Date()).getTime() - new Date(a.timestamp || new Date()).getTime()
      );
      setGameLogs(sortedLogs);
    }
  }, [fetchedLogs]);
  
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

  // Party name update functionality will be added later when database schema is updated
  // For now, we have a placeholder mutation that will be used later
  const updatePartyNameMutation = useMutation({
    mutationFn: async (_updates: any) => {
      // This will be implemented when we update the database schema
      return null;
    },
    onSuccess: () => {
      toast({
        title: "Party name feature coming soon",
        description: "The party naming feature will be available in a future update.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update party name",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Placeholder for party name update function
  const handlePartyNameUpdate = () => {
    toast({
      title: "Party name feature coming soon",
      description: "The party naming feature will be available in a future update.",
    });
  };
  
  // Temporarily disabled until schema is updated
  /*
  // Set initial party name from campaign data
  useEffect(() => {
    if (campaign?.partyName) {
      setPartyName(campaign.partyName);
    }
  }, [campaign]);
  
  const handlePartyNameUpdate = () => {
    if (partyName.trim()) {
      updatePartyNameMutation.mutate({ partyName: partyName.trim() });
    }
  };
  */
  
  // Handle DM mode toggle
  const handleDmModeToggle = () => {
    setIsAutoDmMode(prevMode => !prevMode);
    
    // Notify the user about the DM mode change
    toast({
      title: isAutoDmMode ? "Human DM Mode Activated" : "Auto-DM Mode Activated",
      description: isAutoDmMode 
        ? "A human Dungeon Master will now control the narrative." 
        : "The AI Dungeon Master will now guide your adventure.",
      variant: "default",
    });
  };
  
  // Handle dice roll
  const handleDiceRoll = (
    type: DiceType, 
    result: number, 
    modifier: number = 0, 
    purpose?: string,
    threshold?: number
  ) => {
    if (!currentCharacter) return;
    
    const diceRoll: DiceRollResult = {
      id: Math.random().toString(36).substring(2, 15),
      characterName: currentCharacter.name,
      diceType: type,
      result,
      modifier,
      total: result + modifier,
      timestamp: new Date(),
      purpose,
      threshold,
      isSuccess: threshold ? (result + modifier >= threshold) : undefined
    };
    
    // Add roll to campaign history
    addCampaignRoll(diceRoll);
    
    // Optionally log the roll to game logs
    const rollDescription = `${currentCharacter.name} rolled ${result} on a ${type}${modifier ? ` with a modifier of ${modifier > 0 ? '+' : ''}${modifier}` : ''}${purpose ? ` for ${purpose}` : ''}. Total: ${result + modifier}`;
    
    const rollLog: Partial<GameLog> = {
      campaignId,
      content: rollDescription,
      type: "roll"
    };
    
    createLogMutation.mutate(rollLog);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      {/* DM Mode Toggle Bar */}
      <div className="bg-primary/10 py-2 px-4">
        <div className="container mx-auto flex justify-between items-center">
          <div className="text-lg font-medieval text-primary">
            {campaign.name}
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Panel toggle buttons */}
            <div className="hidden sm:flex items-center space-x-2">
              <Button
                variant={rightPanelTab === "info" ? "default" : "ghost"} 
                size="sm"
                onClick={() => setRightPanelTab("info")}
                className="h-8"
              >
                <Users className="h-4 w-4 mr-1" />
                Info
              </Button>
              <Button
                variant={rightPanelTab === "chat" ? "default" : "ghost"} 
                size="sm"
                onClick={() => setRightPanelTab("chat")}
                className="h-8"
              >
                <MessageSquare className="h-4 w-4 mr-1" />
                Chat
              </Button>
              <Button
                variant={rightPanelTab === "party" ? "default" : "ghost"} 
                size="sm"
                onClick={() => setRightPanelTab("party")}
                className="h-8"
              >
                <Split className="h-4 w-4 mr-1" />
                Party
              </Button>
              <Button
                variant={rightPanelTab === "voting" ? "default" : "ghost"} 
                size="sm"
                onClick={() => setRightPanelTab("voting")}
                className="h-8"
              >
                <Vote className="h-4 w-4 mr-1" />
                Vote
              </Button>
              <Button
                variant={rightPanelTab === "planning" ? "default" : "ghost"} 
                size="sm"
                onClick={() => setRightPanelTab("planning")}
                className="h-8"
              >
                <ClipboardList className="h-4 w-4 mr-1" />
                Plan
              </Button>
            </div>
            
            {/* DM Mode Toggle */}
            <div className="flex items-center space-x-2">
              <Label htmlFor="dm-mode" className="text-sm font-medium">
                {isAutoDmMode ? (
                  <div className="flex items-center">
                    <Bot className="h-4 w-4 mr-1" />
                    Auto-DM
                  </div>
                ) : (
                  <div className="flex items-center">
                    <UserCog className="h-4 w-4 mr-1" />
                    Human DM
                  </div>
                )}
              </Label>
              <Switch
                id="dm-mode"
                checked={isAutoDmMode}
                onCheckedChange={handleDmModeToggle}
              />
            </div>
          </div>
        </div>
      </div>
      
      <main className="flex-grow flex flex-col lg:flex-row overflow-hidden">
        {/* Character Panel */}
        <CharacterPanel character={currentCharacter} />
        
        {/* Game Area */}
        <GameArea 
          campaign={campaign} 
          currentAdventure={currentAdventure ? {
            title: currentAdventure.title || "",
            description: currentAdventure.description || "",
            location: currentAdventure.location || ""
          } : undefined} 
          currentCharacter={currentCharacter}
          gameLogs={displayLogs}
          onAddGameLog={handleAddGameLog}
          isAutoDmMode={isAutoDmMode}
          onDiceRoll={handleDiceRoll}
          diceRollResults={campaignRolls}
        />
        
        {/* Right Panel with Tabs for World Info, Chat, Party Management, & Voting */}
        <div className="w-80 border-l border-border shrink-0 flex flex-col h-screen max-h-screen overflow-hidden">
          <Tabs value={rightPanelTab} className="flex flex-col h-full" onValueChange={(val) => setRightPanelTab(val as any)}>
            <TabsList className="grid w-full grid-cols-5 m-2">
              <TabsTrigger value="info" className="flex items-center">
                <Users className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Info</span>
              </TabsTrigger>
              <TabsTrigger value="chat" className="flex items-center">
                <MessageSquare className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Chat</span>
              </TabsTrigger>
              <TabsTrigger value="party" className="flex items-center">
                <Split className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Party</span>
              </TabsTrigger>
              <TabsTrigger value="voting" className="flex items-center">
                <Vote className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Vote</span>
              </TabsTrigger>
              <TabsTrigger value="planning" className="flex items-center">
                <ClipboardList className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Plan</span>
              </TabsTrigger>
            </TabsList>
            
            {/* World Info Tab */}
            <TabsContent value="info" className="flex-grow flex flex-col m-0 overflow-auto">
              <WorldInfoPanel 
                campaign={campaign}
                partyMembers={partyMembers}
                currentAdventure={currentAdventure || undefined}
                currentLocation={currentAdventure?.location || "Unknown"}
                quests={[]} // Quests would be fetched in a real implementation
                onUpdatePartyName={handlePartyNameUpdate}
              />
            </TabsContent>
            
            {/* Chat Tab */}
            <TabsContent value="chat" className="flex-grow flex flex-col m-0 overflow-hidden">
              <CampaignChat 
                campaignId={campaignId}
                usernames={
                  // Create a map of user IDs to usernames from the party members
                  partyMembers.reduce((acc, member) => {
                    acc[member.id] = member.name;
                    return acc;
                  }, {} as Record<number, string>)
                }
              />
            </TabsContent>

            {/* Party Management Tab */}
            <TabsContent value="party" className="flex-grow flex flex-col m-0 overflow-auto">
              <PartyManagement 
                campaignId={campaignId} 
                isCampaignDm={campaign.dmId === user?.id}
              />
            </TabsContent>

            {/* Party Voting Tab */}
            <TabsContent value="voting" className="flex-grow flex flex-col m-0 overflow-auto">
              <PartyVoting 
                campaignId={campaignId}
                onVoteComplete={(result) => {
                  // Add a game log when vote completes
                  const voteLog: Partial<GameLog> = {
                    campaignId,
                    content: `The party has voted and ${result ? 'approved' : 'rejected'} the proposal.`,
                    type: "narrative"
                  };
                  createLogMutation.mutate(voteLog);
                }}
              />
            </TabsContent>
            
            {/* Party Planning Tab */}
            <TabsContent value="planning" className="flex-grow flex flex-col m-0 overflow-auto">
              <PartyPlanning 
                campaignId={campaignId}
                characters={campaignCharacters || []}
              />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
