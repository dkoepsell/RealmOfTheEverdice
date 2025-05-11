import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import CharacterRelationships from "@/components/character-relationships";
import RelationshipPredictions from "@/components/relationship-predictions";
import RelationshipAnalysis from "@/components/relationship-analysis";
import { apiRequest } from "@/lib/queryClient";
import { 
  Brain, 
  CircleUser, 
  Heart, 
  HeartHandshake, 
  Zap, 
  Network, 
  RefreshCw, 
  Sparkles, 
  Users 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Character = {
  id: number;
  name: string;
  race: string;
  class: string;
  level: number;
  userId: number;
  avatarUrl?: string;
};

type Relationship = {
  id: number;
  sourceCharacterId: number;
  targetCharacterId: number;
  relationshipType: string;
  relationshipStrength: number;
  interactionHistory: Array<{
    date: string;
    description: string;
    impact: number;
    context: string;
  }>;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export default function CampaignRelationships({
  campaignId,
  isDm = false,
  currentUserId,
}: {
  campaignId: number;
  isDm?: boolean;
  currentUserId: number;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCharacterId, setSelectedCharacterId] = useState<number | null>(null);
  const [selectedRelationship, setSelectedRelationship] = useState<{
    sourceCharacter: Character;
    targetCharacter: Character;
    relationshipId: number;
  } | null>(null);
  const [isGeneratingPredictions, setIsGeneratingPredictions] = useState(false);
  
  // Fetch campaign characters
  const { 
    data: characters = [], 
    isLoading: isLoadingCharacters,
    error: charactersError,
  } = useQuery({
    queryKey: [`/api/campaigns/${campaignId}/characters`],
    enabled: !!campaignId,
  });
  
  // Get the user's characters in this campaign
  const userCharacters = characters.filter((char: Character) => char.userId === currentUserId);
  const firstUserCharacterId = userCharacters.length > 0 ? userCharacters[0].id : null;
  
  // Select first character automatically if none selected
  React.useEffect(() => {
    if (!selectedCharacterId && firstUserCharacterId) {
      setSelectedCharacterId(firstUserCharacterId);
    }
  }, [selectedCharacterId, firstUserCharacterId]);
  
  // Fetch all relationships in the campaign (for visual map)
  const { 
    data: campaignRelationships = [], 
    isLoading: isLoadingRelationships,
  } = useQuery({
    queryKey: [`/api/campaigns/${campaignId}/relationships`],
    enabled: !!campaignId && isDm,
  });
  
  // Generate predictions mutation
  const generatePredictionsMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/campaigns/${campaignId}/generate-predictions`, {});
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Predictions generated",
        description: data.message || `Generated predictions for character relationships.`,
      });
      queryClient.invalidateQueries({ queryKey: [`/api/campaigns/${campaignId}/relationship-predictions`] });
    },
    onError: (error) => {
      toast({
        title: "Failed to generate predictions",
        description: "There was an error generating predictions. Please try again.",
        variant: "destructive",
      });
      console.error("Error generating predictions:", error);
    },
    onSettled: () => {
      setIsGeneratingPredictions(false);
    }
  });
  
  // Generate predictions handler
  const handleGeneratePredictions = () => {
    setIsGeneratingPredictions(true);
    generatePredictionsMutation.mutate();
  };
  
  // Find a character by ID
  const getCharacterById = (id: number): Character | undefined => {
    return characters.find((char: Character) => char.id === id);
  };
  
  // Show relationship analysis dialog
  const handleShowAnalysis = (sourceId: number, targetId: number, relationshipId: number) => {
    const sourceCharacter = getCharacterById(sourceId);
    const targetCharacter = getCharacterById(targetId);
    
    if (sourceCharacter && targetCharacter) {
      setSelectedRelationship({
        sourceCharacter,
        targetCharacter,
        relationshipId
      });
    }
  };
  
  if (isLoadingCharacters) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }
  
  if (charactersError) {
    return (
      <div className="p-4 text-center text-red-500">
        Error loading characters: {(charactersError as Error).message}
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center">
          <HeartHandshake className="h-6 w-6 mr-2" />
          Character Relationships
        </h2>
        
        {isDm && (
          <Button
            onClick={handleGeneratePredictions}
            disabled={isGeneratingPredictions}
          >
            {isGeneratingPredictions ? (
              <>
                <div className="h-4 w-4 mr-2 rounded-full border-2 border-background border-t-transparent animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Predictions
              </>
            )}
          </Button>
        )}
      </div>
      
      <Tabs defaultValue="characters" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="characters">
            <Users className="h-4 w-4 mr-2" />
            Character View
          </TabsTrigger>
          {isDm && (
            <TabsTrigger value="predictions">
              <Lightning className="h-4 w-4 mr-2" />
              Predictions
            </TabsTrigger>
          )}
          {(isDm || userCharacters.length > 0) && (
            <TabsTrigger value="network">
              <Network className="h-4 w-4 mr-2" />
              Relationship Network
            </TabsTrigger>
          )}
        </TabsList>
        
        <TabsContent value="characters" className="space-y-4">
          {characters.length === 0 ? (
            <Card className="p-6 text-center">
              <CardContent>
                <p className="text-muted-foreground">
                  No characters found in this campaign. Add characters to view their relationships.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="flex flex-wrap gap-2 mb-4">
                {characters.map((character: Character) => (
                  <Button
                    key={character.id}
                    variant={selectedCharacterId === character.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCharacterId(character.id)}
                    className="flex items-center"
                  >
                    <CircleUser className="h-4 w-4 mr-1" />
                    {character.name}
                    {character.userId === currentUserId && (
                      <span className="ml-1 text-xs bg-secondary text-secondary-foreground rounded-full px-1">You</span>
                    )}
                  </Button>
                ))}
              </div>
              
              {selectedCharacterId && (
                <CharacterRelationships
                  characterId={selectedCharacterId}
                  campaignId={campaignId}
                  campaignCharacters={characters}
                />
              )}
            </>
          )}
        </TabsContent>
        
        {isDm && (
          <TabsContent value="predictions">
            <RelationshipPredictions campaignId={campaignId} />
          </TabsContent>
        )}
        
        <TabsContent value="network">
          <Card>
            <CardHeader>
              <CardTitle>Relationship Network</CardTitle>
              <CardDescription>
                View how characters are connected in this campaign
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingRelationships ? (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                </div>
              ) : campaignRelationships.length === 0 ? (
                <div className="text-center py-8">
                  <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No relationships found between characters yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {campaignRelationships.map((relationship: Relationship) => {
                    const source = getCharacterById(relationship.sourceCharacterId);
                    const target = getCharacterById(relationship.targetCharacterId);
                    
                    if (!source || !target) return null;
                    
                    return (
                      <Card key={relationship.id} className="border-l-4" style={{
                        borderLeftColor: relationship.relationshipStrength > 0 ? 
                          '#10b981' : relationship.relationshipStrength < 0 ? 
                          '#ef4444' : '#6b7280'
                      }}>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base flex justify-between items-center">
                            <span>{source.name} & {target.name}</span>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleShowAnalysis(
                                relationship.sourceCharacterId, 
                                relationship.targetCharacterId,
                                relationship.id
                              )}
                            >
                              <Brain className="h-4 w-4" />
                            </Button>
                          </CardTitle>
                          <CardDescription>
                            {relationship.relationshipType} • Strength: {relationship.relationshipStrength}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-0">
                          {relationship.notes && (
                            <p className="text-sm">{relationship.notes}</p>
                          )}
                          
                          {relationship.interactionHistory && relationship.interactionHistory.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs text-muted-foreground">
                                {relationship.interactionHistory.length} recorded interactions
                              </p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Relationship Analysis Dialog */}
      <Dialog 
        open={!!selectedRelationship} 
        onOpenChange={(open) => !open && setSelectedRelationship(null)}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Relationship Analysis</DialogTitle>
            <DialogDescription>
              AI-powered analysis of the relationship between {selectedRelationship?.sourceCharacter.name} and {selectedRelationship?.targetCharacter.name}
            </DialogDescription>
          </DialogHeader>
          
          {selectedRelationship && (
            <RelationshipAnalysis
              sourceCharacter={selectedRelationship.sourceCharacter}
              targetCharacter={selectedRelationship.targetCharacter}
              relationshipId={selectedRelationship.relationshipId}
              campaignId={campaignId}
              onSelectPrediction={() => setSelectedRelationship(null)}
            />
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedRelationship(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}