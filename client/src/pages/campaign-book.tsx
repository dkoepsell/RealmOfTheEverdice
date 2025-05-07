import { useEffect, useState, useRef } from "react";
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
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useCampaignDiceHistory } from "@/hooks/use-dice-history";
import { 
  Loader2, UserPlus, Users, Bot, UserCog, 
  MessageSquare, DicesIcon, Vote, Split, 
  ClipboardList, ScrollTextIcon, Menu, X,
  Send, BookOpen, BookMarked, Map, Sword,
  ShieldAlert, Backpack, HelpCircle, Info
} from "lucide-react";
import { DndTextAnalyzer } from "@/components/dnd-text-analyzer";
import { DndQuickReference } from "@/components/dnd-quick-reference";
import InteractiveDiceSuggestions from "@/components/interactive-dice-suggestions";

export default function CampaignPage() {
  // URL parameters
  const { id } = useParams();
  const campaignId = parseInt(id || "0");
  
  // Auth and UI hooks
  const { user } = useAuth();
  const { toast } = useToast();
  const { campaignRolls, addCampaignRoll, clearCampaignRolls } = useCampaignDiceHistory();
  const narrativeRef = useRef<HTMLDivElement>(null);
  
  // State management
  const [selectedCharacterId, setSelectedCharacterId] = useState<number | null>(null);
  const [gameLogs, setGameLogs] = useState<GameLog[]>([]);
  const [showAddCharacterDialog, setShowAddCharacterDialog] = useState(false);
  const [isAutoDmMode, setIsAutoDmMode] = useState(true); // Auto-DM is enabled by default
  const [showDiceRoller, setShowDiceRoller] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [rightPanelTab, setRightPanelTab] = useState<string | null>(null);
  const [playerInput, setPlayerInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  
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
  
  // Generate adventure narration mutation
  const generateNarrationMutation = useMutation({
    mutationFn: async (input: string) => {
      // Create a context from recent game logs to include dice roll results
      const recentLogs = gameLogs.slice(0, 10)
        .map(log => {
          // Include the type of log to help AI understand what's happening
          return `[${log.type}] ${log.content}`;
        })
        .join("\n");
      
      const res = await apiRequest("POST", "/api/generate/narration", {
        context: `${currentAdventure?.description || ""}\n\nRecent game events:\n${recentLogs}`,
        playerAction: input,
        isAutoAdvance: false
      });
      return await res.json();
    },
    onSuccess: (data) => {
      // Add the narration to game logs
      const narrativeLog: Partial<GameLog> = {
        campaignId,
        content: data.narration,
        type: "narrative"
      };
      
      createLogMutation.mutate(narrativeLog);
      
      // Add player input to game logs as well
      const playerLog: Partial<GameLog> = {
        campaignId,
        content: playerInput,
        type: "player"
      };
      
      createLogMutation.mutate(playerLog);
      
      // Reset the player input
      setPlayerInput("");
      setIsProcessing(false);
    },
    onError: (error) => {
      setIsProcessing(false);
      toast({
        title: "Error",
        description: `Failed to generate narration: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Update game logs when fetchedLogs changes
  useEffect(() => {
    if (fetchedLogs) {
      // Sort logs by timestamp in ascending order (oldest to newest)
      const sortedLogs = [...fetchedLogs].sort((a, b) => 
        new Date(a.timestamp || new Date()).getTime() - new Date(b.timestamp || new Date()).getTime()
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

  // Scroll to the bottom when new logs are added
  useEffect(() => {
    if (narrativeRef.current) {
      narrativeRef.current.scrollTop = narrativeRef.current.scrollHeight;
    }
  }, [gameLogs]);

  // Add a game log
  const handleAddGameLog = (log: GameLog) => {
    setGameLogs([...gameLogs, log]);
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
    threshold?: number,
    effects?: {
      stats?: Partial<Record<string, number>>;
      alignment?: string;
      description: string;
    }
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
    
    // Build a detailed roll description including results and effects
    let rollDescription = `${currentCharacter.name} rolled ${result} on a ${type}${modifier ? ` with a modifier of ${modifier > 0 ? '+' : ''}${modifier}` : ''}${purpose ? ` for ${purpose}` : ''}. Total: ${result + modifier}`;
    
    // Add success/failure info if threshold was provided
    if (threshold !== undefined) {
      const success = (result + modifier) >= threshold;
      rollDescription += ` (${success ? 'Success' : 'Failure'} against DC ${threshold})`;
    }
    
    // Add effects description if provided
    if (effects?.description) {
      rollDescription += `\nEffect: ${effects.description}`;
    }
    
    // Store dice roll data as a JSON string in the content field
    const rollData = JSON.stringify(diceRoll);
    
    const rollLog: Partial<GameLog> = {
      campaignId,
      content: rollDescription,
      type: "roll"
    };
    
    createLogMutation.mutate(rollLog);
    
    // Hide the dice roller after rolling
    setShowDiceRoller(false);
    
    // If this is a significant roll (has a threshold or effect), generate narrative advancement
    if ((threshold !== undefined || effects) && isAutoDmMode) {
      // Wait a brief moment for the roll log to be added
      setTimeout(() => {
        // Auto-generate narrative response to the dice roll result
        const actionDescription = `${currentCharacter.name} attempts ${purpose || 'an action'} and rolls ${result + modifier} (${result} + ${modifier})${
          threshold !== undefined ? ` against DC ${threshold}${(result + modifier) >= threshold ? ' (SUCCESS)' : ' (FAILURE)'}` : ''
        }`;
        
        generateNarrationMutation.mutate(actionDescription);
      }, 500);
    }
  };
  
  // Submit player action
  const handleSubmitAction = () => {
    if (!playerInput.trim()) return;
    setIsProcessing(true);
    
    if (isAutoDmMode) {
      // Use AI DM to generate a response
      generateNarrationMutation.mutate(playerInput);
    } else {
      // Just log the player's action, a human DM will respond
      const playerLog: Partial<GameLog> = {
        campaignId,
        content: playerInput,
        type: "player"
      };
      
      createLogMutation.mutate(playerLog);
      setPlayerInput("");
      setIsProcessing(false);
    }
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
  
  if (!currentAdventure && !generateNarrationMutation.isPending) {
    return (
      <div className="flex flex-col h-screen bg-background">
        <Navbar />
        <div className="h-16 border-b border-border px-4 flex items-center">
          <h1 className="text-xl font-medieval mr-auto">{campaign.name}</h1>
        </div>
        <div className="flex-grow flex items-center justify-center p-4">
          <div className="text-center max-w-md p-6 bg-primary/5 rounded-lg">
            <h2 className="text-2xl font-medieval text-primary mb-2">Start Your Adventure</h2>
            <p className="mb-4">This campaign doesn't have any adventures yet. Start one to begin your journey!</p>
            <Button 
              variant="default"
              onClick={() => {
                toast({
                  title: "Adventure Feature",
                  description: "Please go to the regular campaign view to generate a new adventure.",
                  variant: "default",
                });
              }}
            >
              <ScrollTextIcon className="mr-2 h-4 w-4" />
              Return to Campaign View
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  // For formatting logs as a continuous narrative
  const renderGameLogs = () => {
    return gameLogs.map((log, index) => {
      switch (log.type) {
        case 'narrative':
          return (
            <div key={log.id} className="mb-6 text-lg leading-relaxed">
              {/* Analyze narrative text for D&D terms and add tooltips */}
              <DndTextAnalyzer text={log.content} showAsPopover={true} />
            </div>
          );
        case 'player':
          return (
            <div key={log.id} className="mb-6">
              <p className="mb-1 text-sm font-medium text-primary">
                <span className="font-bold">{currentCharacter.name}:</span>
              </p>
              <p className="text-lg leading-relaxed italic">"{log.content}"</p>
            </div>
          );
        case 'roll':
          return (
            <div key={log.id} className="mb-4 py-2 px-3 bg-muted/30 rounded-md text-sm">
              <DicesIcon className="inline-block mr-2 h-4 w-4 text-muted-foreground" />
              {log.content}
            </div>
          );
        default:
          return (
            <div key={log.id} className="mb-4">
              {log.content}
            </div>
          );
      }
    });
  };
  
  // Main campaign view with book-like layout
  return (
    <div className="flex flex-col h-screen bg-background">
      <Navbar />
      
      {/* Top Adventure Header */}
      <div className="border-b border-border bg-muted/20">
        <div className="container mx-auto px-4 py-2 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setShowSidebar(!showSidebar)}
              className="mr-2 md:hidden"
            >
              {showSidebar ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <div>
              <h1 className="text-xl sm:text-2xl font-medieval text-primary">
                {campaign.name}
              </h1>
              {currentAdventure && (
                <div className="text-sm text-muted-foreground">
                  <BookMarked className="inline-block mr-1 h-3 w-3" />
                  {currentAdventure.title}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Label htmlFor="dm-mode-toggle" className="text-sm whitespace-nowrap flex items-center gap-1">
                {isAutoDmMode ? <Bot className="h-4 w-4" /> : <UserCog className="h-4 w-4" />}
                Auto-DM
              </Label>
              <Switch
                id="dm-mode-toggle"
                checked={isAutoDmMode}
                onCheckedChange={handleDmModeToggle}
              />
            </div>
            
            {/* D&D Rules Button with Quick Reference Panel */}
            <DndQuickReference side="right" buttonText="D&D Rules">
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1"
              >
                <BookOpen className="h-4 w-4" />
                <span className="hidden md:inline-block">D&D Rules</span>
              </Button>
            </DndQuickReference>
            
            <div className="hidden md:flex -space-x-2">
              {partyMembers.slice(0, 3).map(member => (
                <Avatar key={member.id} className="h-8 w-8 border-2 border-background">
                  <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                </Avatar>
              ))}
              {partyMembers.length > 3 && (
                <Avatar className="h-8 w-8 border-2 border-background">
                  <AvatarFallback>+{partyMembers.length - 3}</AvatarFallback>
                </Avatar>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content Area with Sidebar */}
      <div className="flex-grow flex overflow-hidden">
        {/* Sidebar - Only visible on MD and above (or when toggled on mobile) */}
        <div className={`${showSidebar ? 'fixed inset-0 z-50 bg-background' : 'hidden'} md:relative md:block md:w-64 lg:w-72 border-r border-border shrink-0 overflow-y-auto`}>
          <div className="p-4">
            {/* Character Info */}
            <div className="mb-6">
              <h3 className="font-medieval text-lg mb-2 pb-1 border-b border-border flex items-center">
                <UserCog className="mr-2 h-4 w-4" />
                Character
              </h3>
              <div className="flex items-center gap-3 mb-3">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {currentCharacter.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-medium">{currentCharacter.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    Level {currentCharacter.level} {currentCharacter.race} {currentCharacter.class}
                  </p>
                </div>
              </div>
              
              {/* Stats Overview */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                {Object.entries({
                  STR: ((currentCharacter.stats as any)?.strength || 10),
                  DEX: ((currentCharacter.stats as any)?.dexterity || 10),
                  CON: ((currentCharacter.stats as any)?.constitution || 10),
                  INT: ((currentCharacter.stats as any)?.intelligence || 10),
                  WIS: ((currentCharacter.stats as any)?.wisdom || 10),
                  CHA: ((currentCharacter.stats as any)?.charisma || 10)
                }).map(([stat, value]) => (
                  <div key={stat} className="flex flex-col items-center bg-muted/30 rounded-sm p-1">
                    <span className="text-xs text-muted-foreground">{stat}</span>
                    <span className="text-sm font-medium">{value}</span>
                  </div>
                ))}
              </div>
              
              {/* HP Bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs">Hit Points</span>
                  <span className="text-xs font-medium">{currentCharacter.hp}/{currentCharacter.maxHp}</span>
                </div>
                <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-destructive h-full" 
                    style={{ width: `${Math.max(0, Math.min(100, (currentCharacter.hp / currentCharacter.maxHp) * 100))}%` }}
                  ></div>
                </div>
              </div>
            </div>
            
            {/* Character Actions Buttons */}
            <div className="mb-6">
              <h3 className="font-medieval text-lg mb-2 pb-1 border-b border-border flex items-center">
                <Sword className="mr-2 h-4 w-4" />
                Character Actions
              </h3>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full text-xs justify-start"
                  onClick={() => setRightPanelTab("inventory")}
                >
                  <Backpack className="mr-1 h-3.5 w-3.5" />
                  Inventory
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full text-xs justify-start"
                  onClick={() => setRightPanelTab("equipment")}
                >
                  <ShieldAlert className="mr-1 h-3.5 w-3.5" />
                  Equipment
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full text-xs justify-start"
                  onClick={() => setRightPanelTab("spells")}
                >
                  <HelpCircle className="mr-1 h-3.5 w-3.5" />
                  Spells
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full text-xs justify-start"
                  onClick={() => setRightPanelTab("map")}
                >
                  <Map className="mr-1 h-3.5 w-3.5" />
                  Map
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full text-xs justify-start col-span-2"
                  onClick={() => setRightPanelTab("progression")}
                >
                  <Info className="mr-1 h-3.5 w-3.5" />
                  Character Progression
                </Button>
              </div>
              
              {/* Battle Tracker Button - Only shown during combat */}
              <Button 
                variant="destructive" 
                size="sm" 
                className="w-full text-xs justify-center mb-2"
                onClick={() => setRightPanelTab("battle")}
              >
                <Sword className="mr-1 h-3.5 w-3.5" />
                Battle Tracker
              </Button>
            </div>
            
            {/* Adventure Location */}
            <div className="mb-6">
              <h3 className="font-medieval text-lg mb-2 pb-1 border-b border-border flex items-center">
                <Map className="mr-2 h-4 w-4" />
                Location
              </h3>
              <p className="text-sm">
                {currentAdventure?.location || "Unknown"}
              </p>
              <Button 
                variant="link" 
                size="sm" 
                className="text-xs p-0 h-auto mt-1"
                onClick={() => setRightPanelTab("map")}
              >
                View on map
              </Button>
            </div>
            
            {/* Party Members */}
            <div className="mb-6">
              <h3 className="font-medieval text-lg mb-2 pb-1 border-b border-border flex items-center">
                <Users className="mr-2 h-4 w-4" />
                Party Members
              </h3>
              <div className="space-y-2">
                {partyMembers.map(member => (
                  <div key={member.id} className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs">
                        {member.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{member.name}</span>
                    <span className="text-xs text-muted-foreground ml-auto">
                      Lvl {member.level} {member.class}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Campaign Tools */}
            <div>
              <h3 className="font-medieval text-lg mb-2 pb-1 border-b border-border flex items-center">
                <Sword className="mr-2 h-4 w-4" />
                Campaign Tools
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="text-xs justify-start"
                  onClick={() => setShowDiceRoller(!showDiceRoller)}
                >
                  <DicesIcon className="mr-1 h-3 w-3" />
                  Dice Roller
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="text-xs justify-start"
                  onClick={() => {
                    toast({
                      title: "Party Chat",
                      description: "The party chat panel has been moved to the sidebar for easier access.",
                      variant: "default",
                    });
                    setRightPanelTab && setRightPanelTab("chat");
                  }}
                >
                  <MessageSquare className="mr-1 h-3 w-3" />
                  Party Chat
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="text-xs justify-start"
                  onClick={() => window.open(`/campaigns/${campaignId}/vote`, '_blank')}
                >
                  <Vote className="mr-1 h-3 w-3" />
                  Party Vote
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="text-xs justify-start"
                  onClick={() => window.open(`/campaigns/${campaignId}/plan`, '_blank')}
                >
                  <ClipboardList className="mr-1 h-3 w-3" />
                  Party Plan
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Main Book-Like Content Area */}
        <div className="flex-grow flex flex-col overflow-hidden bg-[#fffbf0]">
          {/* Right Side Panel */}
          {rightPanelTab && (
            <div className="absolute top-0 right-0 z-30 h-full w-80 bg-white border-l border-border overflow-y-auto">
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medieval text-lg">
                    {rightPanelTab === "inventory" && "Inventory"}
                    {rightPanelTab === "equipment" && "Equipment & Attire"}
                    {rightPanelTab === "spells" && "Spells & Abilities"}
                    {rightPanelTab === "map" && "Adventure Map"}
                    {rightPanelTab === "battle" && "Battle Tracker"}
                    {rightPanelTab === "progression" && "Character Progression"}
                  </h3>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => setRightPanelTab(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                {/* Inventory Panel */}
                {rightPanelTab === "inventory" && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Items</span>
                      <span className="text-xs text-muted-foreground">
                        {((currentCharacter.equipment as any)?.inventory?.length || 0)} items
                      </span>
                    </div>
                    
                    {(currentCharacter.equipment as any)?.inventory?.length > 0 ? (
                      <div className="space-y-2">
                        {(currentCharacter.equipment as any)?.inventory?.map((item: any, index: number) => (
                          <div key={index} className="p-2 border border-border rounded-md">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <span className="text-sm font-medium">{item.name}</span>
                                {item.isEquipped && (
                                  <span className="ml-2 text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                                    Equipped
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {item.quantity > 1 ? `x${item.quantity}` : ''}
                              </span>
                            </div>
                            
                            <p className="text-xs text-muted-foreground mt-1">
                              {item.description}
                            </p>
                            
                            <div className="flex items-center mt-2">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="text-xs h-7"
                                onClick={() => {
                                  toast({
                                    title: item.isEquipped ? "Item Unequipped" : "Item Equipped",
                                    description: item.isEquipped 
                                      ? `${item.name} has been removed.` 
                                      : `${item.name} has been equipped.`,
                                  });
                                }}
                              >
                                {item.isEquipped ? 'Unequip' : 'Equip'}
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-xs h-7 ml-1"
                                onClick={() => {
                                  toast({
                                    title: "Item Details",
                                    description: item.description,
                                  });
                                }}
                              >
                                Details
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center p-4 border border-dashed border-border rounded-md">
                        <p className="text-sm text-muted-foreground">No items in inventory</p>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Equipment Panel */}
                {rightPanelTab === "equipment" && (
                  <div>
                    <div className="mb-4">
                      <h4 className="text-sm font-medium mb-2">Equipped Attire</h4>
                      <div className="space-y-2">
                        <div className="p-2 border border-border rounded-md">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Armor</span>
                            <span className="text-xs text-muted-foreground">
                              {(currentCharacter.equipment as any)?.armor || "None"}
                            </span>
                          </div>
                        </div>
                        
                        <div className="p-2 border border-border rounded-md">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Main Weapon</span>
                            <span className="text-xs text-muted-foreground">
                              {(currentCharacter.equipment as any)?.weapons?.[0] || "None"}
                            </span>
                          </div>
                        </div>
                        
                        <div className="p-2 border border-border rounded-md">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Secondary Weapon</span>
                            <span className="text-xs text-muted-foreground">
                              {(currentCharacter.equipment as any)?.weapons?.[1] || "None"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium mb-2">Available Attire</h4>
                      <div className="space-y-2">
                        {(currentCharacter.equipment as any)?.inventory
                          ?.filter((item: any) => item.type === "armor" || item.type === "weapon")
                          .map((item: any, index: number) => (
                          <div key={index} className="p-2 border border-border rounded-md">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">{item.name}</span>
                              <span className="text-xs bg-muted px-1.5 py-0.5 rounded-full">
                                {item.type}
                              </span>
                            </div>
                            
                            <p className="text-xs text-muted-foreground mt-1">
                              {item.description}
                            </p>
                            
                            <div className="flex items-center mt-2">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="text-xs h-7"
                                onClick={() => {
                                  toast({
                                    title: item.isEquipped ? "Item Unequipped" : "Item Equipped",
                                    description: item.isEquipped 
                                      ? `${item.name} has been removed.` 
                                      : `${item.name} has been equipped.`,
                                  });
                                }}
                              >
                                {item.isEquipped ? 'Unequip' : 'Equip'}
                              </Button>
                            </div>
                          </div>
                        ))}
                        
                        {!(currentCharacter.equipment as any)?.inventory?.some((item: any) => 
                          item.type === "armor" || item.type === "weapon"
                        ) && (
                          <div className="text-center p-4 border border-dashed border-border rounded-md">
                            <p className="text-sm text-muted-foreground">No equippable items</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Spells Panel */}
                {rightPanelTab === "spells" && (
                  <div>
                    <Tabs defaultValue="spells">
                      <TabsList className="w-full mb-4">
                        <TabsTrigger value="spells" className="flex-1">Spells</TabsTrigger>
                        <TabsTrigger value="abilities" className="flex-1">Abilities</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="spells">
                        {(currentCharacter.spells as any)?.length > 0 ? (
                          <div className="space-y-2">
                            {(currentCharacter.spells as any)?.map((spell: any, index: number) => (
                              <div key={index} className="p-2 border border-border rounded-md">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium">{spell.name}</span>
                                  <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                                    Level {spell.level}
                                  </span>
                                </div>
                                
                                <p className="text-xs text-muted-foreground mt-1">
                                  {spell.description}
                                </p>
                                
                                <div className="flex items-center mt-2">
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="text-xs h-7"
                                    onClick={() => {
                                      // Example action for casting a spell
                                      const spellAction = `${currentCharacter.name} casts ${spell.name}`;
                                      setPlayerInput(spellAction);
                                    }}
                                  >
                                    Cast Spell
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center p-4 border border-dashed border-border rounded-md">
                            <p className="text-sm text-muted-foreground">No spells available</p>
                          </div>
                        )}
                      </TabsContent>
                      
                      <TabsContent value="abilities">
                        {(currentCharacter.abilities as any)?.length > 0 ? (
                          <div className="space-y-2">
                            {(currentCharacter.abilities as any)?.map((ability: any, index: number) => (
                              <div key={index} className="p-2 border border-border rounded-md">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium">{ability.name}</span>
                                </div>
                                
                                <p className="text-xs text-muted-foreground mt-1">
                                  {ability.description}
                                </p>
                                
                                <div className="flex items-center mt-2">
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="text-xs h-7"
                                    onClick={() => {
                                      // Example action for using ability
                                      const abilityAction = `${currentCharacter.name} uses ${ability.name}`;
                                      setPlayerInput(abilityAction);
                                    }}
                                  >
                                    Use Ability
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center p-4 border border-dashed border-border rounded-md">
                            <p className="text-sm text-muted-foreground">No abilities available</p>
                          </div>
                        )}
                      </TabsContent>
                    </Tabs>
                  </div>
                )}
                
                {/* Map Panel */}
                {rightPanelTab === "map" && (
                  <div>
                    <div className="mb-4 h-[300px] border border-border rounded-md overflow-hidden relative bg-muted">
                      <div className="absolute inset-0 flex items-center justify-center">
                        {/* Map placeholder - in a real implementation this would be the actual map component */}
                        <p className="text-sm text-muted-foreground">Adventure map would be displayed here</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Known Locations</h4>
                      <div className="p-2 border border-border rounded-md">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Current Location</span>
                          <span className="text-xs text-muted-foreground">
                            {currentAdventure?.location || "Unknown"}
                          </span>
                        </div>
                      </div>
                      
                      <div className="p-2 border border-border rounded-md">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Town</span>
                          <Button 
                            variant="link" 
                            size="sm" 
                            className="text-xs p-0 h-auto"
                            onClick={() => {
                              toast({
                                title: "View Location",
                                description: "Viewing this location on the map",
                              });
                            }}
                          >
                            View
                          </Button>
                        </div>
                      </div>
                      
                      <div className="p-2 border border-border rounded-md">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Dungeon</span>
                          <Button 
                            variant="link" 
                            size="sm" 
                            className="text-xs p-0 h-auto"
                            onClick={() => {
                              toast({
                                title: "View Location",
                                description: "Viewing this location on the map",
                              });
                            }}
                          >
                            View
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Battle Tracker Panel */}
                {rightPanelTab === "battle" && (
                  <div>
                    <div className="mb-4">
                      <h4 className="text-sm font-medium mb-2">Combat Status</h4>
                      <div className="p-2 border border-border rounded-md bg-destructive/10">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Battle in Progress</span>
                          <span className="text-xs bg-destructive/20 text-destructive px-1.5 py-0.5 rounded-full">
                            Round 2
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <h4 className="text-sm font-medium mb-2">Initiative Order</h4>
                      <div className="space-y-1">
                        <div className="p-2 border border-border rounded-md bg-primary/5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <span className="text-xs bg-primary text-white px-1.5 py-0.5 rounded-full mr-2">
                                20
                              </span>
                              <span className="text-sm font-medium">{currentCharacter.name}</span>
                            </div>
                            <span className="text-xs text-primary font-medium">
                              Current Turn
                            </span>
                          </div>
                        </div>
                        
                        <div className="p-2 border border-border rounded-md">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <span className="text-xs bg-muted px-1.5 py-0.5 rounded-full mr-2">
                                15
                              </span>
                              <span className="text-sm font-medium">Goblin Archer</span>
                            </div>
                            <span className="text-xs text-destructive">
                              Enemy
                            </span>
                          </div>
                        </div>
                        
                        <div className="p-2 border border-border rounded-md">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <span className="text-xs bg-muted px-1.5 py-0.5 rounded-full mr-2">
                                12
                              </span>
                              <span className="text-sm font-medium">Goblin Warrior</span>
                            </div>
                            <span className="text-xs text-destructive">
                              Enemy
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <h4 className="text-sm font-medium mb-2">Available Actions</h4>
                      <div className="grid grid-cols-2 gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-xs h-8 justify-start"
                          onClick={() => {
                            setPlayerInput("I attack the goblin archer with my sword");
                          }}
                        >
                          <Sword className="mr-1 h-3 w-3" />
                          Attack
                        </Button>
                        
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-xs h-8 justify-start"
                          onClick={() => {
                            setPlayerInput("I cast a spell at the goblin warrior");
                          }}
                        >
                          <HelpCircle className="mr-1 h-3 w-3" />
                          Cast Spell
                        </Button>
                        
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-xs h-8 justify-start"
                          onClick={() => {
                            setPlayerInput("I use a potion to heal myself");
                          }}
                        >
                          <ShieldAlert className="mr-1 h-3 w-3" />
                          Use Item
                        </Button>
                        
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-xs h-8 justify-start"
                          onClick={() => {
                            setPlayerInput("I try to hide behind the rock");
                          }}
                        >
                          <Backpack className="mr-1 h-3 w-3" />
                          Other
                        </Button>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium mb-2">Battle Log</h4>
                      <div className="h-48 overflow-y-auto border border-border rounded-md p-2 text-xs">
                        <p className="text-muted-foreground mb-1">You rolled 18 (15 + 3) for initiative</p>
                        <p className="text-muted-foreground mb-1">Battle begins!</p>
                        <p className="text-muted-foreground mb-1">Goblin Archer attacks you and misses</p>
                        <p className="text-muted-foreground mb-1">Goblin Warrior hits you for 3 damage</p>
                        <p className="text-muted-foreground mb-1">It's now your turn</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Character Progression Panel */}
                {rightPanelTab === "progression" && (
                  <div>
                    <div className="mb-4">
                      <h4 className="text-sm font-medium mb-2">Level Progression</h4>
                      <div className="p-2 border border-border rounded-md">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">Current Level</span>
                          <span className="text-xs text-primary font-medium">
                            {currentCharacter.level}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-muted-foreground">Experience Points</span>
                          <span className="text-xs text-muted-foreground">
                            {(currentCharacter as any).experience || 0}/
                            {currentCharacter.level * 300} XP
                          </span>
                        </div>
                        
                        <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                          <div 
                            className="bg-primary h-full" 
                            style={{ width: `${Math.min(100, ((currentCharacter as any).experience || 0) / (currentCharacter.level * 300) * 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <h4 className="text-sm font-medium mb-2">Level-Up Hints</h4>
                      <div className="p-3 border border-border rounded-md space-y-2">
                        <p className="text-sm">
                          <span className="font-medium">Gain Experience:</span> Complete quests, defeat enemies, 
                          and solve puzzles to earn XP.
                        </p>
                        
                        <p className="text-sm">
                          <span className="font-medium">Skill Improvements:</span> At level {currentCharacter.level + 1}, 
                          you'll be able to increase two ability scores by 1 point each.
                        </p>
                        
                        <p className="text-sm">
                          <span className="font-medium">New Abilities:</span> As a {currentCharacter.class}, 
                          you'll gain access to new class features at level {currentCharacter.level + 1}.
                        </p>
                        
                        <p className="text-sm">
                          <span className="font-medium">Hit Points:</span> You'll gain additional hit points 
                          based on your class and Constitution modifier.
                        </p>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium mb-2">Skill Development</h4>
                      <div className="space-y-2">
                        <div className="p-2 border border-border rounded-md">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Combat Skills</span>
                            <Button 
                              variant="link" 
                              size="sm" 
                              className="text-xs p-0 h-auto"
                              onClick={() => {
                                toast({
                                  title: "Skill Development",
                                  description: "Practice combat techniques to improve your attack rolls and damage output.",
                                });
                              }}
                            >
                              Tips
                            </Button>
                          </div>
                        </div>
                        
                        <div className="p-2 border border-border rounded-md">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Magic & Spells</span>
                            <Button 
                              variant="link" 
                              size="sm" 
                              className="text-xs p-0 h-auto"
                              onClick={() => {
                                toast({
                                  title: "Skill Development",
                                  description: "Study arcane knowledge and practice spellcasting to learn new spells and improve spell effectiveness.",
                                });
                              }}
                            >
                              Tips
                            </Button>
                          </div>
                        </div>
                        
                        <div className="p-2 border border-border rounded-md">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Social Interaction</span>
                            <Button 
                              variant="link" 
                              size="sm" 
                              className="text-xs p-0 h-auto"
                              onClick={() => {
                                toast({
                                  title: "Skill Development",
                                  description: "Engage in conversations, negotiations, and diplomacy to improve your Charisma-based skills.",
                                });
                              }}
                            >
                              Tips
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          {/* Narrative Content - Scrollable Area */}
          <div 
            ref={narrativeRef}
            className="flex-grow overflow-y-auto px-4 md:px-8 lg:px-12 xl:px-20 py-6 font-serif bg-[#fffbf0] text-[#2c2113]"
          >
            {/* Chapter Title */}
            {currentAdventure && (
              <div className="mb-8 text-center">
                <h2 className="text-2xl font-medieval text-primary">{currentAdventure.title}</h2>
                <div className="mt-1 mx-auto w-16 h-1 bg-primary/30 rounded-full"></div>
              </div>
            )}
            
            {/* Main Game Content */}
            <div className="max-w-prose mx-auto">
              {renderGameLogs()}
              
              {/* If there are no logs yet, show some placeholder text with D&D tooltips */}
              {gameLogs.length === 0 && currentAdventure && (
                <div className="text-lg leading-relaxed mb-6">
                  <DndTextAnalyzer 
                    text={currentAdventure.description || "Your adventure begins..."} 
                    showAsPopover={true} 
                  />
                </div>
              )}
              
              {/* Interactive Dice Suggestions */}
              {currentCharacter && gameLogs.length > 0 && gameLogs[0].type === 'narrative' && (
                <InteractiveDiceSuggestions
                  content={gameLogs[0].content}
                  character={currentCharacter}
                  onRollComplete={handleDiceRoll}
                />
              )}
              
              {/* Show dice roller if enabled */}
              {showDiceRoller && (
                <div className="my-6 p-4 border border-border rounded-lg bg-white">
                  <h3 className="text-lg font-medium mb-3 flex items-center">
                    <DicesIcon className="mr-2 h-4 w-4" />
                    Dice Roller
                  </h3>
                  <DiceRoller
                    characterName={currentCharacter.name}
                    onRollResult={handleDiceRoll}
                    characterModifiers={currentCharacter.stats as any}
                  />
                </div>
              )}
              
              {/* Processing indicator */}
              {isProcessing && (
                <div className="flex items-center justify-center my-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
                  <span>The story continues...</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Player Input Area */}
          <div className="border-t border-border p-4 bg-white">
            <div className="max-w-prose mx-auto">
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSubmitAction();
                }}
                className="flex gap-2"
              >
                <Textarea 
                  placeholder={`What will ${currentCharacter.name} do next?`}
                  value={playerInput}
                  onChange={(e) => setPlayerInput(e.target.value)}
                  className="flex-grow min-h-12 resize-none"
                  disabled={isProcessing}
                />
                <Button 
                  type="submit" 
                  size="icon" 
                  className="h-12 w-12"
                  disabled={!playerInput.trim() || isProcessing}
                >
                  {isProcessing ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}