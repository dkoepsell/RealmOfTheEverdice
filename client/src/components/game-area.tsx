import { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, UserCog, Bot } from "lucide-react";
import { Campaign, Character, GameLog } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";

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
}

export const GameArea = ({ 
  campaign, 
  currentAdventure, 
  currentCharacter, 
  gameLogs,
  onAddGameLog,
  isAutoDmMode = true // Default to Auto-DM if not specified
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
  
  // Generate new decision options
  const generateDecisionOptions = async () => {
    // In a real app, you might use AI to generate these based on the story context
    setDecisionOptions([
      "Continue exploring the ruins",
      "Inspect the strange markings",
      "Set up camp for the night",
      "Head back to town"
    ]);
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
          
          {/* Game Logs - DM Narration and Player Actions */}
          <div className="space-y-6">
            {gameLogs.map((log, index) => {
              if (log.type === "narrative") {
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
              } else {
                return null;
              }
            })}
            
            {/* Loading indicator for narration generation */}
            {narrationMutation.isPending && (
              <div className="animate-pulse p-4 bg-secondary/10 rounded-lg">
                <div className="h-4 bg-secondary/20 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-secondary/20 rounded w-1/2"></div>
              </div>
            )}
          </div>
          
          {/* Decision Point */}
          <div className="bg-darkBrown/10 p-4 rounded-lg mt-6">
            <h3 className="font-medieval text-lg mb-2">What will you do?</h3>
            <div className="space-y-2">
              {decisionOptions.map((option, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="w-full text-left justify-start p-2 bg-parchment hover:bg-accent/20 border border-accent rounded"
                  onClick={() => handleDecisionClick(option)}
                >
                  {option}
                </Button>
              ))}
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
