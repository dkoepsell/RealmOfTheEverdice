import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Character, CharacterEquipment, CharacterStats } from "@shared/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "../lib/queryClient";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { 
  Shirt, 
  Crown, 
  Footprints, 
  PanelTop, 
  Fingerprint, 
  DivideCircle, 
  GraduationCap,
  Gem,
  Hand
} from "lucide-react";

// Define a proper type to ensure compatibility
type CharacterWithStats = Omit<Character, 'stats'> & {
  stats?: CharacterStats;
};

type ApparelManagementProps = {
  character: CharacterWithStats;
  isOpen: boolean;
  onClose: () => void;
};

type ApparelSlot = "head" | "chest" | "legs" | "feet" | "hands" | "back" | "neck" | "finger" | "waist";

interface ApparelItem {
  name: string;
  description: string;
  apparelSlot: ApparelSlot;
  rarity: string;
  slot: number;
}

// Type guard to check if equipment exists with correct structure
function hasValidEquipment(equipment: any): equipment is CharacterEquipment {
  return equipment && 
         typeof equipment === 'object' && 
         Array.isArray(equipment.inventory) &&
         typeof equipment.apparel === 'object';
}

const slotIcons = {
  head: <Crown className="h-5 w-5" />,
  chest: <Shirt className="h-5 w-5" />,
  legs: <PanelTop className="h-5 w-5" />,
  feet: <Footprints className="h-5 w-5" />,
  hands: <Hand className="h-5 w-5" />,
  back: <DivideCircle className="h-5 w-5" />,
  neck: <GraduationCap className="h-5 w-5" />,
  finger: <Fingerprint className="h-5 w-5" />,
  waist: <Gem className="h-5 w-5" />,
};

const rarityColors = {
  common: "text-slate-400",
  uncommon: "text-green-500",
  rare: "text-blue-500",
  "very rare": "text-purple-500",
  legendary: "text-amber-400",
  artifact: "text-red-500",
};

export function ApparelManagement({ character, isOpen, onClose }: ApparelManagementProps) {
  const [activeTab, setActiveTab] = useState<string>("equipped");
  const queryClient = useQueryClient();

  // Extract apparel items from inventory
  const apparelItems = useMemo(() => {
    if (!hasValidEquipment(character.equipment)) {
      return [] as ApparelItem[];
    }
    
    return character.equipment.inventory
      .filter((item: any) => item.type === "apparel" && item.apparelSlot)
      .map((item: any) => ({
        ...item,
        apparelSlot: item.apparelSlot as ApparelSlot
      })) as ApparelItem[];
  }, [character.equipment]);

  // Get currently equipped items
  const equippedApparel = useMemo(() => {
    if (!hasValidEquipment(character.equipment)) {
      return {} as Record<ApparelSlot, string | undefined>;
    }
    return character.equipment.apparel;
  }, [character.equipment]);

  // Mutation to equip/unequip apparel
  const updateApparelMutation = useMutation({
    mutationFn: async (data: { slotName: ApparelSlot; itemName: string | null }) => {
      const { slotName, itemName } = data;
      
      if (!hasValidEquipment(character.equipment)) {
        throw new Error("Invalid equipment data");
      }
      
      // If itemName is null, we're unequipping the slot
      const payload = {
        equipment: {
          ...character.equipment,
          apparel: {
            ...character.equipment.apparel,
            [slotName]: itemName
          }
        }
      };
      
      const response = await apiRequest("PATCH", `/api/characters/${character.id}`, payload);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/characters/${character.id}`] });
      toast({
        title: "Apparel updated",
        description: "Your character's outfit has been updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update apparel",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Function to equip an item
  const equipItem = (item: ApparelItem) => {
    updateApparelMutation.mutate({
      slotName: item.apparelSlot,
      itemName: item.name
    });
  };

  // Function to unequip an item
  const unequipItem = (slotName: ApparelSlot) => {
    updateApparelMutation.mutate({
      slotName,
      itemName: null
    });
  };

  // Get appropriate items for each slot
  const getItemsForSlot = (slot: ApparelSlot) => {
    return apparelItems.filter(item => item.apparelSlot === slot);
  };

  // Check if an item is equipped
  const isItemEquipped = (itemName: string, slot: ApparelSlot) => {
    return equippedApparel[slot] === itemName;
  };

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold">
            Character Apparel
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="equipped" className="flex-1 overflow-hidden flex flex-col" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full">
            <TabsTrigger value="equipped">Equipped Items</TabsTrigger>
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
          </TabsList>
          
          <TabsContent value="equipped" className="flex-1 overflow-hidden">
            <ScrollArea className="h-[350px] rounded-md border p-4">
              <div className="space-y-6">
                {(Object.entries(slotIcons) as [ApparelSlot, JSX.Element][]).map(([slot, icon]) => {
                  const equippedItem = equippedApparel[slot as ApparelSlot];
                  const itemDetails = apparelItems.find(item => 
                    item.name === equippedItem && item.apparelSlot === slot
                  );
                  
                  return (
                    <div key={slot} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {icon}
                          <Label className="capitalize text-md font-semibold">{slot}</Label>
                        </div>
                        
                        {equippedItem && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => unequipItem(slot)}
                            disabled={updateApparelMutation.isPending}
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                      
                      <div className="rounded-md bg-muted p-3 min-h-[60px]">
                        {equippedItem ? (
                          <div>
                            <p className={`font-semibold ${itemDetails?.rarity ? rarityColors[itemDetails.rarity as keyof typeof rarityColors] : ""}`}>
                              {equippedItem}
                            </p>
                            {itemDetails && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {itemDetails.description}
                              </p>
                            )}
                          </div>
                        ) : (
                          <p className="text-muted-foreground italic">Nothing equipped</p>
                        )}
                      </div>
                      
                      <Separator />
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="inventory" className="flex-1 overflow-hidden">
            <ScrollArea className="h-[350px] rounded-md border p-4">
              <div className="space-y-6">
                {(Object.entries(slotIcons) as [ApparelSlot, JSX.Element][]).map(([slot, icon]) => {
                  const slotItems = getItemsForSlot(slot as ApparelSlot);
                  
                  if (slotItems.length === 0) return null;
                  
                  return (
                    <div key={slot} className="space-y-2">
                      <div className="flex items-center gap-2">
                        {icon}
                        <Label className="capitalize text-md font-semibold">{slot} Items</Label>
                      </div>
                      
                      <div className="space-y-2">
                        {slotItems.map((item) => (
                          <div key={`${item.name}-${item.slot}`} className="rounded-md bg-muted p-3">
                            <div className="flex justify-between items-start">
                              <p className={`font-semibold ${item.rarity ? rarityColors[item.rarity as keyof typeof rarityColors] : ""}`}>
                                {item.name}
                              </p>
                              <Button 
                                variant={isItemEquipped(item.name, slot) ? "secondary" : "outline"} 
                                size="sm"
                                onClick={() => equipItem(item)}
                                disabled={updateApparelMutation.isPending || isItemEquipped(item.name, slot)}
                              >
                                {isItemEquipped(item.name, slot) ? "Equipped" : "Equip"}
                              </Button>
                            </div>
                            
                            <p className="text-sm text-muted-foreground mt-1">
                              {item.description}
                            </p>
                          </div>
                        ))}
                      </div>
                      
                      <Separator />
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
        
        <div className="mt-4 flex justify-end">
          <Button variant="default" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}