import React, { useState, useRef, useEffect } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { v4 as uuidv4 } from 'uuid';
import { Adventure, Campaign, GameLog } from "@shared/schema";

// Character interface with explicit typing
interface Character {
  id: number;
  name: string;
  race: string;
  class: string;
  level: number;
  background: string | null;
  appearance: string | null;
  backstory: string | null;
  stats: {
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
  };
  hp: number;
  maxHp: number;
  equipment: {
    items: Array<{
      name: string;
      type: string;
      isEquipped: boolean;
    }>;
    inventory?: any[];
  };
  spells?: any;
  abilities?: any;
  userId: number;
  isBot: boolean;
  createdAt: Date | null;
};
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/navbar";
import { CharacterPanel } from "@/components/character-panel";
import { GameArea } from "@/components/game-area";
import { WorldInfoPanel } from "@/components/world-info-panel";
import { CampaignChat } from "@/components/campaign-chat";
import { DiceRoller } from "@/components/dice-roll";
import { DiceType } from "@/hooks/use-dice";
import { ResizablePanels } from "@/components/resizable-panels";
import { BotCompanion } from "@/components/bot-companion";
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useCampaignDiceHistory } from "@/hooks/use-dice-history";
import { 
  Loader2, UserPlus, Users, Bot, UserCog, 
  MessageSquare, DicesIcon, Vote, Split, 
  ClipboardList, ScrollTextIcon, Menu, X,
  Send, BookOpen, BookMarked, Map, Sword,
  ShieldAlert, Backpack, HelpCircle, Info,
  Shield, ShieldCheck, Wand2, Heart, Eye, EyeOff,
  MoveRight, Package, MessageCircle
} from "lucide-react";
import { DndTextAnalyzer } from "@/components/dnd-text-analyzer";
import { DndQuickReference } from "@/components/dnd-quick-reference";
import { InteractiveDiceSuggestions } from "@/components/interactive-dice-suggestions";
import { InventoryManagement } from "@/components/inventory-management";
import { AdventureMapPanel } from "@/components/adventure-map-panel";
import { BattleTracker } from "@/components/battle-tracker";
import { useCombatDetection } from "@/hooks/use-combat-detection";
import { LootCollectionPanel } from "@/components/loot-collection-panel";

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
  const [hasUnclaimedLoot, setHasUnclaimedLoot] = useState(false);
  const [fontSizeMultiplier, setFontSizeMultiplier] = useState(() => {
    // Try to load saved font size from local storage, default to 1 if not found
    const savedSize = localStorage.getItem('narrativeFontSize');
    return savedSize ? parseFloat(savedSize) : 1;
  });
  

  
  // Loot system state
  const [availableLoot, setAvailableLoot] = useState<Array<{
    id: string;
    name: string;
    description?: string;
    type: string;
    quantity: number;
    weight?: number;
    value?: number;
    source: string; // e.g., "Goblin Warrior", "Treasure Chest"
  }>>([]);
  
  // Action shortcuts state
  const [actionShortcuts, setActionShortcuts] = useState<Array<{
    id: string;
    name: string;
    icon: string;
    action: string;
  }>>([
    { id: "attack", name: "Attack", icon: "sword", action: "I attack the nearest enemy" },
    { id: "defend", name: "Defend", icon: "shield", action: "I take the Dodge action to avoid attacks" },
    { id: "cast", name: "Cast Spell", icon: "wand", action: "I cast a spell at the enemy" },
    { id: "heal", name: "Heal", icon: "heart", action: "I use a healing potion" },
    { id: "look", name: "Look Around", icon: "eye", action: "I look around for clues or hidden items" },
    { id: "talk", name: "Talk", icon: "message-circle", action: "I try to talk to the character in front of me" }
  ]);
  
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
    data: campaignCharactersRaw,
    isLoading: charactersLoading,
    error: charactersError
  } = useQuery<any[]>({
    queryKey: [`/api/campaigns/${campaignId}/characters`],
    enabled: !!campaignId && !!user,
  });
  
  // Cast the raw data to our Character type with proper stats shape
  const campaignCharacters: Character[] | undefined = campaignCharactersRaw?.map(char => ({
    ...char,
    stats: char.stats as Character['stats'] || {
      strength: 10,
      dexterity: 10,
      constitution: 10, 
      intelligence: 10,
      wisdom: 10,
      charisma: 10
    },
    equipment: char.equipment as Character['equipment'] || {
      items: []
    }
  }));
  
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
  
  // Get current character and adventure
  const currentCharacter = campaignCharacters?.find(char => char.id === selectedCharacterId) || campaignCharacters?.[0];
  const currentAdventure = adventures?.[0]; // Just use the first adventure for now
  
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
  
  // Save font size to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('narrativeFontSize', fontSizeMultiplier.toString());
  }, [fontSizeMultiplier]);
  
  // Get the latest narrative content for combat detection
  const latestNarrativeContent = gameLogs.length > 0 
    ? gameLogs.filter(log => log.type === 'narrative').slice(-1)[0]?.content || ""
    : "";
    
  // Combat state
  const [combatRound, setCombatRound] = useState(1);
  const [combatTurn, setCombatTurn] = useState(0);
  const [combatParticipants, setCombatParticipants] = useState<any[]>([]);
  
  // Use combat detection hook to automatically detect threats in the narrative
  const { 
    inCombat, 
    detectedThreats,
    availableLoot: detectedLoot,
    setInCombat,
    setDetectedThreats,
    setAvailableLoot: updateAvailableLoot
  } = useCombatDetection(latestNarrativeContent || "");
  
  // Update unclaimed loot status
  useEffect(() => {
    setHasUnclaimedLoot(availableLoot.length > 0);
  }, [availableLoot]);

  // Add detected threats to combat participants when combat starts
  useEffect(() => {
    if (inCombat && detectedThreats.length > 0) {
      // Convert threats to combat participants format
      const newParticipants = detectedThreats.map(threat => ({
        id: threat.id,
        name: threat.name,
        initiative: threat.initiative || Math.floor(Math.random() * 20) + 1,
        isEnemy: true,
        isActive: false,
        hp: threat.hp,
        maxHp: threat.maxHp,
        ac: threat.ac,
        conditions: [],
        actions: threat.attacks || [],
        stats: threat.stats,
      }));
      
      // Add to existing participants (avoid duplicates)
      setCombatParticipants(prev => {
        const existingIds = prev.map(p => p.id);
        const filteredNew = newParticipants.filter(p => !existingIds.includes(p.id));
        return [...prev, ...filteredNew];
      });
    }
  }, [inCombat, detectedThreats]);
  
  // Combat action handlers
  const onNextTurn = () => {
    // Advance turn or round
    if (combatParticipants.length > 0) {
      if (combatTurn >= combatParticipants.length - 1) {
        setCombatTurn(0);
        setCombatRound(prevRound => prevRound + 1);
      } else {
        setCombatTurn(prevTurn => prevTurn + 1);
      }
      
      // Update active participant
      setCombatParticipants(prevParticipants => 
        prevParticipants.map((participant, index) => ({
          ...participant,
          isActive: index === (combatTurn + 1) % prevParticipants.length
        }))
      );
    }
  };
  
  const onEndCombat = () => {
    setInCombat(false);
    setCombatTurn(0);
    setCombatRound(1);
    setCombatParticipants([]);
  };
  
  const onAddParticipant = (participant: any) => {
    setCombatParticipants(prev => [...prev, { 
      ...participant, 
      id: participant.id || uuidv4() 
    }]);
  };
  
  const onApplyDamage = (participantId: string, amount: number) => {
    setCombatParticipants(prevParticipants => 
      prevParticipants.map(participant => {
        if (participant.id === participantId) {
          const newHp = Math.max(0, participant.hp - amount);
          return {
            ...participant,
            hp: newHp
          };
        }
        return participant;
      })
    );
  };
  
  const onApplyHealing = (participantId: string, amount: number) => {
    setCombatParticipants(prevParticipants => 
      prevParticipants.map(participant => {
        if (participant.id === participantId) {
          const newHp = Math.min(participant.maxHp, participant.hp + amount);
          return {
            ...participant,
            hp: newHp
          };
        }
        return participant;
      })
    );
  };
  
  const onAddCondition = (participantId: string, condition: string) => {
    setCombatParticipants(prevParticipants => 
      prevParticipants.map(participant => {
        if (participant.id === participantId) {
          const updatedConditions = [...(participant.conditions || [])];
          if (!updatedConditions.includes(condition)) {
            updatedConditions.push(condition);
          }
          return {
            ...participant,
            conditions: updatedConditions
          };
        }
        return participant;
      })
    );
  };
  
  const onRemoveCondition = (participantId: string, condition: string) => {
    setCombatParticipants(prevParticipants => 
      prevParticipants.map(participant => {
        if (participant.id === participantId) {
          return {
            ...participant,
            conditions: (participant.conditions || []).filter((c: string) => c !== condition)
          };
        }
        return participant;
      })
    );
  };
  
  const onDiceRoll = (participantId: string, type: string, purpose: string) => {
    // Simple dice roll implementation
    const dieSize = parseInt(type.substring(1));
    const result = Math.floor(Math.random() * dieSize) + 1;
    
    setCombatParticipants(prevParticipants => 
      prevParticipants.map(participant => {
        if (participant.id === participantId) {
          return {
            ...participant,
            lastRoll: {
              type: purpose,
              result,
              total: result,
              success: undefined
            }
          };
        }
        return participant;
      })
    );
  };
  
  // Update available loot when new loot is detected
  useEffect(() => {
    if (detectedLoot.length > 0) {
      updateAvailableLoot(prevLoot => {
        // Combine previous loot with new loot, avoiding duplicates by id
        const existingIds = new Set(prevLoot.map(item => item.id));
        const newLoot = detectedLoot.filter(item => !existingIds.has(item.id));
        return [...prevLoot, ...newLoot];
      });
    }
  }, [detectedLoot, updateAvailableLoot]);
  
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

  // Scroll to the bottom when new logs are added
  useEffect(() => {
    if (narrativeRef.current) {
      narrativeRef.current.scrollTop = narrativeRef.current.scrollHeight;
    }
  }, [gameLogs]);

  // Handle player input submission
  const handleSubmitAction = () => {
    if (!playerInput.trim() || isProcessing) return;
    
    setIsProcessing(true);
    
    if (isAutoDmMode) {
      // Use AI to generate a response
      generateNarrationMutation.mutate(playerInput);
    } else {
      // Just record the player action in human DM mode
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

  // Calculate inventory weight
  const calculateInventoryWeight = () => {
    if (!currentCharacter?.equipment || !(currentCharacter.equipment as any)?.inventory) return 0;
    
    // Safely cast to the expected type or use empty array as fallback
    const inventory = ((currentCharacter.equipment as any).inventory as any[] || []);
    
    return inventory.reduce((total, item) => {
      return total + (item.weight || 0) * item.quantity;
    }, 0).toFixed(1);
  };
  
  // Calculate carrying capacity based on strength
  const calculateCarryingCapacity = () => {
    if (!currentCharacter?.stats) return 0;
    
    // Safely access strength or default to 10 if not found
    const strength = (currentCharacter.stats as any)?.strength || 10;
    
    // D&D 5e carrying capacity is strength score × 15 in pounds
    return (strength * 15).toFixed(0);
  };

  // Loading state
  if (campaignLoading || charactersLoading || adventuresLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // Error state
  if (campaignError || charactersError || adventuresError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="text-destructive mb-4">
          <ShieldAlert className="h-12 w-12 mx-auto mb-2" />
          <h2 className="text-2xl font-bold text-center">Adventure Error</h2>
        </div>
        <p className="text-muted-foreground text-center mb-6">
          {campaignError?.message || charactersError?.message || adventuresError?.message || "Something went wrong loading your adventure."}
        </p>
        <Button asChild>
          <a href="/">Return to Tavern</a>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar showBackButton />
      
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Main campaign area with resizable panels */}
        <ResizablePanels
          initialSizes={[20, 80]} 
          direction="horizontal"
          className="h-full border-0"
          minSizes={[15, 50]}
          maxSizes={[35, 85]}
        >
          {/* Left sidebar - Character info, etc. */}
          <div className="h-full flex flex-col bg-muted/30">
            <div className="p-3 border-b flex items-center justify-between">
              <h2 className="font-medieval text-lg">Campaign</h2>
              
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  title="Dice Roller"
                  onClick={() => setShowDiceRoller(!showDiceRoller)}
                >
                  <DicesIcon className="h-4 w-4" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  title="Party Management"
                  onClick={() => setRightPanelTab(rightPanelTab === "party" ? null : "party")}
                >
                  <Users className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {/* Campaign details */}
            <div className="p-3 border-b">
              <h3 className="font-semibold text-sm mb-1">{campaign?.name}</h3>
              <p className="text-xs text-muted-foreground mb-2">{campaign?.setting || "Fantasy World"}</p>
              
              <div className="flex items-center gap-2 mb-2">
                <div className="text-xs flex items-center">
                  <Switch
                    id="auto-dm"
                    checked={isAutoDmMode}
                    onCheckedChange={handleDmModeToggle}
                    className="scale-75"
                  />
                  <Label htmlFor="auto-dm" className="ml-1">
                    {isAutoDmMode ? "AI DM" : "Human DM"}
                  </Label>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log("Add Character button clicked (header)");
                    setShowAddCharacterDialog(true);
                  }}
                >
                  <UserPlus className="h-3 w-3 mr-1" />
                  Add Character
                </Button>
              </div>
            </div>
            
            {/* Character selection */}
            <div className="p-3 border-b">
              <h3 className="font-semibold text-sm mb-2">Your Characters</h3>
              
              <div className="space-y-2">
                {campaignCharacters?.map(character => (
                  <div
                    key={character.id}
                    className={`p-2 rounded-md cursor-pointer text-sm transition-colors ${
                      selectedCharacterId === character.id
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    }`}
                    onClick={() => setSelectedCharacterId(character.id)}
                  >
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={(character as any).avatarUrl || ""} alt={character.name} />
                        <AvatarFallback className="text-xs">
                          {character.name?.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium leading-none">{character.name}</div>
                        <div className="text-xs opacity-70">
                          {character.race} {character.class}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {(!campaignCharacters || campaignCharacters.length === 0) && (
                  <div className="text-xs text-muted-foreground text-center p-2">
                    No characters yet. Add one to begin!
                  </div>
                )}
              </div>
            </div>
            
            {/* Bot companions */}
            <div className="p-3 border-b">
              <h3 className="font-semibold text-sm mb-2">Bot Companions</h3>
              
              <div className="space-y-2">
                <div
                  className="p-2 rounded-md cursor-pointer text-sm hover:bg-muted"
                  onClick={() => setRightPanelTab("companion")}
                >
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6 bg-blue-100">
                      <AvatarFallback className="text-xs bg-blue-100 text-blue-800">
                        <Bot className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium leading-none">Sage Eldrin</div>
                      <div className="text-xs opacity-70">
                        D&D Lore Expert
                      </div>
                    </div>
                  </div>
                </div>
                
                <div
                  className="p-2 rounded-md cursor-pointer text-sm hover:bg-muted"
                  onClick={() => setRightPanelTab("companion")}
                >
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6 bg-amber-100">
                      <AvatarFallback className="text-xs bg-amber-100 text-amber-800">
                        <Sword className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium leading-none">Bron Ironfist</div>
                      <div className="text-xs opacity-70">
                        Combat Strategist
                      </div>
                    </div>
                  </div>
                </div>
                
                <div
                  className="p-2 rounded-md cursor-pointer text-sm hover:bg-muted"
                  onClick={() => setRightPanelTab("companion")}
                >
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6 bg-green-100">
                      <AvatarFallback className="text-xs bg-green-100 text-green-800">
                        <BookOpen className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium leading-none">Lily Whisperwind</div>
                      <div className="text-xs opacity-70">
                        Rules & Mechanics
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Quick menu */}
            <div className="mt-auto p-3 border-t">
              <div className="grid grid-cols-2 gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => setRightPanelTab("inventory")}
                >
                  <Backpack className="h-3 w-3 mr-1" />
                  Inventory
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs relative"
                  onClick={() => setRightPanelTab("loot")}
                >
                  <Package className="h-3 w-3 mr-1" />
                  Loot
                  {hasUnclaimedLoot && (
                    <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full" />
                  )}
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => setRightPanelTab("map")}
                >
                  <Map className="h-3 w-3 mr-1" />
                  Map
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => setRightPanelTab("battle")}
                >
                  <Sword className="h-3 w-3 mr-1" />
                  Battle
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => setRightPanelTab("spells")}
                >
                  <Wand2 className="h-3 w-3 mr-1" />
                  Spells
                </Button>
              </div>
            </div>
          </div>
          
          {/* Main Book-Like Content Area - Set explicit height constraints at parent level */}
          <div className="h-full flex flex-col bg-[#fffbf0] relative overflow-hidden">
            {/* Split the content into two sections: scrollable narrative at top, fixed controls at bottom */}
            
            {/* Font size controls */}
            <div className="border-b border-amber-200/50 bg-amber-50/30 flex-none p-2">
              <div className="flex items-center justify-end max-w-3xl mx-auto">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Font Size: {Math.round(fontSizeMultiplier * 100)}%</span>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-6 w-6"
                          onClick={() => setFontSizeMultiplier(prev => Math.max(0.8, prev - 0.1))}
                          disabled={fontSizeMultiplier <= 0.8}
                        >
                          <span className="text-xs">A-</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <p className="text-xs">Decrease text size</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-6 w-6"
                          onClick={() => setFontSizeMultiplier(1)} // Reset to default
                          disabled={fontSizeMultiplier === 1}
                        >
                          <span className="text-xs">A</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <p className="text-xs">Reset to default size</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-6 w-6"
                          onClick={() => setFontSizeMultiplier(prev => Math.min(1.5, prev + 0.1))}
                          disabled={fontSizeMultiplier >= 1.5}
                        >
                          <span className="text-xs">A+</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <p className="text-xs">Increase text size</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </div>
            
            {/* Top scrollable narrative - Fixed percentage height - content will scale with viewport */}
            <div className="h-[calc(100vh-350px-32px)] min-h-[300px] overflow-hidden">
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
                  {gameLogs.slice().reverse().map((log, index) => (
                    <div key={log.id || index} className="mb-4">
                      {log.type === "player" && (
                        <div className="mb-2 text-right">
                          <div className="inline-block bg-primary/10 text-primary rounded-lg py-2 px-3">
                            <p style={{ 
                              fontSize: `${0.95 * fontSizeMultiplier}rem`,
                              lineHeight: 1.5
                            }}>
                              {log.content}
                            </p>
                          </div>
                        </div>
                      )}
                      
                      {log.type === "narrative" && (
                        <div className="prose prose-amber max-w-none">
                          <p 
                            className="mb-4" 
                            style={{ 
                              fontSize: `${1 * fontSizeMultiplier}rem`,
                              lineHeight: 1.5
                            }}
                          >
                            {log.content}
                          </p>
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
                  ))}
                </div>
              </div>
            </div>
            
            {/* Bottom fixed action bar - Never scrolls, auto-height based on content */}
            <div className="border-t border-amber-200/50 bg-amber-50/30 flex-none">
              <div className="p-4">
                <div className="max-w-3xl mx-auto">
                  {/* Common Action Shortcuts */}
                  <div className="mb-3">
                    <h3 className="text-sm font-medium mb-2">Quick Actions</h3>
                    <div className="grid grid-cols-3 gap-1">
                      {actionShortcuts.map(shortcut => (
                        <Button
                          key={shortcut.id}
                          variant="outline"
                          size="sm"
                          className="text-xs h-8 px-2"
                          onClick={() => setPlayerInput(shortcut.action)}
                        >
                          {shortcut.icon === "sword" && <Sword className="mr-1 h-3 w-3" />}
                          {shortcut.icon === "shield" && <ShieldCheck className="mr-1 h-3 w-3" />}
                          {shortcut.icon === "wand" && <Wand2 className="mr-1 h-3 w-3" />}
                          {shortcut.icon === "heart" && <Heart className="mr-1 h-3 w-3" />}
                          {shortcut.icon === "eye" && <Eye className="mr-1 h-3 w-3" />}
                          {shortcut.icon === "message-circle" && <MessageCircle className="mr-1 h-3 w-3" />}
                          {shortcut.name}
                        </Button>
                      ))}
                    </div>
                    
                    {/* Tabletop Tools */}
                    <div className="flex justify-center items-center gap-2 mt-2">
                      {/* Inventory Management */}
                      {currentCharacter && (
                        <InventoryManagement 
                          characterId={currentCharacter.id}
                          campaignId={campaignId}
                          character={currentCharacter}
                          campaignCharacters={campaignCharacters || []}
                          onItemUpdate={() => {
                            queryClient.invalidateQueries({ queryKey: [`/api/characters/${currentCharacter.id}`] });
                          }}
                          isDm={user?.id === campaign?.dmId}
                        />
                      )}
                      
                      {/* Adventure Map */}
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => setRightPanelTab(rightPanelTab === "map" ? null : "map")}
                              className="h-8 w-8"
                            >
                              <Map className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Adventure Map</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                  
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSubmitAction();
                    }}
                    className="flex gap-2"
                  >
                    <Textarea 
                      placeholder={`What will ${currentCharacter?.name || 'your character'} do next?`}
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
                      {rightPanelTab === "companion" && "Bot Companion"}
                      {rightPanelTab === "loot" && "Available Loot"}
                    </h3>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => setRightPanelTab(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {/* Right panel content based on selected tab */}
                  {rightPanelTab === "inventory" && (
                    <div className="space-y-4">
                      {/* Carrying capacity indicator */}
                      <div className="p-2 border border-border rounded-md bg-muted/10">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs font-medium">Carrying Weight:</span>
                          <span className={`text-xs ${
                            Number(calculateInventoryWeight()) > Number(calculateCarryingCapacity()) * 0.8
                              ? 'text-destructive font-medium'
                              : Number(calculateInventoryWeight()) > Number(calculateCarryingCapacity()) * 0.5
                                ? 'text-amber-600'
                                : ''
                          }`}>
                            {calculateInventoryWeight()} / {calculateCarryingCapacity()} lbs
                          </span>
                        </div>
                        <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${
                              Number(calculateInventoryWeight()) > Number(calculateCarryingCapacity()) * 0.8
                                ? 'bg-destructive' 
                                : Number(calculateInventoryWeight()) > Number(calculateCarryingCapacity()) * 0.5
                                  ? 'bg-amber-500'
                                  : 'bg-primary'
                            }`}
                            style={{ 
                              width: `${Math.min(100, (Number(calculateInventoryWeight()) / Number(calculateCarryingCapacity())) * 100)}%` 
                            }}
                          />
                        </div>
                      </div>
                      
                      {/* Inventory items list */}
                      <div className="space-y-2">
                        {((currentCharacter?.equipment as any)?.inventory || [])?.map((item: any, index: number) => (
                          <div key={index} className="p-2 border border-border rounded-md bg-background">
                            <div className="flex justify-between">
                              <div className="font-medium">{item.name}</div>
                              <div className="text-sm">{item.quantity}x</div>
                            </div>
                            <p className="text-xs text-muted-foreground">{item.description}</p>
                            <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                              <span>{item.type}</span>
                              {item.weight && <span>{item.weight} lbs</span>}
                            </div>
                          </div>
                        ))}
                        
                        {(!currentCharacter?.equipment || 
                          !(currentCharacter.equipment as any)?.inventory || 
                          ((currentCharacter.equipment as any)?.inventory || []).length === 0) && (
                          <div className="text-center p-4 text-muted-foreground">
                            <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p>Your inventory is empty</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {rightPanelTab === "map" && (
                    <div className="relative">
                      <div className="absolute top-0 right-0 z-10">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setRightPanelTab(null)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <AdventureMapPanel 
                        campaignId={campaignId}
                        isDm={campaign?.dmId === user?.id}
                        onLocationClick={(location) => {
                          // Handle location click - could generate description or reveal info
                          toast({
                            title: location.name,
                            description: location.description || "A mysterious location on your adventure map.",
                          });
                        }}
                      />
                    </div>
                  )}

                  {rightPanelTab === "spells" && (
                    <div className="space-y-4">
                      <div className="absolute top-0 right-0 z-10">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setRightPanelTab(null)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      {currentCharacter?.spells && Object.keys(currentCharacter.spells).length > 0 ? (
                        <div>
                          <h4 className="text-sm font-semibold mb-2">Spells</h4>
                          <div className="space-y-2">
                            {Object.entries(currentCharacter.spells).map(([level, spellList]) => (
                              <div key={level} className="border border-border rounded-md p-3">
                                <h5 className="font-medieval text-sm mb-2">Level {level}</h5>
                                <div className="space-y-1">
                                  {Array.isArray(spellList) && spellList.map((spell: any, idx: number) => (
                                    <div 
                                      key={`${spell.name}-${idx}`} 
                                      className="p-2 bg-background hover:bg-secondary/10 rounded-sm cursor-pointer"
                                      onClick={() => {
                                        toast({
                                          title: spell.name,
                                          description: spell.description || "A mysterious spell with unknown effects.",
                                        });
                                      }}
                                    >
                                      <div className="flex justify-between items-center">
                                        <span className="font-medium">{spell.name}</span>
                                        <Button 
                                          variant="ghost" 
                                          size="sm"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setPlayerInput(`I cast ${spell.name}!`);
                                          }}
                                        >
                                          Cast
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center p-6">
                          <Wand2 className="h-12 w-12 mx-auto text-muted-foreground opacity-50 mb-3" />
                          <h4 className="text-lg font-medieval mb-2">No Spells Available</h4>
                          <p className="text-muted-foreground">
                            {currentCharacter?.class === "Wizard" || currentCharacter?.class === "Sorcerer" || currentCharacter?.class === "Warlock" || currentCharacter?.class === "Bard" || currentCharacter?.class === "Cleric" || currentCharacter?.class === "Druid" ? 
                              "You haven't learned any spells yet. Spells can be acquired through level advancement, finding scrolls, or receiving them as rewards." :
                              "This character class doesn't have spellcasting abilities. Consider multiclassing or finding magical items to gain spells."}
                          </p>
                        </div>
                      )}
                      
                      <div className="mt-6">
                        <h4 className="text-sm font-semibold mb-2">Abilities & Skills</h4>
                        {currentCharacter?.abilities && Object.keys(currentCharacter.abilities).length > 0 ? (
                          <div className="space-y-2">
                            {Object.entries(currentCharacter.abilities).map(([category, abilityList]) => (
                              <div key={category} className="border border-border rounded-md p-3">
                                <h5 className="font-medieval text-sm mb-2">{category}</h5>
                                <div className="space-y-1">
                                  {Array.isArray(abilityList) && abilityList.map((ability: any, idx: number) => (
                                    <div 
                                      key={`${ability.name}-${idx}`} 
                                      className="p-2 bg-background hover:bg-secondary/10 rounded-sm cursor-pointer"
                                      onClick={() => {
                                        toast({
                                          title: ability.name,
                                          description: ability.description || "A mysterious ability with unknown effects.",
                                        });
                                      }}
                                    >
                                      <div className="flex justify-between items-center">
                                        <span className="font-medium">{ability.name}</span>
                                        <Button 
                                          variant="ghost" 
                                          size="sm"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setPlayerInput(`I use my ${ability.name} ability!`);
                                          }}
                                        >
                                          Use
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center p-6">
                            <Shield className="h-12 w-12 mx-auto text-muted-foreground opacity-50 mb-3" />
                            <h4 className="text-lg font-medieval mb-2">No Abilities Listed</h4>
                            <p className="text-muted-foreground">
                              Your character's special abilities and skills will appear here as you gain them through leveling up and adventures.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {rightPanelTab === "battle" && (
                    <div className="space-y-4">
                      <div className="absolute top-0 right-0 z-10">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setRightPanelTab(null)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <BattleTracker
                        inCombat={inCombat}
                        combatRound={combatRound}
                        combatTurn={combatTurn}
                        combatParticipants={combatParticipants}
                        onNextTurn={onNextTurn}
                        onEndCombat={onEndCombat}
                        onAddParticipant={onAddParticipant}
                        onApplyDamage={onApplyDamage}
                        onApplyHealing={onApplyHealing}
                        onAddCondition={onAddCondition}
                        onRemoveCondition={onRemoveCondition}
                        onDiceRoll={onDiceRoll}
                        partyCharacters={campaignCharacters || []}
                      />
                    </div>
                  )}
                  
                  {rightPanelTab === "companion" && (
                    <BotCompanion 
                      campaignId={campaignId}
                      characterName={currentCharacter?.name} 
                      compendiumMode={false}
                    />
                  )}
                  
                  {rightPanelTab === "party" && (
                    <div className="space-y-4">
                      {/* Party members list */}
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold mb-2">Party Members</h4>
                        
                        {campaignCharacters && campaignCharacters.length > 0 ? (
                          campaignCharacters.map(character => (
                            <div key={character.id} className="p-2 border border-border rounded-md bg-background">
                              <div className="flex items-center">
                                <Avatar className="h-10 w-10 mr-3">
                                  <AvatarFallback className="bg-primary/10 text-primary">
                                    {character.name?.substring(0, 2).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="font-medium">{character.name}</div>
                                  <div className="text-sm text-muted-foreground">
                                    {character.race} {character.class}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center p-4 text-muted-foreground">
                            <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p>No characters in party</p>
                          </div>
                        )}
                      </div>
                      
                      {/* Party management options */}
                      <div className="space-y-2 pt-3 border-t border-border">
                        <h4 className="text-sm font-semibold mb-2">Party Options</h4>
                        
                        <div className="flex flex-col gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="w-full justify-start py-3"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              console.log("Add Character button clicked (sidebar)");
                              setShowAddCharacterDialog(true);
                            }}
                            onTouchStart={(e) => {
                              e.preventDefault();
                              console.log("Touch start on Add Character button");
                              setShowAddCharacterDialog(true);
                            }}
                          >
                            <UserPlus className="h-4 w-4 mr-2 flex-shrink-0" />
                            <span className="truncate">Add Character</span>
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full justify-start py-3"
                          >
                            <UserCog className="h-4 w-4 mr-2 flex-shrink-0" />
                            <span className="truncate">Manage Party Roles</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </ResizablePanels>
        
        {/* Battle Tracker */}
        <BattleTracker
          inCombat={inCombat}
          combatParticipants={combatParticipants}
          combatRound={combatRound}
          combatTurn={combatTurn}
          onEndCombat={onEndCombat}
          onNextTurn={onNextTurn}
          onAddParticipant={onAddParticipant}
          onApplyDamage={onApplyDamage}
          onApplyHealing={onApplyHealing}
          onAddCondition={onAddCondition}
          onRemoveCondition={onRemoveCondition}
          onDiceRoll={onDiceRoll}
          partyCharacters={campaignCharacters as any[]}
        />
        
        {/* Dice Roller Dialog */}
        {showDiceRoller && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-medieval">Dice Roller</h2>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0" 
                  onClick={() => setShowDiceRoller(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <DiceRoller 
                characterName={currentCharacter?.name || "Character"} 
                characterModifiers={{
                  STR: 2,
                  DEX: 3,
                  CON: 1,
                  INT: 0,
                  WIS: 2,
                  CHA: 1
                }}
                onRollResult={(type, result, modifier, purpose, threshold) => {
                  // Handle roll result
                  addCampaignRoll({
                    id: uuidv4(),
                    characterName: currentCharacter?.name || "Character",
                    diceType: type,
                    result: result,
                    modifier: modifier || 0,
                    total: result + (modifier || 0),
                    purpose: purpose,
                    threshold: threshold,
                    isSuccess: threshold ? (result + (modifier || 0)) >= threshold : undefined,
                    timestamp: new Date()
                  });
                  
                  // Log the roll to the campaign
                  createLogMutation.mutate({
                    campaignId,
                    content: `${currentCharacter?.name || "Character"} rolled ${result}${modifier ? ` + ${modifier} = ${result + modifier}` : ''} on a ${type}${purpose ? ` for ${purpose}` : ''}${threshold ? ` against DC ${threshold}` : ''}.`,
                    type: "roll"
                  });
                }}
              />
            </div>
          </div>
        )}
        
        {/* Mobile Add Character Button */}
        <div className="md:hidden fixed bottom-20 right-4 z-40">
          <Button
            variant="default"
            size="lg"
            className="rounded-full h-14 w-14 shadow-lg"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log("Mobile add character button clicked");
              setShowAddCharacterDialog(true);
            }}
          >
            <UserPlus className="h-6 w-6" />
          </Button>
        </div>
        
        {/* Add Character Dialog */}
        <AddCharacterDialog
          campaignId={campaignId}
          open={showAddCharacterDialog}
          onOpenChange={setShowAddCharacterDialog}
          onCharacterAdded={() => {
            queryClient.invalidateQueries({ queryKey: [`/api/campaigns/${campaignId}/characters`] });
            toast({
              title: "Character Added",
              description: "Your character has joined the campaign!",
              variant: "default",
            });
          }}
        />
      </div>
    </div>
  );
}