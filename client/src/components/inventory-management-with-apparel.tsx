import React, { useState } from 'react';
import { InventoryManagement } from './inventory-management';
import { ApparelManagement } from './apparel-management';
import { Character, CharacterStats } from '@shared/schema';
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Shirt } from 'lucide-react';

// Define a proper type to ensure compatibility with the Character type
type CharacterWithStats = Omit<Character, 'stats'> & {
  stats?: CharacterStats;
};

interface InventoryManagerWithApparelProps {
  characterId: number;
  campaignId: number;
  character?: CharacterWithStats;
  campaignCharacters?: CharacterWithStats[];
  onItemUpdate?: () => void;
}

export function InventoryManagerWithApparel({
  characterId,
  campaignId,
  character,
  campaignCharacters,
  onItemUpdate
}: InventoryManagerWithApparelProps) {
  const [isApparelOpen, setIsApparelOpen] = useState(false);

  // Only render if we have a character
  if (!character) {
    return null;
  }

  return (
    <div className="flex space-x-1">
      {/* Regular inventory management */}
      <InventoryManagement
        characterId={characterId}
        campaignId={campaignId}
        character={character}
        campaignCharacters={campaignCharacters}
        onItemUpdate={onItemUpdate}
      />
      
      {/* Apparel management button */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsApparelOpen(true)}
              className="h-8 w-8"
            >
              <Shirt className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Apparel & Outfits</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      {/* Apparel management dialog */}
      <ApparelManagement
        character={character}
        isOpen={isApparelOpen}
        onClose={() => setIsApparelOpen(false)}
      />
    </div>
  );
}