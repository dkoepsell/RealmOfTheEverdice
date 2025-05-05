import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Character, InsertCharacter } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "./use-toast";

export function useCharacter(characterId?: number) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Get a single character
  const {
    data: character,
    isLoading,
    error,
  } = useQuery<Character>({
    queryKey: [`/api/characters/${characterId}`],
    enabled: !!characterId,
  });

  // Get all characters for the user
  const {
    data: characters,
    isLoading: charactersLoading,
    error: charactersError,
  } = useQuery<Character[]>({
    queryKey: ["/api/characters"],
  });

  // Create character mutation
  const createCharacterMutation = useMutation({
    mutationFn: async (character: InsertCharacter) => {
      const res = await apiRequest("POST", "/api/characters", character);
      return await res.json();
    },
    onSuccess: (newCharacter) => {
      queryClient.invalidateQueries({ queryKey: ["/api/characters"] });
      toast({
        title: "Character Created",
        description: `${newCharacter.name} has been created successfully!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to create character: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Update character mutation
  const updateCharacterMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Character> }) => {
      const res = await apiRequest("PUT", `/api/characters/${id}`, data);
      return await res.json();
    },
    onSuccess: (updatedCharacter) => {
      queryClient.invalidateQueries({ queryKey: [`/api/characters/${updatedCharacter.id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/characters"] });
      toast({
        title: "Character Updated",
        description: `${updatedCharacter.name} has been updated successfully!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to update character: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Delete character mutation
  const deleteCharacterMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/characters/${id}`);
      return id;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ["/api/characters"] });
      toast({
        title: "Character Deleted",
        description: "Character has been deleted successfully!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to delete character: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Generate AI character
  const generateCharacterMutation = useMutation({
    mutationFn: async (options: { race?: string; class?: string; level?: number }) => {
      const res = await apiRequest("POST", "/api/characters/generate", options);
      return await res.json();
    },
    onSuccess: (generatedCharacter) => {
      toast({
        title: "Character Generated",
        description: `${generatedCharacter.name} has been generated successfully!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to generate character: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  return {
    character,
    isLoading,
    error,
    characters,
    charactersLoading,
    charactersError,
    createCharacter: createCharacterMutation.mutate,
    updateCharacter: updateCharacterMutation.mutate,
    deleteCharacter: deleteCharacterMutation.mutate,
    generateCharacter: generateCharacterMutation.mutate,
    isCreating: createCharacterMutation.isPending,
    isUpdating: updateCharacterMutation.isPending,
    isDeleting: deleteCharacterMutation.isPending,
    isGenerating: generateCharacterMutation.isPending,
  };
}
