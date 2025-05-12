import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { X, UserCircle, Users, Shield, Swords, ScrollText } from "lucide-react";
import { InventoryManagerWithApparel } from "@/components/inventory-management-with-apparel";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface CharactersPanelProps {
  campaignId: number;
  campaignCharacters: any[] | undefined;
  charactersLoading: boolean;
  charactersError: Error | null;
  isDm: boolean;
  userId?: number;
  removeCharacterMutation: any;
  compactView?: boolean;
}

export default function CharactersPanel({
  campaignId,
  campaignCharacters,
  charactersLoading,
  charactersError,
  isDm,
  userId,
  removeCharacterMutation,
  compactView = false,
}: CharactersPanelProps) {
  const queryClient = useQueryClient();
  const [expandedCharacter, setExpandedCharacter] = useState<number | null>(null);

  if (charactersLoading) {
    return (
      <div className="py-8 text-center">
        <div className="animate-spin inline-block w-8 h-8 border-2 border-current border-t-transparent text-primary rounded-full" aria-hidden="true"></div>
        <p className="mt-2 text-sm text-muted-foreground">Loading characters...</p>
      </div>
    );
  }

  if (charactersError) {
    return (
      <div className="p-4 border border-destructive/20 bg-destructive/10 rounded-md text-center">
        <p className="text-sm">Unable to load character information</p>
        <Button 
          variant="outline" 
          size="sm" 
          className="mt-2"
          onClick={() => queryClient.invalidateQueries({ queryKey: [`/api/campaigns/${campaignId}/characters`] })}
        >
          Retry
        </Button>
      </div>
    );
  }

  const playerCharacters = Array.isArray(campaignCharacters) 
    ? campaignCharacters.filter(c => !c.isBot) 
    : [];
    
  const npcCharacters = Array.isArray(campaignCharacters)
    ? campaignCharacters.filter(c => c.isBot)
    : [];

  const toggleCharacterExpand = (id: number) => {
    if (expandedCharacter === id) {
      setExpandedCharacter(null);
    } else {
      setExpandedCharacter(id);
    }
  };

  // Render a compact or detailed character card based on the view mode
  const renderCharacterCard = (character: any, isPlayerCharacter: boolean) => {
    const isExpanded = expandedCharacter === character.id;
    
    if (compactView) {
      // Compact View with expandable details
      return (
        <div 
          key={character.id} 
          className={`border rounded-lg p-2 bg-card shadow-sm hover:shadow-md transition-all cursor-pointer ${isExpanded ? 'ring-1 ring-amber-400' : ''}`}
          onClick={() => toggleCharacterExpand(character.id)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isPlayerCharacter ? (
                <UserCircle className="h-4 w-4 text-amber-700 flex-shrink-0" />
              ) : (
                <Users className="h-4 w-4 text-amber-700 flex-shrink-0" />
              )}
              <h4 className="font-medium text-amber-900 truncate">{character.name}</h4>
            </div>
            <div className="flex items-center gap-1">
              <div className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full whitespace-nowrap">
                HP: {character.hp}/{character.maxHp}
              </div>
            </div>
          </div>
          
          {isExpanded && (
            <div className="mt-2 pt-2 border-t">
              <div className="text-xs text-muted-foreground mb-1.5">
                Level {character.level} {character.race} {character.class}
              </div>
              
              {/* Equipment Summary */}
              <div className="flex flex-wrap gap-1 mt-1.5">
                {/* Equipment Buttons - Direct placement without wrapping in another button */}
                <div onClick={(e) => e.stopPropagation()}>
                  <InventoryManagerWithApparel
                    characterId={character.id}
                    campaignId={campaignId}
                    character={character}
                    campaignCharacters={campaignCharacters}
                    onItemUpdate={() => {
                      queryClient.invalidateQueries({ queryKey: [`/api/campaigns/${campaignId}/characters`] });
                    }}
                  />
                </div>

                {(isDm || character.userId === userId) && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="h-7 px-2 text-xs hover:bg-destructive/10 hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Remove ${character.name} from this campaign?`)) {
                              removeCharacterMutation.mutate(character.id);
                            }
                          }}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Remove
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Remove from campaign</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            </div>
          )}
        </div>
      );
    } else {
      // Full View
      return (
        <div key={character.id} className="border rounded-lg p-3 bg-card shadow-sm hover:shadow-md transition-all">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h4 className="font-bold text-amber-900">{character.name}</h4>
              <p className="text-sm text-muted-foreground">
                Level {character.level} {character.race} {character.class}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full">
                HP: {character.hp}/{character.maxHp}
              </div>
              <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                <InventoryManagerWithApparel
                  characterId={character.id}
                  campaignId={campaignId}
                  character={character}
                  campaignCharacters={campaignCharacters}
                  onItemUpdate={() => {
                    // Refresh character data
                    queryClient.invalidateQueries({ queryKey: [`/api/campaigns/${campaignId}/characters`] });
                  }}
                />
              </div>
              {/* Remove character button (only shown for DM or character owner) */}
              {(isDm || character.userId === userId) && (
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="h-7 w-7 rounded-full hover:bg-destructive/10 hover:text-destructive"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (confirm(`Remove ${character.name} from this campaign?`)) {
                      removeCharacterMutation.mutate(character.id);
                    }
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          
          {/* Character background/appearance - shown for both players and NPCs */}
          <div className="text-sm text-muted-foreground line-clamp-2">
            {isPlayerCharacter 
              ? `${character.background || ''} ${character.appearance ? `- ${character.appearance}` : ''}` 
              : `NPC companion - ${character.background || 'No background information'}`
            }
          </div>
        </div>
      );
    }
  };

  return (
    <div className="space-y-4">
      <h3 className={`font-semibold border-b pb-2 ${compactView ? 'text-base' : 'text-lg'}`}>
        <UserCircle className="inline-block mr-2 h-5 w-5" />
        Player Characters
      </h3>
      
      {playerCharacters.length === 0 ? (
        <div className="p-4 border border-muted rounded-md text-center">
          <p className="text-sm text-muted-foreground">No player characters in this campaign</p>
        </div>
      ) : (
        <div className="space-y-2">
          {playerCharacters.map(character => renderCharacterCard(character, true))}
        </div>
      )}
      
      <h3 className={`font-semibold border-b pb-2 ${compactView ? 'text-base mt-4' : 'text-lg mt-6'}`}>
        <Users className="inline-block mr-2 h-5 w-5" />
        NPC Companions
      </h3>
      
      {npcCharacters.length === 0 ? (
        <div className="text-center p-4 border border-dashed rounded-lg">
          <p className="text-muted-foreground text-sm">No NPC companions in the party yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {npcCharacters.map(character => renderCharacterCard(character, false))}
        </div>
      )}
    </div>
  );
}