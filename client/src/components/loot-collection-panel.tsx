import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash2, Package, CoinsIcon, ShoppingBag, Gem, Sparkles, Shield, Sword } from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

interface LootCollectionPanelProps {
  characterId: number;
  availableLoot: Array<{
    id: string;
    name: string;
    description?: string;
    type: string;
    quantity: number;
    weight?: number;
    value?: number;
    rarity?: string;
    source?: string;
  }>;
  onLootCollected: () => void;
}

export function LootCollectionPanel({ 
  characterId, 
  availableLoot, 
  onLootCollected 
}: LootCollectionPanelProps) {
  const { toast } = useToast();
  const [isCollecting, setIsCollecting] = useState(false);

  // Add item to inventory mutation
  const addItemMutation = useMutation({
    mutationFn: async (item: any) => {
      const response = await apiRequest('POST', `/api/characters/${characterId}/items`, item);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Item added to inventory",
        description: "The item has been added to your character's inventory",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/characters/${characterId}`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add item",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Get the appropriate icon for a loot item type
  const getLootIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'gold':
        return <CoinsIcon className="h-5 w-5 text-yellow-500" />;
      case 'weapon':
        return <Sword className="h-5 w-5 text-slate-600" />;
      case 'armor':
        return <Shield className="h-5 w-5 text-slate-600" />;
      case 'gem':
        return <Gem className="h-5 w-5 text-purple-500" />;
      case 'potion':
        return <Sparkles className="h-5 w-5 text-blue-500" />;
      case 'scroll':
        return <Sparkles className="h-5 w-5 text-amber-500" />;
      case 'wondrous':
        return <Sparkles className="h-5 w-5 text-emerald-500" />;
      default:
        return <ShoppingBag className="h-5 w-5 text-slate-500" />;
    }
  };

  // Get a color class based on rarity
  const getRarityColor = (rarity?: string) => {
    if (!rarity) return "bg-slate-100 text-slate-800";
    
    switch (rarity.toLowerCase()) {
      case 'common':
        return "bg-slate-100 text-slate-800";
      case 'uncommon':
        return "bg-green-100 text-green-800";
      case 'rare':
        return "bg-blue-100 text-blue-800";
      case 'very rare':
        return "bg-purple-100 text-purple-800";
      case 'legendary':
        return "bg-amber-100 text-amber-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  // Collect a single item
  const collectLootItem = async (item: any) => {
    try {
      // Format the item for the API
      const formattedItem = {
        name: item.name,
        description: item.description || `Found during your adventure.`,
        type: item.type,
        weight: item.weight || 1,
        value: item.value || 0,
        rarity: item.rarity || 'common',
        quantity: item.quantity || 1,
        // Add additional properties if they exist
        ...(item.magical && { magical: true }),
        ...(item.properties && { properties: item.properties })
      };
      
      await addItemMutation.mutateAsync(formattedItem);
      onLootCollected();
    } catch (error) {
      console.error("Error collecting loot item:", error);
    }
  };

  // Collect all available loot
  const collectAllLoot = async () => {
    setIsCollecting(true);
    try {
      // Process items sequentially to avoid overwhelming the API
      for (const item of availableLoot) {
        await collectLootItem(item);
      }
      toast({
        title: "All loot collected",
        description: `${availableLoot.length} items have been added to your inventory`,
      });
    } catch (error) {
      console.error("Error collecting all loot:", error);
      toast({
        title: "Failed to collect all loot",
        description: "An error occurred while collecting loot",
        variant: "destructive",
      });
    } finally {
      setIsCollecting(false);
    }
  };

  if (availableLoot.length === 0) {
    return (
      <div className="p-4 text-center">
        <Package className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
        <h3 className="text-lg font-medium mb-1">No Loot Available</h3>
        <p className="text-sm text-muted-foreground">
          Items you find during your adventure will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold">Available Loot</h2>
        <Button 
          variant="default" 
          onClick={collectAllLoot} 
          disabled={isCollecting || availableLoot.length === 0}
          className="flex items-center gap-1"
        >
          {isCollecting ? (
            <>Collecting...</>
          ) : (
            <>
              <ShoppingBag className="h-4 w-4 mr-1" />
              Collect All
            </>
          )}
        </Button>
      </div>

      <ScrollArea className="h-[calc(100vh-300px)] pr-4">
        <div className="grid gap-3">
          {availableLoot.map((item) => (
            <Card key={item.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    {getLootIcon(item.type)}
                    <CardTitle className="text-base">{item.name}</CardTitle>
                  </div>
                  {item.rarity && (
                    <Badge variant="outline" className={`${getRarityColor(item.rarity)}`}>
                      {item.rarity}
                    </Badge>
                  )}
                </div>
                {item.source && (
                  <CardDescription className="text-xs">
                    Source: {item.source}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="py-2">
                <p className="text-sm">{item.description}</p>
                <div className="flex gap-2 mt-2 text-xs text-muted-foreground">
                  <span>{item.type}</span>
                  {item.weight && <span>• {item.weight} lbs</span>}
                  {item.value && <span>• {item.value} gold</span>}
                  {item.quantity > 1 && <span>• {item.quantity}x</span>}
                </div>
              </CardContent>
              <CardFooter className="pt-2">
                <Button 
                  variant="default" 
                  size="sm" 
                  onClick={() => collectLootItem(item)}
                  disabled={addItemMutation.isPending}
                  className="w-full"
                >
                  {addItemMutation.isPending ? 'Adding...' : 'Add to Inventory'}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}