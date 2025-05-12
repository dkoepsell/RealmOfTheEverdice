import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { X, UserCircle, Users } from "lucide-react";
import { InventoryManagerWithApparel } from "@/components/inventory-management-with-apparel";

interface CharactersPanelProps {
  campaignId: number;
  campaignCharacters: any[] | undefined;
  charactersLoading: boolean;
  charactersError: Error | null;
  isDm: boolean;
  userId?: number;
  removeCharacterMutation: any;
}

export default function CharactersPanel({
  campaignId,
  campaignCharacters,
  charactersLoading,
  charactersError,
  isDm,
  userId,
  removeCharacterMutation,
}: CharactersPanelProps) {
  const queryClient = useQueryClient();

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

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold border-b pb-2">
        <UserCircle className="inline-block mr-2 h-5 w-5" />
        Player Characters
      </h3>
      
      {playerCharacters.length === 0 ? (
        <div className="p-4 border border-muted rounded-md text-center">
          <p className="text-sm text-muted-foreground">No player characters in this campaign</p>
        </div>
      ) : (
        <div className="space-y-3">
          {playerCharacters.map(character => (
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
              
              <div className="text-sm text-muted-foreground line-clamp-2">
                {character.background} {character.appearance && `- ${character.appearance}`}
              </div>
            </div>
          ))}
        </div>
      )}
      
      <h3 className="text-lg font-semibold border-b pb-2 mt-6">
        <Users className="inline-block mr-2 h-5 w-5" />
        NPC Companions
      </h3>
      
      {npcCharacters.length === 0 ? (
        <div className="text-center p-4 border border-dashed rounded-lg">
          <p className="text-muted-foreground text-sm">No NPC companions in the party yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {npcCharacters.map(character => (
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
                  {/* Only DM can remove NPCs */}
                  {isDm && (
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
}