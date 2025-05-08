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
import { Loader2 } from "lucide-react";

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

  // Add character to campaign mutation
  const addCharacterMutation = useMutation({
    mutationFn: async (characterId: number) => {
      const res = await apiRequest(
        "POST",
        `/api/campaigns/${campaignId}/characters`,
        { characterId }
      );
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Character Added",
        description: "Your character has joined the campaign!",
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

    addCharacterMutation.mutate(parseInt(selectedCharacterId));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-parchment border-accent max-h-[90vh] overflow-y-auto w-[95vw] sm:w-auto">
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
              <Loader2 className="h-6 w-6 animate-spin text-secondary" />
            </div>
          ) : charactersError ? (
            <div className="text-destructive text-center py-4">
              Failed to load characters. Please try again.
            </div>
          ) : characters && characters.length > 0 ? (
            <div className="space-y-4">
              <Select
                value={selectedCharacterId}
                onValueChange={setSelectedCharacterId}
              >
                <SelectTrigger className="w-full bg-parchment border-accent">
                  <SelectValue placeholder="Select a character" />
                </SelectTrigger>
                <SelectContent 
                  className="bg-white border border-accent z-[100] fixed" 
                  position="popper"
                  sideOffset={5}
                  align="start"
                >
                  {characters.map((character) => (
                    <SelectItem
                      key={character.id}
                      value={character.id.toString()}
                    >
                      {character.name} - Level {character.level} {character.race} {character.class}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="mb-2">You don't have any characters yet.</p>
              <Button 
                variant="link" 
                onClick={() => window.location.href = "/characters/create"}
              >
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
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            onClick={handleAddCharacter}
            disabled={!selectedCharacterId || addCharacterMutation.isPending}
            className="w-full sm:w-auto"
          >
            {addCharacterMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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