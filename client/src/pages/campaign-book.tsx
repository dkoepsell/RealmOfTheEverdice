import { useState, useEffect, useRef, useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { InventoryManagerWithApparel } from "@/components/inventory-management-with-apparel";
import { CharacterInventoryButton } from "@/components/character-inventory-button";
import CharacterPanel from "@/components/character-panel";
import CharactersPanel from "@/components/characters-panel";
import { MessageSquare, X, Save, Map, Dice5, Settings, ChevronDown, ChevronUp, Briefcase, Dices as DicesIcon, Book, Users, MessageCircle, Clock, CalendarDays, ClipboardList, Backpack, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation, useParams } from "wouter";
import { BotCompanion } from "@/components/bot-companion";
import { AddCharacterDialog } from "@/components/add-character-dialog";
import { CampaignSettingsDialog } from "@/components/campaign-settings-dialog";
import { InteractiveSkillChecks } from "@/components/interactive-skill-checks";
import { DiceRoller } from "@/components/dice-roll";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LootCollectionPanel } from "@/components/loot-collection-panel";
import { useCombatDetection } from "@/hooks/use-combat-detection";
import { AdventureMapPanel } from "@/components/adventure-map-panel";
import { ModeToggle } from "@/components/mode-toggle";

// Campaign book / main adventure interface
export default function CampaignPage() {
  const [, setLocation] = useLocation();
  // Use the correct type for wouter params (no TS typings)
  const params = useParams() as {id: string};
  const campaignIdParam = params.id;
  
  // Parse and validate campaign ID ensuring it's always a valid number
  const parsedId = campaignIdParam ? parseInt(campaignIdParam, 10) : 0;
  // Ensure campaignId is a positive number greater than 0
  const campaignId = !isNaN(parsedId) && parsedId > 0 ? parsedId : 0;
  
  // Log campaign ID for debugging
  useEffect(() => {
    console.log("Campaign book received campaignId param:", campaignIdParam, "| parsed as:", campaignId);
    // Extra validation
    if (campaignId <= 0) {
      console.error("Invalid campaign ID in URL, showing error UI. Raw param:", campaignIdParam);
    }
  }, [campaignIdParam, campaignId]);
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
  
  // Log campaign data when it changes
  useEffect(() => {
    if (campaign) {
      console.log("Campaign data loaded successfully:", campaign.title);
    }
    if (campaignError) {
      console.error("Error loading campaign data:", campaignError);
    }
  }, [campaign, campaignError]);
  
  // Check if the current user is the DM of this campaign
  const isDm = campaign && user && campaign.dmId === user.id;

  // Remove character mutation
  const removeCharacterMutation = useMutation({
    mutationFn: async (characterId: number) => {
      await apiRequest('DELETE', `/api/campaigns/${campaignId}/characters/${characterId}`);
    },
    onSuccess: () => {
      // Refresh character list
      queryClient.invalidateQueries({ queryKey: [`/api/campaigns/${campaignId}/characters`] });
      toast({
        title: "Character removed",
        description: "The character has been removed from this campaign",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to remove character",
        description: error.message || "An error occurred while removing the character",
        variant: "destructive",
      });
    }
  });

  // Campaign characters query with explicit typing and error handling
  const {
    data: campaignCharacters = [],
    isLoading: charactersLoading,
    error: charactersError,
  } = useQuery<any[]>({
    queryKey: [`/api/campaigns/${campaignId}/characters`],
    enabled: !!campaignId,
    onError: (error) => {
      console.error("Failed to fetch campaign characters:", error);
      toast({
        title: "Warning: Unable to load characters",
        description: "There was a problem loading character information. Some features may be limited.",
        variant: "destructive",
      });
    }
  });

  // Campaign game logs query with improved error handling
  const {
    data: gameLogs = [],
    isLoading: logsLoading,
    error: logsError,
    refetch: refetchLogs
  } = useQuery({
    queryKey: [`/api/campaigns/${campaignId}/logs`],
    enabled: !!campaignId,
    retry: 3,
    retryDelay: 1000,
    onError: (error) => {
      console.error("Failed to fetch game logs:", error);
      // Don't show the toast so we don't disrupt the user experience
      // The GameArea component will handle the empty state gracefully
    }
  });

  // Get user's player character in this campaign
  const userCharacter = useMemo(() => {
    if (!user || !campaignCharacters.length) return null;
    
    // Debug logging to help diagnose the issue
    console.log("Looking for character for user:", user?.id);
    console.log("Available campaign characters:", campaignCharacters);
    
    // Match by user ID
    const character = campaignCharacters.find(
      (char) => char.userId === user.id && !char.isBot
    );
    
    console.log("Found character:", character);
    return character;
  }, [user, campaignCharacters]);

  // Get map locations
  const validMapCampaignId = campaignId && !isNaN(parseInt(campaignId)) ? parseInt(campaignId) : 0;
  const {
    data: mapLocations = [],
    isLoading: locationsLoading,
    error: locationsError,
  } = useQuery({
    queryKey: [`/api/campaigns/${validMapCampaignId}/map/locations`],
    enabled: !!validMapCampaignId
  });

  // Get map paths
  const {
    data: mapPaths = [],
    isLoading: pathsLoading,
    error: pathsError,
  } = useQuery({
    queryKey: [`/api/campaigns/${validMapCampaignId}/map/paths`],
    enabled: !!validMapCampaignId
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
        
        // Refresh the logs after adding player action
        await queryClient.invalidateQueries({
          queryKey: [`/api/campaigns/${campaignId}/logs`],
        });
        
        // Generate DM response
        try {
          const dmResponse = await apiRequest(
            "POST",
            `/api/campaigns/${campaignId}/generate-response`,
            { 
              playerAction: input,
              isAutoAdvance: isAutoDmMode
            }
          );
          
          const responseData = await dmResponse.json();
          
          // Refresh logs again to get the narrative response
          await queryClient.invalidateQueries({
            queryKey: [`/api/campaigns/${campaignId}/logs`],
          });
          
          return {
            success: true,
            ...responseData
          };
        } catch (dmError) {
          console.error("Error generating DM response:", dmError);
          
          // Instead of directly manipulating state, log the error and handle gracefully
          // We'll create a manual log entry when this function returns
          console.warn("Will create fallback message for failed DM response");
          
          // Return a fallback response with a flag that indicates we need to create a fallback message
          return { 
            success: false,
            needsFallbackMessage: true,
            error: dmError instanceof Error ? dmError.message : "Unknown error" 
          };
        }
      } catch (error) {
        console.error("Error in player action:", error instanceof Error ? error.message : error);
        
        // Show toast notification
        toast({
          title: "Action Failed",
          description: "There was an error submitting your action. Please try again.",
          variant: "destructive",
        });
        
        throw error;
      } finally {
        setIsProcessing(false);
      }
    },
    onSuccess: async (data) => {
      // Clear player input
      setPlayerInput("");
      
      // Check if we need to create a fallback message due to DM response failure
      if (data.needsFallbackMessage) {
        console.log("Creating fallback message for failed DM response");
        try {
          // Add the fallback narrative response through the API
          await apiRequest(
            "POST",
            `/api/campaigns/${campaignId}/logs`,
            {
              content: "The Dungeon Master pauses for a moment, considering your action. \"That's an interesting approach! Let me think about how that plays out...\" (There was an issue generating the AI response. Try again in a moment.)",
              type: "narrative",
              timestamp: new Date()
            }
          );
        } catch (fallbackError) {
          console.error("Failed to add fallback message:", fallbackError);
        }
      }
      
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
    onError: async (error) => {
      console.error("Action submission error:", error);
      setPlayerInput(""); // Clear the input even on error for better UX
      
      toast({
        title: "Action Failed",
        description: "There was an issue with the Dungeon Master's response. Your action was recorded.",
        variant: "destructive",
      });
      
      // Add fallback response through the API instead of direct state manipulation
      try {
        // First, ensure player input is recorded
        await apiRequest(
          "POST",
          `/api/campaigns/${campaignId}/logs`,
          {
            content: playerInput,
            type: "player",
            timestamp: new Date()
          }
        );
        
        // Then add the fallback narrative response
        await apiRequest(
          "POST",
          `/api/campaigns/${campaignId}/logs`,
          {
            content: "The Dungeon Master pauses for a moment, considering your action. \"That's an interesting approach! Let me think about how that plays out...\" (There was an issue generating the AI response. Try again in a moment.)",
            type: "narrative",
            timestamp: new Date()
          }
        );
        
        // Refresh the logs to display both messages
        await queryClient.invalidateQueries({
          queryKey: [`/api/campaigns/${campaignId}/logs`],
        });
      } catch (fallbackError) {
        console.error("Failed to add fallback messages:", fallbackError);
      }
      
      setIsProcessing(false);
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
  
  // Function to handle the player input submission is already defined elsewhere
  // in the file, no need to redefine it
  
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
    
    // Allow submission without user character but show a dialog to add one
    if (!userCharacter) {
      toast({
        title: "No Character",
        description: "Your action will be submitted, but it's recommended to add a character first!",
        variant: "default",
      });
      setShowAddCharacterDialog(true);
      // We'll continue with the action submission
    }
    
    try {
      console.log("Submitting player action:", playerInput);
      
      // Store current input and clear immediately for better UX
      const currentInput = playerInput;
      setPlayerInput(""); // Clear input immediately
      
      // Submit action
      const result = await playerActionMutation.mutateAsync(currentInput);
      
      console.log("Action submission result:", result);
      
      // Handle potential errors from the DM response
      if (result && !result.success) {
        console.warn("DM response had an error:", result.error);
        toast({
          variant: "warning",
          title: "Action Recorded",
          description: "Your action was recorded, but the DM response had an issue. The story will continue when you submit your next action.",
        });
      } else {
        console.log("Action successfully processed");
      }
      
      // Scroll to bottom after a short delay to allow rendering
      setTimeout(() => {
        if (narrativeRef.current) {
          narrativeRef.current.scrollTop = narrativeRef.current.scrollHeight;
        }
      }, 100);
    } catch (error) {
      console.error("Action submission error:", error instanceof Error ? error.message : String(error));
      
      // Show more detailed error message
      toast({
        variant: "destructive",
        title: "Action Failed",
        description: error instanceof Error 
          ? `Error: ${error.message}. Please try again or refresh the page.`
          : "Failed to process your action. Please try again or refresh the page.",
      });
      
      // Restore the input so the user doesn't lose their text
      setPlayerInput(playerInput);
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
      case "chat": return "Bot Companion";
      case "roll": return "Dice Roller";
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
            <Button onClick={() => setLocation("/")}>
              Back to Home
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
              onClick={() => setLocation("/")}
              className="text-amber-900 hover:text-amber-700 hover:bg-amber-100"
            >
              &larr; Back to Home
            </Button>
            <h1 className="text-lg md:text-xl font-bold text-amber-900 truncate">
              {campaign?.title || "Campaign"}
            </h1>
            
            {/* Font Size Buttons (moved to left side) */}
            <div className="flex items-center gap-1 pl-1 ml-4">
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
          
          <div className="flex items-center gap-1 md:gap-2">
            {/* Theme toggle */}
            <div className="mr-1">
              <ModeToggle />
            </div>
            
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
            
            {/* Campaign settings button removed as requested */}
            
            {/* Party Planning button temporarily hidden until functionality is fully fixed */}
            {/* <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    // This button is disabled to prevent navigation to blank pages
                    onClick={() => {}}
                    className="border-amber-300 hover:bg-amber-100 text-amber-900 opacity-50 cursor-not-allowed"
                  >
                    <ClipboardList className="h-4 w-4 mr-1 md:mr-2" />
                    <span className="hidden md:inline">Party Planning</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Collaborative party planning</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider> */}
            
            {/* Map feature removed */}
            
            {/* Manage Characters button */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddCharacterDialog(true)}
                    className="border-amber-300 hover:bg-amber-100 text-amber-900"
                  >
                    <UserCircle className="h-4 w-4 mr-1 md:mr-2" />
                    <span className="hidden md:inline">Add Character</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Add a character to this campaign</p>
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
          </div>
        </div>
      </div>
      
      {/* Main content - flexbox with left-center-right layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel - permanent characters panel */}
        <div className="hidden md:block flex-none w-[300px] border-r border-amber-200 bg-amber-50/60 overflow-y-auto">
          <div className="p-4 border-b border-amber-200">
            <h2 className="text-lg font-semibold text-amber-900 flex items-center">
              <Users className="mr-2 h-5 w-5" />
              Party Members
            </h2>
          </div>
          
          <div className="p-4 h-full overflow-y-auto">
            <CharactersPanel
              campaignId={campaignId}
              campaignCharacters={campaignCharacters}
              charactersLoading={charactersLoading}
              charactersError={charactersError}
              isDm={isDm}
              userId={user?.id}
              removeCharacterMutation={removeCharacterMutation}
              compactView={true}
            />
          </div>
        </div>
      
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
              {/* Map panel removed */}
              
              {rightPanelTab === "chat" && (
                <BotCompanion 
                  campaignId={parseInt(campaignId)} 
                  userCharacter={userCharacter} 
                  campaign={campaign}
                />
              )}
              
              {rightPanelTab === "roll" && (
                <DiceRoller
                  characterName={userCharacter?.name || "Adventurer"}
                  characterModifiers={userCharacter?.stats}
                />
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
        <div className="flex-1 flex flex-col overflow-hidden bg-parchment relative pl-0">
          {/* Book UI - fixed aspect ratio container with book styling */}
          <div className="flex-1 flex flex-col overflow-hidden border-amber-200 bg-parchment relative">
            {/* Campaign title banner */}
            <div className="bg-gradient-to-r from-amber-800/70 via-amber-700 to-amber-800/70 p-2 text-center sticky top-0 z-10 shadow-md">
              <h1 className="text-amber-50 font-medieval text-xl">
                {campaignLoading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-amber-200" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Loading Campaign...
                  </span>
                ) : campaign?.title || campaign?.name || "Loading Campaign..."}
              </h1>
            </div>
            
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
                    <div className="absolute left-0 bottom-0 flex flex-col items-center -translate-x-1/2">
                      <div className="px-2 py-1 bg-amber-400 rounded-md text-xs font-medium text-amber-900 whitespace-nowrap border border-amber-500/30 shadow-sm">
                        Start of Adventure
                      </div>
                    </div>
                    
                    <div className="absolute left-0 top-0 flex flex-col items-center -translate-x-1/2">
                      <div className="px-2 py-1 bg-amber-100 rounded-md text-xs font-medium text-amber-700 whitespace-nowrap">
                        Current Moment
                      </div>
                    </div>
                    
                    {/* Empty state message when no logs are present */}
                    {(!gameLogs || gameLogs.length === 0) && (
                      <div className="pl-6 py-8">
                        <div className="border-4 border-double border-amber-800/40 bg-amber-50/30 p-6 rounded-lg shadow-inner">
                          <h3 className="text-xl font-medieval text-primary-800 mb-4">Begin Your Adventure</h3>
                          <p className="mb-3 font-serif italic first-letter:text-3xl first-letter:font-bold first-letter:mr-1 first-letter:float-left first-letter:text-primary-900">
                            Welcome to your journey in the realm of Everdice. The adventure is about to begin! Use the action box below to describe what your character wants to do, and the Dungeon Master will respond with a narrative that continues your story.
                          </p>
                          <p className="text-sm font-medium text-primary-700 mt-4">
                            Tip: Try simple actions like "I look around the area" or "I introduce myself to nearby travelers" to begin.
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {/* Show default welcome message if no logs exist but character is selected */}
                    {(!gameLogs || gameLogs.length === 0) && userCharacter && (
                      <div className="relative pl-6 mb-6">
                        <span className="absolute left-[-4px] top-2 h-2 w-2 rounded-full bg-amber-400"></span>
                        
                        <div className="mb-4">
                          <div className="text-gray-800" style={{ fontSize: `${fontSizeMultiplier}rem` }}>
                            <h3 className="text-xl font-bold mb-2 text-amber-800">Welcome to {campaign?.title || "Your Adventure"}!</h3>
                            <p className="mb-4">The adventure is about to begin with {userCharacter.name}, a level {userCharacter.level} {userCharacter.race} {userCharacter.class}.</p>
                            <p className="mb-4">You stand at the threshold of a grand adventure in the world of Everdice. The path ahead is filled with mystery, danger, and excitement. What will you do first?</p>
                            <p className="italic text-amber-700">Use the text box below to begin your adventure. Describe your first action to start the story...</p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Map logs to messages */}
                    {gameLogs && gameLogs.length > 0 && gameLogs.map((log, index, array) => {
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
                              <div className="text-gray-800" style={{ fontSize: `${fontSizeMultiplier}rem` }}>
                                <InteractiveSkillChecks 
                                  content={log.content}
                                  autoRoll={isAutoRollEnabled}
                                  onRollSkillCheck={handleSkillCheckRoll}
                                  character={userCharacter}
                                  onAdvanceStory={() => {
                                    // When auto-advancing after a skill check, submit a "continue" action
                                    console.log("Auto-advancing narrative after skill check from campaign-book");
                                    playerActionMutation.mutate("What happens next?");
                                  }}
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
            
            {/* Mobile action button bar - Only visible on small screens */}
            <div className="md:hidden flex items-center justify-between p-2 bg-amber-100/80 border-t border-amber-200">
              <div className="flex items-center gap-1">
                {/* Replaced Party button with Characters button to prevent blank screen */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleToggleRightPanel("characters")}
                  className={`border-amber-300 bg-white/60 hover:bg-amber-100 ${rightPanelTab === "characters" ? "bg-amber-200" : ""}`}
                >
                  <Users className="h-4 w-4" />
                  <span className="ml-1 text-xs">Characters</span>
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleToggleRightPanel("inventory")}
                  className={`border-amber-300 bg-white/60 hover:bg-amber-100 ${rightPanelTab === "inventory" ? "bg-amber-200" : ""}`}
                >
                  <Backpack className="h-4 w-4" />
                  <span className="ml-1 text-xs">Items</span>
                </Button>
              </div>
              
              <div className="flex items-center gap-1">
                {/* Map button removed */}
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleToggleRightPanel("roll")}
                  className={`border-amber-300 bg-white/60 hover:bg-amber-100 ${rightPanelTab === "roll" ? "bg-amber-200" : ""}`}
                >
                  <DicesIcon className="h-4 w-4" />
                  <span className="ml-1 text-xs">Roll</span>
                </Button>
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
                          disabled={isProcessing}
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
                              disabled={isProcessing || !playerInput.trim()}
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
                {/* Map panel removed */}
                
                {rightPanelTab === "chat" && (
                  <BotCompanion 
                    campaignId={parseInt(campaignId)} 
                    userCharacter={userCharacter} 
                    campaign={campaign}
                  />
                )}
                
                {rightPanelTab === "roll" && (
                  <DiceRoller
                    characterName={userCharacter?.name || "Adventurer"}
                    characterModifiers={userCharacter?.stats}
                  />
                )}
                
                {rightPanelTab === "characters" && (
                  <CharactersPanel
                    campaignId={campaignId}
                    campaignCharacters={campaignCharacters}
                    charactersLoading={charactersLoading}
                    charactersError={charactersError}
                    isDm={isDm}
                    userId={user?.id}
                    removeCharacterMutation={removeCharacterMutation}
                  />
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
      
      {/* Character dialog - provide positively verified ID */}
      <AddCharacterDialog
        campaignId={campaignId > 0 ? campaignId : undefined}
        open={showAddCharacterDialog}
        onOpenChange={setShowAddCharacterDialog}
        onCharacterAdded={handleCharacterAdded}
      />
      
      {/* Settings dialog removed as it wasn't functional */}
    </div>
  );
}