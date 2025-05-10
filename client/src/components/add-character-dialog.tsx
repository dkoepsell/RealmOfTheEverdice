import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Character } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2, UserPlus, Bot } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AddCharacterDialogProps {
  campaignId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCharacterAdded?: () => void;
}

// Bot companion options
const BOT_COMPANIONS = [
  { 
    id: 'ranger-companion', 
    name: 'Sylvanas Windrunner', 
    class: 'Ranger', 
    race: 'Elf', 
    level: 5,
    description: 'A skilled tracker and wilderness expert who provides ranged support and scouting abilities.'
  },
  { 
    id: 'cleric-companion', 
    name: 'Thaddeus Lightbringer', 
    class: 'Cleric', 
    race: 'Human', 
    level: 5,
    description: 'A devout healer who provides magical support and can turn undead creatures.'
  },
  { 
    id: 'warrior-companion', 
    name: 'Grog Strongjaw', 
    class: 'Fighter', 
    race: 'Goliath', 
    level: 5,
    description: 'A mighty warrior who excels at taking damage and protecting more vulnerable party members.'
  }
];

export function AddCharacterDialog({
  campaignId,
  open,
  onOpenChange,
  onCharacterAdded
}: AddCharacterDialogProps) {
  // Safety check for campaign ID to prevent NaN issues and log for debugging
  const validCampaignId = campaignId && !isNaN(campaignId) ? Number(campaignId) : 0;
  
  // Log campaign ID for debugging
  useEffect(() => {
    if (open) {
      console.log("AddCharacterDialog opened with campaignId:", campaignId, "validCampaignId:", validCampaignId);
      if (!validCampaignId || validCampaignId <= 0) {
        console.error("Invalid campaign ID detected in AddCharacterDialog:", campaignId);
      }
    }
  }, [open, campaignId, validCampaignId]);
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>("");
  const [characterList, setCharacterList] = useState<Character[]>([]);
  const [characterTab, setCharacterTab] = useState<"my-characters" | "bot-companions">("my-characters");
  const [selectedBotCompanionId, setSelectedBotCompanionId] = useState<string>("");

  // Fetch user's characters
  const {
    data: characters,
    isLoading: charactersLoading,
    error: charactersError,
    refetch: refetchCharacters
  } = useQuery<Character[]>({
    queryKey: ["/api/characters"],
    enabled: open && !!user && characterTab === "my-characters",
  });

  // Reset selected character when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedCharacterId("");
      setSelectedBotCompanionId("");
      setCharacterTab("my-characters");
      refetchCharacters();
    }
  }, [open, refetchCharacters]);

  // Update local state when characters are loaded
  useEffect(() => {
    if (characters) {
      setCharacterList(characters);
    }
  }, [characters]);

  // Mutation for adding a user character
  const addCharacterMutation = useMutation({
    mutationFn: async (characterId: number) => {
      // Use the validated campaign ID
      if (!validCampaignId || validCampaignId <= 0) {
        throw new Error(`Invalid campaign ID: ${campaignId}`);
      }
      
      console.log("Adding character to campaign:", validCampaignId, characterId);
      try {
        const res = await apiRequest(
          "POST",
          `/api/campaigns/${validCampaignId}/characters`,
          { characterId }
        );
        
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || "Failed to add character");
        }
        
        return await res.json();
      } catch (error) {
        console.error("Error adding character:", error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Character Added",
        description: "Your character has joined the campaign!",
        variant: "default",
      });
      
      // Invalidate multiple queries to refresh all related data
      console.log("Invalidating queries for campaign:", validCampaignId);
      
      queryClient.invalidateQueries({
        queryKey: [`/api/campaigns/${validCampaignId}/characters`],
      });
      
      queryClient.invalidateQueries({
        queryKey: ["/api/campaigns"],
      });
      
      queryClient.invalidateQueries({
        queryKey: ["/api/characters"],
      });
      
      // Close dialog and trigger callback
      onOpenChange(false);
      if (onCharacterAdded) {
        onCharacterAdded();
      }
    },
    onError: (error) => {
      console.error("Mutation error:", error);
      toast({
        title: "Error",
        description: `Failed to add character: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Mutation for adding a bot companion
  const addBotCompanionMutation = useMutation({
    mutationFn: async (botId: string) => {
      // Use the validated campaign ID
      if (!validCampaignId || validCampaignId <= 0) {
        throw new Error(`Invalid campaign ID: ${campaignId}`);
      }
      
      console.log("Adding bot companion to campaign:", validCampaignId, botId);
      const botCompanion = BOT_COMPANIONS.find(bot => bot.id === botId);
      
      if (!botCompanion) {
        throw new Error("Bot companion not found");
      }
      
      try {
        // Create the bot character first
        const createBotRes = await apiRequest(
          "POST",
          `/api/characters/create-bot`,
          {
            name: botCompanion.name,
            class: botCompanion.class,
            race: botCompanion.race,
            level: botCompanion.level,
            isBot: true
          }
        );
        
        if (!createBotRes.ok) {
          const errorData = await createBotRes.json();
          throw new Error(errorData.message || "Failed to create bot companion");
        }
        
        const newBotCharacter = await createBotRes.json();
        
        // Then add the bot to the campaign
        const addToCampaignRes = await apiRequest(
          "POST",
          `/api/campaigns/${validCampaignId}/characters`,
          { characterId: newBotCharacter.id }
        );
        
        if (!addToCampaignRes.ok) {
          const errorData = await addToCampaignRes.json();
          throw new Error(errorData.message || "Failed to add bot to campaign");
        }
        
        return await addToCampaignRes.json();
      } catch (error) {
        console.error("Error adding bot companion:", error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Bot Companion Added",
        description: "Your bot companion has joined the campaign!",
        variant: "default",
      });
      
      // Invalidate multiple queries to refresh all related data
      console.log("Invalidating queries for bot companion in campaign:", validCampaignId);
      
      queryClient.invalidateQueries({
        queryKey: [`/api/campaigns/${validCampaignId}/characters`],
      });
      
      queryClient.invalidateQueries({
        queryKey: ["/api/campaigns"],
      });
      
      queryClient.invalidateQueries({
        queryKey: ["/api/characters"],
      });
      
      // Close dialog and trigger callback
      onOpenChange(false);
      if (onCharacterAdded) {
        onCharacterAdded();
      }
    },
    onError: (error) => {
      console.error("Bot companion mutation error:", error);
      toast({
        title: "Error",
        description: `Failed to add bot companion: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleAddCharacter = () => {
    if (characterTab === "my-characters") {
      if (!selectedCharacterId) {
        toast({
          title: "No Character Selected",
          description: "Please select a character to add to the campaign.",
          variant: "destructive",
        });
        return;
      }
      addCharacterMutation.mutate(parseInt(selectedCharacterId));
    } else {
      if (!selectedBotCompanionId) {
        toast({
          title: "No Bot Companion Selected",
          description: "Please select a bot companion to add to the campaign.",
          variant: "destructive",
        });
        return;
      }
      addBotCompanionMutation.mutate(selectedBotCompanionId);
    }
  };

  // Character selection handlers
  const handleSelectCharacter = (id: string) => {
    setSelectedCharacterId(id);
  };

  const handleSelectBotCompanion = (id: string) => {
    setSelectedBotCompanionId(id);
  };

  const isPending = addCharacterMutation.isPending || addBotCompanionMutation.isPending;
  const isValid = (characterTab === "my-characters" && !!selectedCharacterId) || 
                 (characterTab === "bot-companions" && !!selectedBotCompanionId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal={true}>
      <DialogContent className="sm:max-w-md bg-parchment border-accent max-h-[80vh] overflow-y-auto w-[95%] sm:w-auto p-4 sm:p-6 fixed left-[50%] -translate-x-[50%] top-[50%] -translate-y-[50%] z-50 rounded-lg shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-medieval text-primary">
            Add Character to Campaign
          </DialogTitle>
          <DialogDescription>
            Choose a character to join this adventure!
          </DialogDescription>
        </DialogHeader>

        <Tabs 
          defaultValue="my-characters" 
          value={characterTab} 
          onValueChange={(value) => setCharacterTab(value as "my-characters" | "bot-companions")}
          className="py-4"
        >
          <TabsList className="w-full grid grid-cols-2 mb-4">
            <TabsTrigger value="my-characters" className="text-base">
              <UserPlus className="mr-2 h-4 w-4" />
              My Characters
            </TabsTrigger>
            <TabsTrigger value="bot-companions" className="text-base">
              <Bot className="mr-2 h-4 w-4" />
              Bot Companions
            </TabsTrigger>
          </TabsList>
          
          {/* My Characters Tab */}
          <TabsContent value="my-characters">
            {charactersLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-8 w-8 animate-spin text-secondary" />
              </div>
            ) : charactersError ? (
              <div className="text-destructive text-center py-4">
                <p>Failed to load characters. Please try again.</p>
                <Button 
                  onClick={() => refetchCharacters()} 
                  variant="outline" 
                  className="mt-2"
                >
                  Retry
                </Button>
              </div>
            ) : characterList && characterList.length > 0 ? (
              <div className="space-y-4">
                {/* Mobile-friendly character selection */}
                <div className="md:hidden space-y-3">
                  <h3 className="font-semibold mb-2">Select Your Character:</h3>
                  {characterList.map((character) => (
                    <div 
                      key={character.id}
                      onClick={() => handleSelectCharacter(character.id.toString())}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedCharacterId === character.id.toString() 
                          ? 'bg-primary/10 border-primary' 
                          : 'bg-background/50 border-border hover:bg-accent/10'
                      }`}
                    >
                      <div className="font-bold">{character.name}</div>
                      <div className="text-sm text-muted-foreground">
                        Level {character.level} {character.race} {character.class}
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Desktop dropdown */}
                <div className="hidden md:block">
                  <Select
                    value={selectedCharacterId}
                    onValueChange={setSelectedCharacterId}
                  >
                    <SelectTrigger className="w-full bg-parchment border-accent">
                      <SelectValue placeholder="Select a character" />
                    </SelectTrigger>
                    <SelectContent 
                      className="bg-white border border-accent z-[200] max-h-[40vh] overflow-y-auto" 
                      position="popper"
                      sideOffset={5}
                      align="center"
                    >
                      {characterList.map((character) => (
                        <SelectItem
                          key={character.id}
                          value={character.id.toString()}
                          className="py-3"
                        >
                          {character.name} - Level {character.level} {character.race} {character.class}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="mb-2">You don't have any characters yet.</p>
                <Button 
                  variant="default" 
                  onClick={() => {
                    onOpenChange(false);
                    // Use setTimeout to ensure dialog closes properly before navigation
                    setTimeout(() => window.location.href = "/characters/create", 100);
                  }}
                  className="mt-2"
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Create a Character
                </Button>
              </div>
            )}
          </TabsContent>
          
          {/* Bot Companions Tab */}
          <TabsContent value="bot-companions">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground mb-4">
                Bot companions are premade characters that can join your campaign. They are controlled 
                by the AI and can help your party with their unique abilities.
              </p>
              
              {/* Mobile-friendly bot selection */}
              <div className="md:hidden space-y-3">
                <h3 className="font-semibold mb-2">Select a Bot Companion:</h3>
                {BOT_COMPANIONS.map((bot) => (
                  <div 
                    key={bot.id}
                    onClick={() => handleSelectBotCompanion(bot.id)}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedBotCompanionId === bot.id 
                        ? 'bg-primary/10 border-primary' 
                        : 'bg-background/50 border-border hover:bg-accent/10'
                    }`}
                  >
                    <div className="font-bold">{bot.name}</div>
                    <div className="text-sm">
                      Level {bot.level} {bot.race} {bot.class}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {bot.description}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Desktop selection */}
              <div className="hidden md:block">
                <div className="grid grid-cols-1 gap-4">
                  {BOT_COMPANIONS.map((bot) => (
                    <div 
                      key={bot.id}
                      onClick={() => handleSelectBotCompanion(bot.id)}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedBotCompanionId === bot.id 
                          ? 'bg-primary/10 border-primary' 
                          : 'bg-background/50 border-border hover:bg-accent/10'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Bot className="h-8 w-8 text-primary" />
                        <div>
                          <div className="font-bold text-lg">{bot.name}</div>
                          <div className="text-sm">
                            Level {bot.level} {bot.race} {bot.class}
                          </div>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground mt-2">
                        {bot.description}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0 mt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
            className="w-full sm:w-auto text-base py-5 sm:py-2"
          >
            Cancel
          </Button>
          <Button
            onClick={handleAddCharacter}
            disabled={!isValid || isPending}
            className="w-full sm:w-auto text-base py-5 sm:py-2"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Adding...
              </>
            ) : (
              "Add to Campaign"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}