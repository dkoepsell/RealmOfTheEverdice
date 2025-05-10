import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Campaign, Character, GameLog, Adventure } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
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
  ClipboardList, ScrollTextIcon
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

export default function CampaignPage() {
  // URL parameters
  const { id } = useParams();
  const campaignId = parseInt(id || "0");
  
  // Validate campaign ID for debugging
  useEffect(() => {
    if (!id || isNaN(parseInt(id))) {
      console.error("Invalid campaign ID in URL parameter:", id);
    } else {
      console.log("Campaign page loaded with ID:", campaignId);
    }
  }, [id, campaignId]);
  
  // Auth and UI hooks
  const { user } = useAuth();
  const { toast } = useToast();
  const { campaignRolls, addCampaignRoll, clearCampaignRolls } = useCampaignDiceHistory();
  
  // State management
  const [selectedCharacterId, setSelectedCharacterId] = useState<number | null>(null);
  const [gameLogs, setGameLogs] = useState<GameLog[]>([]);
  const [showAddCharacterDialog, setShowAddCharacterDialog] = useState(false);
  const [isAutoDmMode, setIsAutoDmMode] = useState(true); // Auto-DM is enabled by default
  const [rightPanelTab, setRightPanelTab] = useState<"info" | "chat" | "party" | "voting" | "planning">("info");
  
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
      setGameLogs(prevLogs => [newLog, ...prevLogs]);
      queryClient.invalidateQueries({ queryKey: [`/api/campaigns/${campaignId}/logs`] });
    }
  });
  
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
  
  // Update party name mutation (placeholder)
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

  // Add a game log
  const handleAddGameLog = (log: GameLog) => {
    setGameLogs([log, ...gameLogs]);
  };
  
  // Start a new adventure
  const startNewAdventure = () => {
    const campaignSetting = campaign?.setting || "fantasy world";
    generateAdventureMutation.mutate({ setting: campaignSetting });
  };
  
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
    
    // Optionally log the roll to game logs with dice roll data embedded in content
    const rollDescription = `${currentCharacter.name} rolled ${result} on a ${type}${modifier ? ` with a modifier of ${modifier > 0 ? '+' : ''}${modifier}` : ''}${purpose ? ` for ${purpose}` : ''}. Total: ${result + modifier}`;
    
    // Store dice roll data as a JSON string in the content field
    const rollData = JSON.stringify(diceRoll);
    
    const rollLog: Partial<GameLog> = {
      campaignId,
      content: rollDescription,
      type: "roll"
    };
    
    createLogMutation.mutate(rollLog);
  };
  
  // Placeholder for party name update function
  const handlePartyNameUpdate = () => {
    toast({
      title: "Party name feature coming soon",
      description: "The party naming feature will be available in a future update.",
    });
  };

  // Get current character
  const currentCharacter = campaignCharacters?.find(character => character.id === selectedCharacterId);
  
  // Get current adventure
  const currentAdventure = adventures?.[0];
  
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
  
  // Loading state
  const isLoading = campaignLoading || charactersLoading || adventuresLoading || logsLoading;
  
  // Error state
  const hasError = campaignError || charactersError || adventuresError || logsError;
  
  if (isLoading) {
    return (
      <div className="flex flex-col h-screen bg-background">
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
      <div className="flex flex-col h-screen bg-background">
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
      <div className="flex flex-col h-screen bg-background">
        <Navbar />
        <div className="flex-grow flex items-center justify-center p-4">
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
      <div className="flex flex-col h-screen bg-background">
        <Navbar />
        <main className="flex-grow container mx-auto px-4 py-8 overflow-y-auto">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl font-medieval text-primary mb-4">{campaign.name}</h1>
            <p className="text-lg mb-8">{campaign.description}</p>
            
            <div className="bg-accent/5 p-8 rounded-lg border border-border">
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
  
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      <Navbar />
      
      {/* Campaign Header Bar */}
      <div className="bg-accent/5 py-3 px-4 border-b">
        <div className="container mx-auto flex flex-wrap justify-between items-center">
          <div>
            <h1 className="text-2xl font-medieval text-primary">{campaign.name}</h1>
            <div className="flex flex-wrap items-center text-sm text-muted-foreground">
              <span>Adventure: {currentAdventure?.title || "None"}</span>
              <span className="mx-2">•</span>
              <span>Location: {currentAdventure?.location || "Unknown"}</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* DM Mode Toggle */}
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
      
      {/* Main Navigation Bar */}
      <div className="bg-accent/10 border-b border-border">
        <div className="container mx-auto">
          <div className="flex overflow-x-auto items-center h-10">
            <Button 
              variant={rightPanelTab === "info" ? "default" : "ghost"} 
              size="sm" 
              onClick={() => setRightPanelTab("info")} 
              className="rounded-none h-10 px-3 md:px-4 whitespace-nowrap"
            >
              <Users className="h-4 w-4 mr-1 md:mr-2" />
              <span className="hidden sm:inline">Info</span>
              <span className="sm:hidden">Info</span>
            </Button>
            <Button 
              variant={rightPanelTab === "chat" ? "default" : "ghost"} 
              size="sm" 
              onClick={() => setRightPanelTab("chat")} 
              className="rounded-none h-10 px-3 md:px-4 whitespace-nowrap"
            >
              <MessageSquare className="h-4 w-4 mr-1 md:mr-2" />
              <span className="hidden sm:inline">Chat</span>
              <span className="sm:hidden">Chat</span>
            </Button>
            <Button 
              variant={rightPanelTab === "party" ? "default" : "ghost"} 
              size="sm" 
              onClick={() => setRightPanelTab("party")} 
              className="rounded-none h-10 px-3 md:px-4 whitespace-nowrap"
            >
              <Split className="h-4 w-4 mr-1 md:mr-2" />
              <span className="hidden sm:inline">Party</span>
              <span className="sm:hidden">Party</span>
            </Button>
            <Button 
              variant={rightPanelTab === "voting" ? "default" : "ghost"} 
              size="sm" 
              onClick={() => setRightPanelTab("voting")} 
              className="rounded-none h-10 px-3 md:px-4 whitespace-nowrap"
            >
              <Vote className="h-4 w-4 mr-1 md:mr-2" />
              <span className="hidden sm:inline">Vote</span>
              <span className="sm:hidden">Vote</span>
            </Button>
            <Button 
              variant={rightPanelTab === "planning" ? "default" : "ghost"} 
              size="sm" 
              onClick={() => setRightPanelTab("planning")} 
              className="rounded-none h-10 px-3 md:px-4 whitespace-nowrap"
            >
              <ClipboardList className="h-4 w-4 mr-1 md:mr-2" />
              <span className="hidden sm:inline">Plan</span>
              <span className="sm:hidden">Plan</span>
            </Button>
          </div>
        </div>
      </div>
      
      {/* Mobile and small screens - show active component only */}
      <div className="lg:hidden flex-grow overflow-hidden flex flex-col">
        {/* Mobile Game Area - Hide when info tabs are active */}
        {!["info", "chat", "party", "voting", "planning"].includes(rightPanelTab) && (
          <div className="flex-grow overflow-y-auto">
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
          </div>
        )}
        
        {/* Mobile Info Panel - Only show when info tab is active */}
        {rightPanelTab === "info" && (
          <div className="flex-grow overflow-y-auto">
            <WorldInfoPanel 
              campaign={campaign}
              partyMembers={partyMembers}
              currentAdventure={currentAdventure ? {
                id: currentAdventure.id,
                title: currentAdventure.title || "",
                description: currentAdventure.description || null,
                location: currentAdventure.location || null,
                status: currentAdventure.status,
                campaignId: currentAdventure.campaignId,
                createdAt: currentAdventure.createdAt,
              } : undefined}
              currentLocation={currentAdventure?.location || "Unknown"}
              quests={[]} 
              onUpdatePartyName={handlePartyNameUpdate}
            />
          </div>
        )}
        
        {/* Mobile Chat - Only show when chat tab is active */}
        {rightPanelTab === "chat" && (
          <div className="flex-grow overflow-y-auto">
            <CampaignChat 
              campaignId={campaignId}
              usernames={
                partyMembers.reduce((acc, member) => {
                  acc[member.id] = member.name;
                  return acc;
                }, {} as Record<number, string>)
              }
            />
          </div>
        )}
        
        {/* Mobile Party Management - Only show when party tab is active */}
        {rightPanelTab === "party" && (
          <div className="flex-grow overflow-y-auto">
            <PartyManagement 
              campaignId={campaignId} 
              isCampaignDm={campaign.dmId === user?.id}
            />
          </div>
        )}
        
        {/* Mobile Voting - Only show when voting tab is active */}
        {rightPanelTab === "voting" && (
          <div className="flex-grow overflow-y-auto">
            <PartyVoting 
              campaignId={campaignId}
              onVoteComplete={(result) => {
                const voteLog: Partial<GameLog> = {
                  campaignId,
                  content: `The party has voted and ${result ? 'approved' : 'rejected'} the proposal.`,
                  type: "narrative"
                };
                createLogMutation.mutate(voteLog);
              }}
            />
          </div>
        )}
        
        {/* Mobile Planning - Only show when planning tab is active */}
        {rightPanelTab === "planning" && (
          <div className="flex-grow overflow-y-auto">
            <PartyPlanning 
              campaignId={campaignId}
              characters={campaignCharacters || []}
              isDungeonMaster={campaign.dmId === user?.id}
            />
          </div>
        )}
      </div>
      
      {/* Desktop layout - redesigned for better story focus */}
      <main className="hidden lg:flex flex-grow flex-col overflow-hidden">
        {/* Top section: Character info + Party info (mini) */}
        <div className="flex border-b border-border h-28 shrink-0">
          {/* Mini character stats */}
          <div className="w-64 border-r border-border flex p-2">
            <div className="flex items-center gap-3">
              <Avatar className="h-16 w-16">
                <AvatarFallback>{currentCharacter.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <h3 className="font-medieval text-lg">{currentCharacter.name}</h3>
                <p className="text-xs text-muted-foreground">Level {currentCharacter.level} {currentCharacter.race} {currentCharacter.class}</p>
                <div className="flex mt-1 gap-2">
                  {Object.entries({
                    STR: ((currentCharacter.stats as any)?.strength || 10),
                    DEX: ((currentCharacter.stats as any)?.dexterity || 10),
                    CON: ((currentCharacter.stats as any)?.constitution || 10),
                    INT: ((currentCharacter.stats as any)?.intelligence || 10),
                    WIS: ((currentCharacter.stats as any)?.wisdom || 10),
                    CHA: ((currentCharacter.stats as any)?.charisma || 10)
                  }).map(([stat, value]) => (
                    <div key={stat} className="flex flex-col items-center bg-card rounded-sm px-1 py-0.5">
                      <span className="text-[10px] text-muted-foreground">{stat}</span>
                      <span className="text-xs font-medium">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          {/* Mini party info */}
          <div className="flex-1 p-2 flex justify-between">
            <div className="flex flex-col">
              <h3 className="font-medieval text-lg">{campaign.partyName || "No party name set"}</h3>
              <p className="text-xs text-muted-foreground">{partyMembers.length} party members</p>
              <div className="flex gap-1 mt-1">
                {partyMembers.slice(0, 5).map(member => (
                  <Avatar key={member.id} className="h-8 w-8">
                    <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                ))}
                {partyMembers.length > 5 && (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>+{partyMembers.length - 5}</AvatarFallback>
                  </Avatar>
                )}
              </div>
            </div>
            <div className="flex items-start">
              <div className="bg-card rounded-md p-2">
                <p className="text-xs text-muted-foreground">Current location</p>
                <p className="text-sm">{currentAdventure?.location || "Unknown"}</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Main content area */}
        <div className="flex flex-grow overflow-hidden">
          {/* Main game area - now taking up more space */}
          <div className="flex-grow overflow-y-auto h-full">
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
          </div>
          
          {/* Right Panel - narrower than before */}
          <div className="w-64 border-l border-border shrink-0 flex flex-col h-full overflow-hidden">
          <div className="flex-grow overflow-auto">
            {rightPanelTab === "info" && (
              <WorldInfoPanel 
                campaign={campaign}
                partyMembers={partyMembers}
                currentAdventure={currentAdventure ? {
                  id: currentAdventure.id,
                  title: currentAdventure.title || "",
                  description: currentAdventure.description || null,
                  location: currentAdventure.location || null,
                  status: currentAdventure.status,
                  campaignId: currentAdventure.campaignId,
                  createdAt: currentAdventure.createdAt,
                } : undefined}
                currentLocation={currentAdventure?.location || "Unknown"}
                quests={[]} 
                onUpdatePartyName={handlePartyNameUpdate}
              />
            )}
            
            {rightPanelTab === "chat" && (
              <CampaignChat 
                campaignId={campaignId}
                usernames={
                  partyMembers.reduce((acc, member) => {
                    acc[member.id] = member.name;
                    return acc;
                  }, {} as Record<number, string>)
                }
              />
            )}

            {rightPanelTab === "party" && (
              <PartyManagement 
                campaignId={campaignId} 
                isCampaignDm={campaign.dmId === user?.id}
              />
            )}

            {rightPanelTab === "voting" && (
              <PartyVoting 
                campaignId={campaignId}
                onVoteComplete={(result) => {
                  const voteLog: Partial<GameLog> = {
                    campaignId,
                    content: `The party has voted and ${result ? 'approved' : 'rejected'} the proposal.`,
                    type: "narrative"
                  };
                  createLogMutation.mutate(voteLog);
                }}
              />
            )}
            
            {rightPanelTab === "planning" && (
              <PartyPlanning 
                campaignId={campaignId}
                characters={campaignCharacters || []}
                isDungeonMaster={campaign.dmId === user?.id}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}