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
import { Loader2, UserPlus } from "lucide-react";

interface AddCharacterDialogProps {
  campaignId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCharacterAdded?: () => void;
}

export function AddCharacterDialog({
  campaignId,
  open,
  onOpenChange,
  onCharacterAdded
}: AddCharacterDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>("");
  const [characterList, setCharacterList] = useState<Character[]>([]);

  // Fetch user's characters
  const {
    data: characters,
    isLoading: charactersLoading,
    error: charactersError,
    refetch: refetchCharacters
  } = useQuery<Character[]>({
    queryKey: ["/api/characters"],
    enabled: open && !!user,
  });

  // Reset selected character when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedCharacterId("");
      refetchCharacters();
    }
  }, [open, refetchCharacters]);

  // Update local state when characters are loaded
  useEffect(() => {
    if (characters) {
      setCharacterList(characters);
    }
  }, [characters]);

  // Add character to campaign mutation
  const addCharacterMutation = useMutation({
    mutationFn: async (characterId: number) => {
      console.log("Adding character to campaign:", campaignId, characterId);
      try {
        const res = await apiRequest(
          "POST",
          `/api/campaigns/${campaignId}/characters`,
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
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({
        queryKey: [`/api/campaigns/${campaignId}/characters`],
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

  const handleAddCharacter = () => {
    if (!selectedCharacterId) {
      toast({
        title: "No Character Selected",
        description: "Please select a character to add to the campaign.",
        variant: "destructive",
      });
      return;
    }

    console.log("Selected character ID:", selectedCharacterId);
    addCharacterMutation.mutate(parseInt(selectedCharacterId));
  };

  // Alternative manual selection approach for mobile
  const handleSelectCharacter = (id: string) => {
    setSelectedCharacterId(id);
  };

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

        <div className="py-4">
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
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0 mt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={addCharacterMutation.isPending}
            className="w-full sm:w-auto text-base py-5 sm:py-2"
          >
            Cancel
          </Button>
          <Button
            onClick={handleAddCharacter}
            disabled={!selectedCharacterId || addCharacterMutation.isPending}
            className="w-full sm:w-auto text-base py-5 sm:py-2"
          >
            {addCharacterMutation.isPending ? (
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