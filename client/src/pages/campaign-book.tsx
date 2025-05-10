import { useState, useEffect, useRef, useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { MessageSquare, X, Save, Map, Dice5, Settings, ChevronDown, ChevronUp, Briefcase, Dices as DicesIcon, Book, Users, MessageCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation, useParams } from "wouter";
import { BotCompanion } from "@/components/bot-companion";
import { AddCharacterDialog } from "@/components/add-character-dialog";
import { CampaignSettingsDialog } from "@/components/campaign-settings-dialog";
import { InteractiveSkillChecks } from "@/components/interactive-skill-checks";
import { DiceRoll } from "@/components/dice-roll";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LootCollectionPanel } from "@/components/loot-collection-panel";
import { useCombatDetection } from "@/hooks/use-combat-detection";
import { AdventureMapPanel } from "@/components/adventure-map-panel";

// Campaign book / main adventure interface
export default function CampaignPage() {
  const [, setLocation] = useLocation();
  const { campaignId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const narrativeRef = useRef<HTMLDivElement>(null);
  
  // State for the campaign page
  const [showAddCharacterDialog, setShowAddCharacterDialog] = useState(false);
  const [isAutoDmMode, setIsAutoDmMode] = useState(true); // Auto-DM is enabled by default
  const [showDiceRoller, setShowDiceRoller] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [rightPanelTab, setRightPanelTab] = useState<string | null>(null);
  const [selectedCharacterId, setSelectedCharacterId] = useState<number | null>(null);
  const [playerInput, setPlayerInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasUnclaimedLoot, setHasUnclaimedLoot] = useState(false);
  const [isAutoRollEnabled, setIsAutoRollEnabled] = useState(() => {
    // Try to load saved auto-roll setting from local storage, default to true if not found
    const savedSetting = localStorage.getItem('autoRollEnabled');
    return savedSetting ? savedSetting === 'true' : true;
  });
  const [fontSizeMultiplier, setFontSizeMultiplier] = useState(() => {
    // Try to load saved font size from local storage, default to 1 if not found
    const savedSize = localStorage.getItem('narrativeFontSize');
    return savedSize ? parseFloat(savedSize) : 1;
  });
  const [shouldScrollToLatest, setShouldScrollToLatest] = useState(true);
  
  // NPC characters that have joined the party
  const [npcPartyMembers, setNpcPartyMembers] = useState([]);

  
  // Show campaign settings dialog
  const [showSettings, setShowSettings] = useState(false);

  // Campaign data query
  const {
    data: campaign,
    isLoading: campaignLoading,
    error: campaignError,
  } = useQuery({
    queryKey: [`/api/campaigns/${campaignId}`],
    enabled: !!campaignId
  });

  // Campaign characters query
  const {
    data: campaignCharacters = [],
    isLoading: charactersLoading,
    error: charactersError,
  } = useQuery({
    queryKey: [`/api/campaigns/${campaignId}/characters`],
    enabled: !!campaignId
  });

  // Campaign game logs query
  const {
    data: gameLogs = [],
    isLoading: logsLoading,
    error: logsError,
  } = useQuery({
    queryKey: [`/api/campaigns/${campaignId}/logs`],
    enabled: !!campaignId
  });

  // Get user's player character in this campaign
  const userCharacter = useMemo(() => {
    if (!user || !campaignCharacters.length) return null;
    return campaignCharacters.find(
      (char) => char.userId === user.id && !char.isBot
    );
  }, [user, campaignCharacters]);

  // Get map locations
  const {
    data: mapLocations = [],
    isLoading: locationsLoading,
    error: locationsError,
  } = useQuery({
    queryKey: [`/api/campaigns/${campaignId}/map-locations`],
    enabled: !!campaignId
  });

  // Get map paths
  const {
    data: mapPaths = [],
    isLoading: pathsLoading,
    error: pathsError,
  } = useQuery({
    queryKey: [`/api/campaigns/${campaignId}/map-paths`],
    enabled: !!campaignId
  });

  // Get comments 
  const {
    data: comments = [],
    isLoading: commentsLoading,
    error: commentsError,
  } = useQuery({
    queryKey: [`/api/campaigns/${campaignId}/comments`],
    enabled: !!campaignId && rightPanelTab === "comments"
  });

  // Get loot items
  const {
    data: lootItems = [],
    isLoading: itemsLoading,
    error: itemsError,
  } = useQuery({
    queryKey: [`/api/campaigns/${campaignId}/loot`],
    enabled: !!campaignId && rightPanelTab === "loot"
  });

  // Mutation for adding player input (action)
  const playerActionMutation = useMutation({
    mutationFn: async (input: string) => {
      setIsProcessing(true);
      
      try {
        // Add player action to logs
        const actionResponse = await apiRequest(
          "POST",
          `/api/campaigns/${campaignId}/logs`,
          {
            content: input,
            type: "player",
            timestamp: new Date()
          }
        );
        
        if (!actionResponse.ok) {
          throw new Error("Failed to add player action");
        }
        
        // Generate DM response
        const dmResponse = await apiRequest(
          "POST",
          `/api/campaigns/${campaignId}/generate-response`,
          { 
            playerAction: input,
            isAutoAdvance: isAutoDmMode
          }
        );
        
        if (!dmResponse.ok) {
          throw new Error("Failed to generate DM response");
        }
        
        return await dmResponse.json();
      } catch (error) {
        console.error("Error in player action:", error);
        throw error;
      } finally {
        setIsProcessing(false);
      }
    },
    onSuccess: (data) => {
      // Clear player input
      setPlayerInput("");
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({
        queryKey: [`/api/campaigns/${campaignId}/logs`],
      });
      
      // If auto-advancing, refresh map locations and loot items
      if (isAutoDmMode) {
        queryClient.invalidateQueries({
          queryKey: [`/api/campaigns/${campaignId}/map-locations`],
        });
        
        queryClient.invalidateQueries({
          queryKey: [`/api/campaigns/${campaignId}/map-paths`],
        });
        
        queryClient.invalidateQueries({
          queryKey: [`/api/campaigns/${campaignId}/loot`],
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Action Failed",
        description: `Failed to process your action: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Detect combat and loot from narrative
  const { detectedLoot } = useCombatDetection(
    // Join all narrative logs content
    gameLogs
      .filter(log => log.type === "narrative")
      .map(log => log.content)
      .join(" ")
  );

  // Update hasUnclaimedLoot state when we detect loot
  useEffect(() => {
    if (detectedLoot && detectedLoot.length > 0) {
      setHasUnclaimedLoot(true);
    }
  }, [detectedLoot]);

  // Save font size multiplier to local storage when it changes
  useEffect(() => {
    localStorage.setItem('narrativeFontSize', fontSizeMultiplier.toString());
  }, [fontSizeMultiplier]);
  
  // Save auto roll setting to local storage when it changes
  useEffect(() => {
    localStorage.setItem('autoRollEnabled', isAutoRollEnabled.toString());
  }, [isAutoRollEnabled]);

  // Handle player input submission
  const handleSubmitAction = async (e) => {
    e.preventDefault();
    
    if (!playerInput.trim()) {
      toast({
        title: "Empty Action",
        description: "Please enter an action before submitting.",
        variant: "destructive",
      });
      return;
    }
    
    if (!userCharacter) {
      toast({
        title: "No Character",
        description: "You need to add a character to the campaign first!",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await playerActionMutation.mutateAsync(playerInput);
    } catch (error) {
      console.error("Action submission error:", error);
    }
  };

  // Handle skill check roll
  const handleSkillCheckRoll = (skill, roll, modifier, dc) => {
    // Create a formatted roll result message
    const success = dc ? (roll + modifier >= dc) : undefined;
    const resultMessage = dc 
      ? `${userCharacter?.name} rolled a ${roll} + ${modifier} = ${roll + modifier} for ${skill} check ${success ? '(Success!)' : '(Failure)'}`
      : `${userCharacter?.name} rolled a ${roll} + ${modifier} = ${roll + modifier} for ${skill} check`;
    
    // Add roll to logs
    apiRequest(
      "POST",
      `/api/campaigns/${campaignId}/logs`,
      {
        content: resultMessage,
        type: "roll"
      }
    ).then(() => {
      // Refresh logs
      queryClient.invalidateQueries({
        queryKey: [`/api/campaigns/${campaignId}/logs`],
      });
    }).catch(error => {
      console.error("Failed to log skill check:", error);
    });
  };

  // Handle adjusting font size
  const handleFontSizeAdjust = (increase: boolean) => {
    setFontSizeMultiplier(prev => {
      // Limit the range from 0.8 to 1.5
      const newSize = increase ? prev + 0.1 : prev - 0.1;
      return Math.max(0.8, Math.min(1.5, newSize));
    });
  };

  // Handle character added to campaign
  const handleCharacterAdded = () => {
    queryClient.invalidateQueries({
      queryKey: [`/api/campaigns/${campaignId}/characters`],
    });
  };

  // Title for the right panel tab
  const getRightPanelTitle = () => {
    switch (rightPanelTab) {
      case "map": return "Adventure Map";
      case "chat": return "Bot Companion";
      case "roll": return "Dice Roller";
      case "characters": return "Party Members";
      case "loot": return "Treasure & Loot";
      case "comments": return "Campaign Notes";
      default: return "";
    }
  };

  const handleToggleRightPanel = (tab: string | null) => {
    if (rightPanelTab === tab) {
      setRightPanelTab(null); // Close if same tab is clicked
    } else {
      setRightPanelTab(tab); // Open new tab
    }
  };

  // If loading, show loading state
  if (campaignLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin mb-4 mx-auto w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
          <p className="text-lg">Loading campaign...</p>
        </div>
      </div>
    );
  }

  // If error, show error state
  if (campaignError) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6 bg-destructive/10 rounded-lg">
          <h1 className="text-2xl font-bold text-destructive mb-4">Error Loading Campaign</h1>
          <p className="mb-4">We couldn't load the campaign information. This might be because:</p>
          <ul className="list-disc text-left ml-8 mb-6">
            <li>The campaign doesn't exist</li>
            <li>You don't have permission to view this campaign</li>
            <li>There was a server error</li>
          </ul>
          <div className="flex justify-center gap-4">
            <Button variant="outline" onClick={() => window.location.reload()}>
              Try Again
            </Button>
            <Button onClick={() => setLocation("/campaigns")}>
              Back to Campaigns
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-parchment">
      {/* Top navigation */}
      <div className="flex-none border-b border-amber-200 bg-amber-50/80 p-2 md:p-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/campaigns")}
              className="text-amber-900 hover:text-amber-700 hover:bg-amber-100"
            >
              &larr; Back
            </Button>
            <h1 className="text-lg md:text-xl font-bold text-amber-900 truncate">
              {campaign?.title || "Campaign"}
            </h1>
          </div>
          
          <div className="flex items-center gap-1 md:gap-2">
            {/* Add character */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddCharacterDialog(true)}
                    className="border-amber-300 hover:bg-amber-100 text-amber-900"
                  >
                    <Users className="h-4 w-4 mr-1 md:mr-2" />
                    <span className="hidden md:inline">Add Character</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Add a character to this campaign</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            {/* Campaign settings */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSettings(true)}
                    className="border-amber-300 hover:bg-amber-100 text-amber-900"
                  >
                    <Settings className="h-4 w-4 mr-1 md:mr-2" />
                    <span className="hidden md:inline">Settings</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Campaign settings</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            {/* Toggle map */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={rightPanelTab === "map" ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleToggleRightPanel("map")}
                    className={rightPanelTab === "map" 
                      ? "bg-amber-700 hover:bg-amber-600" 
                      : "border-amber-300 hover:bg-amber-100 text-amber-900"}
                  >
                    <Map className="h-4 w-4 mr-1 md:mr-2" />
                    <span className="hidden md:inline">Map</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>View adventure map</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            {/* Characters panel */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={rightPanelTab === "characters" ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleToggleRightPanel("characters")}
                    className={rightPanelTab === "characters" 
                      ? "bg-amber-700 hover:bg-amber-600" 
                      : "border-amber-300 hover:bg-amber-100 text-amber-900"}
                  >
                    <Users className="h-4 w-4 mr-1 md:mr-2" />
                    <span className="hidden md:inline">Party</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>View party members</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            {/* Loot panel */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={rightPanelTab === "loot" ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleToggleRightPanel("loot")}
                    className={`
                      ${rightPanelTab === "loot" 
                        ? "bg-amber-700 hover:bg-amber-600" 
                        : "border-amber-300 hover:bg-amber-100 text-amber-900"}
                      ${hasUnclaimedLoot ? "animate-pulse relative" : ""}
                    `}
                  >
                    <Briefcase className="h-4 w-4 mr-1 md:mr-2" />
                    <span className="hidden md:inline">Loot</span>
                    {hasUnclaimedLoot && (
                      <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>View available loot{hasUnclaimedLoot ? " (unclaimed items!)" : ""}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            {/* Comments */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={rightPanelTab === "comments" ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleToggleRightPanel("comments")}
                    className={rightPanelTab === "comments" 
                      ? "bg-amber-700 hover:bg-amber-600" 
                      : "border-amber-300 hover:bg-amber-100 text-amber-900"}
                  >
                    <MessageCircle className="h-4 w-4 mr-1 md:mr-2" />
                    <span className="hidden md:inline">Notes</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Campaign notes and comments</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            {/* Bot companion */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={rightPanelTab === "chat" ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleToggleRightPanel("chat")}
                    className={rightPanelTab === "chat" 
                      ? "bg-amber-700 hover:bg-amber-600" 
                      : "border-amber-300 hover:bg-amber-100 text-amber-900"}
                  >
                    <MessageSquare className="h-4 w-4 mr-1 md:mr-2" />
                    <span className="hidden md:inline">Helper</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Chat with bot companion</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            {/* Dice Roller */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={rightPanelTab === "roll" ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleToggleRightPanel("roll")}
                    className={rightPanelTab === "roll" 
                      ? "bg-amber-700 hover:bg-amber-600" 
                      : "border-amber-300 hover:bg-amber-100 text-amber-900"}
                  >
                    <Dice5 className="h-4 w-4 mr-1 md:mr-2" />
                    <span className="hidden md:inline">Roll</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Roll dice</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            {/* Font Size Buttons */}
            <div className="hidden md:flex items-center gap-1 pl-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleFontSizeAdjust(false)}
                      className="h-8 w-8 p-0 text-amber-900"
                      disabled={fontSizeMultiplier <= 0.8}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Decrease font size</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <span className="text-xs text-muted-foreground">
                Text Size
              </span>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm" 
                      onClick={() => handleFontSizeAdjust(true)}
                      className="h-8 w-8 p-0 text-amber-900"
                      disabled={fontSizeMultiplier >= 1.5}
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Increase font size</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main content - flexbox with left-center-right layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Right panel (conditional) */}
        {rightPanelTab && (
          <div className="hidden lg:block flex-none w-[400px] border-l border-amber-200 bg-amber-50/60 overflow-y-auto">
            <div className="p-4 border-b border-amber-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-amber-900">
                {getRightPanelTitle()}
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setRightPanelTab(null)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="p-4 h-full overflow-y-auto">
              {rightPanelTab === "map" && (
                <AdventureMapPanel 
                  campaignId={parseInt(campaignId)} 
                  locations={mapLocations} 
                  paths={mapPaths}
                  isLoading={locationsLoading || pathsLoading}
                  campaign={campaign}
                />
              )}
              
              {rightPanelTab === "chat" && (
                <BotCompanion 
                  campaignId={parseInt(campaignId)} 
                  userCharacter={userCharacter} 
                  campaign={campaign}
                />
              )}
              
              {rightPanelTab === "roll" && (
                <DiceRoll
                  campaignId={parseInt(campaignId)}
                  character={userCharacter}
                />
              )}
              
              {rightPanelTab === "characters" && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Player Characters</h3>
                  <div className="space-y-3">
                    {campaignCharacters.filter(c => !c.isBot).map(character => (
                      <div key={character.id} className="border rounded-lg p-3 bg-card">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-bold text-amber-900">{character.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              Level {character.level} {character.race} {character.class}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full">
                              HP: {character.hp}/{character.maxHp}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* NPC Party Members */}
                  <h3 className="text-lg font-semibold border-b pb-2 mt-6">NPC Companions</h3>
                  <div className="space-y-3">
                    {campaignCharacters.filter(c => c.isBot).map(character => (
                      <div key={character.id} className="border rounded-lg p-3 bg-card">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-bold text-amber-900">{character.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              Level {character.level} {character.race} {character.class}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full">
                              HP: {character.hp}/{character.maxHp}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {campaignCharacters.filter(c => c.isBot).length === 0 && (
                      <div className="text-center p-4 border border-dashed rounded-lg">
                        <p className="text-muted-foreground text-sm">No NPC companions in the party yet</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {rightPanelTab === "loot" && (
                <LootCollectionPanel 
                  characterId={userCharacter?.id || 0} 
                  availableLoot={detectedLoot || []}
                  onLootCollected={() => setHasUnclaimedLoot(false)}
                />
              )}
              
              {rightPanelTab === "comments" && (
                <div className="space-y-4">
                  <div className="space-y-3">
                    {comments.map(comment => (
                      <div key={comment.id} className="border rounded-lg p-3 bg-card">
                        <p className="text-sm text-muted-foreground mb-1">
                          {comment.authorName} • {new Date(comment.createdAt).toLocaleDateString()}
                        </p>
                        <p>{comment.content}</p>
                      </div>
                    ))}
                    
                    {comments.length === 0 && (
                      <div className="text-center p-6 border border-dashed rounded-lg">
                        <p className="text-muted-foreground mb-2">No campaign notes yet</p>
                        <Button size="sm">Add Note</Button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Main book area - central part that takes remaining space */}
        <div className="flex-1 flex flex-col overflow-hidden bg-parchment relative">
          {/* Book UI - fixed aspect ratio container with book styling */}
          <div className="flex-1 flex flex-col overflow-hidden border-amber-200 bg-parchment relative">
            {/* Book content - scrollable area */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Narrative content with explicit scrollbar */}
              <div 
                className="h-full overflow-y-scroll p-4 scrollbar scrollbar-thumb-amber-300 scrollbar-track-amber-50" 
                ref={narrativeRef}
                style={{
                  scrollbarWidth: 'thin', // Firefox
                  WebkitOverflowScrolling: 'touch', // iOS momentum scrolling
                }}
              >
                {/* Game logs */}
                <div className="max-w-3xl mx-auto">
                  {/* Game narration */}
                  <div className="relative mb-8">
                    {/* Visual timeline */}
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-100 rounded-full">
                      <div className="w-1 bg-amber-300 rounded-full" style={{
                        height: '33%'
                      }}></div>
                    </div>
                    
                    {/* Progress indicators showing new vs. old content */}
                    <div className="absolute left-0 top-0 flex flex-col items-center -translate-x-1/2">
                      <div className="px-2 py-1 bg-amber-100 rounded-md text-xs font-medium text-amber-700 whitespace-nowrap">
                        Start of Adventure
                      </div>
                    </div>
                    
                    <div className="absolute left-0 bottom-0 flex flex-col items-center -translate-x-1/2">
                      <div className="px-2 py-1 bg-amber-400 rounded-md text-xs font-medium text-amber-900 whitespace-nowrap border border-amber-500/30 shadow-sm">
                        Current Moment
                      </div>
                    </div>
                    
                    {/* Map logs to messages */}
                    {gameLogs.map((log, index, array) => {
                      // Calculate if this is a "new" entry (one of the 3 most recent narrative logs)
                      const narrativeLogs = array.filter(l => l.type === "narrative");
                      const recentNarrativeIds = narrativeLogs.slice(0, 3).map(l => l.id);
                      const isRecentNarrative = log.type === "narrative" && recentNarrativeIds.includes(log.id);
                      
                      // Format the timestamp if available
                      const timestamp = log.timestamp 
                        ? new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
                        : '';
                      
                      return (
                        <div 
                          key={log.id || index} 
                          className={`mb-8 pl-6 relative ${isRecentNarrative ? 'bg-amber-50/70 p-4 rounded-lg border-l-4 border-amber-300' : ''}`}
                          id={`log-${log.id}`}
                          ref={index === 0 ? (el) => { if (el && shouldScrollToLatest) el.scrollIntoView({ behavior: 'smooth' }); } : undefined}
                        >
                          {/* Timeline node */}
                          <div className="absolute left-0 top-0 flex flex-col items-center">
                            <div className={`h-3 w-3 rounded-full ${isRecentNarrative ? 'bg-amber-400' : 'bg-amber-200'}`}></div>
                            {timestamp && (
                              <div className="text-xs text-muted-foreground mt-1 rotate-270 transform origin-center whitespace-nowrap">
                                {timestamp}
                              </div>
                            )}
                          </div>
                          
                          {log.type === "player" && (
                            <div className="mb-4 text-right">
                              <div className="inline-block bg-primary/10 text-primary rounded-lg py-2 px-3">
                                <p style={{ 
                                  fontSize: `${1 * fontSizeMultiplier}rem`,
                                  lineHeight: 1.5
                                }}>
                                  {log.content}
                                </p>
                              </div>
                            </div>
                          )}
                          
                          {log.type === "narrative" && (
                            <div className="mb-4">
                              <div className="text-gray-800">
                                <InteractiveSkillChecks 
                                  content={log.content}
                                  autoRoll={isAutoRollEnabled}
                                  onRollSkillCheck={handleSkillCheckRoll}
                                  character={userCharacter}
                                />
                              </div>
                            </div>
                          )}
                          
                          {log.type === "roll" && (
                            <div className="mb-2">
                              <div className="inline-block bg-muted rounded-lg py-2 px-3 text-sm">
                                <p className="flex items-center" style={{ 
                                  fontSize: `${0.9 * fontSizeMultiplier}rem`,
                                  lineHeight: 1.5
                                }}>
                                  <DicesIcon className="h-4 w-4 mr-1 text-primary" style={{
                                    height: `${1 * fontSizeMultiplier}em`,
                                    width: `${1 * fontSizeMultiplier}em`
                                  }} />
                                  {log.content}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Bottom fixed action bar - Never scrolls, auto-height based on content */}
            <div className="border-t border-amber-200/50 bg-amber-50/30 flex-none">
              <div className="p-4">
                <div className="max-w-3xl mx-auto">
                  <form onSubmit={handleSubmitAction}>
                    <div className="flex items-start gap-2">
                      <div className="flex-1">
                        <Textarea
                          placeholder={userCharacter ? "Describe your action..." : "Add a character to this campaign first!"}
                          className="min-h-[80px] resize-none bg-white border-amber-200"
                          value={playerInput}
                          onChange={(e) => setPlayerInput(e.target.value)}
                          disabled={!userCharacter || isProcessing}
                          style={{ fontSize: `${fontSizeMultiplier}rem` }}
                        />
                        <div className="flex justify-between items-center mt-2">
                          <div className="flex items-center space-x-2">
                            <label className="flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={isAutoRollEnabled}
                                onChange={(e) => setIsAutoRollEnabled(e.target.checked)}
                              />
                              <div className="relative w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/50 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                              <span className="ml-2 text-sm font-medium text-muted-foreground">Auto-roll dice</span>
                            </label>
                          </div>
                          
                          <div className="flex gap-2">
                            <Button
                              type="submit"
                              disabled={!userCharacter || isProcessing || !playerInput.trim()}
                              className="font-semibold"
                            >
                              {isProcessing ? (
                                <>
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                  Processing...
                                </>
                              ) : (
                                "Submit Action"
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Right panel for mobile - conditional at bottom, fixed position */}
        {rightPanelTab && (
          <div className="lg:hidden fixed inset-0 bg-black/50 z-40 flex flex-col">
            <div className="flex-1" onClick={() => setRightPanelTab(null)}></div>
            <div className="max-h-[80vh] overflow-y-auto bg-parchment border-t border-amber-300 rounded-t-xl">
              <div className="p-4 border-b border-amber-200 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-amber-900">
                  {getRightPanelTitle()}
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setRightPanelTab(null)}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="p-4 max-h-[70vh] overflow-y-auto">
                {/* Same content as desktop but in a slide-up panel */}
                {rightPanelTab === "map" && (
                  <AdventureMapPanel 
                    campaignId={parseInt(campaignId)} 
                    locations={mapLocations} 
                    paths={mapPaths}
                    isLoading={locationsLoading || pathsLoading}
                    campaign={campaign}
                  />
                )}
                
                {rightPanelTab === "chat" && (
                  <BotCompanion 
                    campaignId={parseInt(campaignId)} 
                    userCharacter={userCharacter} 
                    campaign={campaign}
                  />
                )}
                
                {rightPanelTab === "roll" && (
                  <DiceRoll
                    campaignId={parseInt(campaignId)}
                    character={userCharacter}
                  />
                )}
                
                {rightPanelTab === "characters" && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold border-b pb-2">Player Characters</h3>
                    <div className="space-y-3">
                      {campaignCharacters.filter(c => !c.isBot).map(character => (
                        <div key={character.id} className="border rounded-lg p-3 bg-card">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-bold text-amber-900">{character.name}</h4>
                              <p className="text-sm text-muted-foreground">
                                Level {character.level} {character.race} {character.class}
                              </p>
                            </div>
                            <div className="flex items-center gap-1">
                              <div className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full">
                                HP: {character.hp}/{character.maxHp}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* NPC Party Members */}
                    <h3 className="text-lg font-semibold border-b pb-2 mt-6">NPC Companions</h3>
                    <div className="space-y-3">
                      {campaignCharacters.filter(c => c.isBot).map(character => (
                        <div key={character.id} className="border rounded-lg p-3 bg-card">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-bold text-amber-900">{character.name}</h4>
                              <p className="text-sm text-muted-foreground">
                                Level {character.level} {character.race} {character.class}
                              </p>
                            </div>
                            <div className="flex items-center gap-1">
                              <div className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full">
                                HP: {character.hp}/{character.maxHp}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {campaignCharacters.filter(c => c.isBot).length === 0 && (
                        <div className="text-center p-4 border border-dashed rounded-lg">
                          <p className="text-muted-foreground text-sm">No NPC companions in the party yet</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {rightPanelTab === "loot" && (
                  <LootCollectionPanel 
                    characterId={userCharacter?.id || 0} 
                    availableLoot={detectedLoot || []}
                    onLootCollected={() => setHasUnclaimedLoot(false)}
                  />
                )}
                
                {rightPanelTab === "comments" && (
                  <div className="space-y-4">
                    <div className="space-y-3">
                      {comments.map(comment => (
                        <div key={comment.id} className="border rounded-lg p-3 bg-card">
                          <p className="text-sm text-muted-foreground mb-1">
                            {comment.authorName} • {new Date(comment.createdAt).toLocaleDateString()}
                          </p>
                          <p>{comment.content}</p>
                        </div>
                      ))}
                      
                      {comments.length === 0 && (
                        <div className="text-center p-6 border border-dashed rounded-lg">
                          <p className="text-muted-foreground mb-2">No campaign notes yet</p>
                          <Button size="sm">Add Note</Button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Character dialog */}
      <AddCharacterDialog
        campaignId={parseInt(campaignId)}
        open={showAddCharacterDialog}
        onOpenChange={setShowAddCharacterDialog}
        onCharacterAdded={handleCharacterAdded}
      />
      
      {/* Settings dialog */}
      <CampaignSettingsDialog
        campaign={campaign}
        open={showSettings}
        onOpenChange={setShowSettings}
      />
    </div>
  );
}