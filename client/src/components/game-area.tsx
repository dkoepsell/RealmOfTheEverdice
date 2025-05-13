import { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Send, 
  UserCog, 
  Bot, 
  DicesIcon, 
  Sword, 
  MessagesSquare, 
  Footprints, 
  SearchCode, 
  UserCheck, 
  Fingerprint,
  Users
} from "lucide-react";
import { Campaign, Character, GameLog } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { DiceRoller } from "@/components/dice-roll";
import { DiceRollResults, DiceRollResult } from "@/components/dice-roll-results";
import { InteractiveDiceSuggestions } from "@/components/interactive-dice-suggestions";
import { DiceType } from "@/hooks/use-dice";

interface GameAreaProps {
  campaign: Campaign;
  currentAdventure?: { 
    title: string;
    location: string;
    description: string;
  };
  currentCharacter: Character;
  gameLogs: GameLog[];
  onAddGameLog: (log: GameLog) => void;
  isAutoDmMode?: boolean; // Indicates whether the AI DM is active or a human DM
  onDiceRoll?: (type: DiceType, result: number, modifier?: number, purpose?: string, threshold?: number) => void;
  diceRollResults?: DiceRollResult[];
  isDm?: boolean; // Indicates if the current user is the DM
}

export const GameArea = ({ 
  campaign, 
  currentAdventure, 
  currentCharacter, 
  gameLogs,
  onAddGameLog,
  isAutoDmMode = true, // Default to Auto-DM if not specified
  onDiceRoll,
  diceRollResults = [],
  isDm = false // Default to not being the DM
}: GameAreaProps) => {
  const [playerAction, setPlayerAction] = useState("");
  const [dmNarration, setDmNarration] = useState("");
  const [decisionOptions, setDecisionOptions] = useState<string[]>([
    "Investigate the area",
    "Talk to nearby NPCs",
    "Search for hidden items",
    "Rest and recover"
  ]);
  
  // Generate narration based on player action
  const narrationMutation = useMutation({
    mutationFn: async (playerAction: string) => {
      // Create a context from recent game logs
      const recentLogs = gameLogs.slice(0, 5).map(log => log.content).join("\n");
      
      const res = await apiRequest("POST", "/api/generate/narration", {
        context: recentLogs,
        playerAction
      });
      
      return await res.json();
    },
    onSuccess: (data) => {
      // Add the new narration to game logs
      const newLog: Partial<GameLog> = {
        campaignId: campaign.id,
        content: data.narration,
        type: "narrative"
      };
      
      // Create log in database
      createLogMutation.mutate(newLog);
      
      // Generate new decision options
      generateDecisionOptions();
    }
  });
  
  // Auto-advance the story/turn
  const autoAdvanceMutation = useMutation({
    mutationFn: async () => {
      // Create a context from recent game logs
      const recentLogs = gameLogs.slice(0, 5).map(log => log.content).join("\n");
      
      console.log("Auto-advancing narrative with recent logs context:", { 
        logCount: gameLogs.length,
        contextLength: recentLogs.length
      });
      
      const res = await apiRequest("POST", "/api/generate/narration", {
        context: recentLogs,
        playerAction: "What happens next?",
        isAutoAdvance: true
      });
      
      return await res.json();
    },
    onSuccess: (data) => {
      console.log("Auto-advance narration generated successfully:", data);
      
      // Add the new narration to game logs
      const newLog: Partial<GameLog> = {
        campaignId: campaign.id,
        content: data.narration,
        type: "narrative"
      };
      
      // Create log in database
      createLogMutation.mutate(newLog);
      
      // Generate new decision options
      generateDecisionOptions();
    },
    onError: (error) => {
      console.error("Auto-advance narration generation failed:", error);
      
      // Add a system message about the failure
      const errorLog: Partial<GameLog> = {
        campaignId: campaign.id,
        content: "The narrative couldn't advance automatically. Please use the 'Auto-Advance Story' button to continue.",
        type: "system"
      };
      
      // Create error log in database
      createLogMutation.mutate(errorLog);
    }
  });
  
  // Create game log in database
  const createLogMutation = useMutation({
    mutationFn: async (log: Partial<GameLog>) => {
      const res = await apiRequest("POST", `/api/campaigns/${campaign.id}/logs`, log);
      return await res.json();
    },
    onSuccess: (newLog) => {
      onAddGameLog(newLog);
    }
  });
  
  // Process NPC actions for the campaign
  const npcActionsMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/campaigns/${campaign.id}/npc-turns`, {});
      return await res.json();
    },
    onSuccess: (data) => {
      if (data.actions && data.actions.length > 0) {
        // Create system message indicating NPCs are taking actions
        const systemLog: Partial<GameLog> = {
          campaignId: campaign.id,
          content: "NPCs are taking their turns...",
          type: "system"
        };
        createLogMutation.mutate(systemLog);
        
        // Create individual logs for each NPC action
        data.actions.forEach((action: string) => {
          const actionLog: Partial<GameLog> = {
            campaignId: campaign.id,
            content: action,
            type: "npc"
          };
          createLogMutation.mutate(actionLog);
        });
      } else {
        // No NPC actions occurred
        const noActionLog: Partial<GameLog> = {
          campaignId: campaign.id,
          content: "No NPCs took any meaningful actions at this time.",
          type: "system"
        };
        createLogMutation.mutate(noActionLog);
      }
    },
    onError: (error) => {
      console.error("Failed to process NPC actions:", error);
      const errorLog: Partial<GameLog> = {
        campaignId: campaign.id,
        content: "The NPCs couldn't act at this time. Try again later.",
        type: "system"
      };
      createLogMutation.mutate(errorLog);
    }
  });
  
  // This function is kept for backwards compatibility but we don't restrict player choices anymore
  const generateDecisionOptions = async () => {
    // We're moving away from pre-set options to embrace full player freedom
    // This function is kept to maintain compatibility with existing code
  };
  
  // Handle taking a turn/advancing the story
  const handleTakeTurn = () => {
    if (isAutoDmMode) {
      // Add a system message to indicate the turn advancement
      const systemLog: Partial<GameLog> = {
        campaignId: campaign.id,
        content: `${currentCharacter.name} takes their turn...`,
        type: "system"
      };
      
      // Create log in database
      createLogMutation.mutate(systemLog);
      
      // Generate auto-advance narrative using AI
      autoAdvanceMutation.mutate();
    } else {
      // In Human DM mode, we add a notification that the player wants to advance
      const systemLog: Partial<GameLog> = {
        campaignId: campaign.id,
        content: `${currentCharacter.name} is ready to take their turn.`,
        type: "system"
      };
      
      // Create log in database
      createLogMutation.mutate(systemLog);
    }
  };
  
  // Handle triggering NPC actions
  const handleNpcActions = () => {
    // Trigger NPC actions via the mutation
    npcActionsMutation.mutate();
  };
  
  const handleSubmitAction = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (playerAction.trim()) {
      // Add player action to game logs
      const playerLog: Partial<GameLog> = {
        campaignId: campaign.id,
        content: `${currentCharacter.name}: ${playerAction}`,
        type: "player"
      };
      
      // Create log in database
      createLogMutation.mutate(playerLog);
      
      // Only generate AI narration if in Auto-DM mode
      if (isAutoDmMode) {
        // Generate narration response using AI
        narrationMutation.mutate(playerAction);
      } else {
        // In Human DM mode, we don't automatically generate narrative responses
        // The human DM would need to provide the narration manually
        // We could show a notification or some UI element here to indicate
        // that the DM should respond
      }
      
      // Clear input
      setPlayerAction("");
    }
  };
  
  const handleDecisionClick = (decision: string) => {
    setPlayerAction(decision);
    handleSubmitAction({ preventDefault: () => {} } as React.FormEvent);
  };
  
  // Function for the human DM to add narration
  const handleDmNarrationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (dmNarration.trim()) {
      // Add DM narration to game logs
      const narrativeLog: Partial<GameLog> = {
        campaignId: campaign.id,
        content: dmNarration,
        type: "narrative"
      };
      
      // Create log in database
      createLogMutation.mutate(narrativeLog);
      
      // Clear input
      setDmNarration("");
    }
  };

  return (
    <div className="w-full lg:w-2/4 flex flex-col">
      {/* Game State Bar */}
      <div className="bg-secondary text-white p-2">
        <div className="flex justify-between items-center px-4">
          <div>
            <span className="font-medieval">Campaign:</span>
            <span className="ml-2">{campaign.name}</span>
          </div>
          <div>
            <span className="font-medieval">Current Turn:</span>
            <span className="ml-2 font-bold">{currentCharacter.name}</span>
          </div>
        </div>
      </div>
      
      {/* Narrative Area */}
      <div className="flex-grow overflow-y-auto p-4 scroll-container">
        <div className="max-w-3xl mx-auto bg-parchment/90 rounded-lg p-6 medieval-border shadow-lg">
          <h2 className="text-2xl font-medieval text-primary mb-4">
            {currentAdventure?.title || "The Adventure Begins"}
          </h2>
          
          {/* Game Logs - DM Narration and Player Actions - Displayed in chronological order */}
          <div className="space-y-6">
            {/* Display default message if no logs available */}
            {gameLogs.length === 0 && (
              <div className="mb-8 leading-relaxed">
                <div className="border-4 border-double border-amber-800/60 bg-amber-50/30 p-6 rounded-lg shadow-inner">
                  <h3 className="text-xl font-medieval text-primary-800 mb-4">Begin Your Adventure</h3>
                  <p className="mb-3 font-serif italic first-letter:text-3xl first-letter:font-bold first-letter:mr-1 first-letter:float-left first-letter:text-primary-900">
                    Your adventure is about to begin in the realm of Everdice. To get started, describe your first action in the text box below and click "Submit Action". The Dungeon Master will respond with a narrative that continues your story.
                  </p>
                  <p className="text-sm font-medium text-primary-700 mt-4">
                    Tip: Try simple actions like "I look around the tavern" or "I approach the nearest person and introduce myself" to begin.
                  </p>
                </div>
              </div>
            )}
            
            {/* First show intro narrative if present */}
            {gameLogs.filter(log => log.type === "narrative_introduction").map((log, index) => (
              <div key={`intro-${index}`} className="mb-8 leading-relaxed">
                <div className="border-4 border-double border-amber-800/60 bg-amber-50/30 p-6 rounded-lg shadow-inner">
                  <h3 className="text-xl font-medieval text-primary-800 mb-4">The Story Begins...</h3>
                  <p className="mb-3 font-serif italic first-letter:text-3xl first-letter:font-bold first-letter:mr-1 first-letter:float-left first-letter:text-primary-900">
                    {log.content}
                  </p>
                </div>
              </div>
            ))}
            
            {/* Then show all logs except intro in chronological order */}
            {gameLogs.length > 0 && gameLogs.filter(log => log.type !== "narrative_introduction").map((log, index) => {
              if (log.type === "narrative" || log.type === "narrative_introduction") {
                // Special styling for the introduction narrative
                if (log.type === "narrative_introduction") {
                  return (
                    <div key={index} className="mb-8 leading-relaxed">
                      <div className="border-4 border-double border-amber-800/60 bg-amber-50/30 p-6 rounded-lg shadow-inner">
                        <h3 className="text-xl font-medieval text-primary-800 mb-4">The Story Begins...</h3>
                        <p className="mb-3 font-serif italic first-letter:text-3xl first-letter:font-bold first-letter:mr-1 first-letter:float-left first-letter:text-primary-900">
                          {log.content}
                        </p>
                      </div>
                    </div>
                  );
                }
                
                // Regular narrative styling
                return (
                  <div key={index} className="mb-6 leading-relaxed">
                    <p className="mb-3">
                      {log.content}
                    </p>
                  </div>
                );
              } else if (log.type === "player") {
                return (
                  <div key={index} className="mb-6 border-l-4 border-secondary pl-4 py-1">
                    <p className="mb-2">
                      {log.content}
                    </p>
                  </div>
                );
              } else if (log.type === "system") {
                return (
                  <div key={index} className="mb-6 text-center">
                    <p className="italic text-muted-foreground text-sm bg-secondary/5 py-1 px-3 rounded-full inline-block">
                      {log.content}
                    </p>
                  </div>
                );
              } else if (log.type === "roll") {
                return (
                  <div key={index} className="mb-6 border-l-4 border-purple-500 pl-4 py-1 bg-purple-50/10">
                    <p className="mb-2 font-mono text-sm">
                      {log.content}
                    </p>
                  </div>
                );
              } else {
                return null;
              }
            })}
            
            {/* Loading indicators */}
            {narrationMutation.isPending && (
              <div className="animate-pulse p-4 bg-secondary/10 rounded-lg">
                <div className="h-4 bg-secondary/20 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-secondary/20 rounded w-1/2"></div>
              </div>
            )}
            
            {autoAdvanceMutation.isPending && (
              <div className="animate-pulse p-4 bg-primary/10 rounded-lg">
                <div className="h-4 bg-primary/20 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-primary/20 rounded w-2/3 mb-2"></div>
                <div className="h-4 bg-primary/20 rounded w-1/2"></div>
              </div>
            )}
          </div>
          
          {/* Interactive Dice Suggestions based on the latest narrative */}
          {gameLogs.length > 0 && gameLogs[gameLogs.length - 1] && (gameLogs[gameLogs.length - 1].type === "narrative" || gameLogs[gameLogs.length - 1].type === "narrative_introduction") && (
            <InteractiveDiceSuggestions 
              narrative={gameLogs[gameLogs.length - 1].content} 
              character={currentCharacter}
              onRollComplete={(result) => {
                // Create a roll log entry
                const rollLog: Partial<GameLog> = {
                  campaignId: campaign.id,
                  content: `${currentCharacter.name} rolled a ${result.roll} (total: ${result.total}) for a ${result.suggestion.type} ${result.suggestion.skill ? `(${result.suggestion.skill})` : ""} - ${result.success ? "Success!" : "Failure!"}${result.damage ? ` Damage: ${result.damage}` : ""}`,
                  type: "roll"
                };
                
                // Create log in database
                createLogMutation.mutate(rollLog);
                
                // Also call the parent onDiceRoll handler if provided
                if (onDiceRoll) {
                  const diceType = result.suggestion.type === "attack" ? "d20" : "d20";
                  onDiceRoll(
                    diceType as DiceType,
                    result.roll,
                    result.total - result.roll,
                    result.suggestion.description,
                    result.suggestion.dc || result.suggestion.targetAC
                  );
                }
              }}
              onAdvanceStory={() => {
                // When auto-advancing after a dice roll, call the auto-advance mutation
                autoAdvanceMutation.mutate();
              }}
            />
          )}
          
          {/* Dice Roll Results */}
          {diceRollResults.length > 0 && (
            <div className="mb-6">
              <DiceRollResults results={diceRollResults} maxResults={8} />
            </div>
          )}
          
          {/* Dice Roller */}
          <div className="mb-6">
            <DiceRoller 
              characterName={currentCharacter.name}
              onRollResult={onDiceRoll}
              characterModifiers={{
                STR: Math.floor(((currentCharacter.stats as any)?.strength || 10) - 10) / 2,
                DEX: Math.floor(((currentCharacter.stats as any)?.dexterity || 10) - 10) / 2,
                CON: Math.floor(((currentCharacter.stats as any)?.constitution || 10) - 10) / 2,
                INT: Math.floor(((currentCharacter.stats as any)?.intelligence || 10) - 10) / 2,
                WIS: Math.floor(((currentCharacter.stats as any)?.wisdom || 10) - 10) / 2,
                CHA: Math.floor(((currentCharacter.stats as any)?.charisma || 10) - 10) / 2
              }}
            />
          </div>
          
          {/* Take Turn Button */}
          <div className="flex justify-end my-4">
            <Button
              variant="default"
              size="lg"
              className="bg-primary hover:bg-primary/90 text-white font-medieval"
              onClick={handleTakeTurn}
              disabled={narrationMutation.isPending || autoAdvanceMutation.isPending}
            >
              {autoAdvanceMutation.isPending ? (
                <>
                  <div className="animate-spin mr-2 h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full"></div>
                  Advancing...
                </>
              ) : (
                <>
                  {isAutoDmMode ? "Auto-Advance Story" : "Take Your Turn"}
                </>
              )}
            </Button>
          </div>
          
          {/* Open-ended Adventure Guidance */}
          <div className="bg-darkBrown/10 p-4 rounded-lg mt-6">
            <h3 className="font-medieval text-lg mb-2">What will you do?</h3>
            <p className="text-sm text-muted-foreground mb-3">
              The world is open to you. Describe any action you wish to take, and the adventure will respond accordingly. You could:
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <div className="flex items-start">
                <Sword className="h-3 w-3 mr-1 mt-0.5" />
                <span>Fight or defend yourself</span>
              </div>
              <div className="flex items-start">
                <MessagesSquare className="h-3 w-3 mr-1 mt-0.5" />
                <span>Talk or negotiate with NPCs</span>
              </div>
              <div className="flex items-start">
                <Footprints className="h-3 w-3 mr-1 mt-0.5" />
                <span>Explore the environment</span>
              </div>
              <div className="flex items-start">
                <SearchCode className="h-3 w-3 mr-1 mt-0.5" />
                <span>Solve puzzles or investigate</span>
              </div>
              <div className="flex items-start">
                <UserCheck className="h-3 w-3 mr-1 mt-0.5" />
                <span>Help others or be heroic</span>
              </div>
              <div className="flex items-start">
                <Fingerprint className="h-3 w-3 mr-1 mt-0.5" />
                <span>Use your special skills or abilities</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Human DM Input - Only shown when in Human DM mode */}
      {!isAutoDmMode && (
        <div className="bg-primary/20 p-3 border-t border-primary/30">
          <div className="flex items-center mb-2">
            <UserCog className="h-5 w-5 mr-2 text-primary" />
            <span className="text-sm font-medieval text-primary">DM Narration</span>
          </div>
          <form onSubmit={handleDmNarrationSubmit} className="flex space-x-2">
            <Input 
              value={dmNarration}
              onChange={(e) => setDmNarration(e.target.value)}
              className="flex-grow bg-parchment/90 border border-primary/50 rounded p-2 font-body" 
              placeholder="Describe what happens next as the DM..."
            />
            <Button 
              type="submit" 
              className="bg-primary text-white px-4 py-2 rounded hover:bg-primary/80"
              disabled={!dmNarration.trim()}
            >
              <Send className="mr-1 h-4 w-4" /> Narrate
            </Button>
          </form>
        </div>
      )}
      
      {/* Player Input */}
      <div className="bg-darkBrown/20 p-3">
        <form onSubmit={handleSubmitAction} className="flex space-x-2">
          <Input 
            value={playerAction}
            onChange={(e) => setPlayerAction(e.target.value)}
            className="flex-grow bg-parchment border border-accent rounded p-2 font-body" 
            placeholder="Describe your action..."
          />
          <Button 
            type="submit" 
            className="bg-primary text-white px-4 py-2 rounded hover:bg-primary/80"
            disabled={narrationMutation.isPending || !playerAction.trim()}
          >
            <Send className="mr-1 h-4 w-4" /> Send
          </Button>
        </form>
      </div>
    </div>
  );
};

export default GameArea;
