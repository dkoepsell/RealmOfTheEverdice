import React, { useState } from 'react';
import { Package, ShoppingBag, Check, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { apiRequest } from '@/lib/queryClient';

interface LootItem {
  id: string;
  name: string;
  description?: string;
  type: string;
  quantity: number;
  weight?: number;
  value?: number;
  rarity?: string;
  source?: string;
}

interface LootCollectionPanelProps {
  characterId: number;
  availableLoot: LootItem[];
  onLootCollected: () => void;
}

export function LootCollectionPanel({ characterId, availableLoot, onLootCollected }: LootCollectionPanelProps) {
  const [isCollecting, setIsCollecting] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  const toggleItemSelection = (itemId: string) => {
    if (selectedItems.includes(itemId)) {
      setSelectedItems(prev => prev.filter(id => id !== itemId));
    } else {
      setSelectedItems(prev => [...prev, itemId]);
    }
  };

  const handleCollectItems = async () => {
    if (selectedItems.length === 0) return;
    
    try {
      setIsCollecting(true);
      const itemsToCollect = availableLoot.filter(item => selectedItems.includes(item.id));
      
      // Call API to add items to character inventory
      await apiRequest('POST', `/api/characters/${characterId}/inventory`, {
        items: itemsToCollect
      });
      
      onLootCollected();
      setSelectedItems([]);
    } catch (error) {
      console.error('Failed to collect loot:', error);
    } finally {
      setIsCollecting(false);
    }
  };

  const selectAll = () => {
    setSelectedItems(availableLoot.map(item => item.id));
  };

  const clearSelection = () => {
    setSelectedItems([]);
  };

  if (availableLoot.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-6 h-full">
        <Package className="h-16 w-16 text-muted-foreground mb-4 opacity-50" />
        <h3 className="text-lg font-medium mb-2">No Loot Available</h3>
        <p className="text-sm text-muted-foreground text-center max-w-xs">
          No items have been found in your recent adventures or they've already been collected.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-2">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Available Loot</h3>
        <div className="flex gap-2">
          <Button 
            size="sm" 
            variant="outline" 
            onClick={selectAll}
            disabled={selectedItems.length === availableLoot.length}
          >
            Select All
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={clearSelection}
            disabled={selectedItems.length === 0}
          >
            Clear
          </Button>
        </div>
      </div>

      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
        {availableLoot.map(item => (
          <Card 
            key={item.id} 
            className={`cursor-pointer transition-all ${
              selectedItems.includes(item.id) ? 'border-primary ring-1 ring-primary' : 'border-border'
            }`}
            onClick={() => toggleItemSelection(item.id)}
          >
            <CardHeader className="p-3 pb-1">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-md flex items-center gap-2">
                    {item.name}
                    {item.rarity && (
                      <Badge variant={
                        item.rarity === 'Common' ? 'outline' :
                        item.rarity === 'Uncommon' ? 'secondary' :
                        item.rarity === 'Rare' ? 'default' :
                        item.rarity === 'Very Rare' ? 'destructive' :
                        'outline'
                      } className={item.rarity === 'Legendary' ? 'bg-amber-500 hover:bg-amber-600 text-white' : ''}>
                        {item.rarity}
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {item.type} {item.value && `• ${item.value} gold`}
                  </CardDescription>
                </div>
                {selectedItems.includes(item.id) && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </div>
            </CardHeader>
            {item.description && (
              <CardContent className="p-3 pt-1">
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </CardContent>
            )}
            <CardFooter className="p-3 pt-1 text-xs text-muted-foreground flex justify-between">
              <div>Quantity: {item.quantity}</div>
              {item.weight && <div>Weight: {item.weight} lb</div>}
              {item.source && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center cursor-help">
                        <Info className="h-3 w-3 mr-1" />
                        Source
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Found in: {item.source}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>

      <Button 
        className="w-full" 
        disabled={selectedItems.length === 0 || isCollecting}
        onClick={handleCollectItems}
      >
        <ShoppingBag className="h-4 w-4 mr-2" />
        {isCollecting ? 'Collecting...' : `Collect ${selectedItems.length} Item${selectedItems.length !== 1 ? 's' : ''}`}
      </Button>
    </div>
  );
}