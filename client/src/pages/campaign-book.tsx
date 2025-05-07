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
  
  // Battle tracking state
  const [inCombat, setInCombat] = useState(false);
  const [combatRound, setCombatRound] = useState(1);
  const [combatTurn, setCombatTurn] = useState(0);
  const [combatParticipants, setCombatParticipants] = useState<Array<{
    id: string;
    name: string;
    initiative: number;
    isEnemy: boolean;
    isActive: boolean;
    hp: number;
    maxHp: number;
    actions: string[];
    lastRoll?: {
      type: string;
      result: number;
      total: number;
      success?: boolean;
    };
  }>>([]);
  
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
      
      // Check if the narrative text indicates combat
      const combatKeywords = [
        "attack", "combat", "battle", "fight", "initiative", 
        "sword", "bow", "spell", "opponent", "enemy", "roll for initiative",
        "ambush", "assault", "strike", "hit"
      ];
      
      // Detect combat in the narrative
      const narrativeText = data.narration.toLowerCase();
      const isCombatContext = combatKeywords.some(keyword => narrativeText.includes(keyword));
      
      // Auto-open battle tracker when combat is detected
      if (isCombatContext && !inCombat) {
        startCombat(narrativeText);
      } else if (inCombat) {
        // Update combat info if already in combat
        updateCombatState(narrativeText);
      }
      
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
  
  // Roll dice for a character or enemy
  const rollInitiative = (name: string, modifier: number = 0) => {
    // d20 roll
    const result = Math.floor(Math.random() * 20) + 1;
    const total = result + modifier;
    return { 
      result,
      modifier,
      total
    };
  };
  
  // End combat
  const endCombat = (outcome: "victory" | "defeat" | "fled") => {
    setInCombat(false);
    
    let message = "";
    if (outcome === "victory") {
      message = "Victory! All enemies have been defeated.";
    } else if (outcome === "defeat") {
      message = "Defeat! Your party has been defeated.";
    } else {
      message = "You have fled from combat.";
    }
    
    const combatEndLog: Partial<GameLog> = {
      campaignId,
      content: message,
      type: "system"
    };
    createLogMutation.mutate(combatEndLog);
    
    toast({
      title: "Combat Ended",
      description: message,
      variant: outcome === "victory" ? "default" : "destructive",
    });
  };
  
  // Simulate enemy action
  const simulateEnemyAction = (enemy: typeof combatParticipants[0]) => {
    // Find a random player to attack
    const players = combatParticipants.filter(p => !p.isEnemy && p.hp > 0);
    if (players.length === 0) return; // No valid targets
    
    const targetIndex = Math.floor(Math.random() * players.length);
    const target = players[targetIndex];
    
    // Roll for attack
    const attackRoll = Math.floor(Math.random() * 20) + 1;
    const attackBonus = Math.floor(Math.random() * 3) + 1; // Random bonus between 1-3
    const attackTotal = attackRoll + attackBonus;
    
    // Target AC (simple calculation based on level)
    const targetAC = 10 + Math.floor((target.hp / target.maxHp) * 3);
    const hit = attackTotal >= targetAC;
    
    // Update enemy's last roll
    const updatedParticipants = combatParticipants.map(p => {
      if (p.id === enemy.id) {
        return {
          ...p,
          lastRoll: {
            type: "attack",
            result: attackRoll,
            total: attackTotal,
            success: hit
          }
        };
      }
      return p;
    });
    
    setCombatParticipants(updatedParticipants);
    
    // Create action description for the AI
    let actionDescription = "";
    if (hit) {
      // Calculate damage (simple formula)
      const damageRoll = Math.floor(Math.random() * 6) + 1;
      actionDescription = `${enemy.name} attacks ${target.name} and hits with a roll of ${attackTotal} (${attackRoll} + ${attackBonus}), dealing ${damageRoll} damage.`;
    } else {
      actionDescription = `${enemy.name} attacks ${target.name} but misses with a roll of ${attackTotal} (${attackRoll} + ${attackBonus}).`;
    }
    
    // Generate narration for enemy action
    generateNarrationMutation.mutate(actionDescription);
  };
  
  // Advance to next turn in combat
  const advanceTurn = (specificCharacter?: string) => {
    if (!inCombat || combatParticipants.length === 0) return;
    
    // Find current active participant index
    const currentActiveIndex = combatParticipants.findIndex(p => p.isActive);
    let nextIndex = 0;
    
    if (specificCharacter) {
      // Find the specific character if named
      const characterIndex = combatParticipants.findIndex(
        p => p.name.toLowerCase() === specificCharacter.toLowerCase()
      );
      if (characterIndex >= 0) {
        nextIndex = characterIndex;
      } else {
        // If character not found, just advance normally
        nextIndex = (currentActiveIndex + 1) % combatParticipants.length;
      }
    } else {
      // Normal turn progression
      nextIndex = (currentActiveIndex + 1) % combatParticipants.length;
    }
    
    // Check if we completed a round
    if (nextIndex <= currentActiveIndex) {
      setCombatRound(prev => prev + 1);
    }
    
    // Update active participant
    const updatedParticipants = combatParticipants.map((p, idx) => ({
      ...p,
      isActive: idx === nextIndex
    }));
    
    setCombatParticipants(updatedParticipants);
    setCombatTurn(nextIndex);
    
    // Add turn change to game log
    const activeParticipant = updatedParticipants[nextIndex];
    const turnChangeLog: Partial<GameLog> = {
      campaignId,
      content: `It's now ${activeParticipant.name}'s turn.`,
      type: "system"
    };
    createLogMutation.mutate(turnChangeLog);
    
    // If AI-controlled enemy's turn, simulate their action
    if (activeParticipant.isEnemy && isAutoDmMode) {
      // Wait a moment before enemy acts
      setTimeout(() => {
        simulateEnemyAction(activeParticipant);
      }, 1500);
    }
  };
  
  // Update combat state based on narrative
  const updateCombatState = (narrativeText: string) => {
    // Look for attack patterns like "X hits Y for Z damage"
    const attackPattern = /(\w+)\s+(?:hits|attacks|strikes|damages)\s+(\w+)(?:.*?for\s+(\d+)\s+damage)?/i;
    const match = narrativeText.match(attackPattern);
    
    if (match) {
      const [_, attacker, target, damageStr] = match;
      const damage = damageStr ? parseInt(damageStr) : Math.floor(Math.random() * 6) + 1;
      
      // Update HP for the target if it's in our participants
      const updatedParticipants = combatParticipants.map(p => {
        if (p.name.toLowerCase() === target.toLowerCase()) {
          const newHp = Math.max(0, p.hp - damage);
          return {
            ...p,
            hp: newHp,
            lastRoll: {
              type: "damage",
              result: damage,
              total: damage,
              success: false
            }
          };
        }
        return p;
      });
      
      setCombatParticipants(updatedParticipants);
      
      // Check if target is defeated
      const targetParticipant = updatedParticipants.find(
        p => p.name.toLowerCase() === target.toLowerCase()
      );
      
      if (targetParticipant && targetParticipant.hp <= 0) {
        // Add defeat message
        const defeatLog: Partial<GameLog> = {
          campaignId,
          content: `${targetParticipant.name} has been defeated!`,
          type: "system"
        };
        createLogMutation.mutate(defeatLog);
        
        // Check if combat is over (all enemies or all players defeated)
        const remainingEnemies = updatedParticipants.filter(p => p.isEnemy && p.hp > 0);
        const remainingPlayers = updatedParticipants.filter(p => !p.isEnemy && p.hp > 0);
        
        if (remainingEnemies.length === 0) {
          endCombat("victory");
        } else if (remainingPlayers.length === 0) {
          endCombat("defeat");
        }
      }
    }
    
    // Advance turn if narrative contains phrases like "it's now X's turn"
    const turnPattern = /(?:it['']s|it is) (?:now) (\w+)['']s turn/i;
    const turnMatch = narrativeText.match(turnPattern);
    
    if (turnMatch) {
      const nextCharacter = turnMatch[1];
      advanceTurn(nextCharacter);
    }
  };
  
  // Parse narrative text to extract enemies
  const extractEnemiesFromText = (text: string) => {
    // Common fantasy enemy types
    const enemyTypes = [
      "goblin", "orc", "troll", "ogre", "wolf", "skeleton", "zombie", 
      "bandit", "thief", "cultist", "kobold", "dragon", "demon", "undead",
      "giant", "witch", "warlock", "guard"
    ];
    
    // Look for enemy patterns in text with simple NLP
    const words = text.toLowerCase().split(/\s+/);
    const enemies = new Set<string>();
    
    for (let i = 0; i < words.length; i++) {
      // Check if word is an enemy type
      const word = words[i].replace(/[.,!?;:'"()]/g, '');
      if (enemyTypes.includes(word)) {
        // Look for descriptors before the enemy (e.g. "giant troll")
        let enemyName = word;
        if (i > 0) {
          const prevWord = words[i-1].replace(/[.,!?;:'"()]/g, '');
          if (!enemyTypes.includes(prevWord) && prevWord.length > 2) {
            enemyName = `${prevWord} ${word}`;
          }
        }
        enemies.add(enemyName);
      }
    }
    
    return Array.from(enemies).map(name => {
      // Capitalize each word
      return name.split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    });
  };
  
  // Start combat tracking
  const startCombat = (narrativeText: string) => {
    // Extract potential enemies from the narrative
    const extractedEnemies = extractEnemiesFromText(narrativeText);
    
    // Create initiative order including party members and enemies
    const participants = [
      // Add party characters
      ...partyMembers.map(character => {
        const initiative = rollInitiative(character.name, Math.floor((currentCharacter.stats?.dexterity || 10) - 10) / 2);
        return {
          id: character.id.toString(),
          name: character.name,
          initiative: initiative.total,
          isEnemy: false,
          isActive: character.id === currentCharacter.id,
          hp: character.hp || 10,
          maxHp: character.maxHp || 10,
          actions: ["Attack", "Cast Spell", "Use Item", "Dash", "Dodge", "Hide"],
          lastRoll: {
            type: "initiative",
            result: initiative.result,
            total: initiative.total
          }
        };
      }),
      
      // Add enemies
      ...extractedEnemies.map((enemy, index) => {
        const initiative = rollInitiative(enemy);
        return {
          id: `enemy-${index}`,
          name: enemy,
          initiative: initiative.total,
          isEnemy: true,
          isActive: false,
          hp: 10, // Default HP
          maxHp: 10,
          actions: ["Attack", "Special Attack"],
          lastRoll: {
            type: "initiative",
            result: initiative.result,
            total: initiative.total
          }
        };
      })
    ];
    
    // Sort by initiative
    const sortedParticipants = [...participants].sort((a, b) => b.initiative - a.initiative);
    
    // Set combat state
    setInCombat(true);
    setCombatRound(1);
    setCombatTurn(0);
    setCombatParticipants(sortedParticipants);
    
    // Set first participant as active
    if (sortedParticipants.length > 0) {
      const updatedParticipants = sortedParticipants.map((p, idx) => ({
        ...p,
        isActive: idx === 0
      }));
      setCombatParticipants(updatedParticipants);
    }
    
    // Open battle tracker panel
    setRightPanelTab("battle");
    
    // Notify about combat start
    toast({
      title: "Combat Started!",
      description: "Roll for initiative! The battle tracker has been opened.",
      variant: "default",
    });
    
    // Add combat start to game log
    const combatStartLog: Partial<GameLog> = {
      campaignId,
      content: `Combat has begun! ${sortedParticipants.map(p => `${p.name} rolled ${p.lastRoll?.result} for initiative (${p.initiative} total)`).join('. ')}`,
      type: "system"
    };
    createLogMutation.mutate(combatStartLog);
  };

  // Submit player action
  const handleSubmitAction = () => {
    if (!playerInput.trim()) return;
    setIsProcessing(true);
    
    // If in combat and it's player character's turn, interpret as combat action
    if (inCombat) {
      const currentTurnParticipant = combatParticipants.find(p => p.isActive);
      const isPlayersTurn = currentTurnParticipant && !currentTurnParticipant.isEnemy;
      
      if (isPlayersTurn) {
        // Check for attack keywords
        const attackKeywords = ["attack", "hit", "strike", "stab", "shoot", "cast"];
        const isAttackAction = attackKeywords.some(keyword => 
          playerInput.toLowerCase().includes(keyword)
        );
        
        if (isAttackAction) {
          // Look for target in input
          const targets = combatParticipants
            .filter(p => p.isEnemy)
            .map(p => p.name.toLowerCase());
          
          let targetName = "";
          for (const target of targets) {
            if (playerInput.toLowerCase().includes(target)) {
              targetName = target;
              break;
            }
          }
          
          if (targetName) {
            // Auto-roll attack for the player
            const attackRoll = Math.floor(Math.random() * 20) + 1;
            // Use character's strength or dexterity as bonus
            const strMod = Math.floor((currentCharacter.stats?.strength || 10) - 10) / 2;
            const dexMod = Math.floor((currentCharacter.stats?.dexterity || 10) - 10) / 2;
            const attackBonus = Math.max(strMod, dexMod);
            const attackTotal = attackRoll + attackBonus;
            
            // Update player's last roll
            const updatedParticipants = combatParticipants.map(p => {
              if (p.id === currentCharacter.id.toString()) {
                return {
                  ...p,
                  lastRoll: {
                    type: "attack",
                    result: attackRoll,
                    total: attackTotal
                  }
                };
              }
              return p;
            });
            
            setCombatParticipants(updatedParticipants);
            
            // Add roll information to player input
            const enhancedInput = `${playerInput} [Rolling attack: ${attackRoll} + ${attackBonus} = ${attackTotal}]`;
            
            if (isAutoDmMode) {
              generateNarrationMutation.mutate(enhancedInput);
            } else {
              const playerLog: Partial<GameLog> = {
                campaignId,
                content: enhancedInput,
                type: "player"
              };
              createLogMutation.mutate(playerLog);
              setPlayerInput("");
              setIsProcessing(false);
            }
            return;
          }
        }
      }
    }
    
    // Default action processing
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
  
  // Calculate inventory weight
  const calculateInventoryWeight = () => {
    if (!currentCharacter?.equipment) return 0;
    
    const inventory = (currentCharacter.equipment as any)?.inventory || [];
    return inventory.reduce((total: number, item: any) => {
      const itemWeight = item.weight || 0;
      return total + (itemWeight * (item.quantity || 1));
    }, 0).toFixed(1);
  };
  
  // Calculate maximum carrying capacity based on strength
  const calculateCarryingCapacity = () => {
    if (!currentCharacter?.stats) return 150; // Default to strength 10 capacity
    
    // Safely access strength with fallbacks
    const stats = currentCharacter.stats as Record<string, any>;
    const strength = typeof stats.strength === 'number' ? stats.strength : 10;
    return (strength * 15).toFixed(0); // D&D 5e carrying capacity formula
  };
  
  // Get stat modifier safely
  const getStatModifier = (statName: string): number => {
    if (!currentCharacter?.stats) return 0;
    
    const stats = currentCharacter.stats as Record<string, any>;
    const statValue = typeof stats[statName] === 'number' ? stats[statName] : 10;
    return Math.floor((statValue - 10) / 2);
  };
  
  // Handle dropping an item
  const handleDropItem = (item: any) => {
    if (!currentCharacter?.equipment) return;
    
    // Add to dropped items/loot pile
    const droppedItem = {
      id: `dropped-${Math.random().toString(36).slice(2, 11)}`,
      name: item.name,
      description: item.description,
      type: item.type,
      quantity: item.quantity,
      weight: item.weight,
      value: item.value,
      source: `Dropped by ${currentCharacter.name}`
    };
    
    // Update available loot
    setAvailableLoot(prev => [...prev, droppedItem]);
    
    // Remove from inventory (this is a simplified version)
    // In a real implementation, you'd want to update the character's inventory in the database
    toast({
      title: "Item Dropped",
      description: `${item.name} has been dropped.`,
    });
  };
  
  // Handle taking a loot item
  const handleTakeLootItem = (item: any) => {
    if (!currentCharacter?.equipment) return;
    
    // Add to character inventory (simplified)
    // In a real implementation, you'd update the character's inventory in the database
    
    // Remove from available loot
    setAvailableLoot(prev => prev.filter(i => i.id !== item.id));
    
    toast({
      title: "Item Acquired",
      description: `${item.name} has been added to your inventory.`,
    });
  };
  
  // Handle taking all loot
  const handleTakeAllLoot = () => {
    if (availableLoot.length === 0 || !currentCharacter?.equipment) return;
    
    // Take all items
    setAvailableLoot([]);
    
    toast({
      title: "Loot Collected",
      description: `${availableLoot.length} items have been added to your inventory.`,
    });
  };
  
  // Handle looting a defeated enemy
  const handleLootEnemy = (enemy: typeof combatParticipants[0]) => {
    // Generate random loot based on enemy type
    const lootItems = generateRandomLoot(enemy.name);
    
    // Add items to available loot
    setAvailableLoot(prev => [...prev, ...lootItems]);
    
    // Show loot notification
    if (lootItems.length > 0) {
      toast({
        title: "Loot Available",
        description: `You found ${lootItems.length} items on ${enemy.name}.`,
      });
      
      // Open inventory panel with loot tab active
      setRightPanelTab("inventory");
    }
  };
  
  // Generate random loot based on enemy type
  const generateRandomLoot = (enemyName: string) => {
    // This is a simplified loot generation system
    // In a real implementation, you'd have a more sophisticated system based on enemy type, level, etc.
    
    const lootTable: Record<string, Array<{ 
      name: string; 
      type: string; 
      weight?: number; 
      value?: number;
      description?: string;
      dropChance: number; // 0-1 probability of dropping
    }>> = {
      "goblin": [
        { name: "Rusty Dagger", type: "weapon", weight: 1, value: 2, description: "A crude, rusty dagger.", dropChance: 0.7 },
        { name: "Small Pouch of Coins", type: "treasure", weight: 0.5, value: 5, description: "A small leather pouch containing a few coins.", dropChance: 0.4 },
        { name: "Goblin Ear", type: "miscellaneous", weight: 0.1, value: 1, description: "A severed goblin ear. Some bounty collectors might pay for this.", dropChance: 0.3 }
      ],
      "orc": [
        { name: "Jagged Sword", type: "weapon", weight: 3, value: 8, description: "A crude but effective sword with jagged edges.", dropChance: 0.6 },
        { name: "Orc Tusk", type: "miscellaneous", weight: 0.2, value: 3, description: "A large tusk from an orc. Might be valuable to certain collectors.", dropChance: 0.5 },
        { name: "Leather Scraps", type: "crafting", weight: 1, value: 2, description: "Scraps of leather that could be used for crafting.", dropChance: 0.8 }
      ],
      "wolf": [
        { name: "Wolf Pelt", type: "crafting", weight: 2, value: 5, description: "A wolf's pelt. Could be used for crafting or sold to a tanner.", dropChance: 0.9 },
        { name: "Wolf Fang", type: "miscellaneous", weight: 0.1, value: 2, description: "A sharp wolf fang that could be used as a trinket or crafting component.", dropChance: 0.6 }
      ],
      "skeleton": [
        { name: "Bone Fragments", type: "crafting", weight: 0.5, value: 1, description: "Small fragments of bone that might be useful for certain rituals.", dropChance: 0.8 },
        { name: "Rusty Armor Piece", type: "armor", weight: 2, value: 3, description: "A piece of ancient rusty armor.", dropChance: 0.5 }
      ],
      "bandit": [
        { name: "Stolen Coins", type: "treasure", weight: 0.5, value: 10, description: "A pouch of stolen coins.", dropChance: 0.7 },
        { name: "Dagger", type: "weapon", weight: 1, value: 5, description: "A well-used dagger.", dropChance: 0.6 },
        { name: "Lockpicks", type: "tool", weight: 0.2, value: 8, description: "A set of basic lockpicks.", dropChance: 0.3 }
      ]
    };
    
    // Get enemy type (strip any descriptors)
    const enemyType = enemyName.toLowerCase().split(" ").pop() || "goblin";
    
    // Get loot table for enemy type, defaulting to goblin if not found
    const possibleLoot = lootTable[enemyType] || lootTable["goblin"];
    
    // Roll for each possible item
    const lootDrops = possibleLoot
      .filter(() => Math.random() < 0.7) // Overall chance of any loot
      .filter(item => Math.random() < item.dropChance)
      .map(item => ({
        id: `loot-${Math.random().toString(36).slice(2, 11)}`,
        name: item.name,
        type: item.type,
        weight: item.weight,
        value: item.value,
        description: item.description,
        quantity: 1,
        source: enemyName
      }));
    
    return lootDrops;
  };
  
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
            
            {/* Bot Companion Button */}
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
              onClick={() => setRightPanelTab(rightPanelTab === "companion" ? null : "companion")}
            >
              <Bot className="h-4 w-4" />
              <span className="hidden md:inline-block">Companion</span>
            </Button>
            
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
                    {rightPanelTab === "companion" && "Bot Companion"}
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
                    <Tabs defaultValue="inventory">
                      <TabsList className="w-full mb-4">
                        <TabsTrigger value="inventory" className="flex-1">My Items</TabsTrigger>
                        <TabsTrigger value="loot" className="flex-1">Loot</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="inventory">
                        <div className="mb-3">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <span className="text-sm font-medium">Items</span>
                              <span className="text-xs text-muted-foreground ml-2">
                                ({((currentCharacter.equipment as any)?.inventory?.length || 0)} / 20 slots)
                              </span>
                            </div>
                          </div>
                          
                          {/* Carrying capacity indicator */}
                          <div className="p-2 border border-border rounded-md bg-muted/10 mb-3">
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
                              ></div>
                            </div>
                            <div className="mt-1">
                              <span className="text-xs text-muted-foreground">Based on {getStatModifier('strength') > 0 ? '+' : ''}{getStatModifier('strength')} STR modifier</span>
                              {Number(calculateInventoryWeight()) > Number(calculateCarryingCapacity()) && (
                                <p className="text-xs text-destructive mt-1">
                                  Encumbered: Your movement speed is reduced and you have disadvantage on ability checks, attack rolls, and saving throws that use Strength, Dexterity, or Constitution.
                                </p>
                              )}
                            </div>
                          </div>
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
                                  <div className="flex items-center">
                                    <span className="text-xs text-muted-foreground mr-2">
                                      {item.weight ? `${item.weight} lbs` : ''}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      {item.quantity > 1 ? `x${item.quantity}` : ''}
                                    </span>
                                  </div>
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
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="text-xs h-7 ml-auto text-destructive"
                                    onClick={() => handleDropItem(item)}
                                  >
                                    Drop
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
                      </TabsContent>
                      
                      <TabsContent value="loot">
                        <div>
                          <div className="mb-3 flex items-center justify-between">
                            <h4 className="text-sm font-medium">Available Loot</h4>
                            {availableLoot.length > 0 && (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="text-xs h-7"
                                onClick={handleTakeAllLoot}
                              >
                                <Backpack className="mr-1 h-3 w-3" />
                                Take All
                              </Button>
                            )}
                          </div>
                          
                          {availableLoot.length > 0 ? (
                            <div>
                              {/* Weight calculation warning */}
                              <div className="mb-3 p-2 border border-border rounded-md bg-muted/20">
                                <div className="flex justify-between items-center">
                                  <div>
                                    <span className="text-xs font-medium">Current Weight:</span>
                                    <span className="text-xs ml-1">{calculateInventoryWeight()} lbs</span>
                                  </div>
                                  <div>
                                    <span className="text-xs font-medium">Weight After Taking All:</span>
                                    <span className={`text-xs ml-1 ${
                                      Number(calculateInventoryWeight()) + availableLoot.reduce((total, item) => 
                                        total + ((item.weight || 0) * (item.quantity || 1)), 0) > 
                                        Number(calculateCarryingCapacity()) ? 'text-destructive font-medium' : ''
                                    }`}>
                                      {(Number(calculateInventoryWeight()) + availableLoot.reduce((total, item) => 
                                        total + ((item.weight || 0) * (item.quantity || 1)), 0)).toFixed(1)} / {calculateCarryingCapacity()} lbs
                                    </span>
                                  </div>
                                </div>
                                
                                {/* Warning if taking all would exceed capacity */}
                                {Number(calculateInventoryWeight()) + availableLoot.reduce((total, item) => 
                                  total + ((item.weight || 0) * (item.quantity || 1)), 0) > 
                                  Number(calculateCarryingCapacity()) && (
                                  <p className="text-xs text-destructive mt-1">
                                    Warning: Taking all items will exceed your carrying capacity. You'll be encumbered and move slower.
                                  </p>
                                )}
                              </div>
                          
                              <div className="space-y-2 max-h-64 overflow-y-auto">
                                {availableLoot.map((item, i) => (
                                  <div key={i} className="p-2 border border-border rounded-md">
                                    <div className="flex justify-between">
                                      <div>
                                        <div className="text-sm font-medium">
                                          {item.name}
                                          {item.quantity > 1 && (
                                            <span className="ml-1 text-xs text-muted-foreground">
                                              x{item.quantity}
                                            </span>
                                          )}
                                        </div>
                                        <div className="text-xs text-muted-foreground mt-1">
                                          {item.description || "No description available"}
                                        </div>
                                        <div className="text-xs text-muted-foreground mt-1">
                                          Source: {item.source}
                                        </div>
                                      </div>
                                      <div className="flex flex-col items-end text-xs">
                                        {item.type && <span className="text-muted-foreground capitalize">{item.type}</span>}
                                        {item.weight && <span className="text-muted-foreground">{item.weight} lbs</span>}
                                        {item.value && <span className="text-amber-600">{item.value} gold</span>}
                                      </div>
                                    </div>
                                    
                                    <div className="mt-2 flex justify-end">
                                      <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="text-xs h-7"
                                        onClick={() => handleTakeLootItem(item)}
                                      >
                                        Take Item
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="border border-border rounded-md p-4">
                              <div className="text-center">
                                <p className="text-sm text-muted-foreground">No loot available</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Defeat enemies or find treasures to collect loot
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </TabsContent>
                    </Tabs>
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
                            Round {combatRound}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <h4 className="text-sm font-medium mb-2 flex items-center justify-between">
                        <span>Initiative Order</span>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-xs h-7"
                          onClick={() => advanceTurn()}
                        >
                          Next Turn
                        </Button>
                      </h4>
                      <div className="space-y-1">
                        {combatParticipants.map(participant => (
                          <div 
                            key={participant.id} 
                            className={`p-2 border border-border rounded-md ${
                              participant.isActive ? 'bg-primary/5' : ''
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <span className={`text-xs ${
                                  participant.isActive 
                                    ? 'bg-primary text-white' 
                                    : 'bg-muted'
                                } px-1.5 py-0.5 rounded-full mr-2`}>
                                  {participant.initiative}
                                </span>
                                <span className="text-sm font-medium">{participant.name}</span>
                              </div>
                              <div className="flex items-center">
                                <span className="text-xs text-muted-foreground mr-2">
                                  HP: {participant.hp}/{participant.maxHp}
                                </span>
                                {participant.isActive && (
                                  <span className="text-xs text-primary font-medium">
                                    Current Turn
                                  </span>
                                )}
                                {participant.isEnemy && (
                                  <span className="text-xs text-destructive ml-1">
                                    Enemy
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            {/* Show last roll if available */}
                            {participant.lastRoll && (
                              <div className="mt-1 text-xs bg-muted/40 p-1 rounded">
                                <span>
                                  Last Roll: {participant.lastRoll.type} ({participant.lastRoll.result}) 
                                  {participant.lastRoll.total !== participant.lastRoll.result && 
                                    ` + ${participant.lastRoll.total - participant.lastRoll.result} = ${participant.lastRoll.total}`
                                  }
                                  {participant.lastRoll.success !== undefined && 
                                    ` - ${participant.lastRoll.success ? 'Hit' : 'Miss'}`
                                  }
                                </span>
                              </div>
                            )}
                            
                            {/* Loot button for defeated enemies */}
                            {participant.isEnemy && participant.hp <= 0 && (
                              <div className="mt-1 flex justify-end">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-xs h-6"
                                  onClick={() => handleLootEnemy(participant)}
                                >
                                  <Backpack className="mr-1 h-3 w-3" />
                                  Loot
                                </Button>
                              </div>
                            )}
                          </div>
                        ))}
                        
                        {combatParticipants.length === 0 && (
                          <div className="text-center p-4 border border-dashed border-border rounded-md">
                            <p className="text-sm text-muted-foreground">No combat in progress</p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Show actions only for active player character's turn */}
                    {inCombat && combatParticipants.find(p => p.isActive && !p.isEnemy) && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium mb-2">Available Actions</h4>
                        <div className="grid grid-cols-2 gap-2">
                          {combatParticipants
                            .find(p => p.isActive && !p.isEnemy)
                            ?.actions.map((action, idx) => (
                              <Button 
                                key={idx}
                                variant="outline" 
                                size="sm" 
                                className="text-xs h-8 justify-start"
                                onClick={() => {
                                  // Find a valid enemy target if available
                                  const target = combatParticipants.find(p => p.isEnemy && p.hp > 0)?.name;
                                  setPlayerInput(`I ${action.toLowerCase()}${target ? ` the ${target}` : ''}`);
                                }}
                              >
                                {action === "Attack" && <Sword className="mr-1 h-3 w-3" />}
                                {action === "Cast Spell" && <Wand2 className="mr-1 h-3 w-3" />}
                                {action === "Use Item" && <Package className="mr-1 h-3 w-3" />}
                                {action === "Dash" && <MoveRight className="mr-1 h-3 w-3" />}
                                {action === "Dodge" && <Shield className="mr-1 h-3 w-3" />}
                                {action === "Hide" && <EyeOff className="mr-1 h-3 w-3" />}
                                {action}
                              </Button>
                            ))
                          }
                        </div>
                      </div>
                    )}
                    
                    <div>
                      <h4 className="text-sm font-medium mb-2 flex items-center justify-between">
                        <span>Battle Log</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs h-6"
                          onClick={() => endCombat("fled")}
                        >
                          Flee Combat
                        </Button>
                      </h4>
                      <div className="h-48 overflow-y-auto border border-border rounded-md p-2 text-xs">
                        {/* Filter game logs for combat-related entries */}
                        {gameLogs
                          .filter(log => log.type === "system" || log.type === "roll" || 
                            (log.type === "narrative" && inCombat))
                          .reverse()
                          .slice(0, 20)
                          .map((log, idx) => (
                            <p key={idx} className="text-muted-foreground mb-1">
                              {log.content.substring(0, 150)}
                              {log.content.length > 150 ? '...' : ''}
                            </p>
                          ))}
                          
                        {gameLogs.filter(log => log.type === "system" || log.type === "roll").length === 0 && (
                          <p className="text-muted-foreground mb-1">
                            Combat has begun! Roll for initiative to determine turn order.
                          </p>
                        )}
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
              {/* Action Shortcuts */}
              {inCombat && (
                <div className="mb-3">
                  <h3 className="text-sm font-medium mb-2">Combat Actions</h3>
                  <div className="flex flex-wrap gap-1">
                    {/* Show actions based on current turn */}
                    {combatParticipants.find(p => p.isActive)?.actions.map((action, idx) => (
                      <Button
                        key={idx}
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => {
                          const target = combatParticipants.find(p => p.isEnemy)?.name;
                          setPlayerInput(`I ${action.toLowerCase()}${target ? ` the ${target}` : ''}`);
                        }}
                      >
                        {action}
                      </Button>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => advanceTurn()}
                    >
                      End Turn
                    </Button>
                  </div>
                </div>
              )}
              
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
              </div>
              
              {/* Turn Tracker */}
              {inCombat && (
                <div className="mb-3 p-2 border border-border rounded-md bg-muted/20">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-medium">Turn Tracker</span>
                    <span className="text-xs">Round {combatRound}</span>
                  </div>
                  <div className="flex flex-nowrap overflow-x-auto gap-1 pb-1">
                    {combatParticipants.map((participant, idx) => (
                      <div 
                        key={participant.id}
                        className={`flex-shrink-0 px-2 py-1 rounded-md text-xs ${
                          participant.isActive 
                            ? 'bg-primary text-primary-foreground font-medium' 
                            : participant.isEnemy
                              ? 'bg-destructive/10 text-destructive'
                              : 'bg-muted'
                        }`}
                      >
                        <div className="flex items-center gap-1">
                          <span>{participant.name}</span>
                          <span className="text-[10px] opacity-80">{participant.hp}/{participant.maxHp} HP</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
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