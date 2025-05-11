import { InventoryManagerWithApparel } from "./inventory-management-with-apparel";
import { queryClient } from "@/lib/queryClient";

interface CharacterInventoryButtonProps {
  characterId: number;
  campaignId: number;
  character: any;
  campaignCharacters: any[];
}

export function CharacterInventoryButton({
  characterId,
  campaignId,
  character,
  campaignCharacters
}: CharacterInventoryButtonProps) {
  return (
    <InventoryManagerWithApparel
      characterId={characterId}
      campaignId={campaignId}
      character={character}
      campaignCharacters={campaignCharacters}
      onItemUpdate={() => {
        // Refresh character data after items update
        queryClient.invalidateQueries({ queryKey: [`/api/campaigns/${campaignId}/characters`] });
      }}
    />
  );
}