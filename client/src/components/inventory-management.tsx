import React, { useState } from 'react';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { 
  ShoppingBag, 
  Package, 
  Shield, 
  Sword, 
  Scroll, 
  Sparkles,
  Truck,
  TrendingUp,
  AlertCircle,
  ShoppingCart,
  Search,
  Filter,
  Trash2,
  Beaker,
  Info
} from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

// Helper to determine icon by item type
const getItemIcon = (type: string) => {
  switch (type.toLowerCase()) {
    case 'weapon': return <Sword className="h-4 w-4" />;
    case 'armor': return <Shield className="h-4 w-4" />;
    case 'apparel': return <Shirt className="h-4 w-4" />;
    case 'potion': return <Beaker className="h-4 w-4" />;
    case 'scroll': return <Scroll className="h-4 w-4" />;
    case 'quest': return <Sparkles className="h-4 w-4" />;
    default: return <Package className="h-4 w-4" />;
  }
};

// Helper to determine color by rarity
const getRarityColor = (rarity: string) => {
  switch (rarity.toLowerCase()) {
    case 'common': return 'bg-slate-200 text-slate-800';
    case 'uncommon': return 'bg-green-100 text-green-800';
    case 'rare': return 'bg-blue-100 text-blue-800';
    case 'very rare': return 'bg-purple-100 text-purple-800';
    case 'legendary': return 'bg-amber-100 text-amber-800';
    case 'artifact': return 'bg-red-100 text-red-800';
    default: return 'bg-slate-200 text-slate-800';
  }
};

// Helper to calculate total weight
const calculateTotalWeight = (items: any[]) => {
  return items.reduce((total, item) => {
    return total + (item.weight || 0) * (item.quantity || 1);
  }, 0).toFixed(1);
};

interface Character {
  id: number;
  name: string;
  race: string;
  class: string;
  level: number;
  equipment: any;
  userId: number;
  stats?: {
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
  };
}

interface InventoryManagementProps {
  characterId: number;
  campaignId: number;
  character?: Character;
  campaignCharacters?: Character[];
  onItemUpdate?: () => void;
}

export function InventoryManagement({ 
  characterId, 
  campaignId, 
  character, 
  campaignCharacters = [],
  onItemUpdate 
}: InventoryManagementProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState('inventory');
  const [selectedCharacter, setSelectedCharacter] = useState<number | null>(null);
  const [selectedItem, setSelectedItem] = useState<{ index: number, item: any } | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRarity, setFilterRarity] = useState('all');
  const [filterType, setFilterType] = useState('all');
  
  const queryClient = useQueryClient();
  
  const calculateCarryingCapacity = () => {
    const strength = character?.stats?.strength || 10;
    return strength * 15; // D&D 5e rule: carrying capacity = strength score × 15
  };
  
  const calculateInventoryWeight = () => {
    const inventory = character?.equipment?.inventory || [];
    return calculateTotalWeight(inventory);
  };
  
  // Calculate encumbrance status based on weight
  const getEncumbranceStatus = () => {
    const capacity = calculateCarryingCapacity();
    const weight = calculateInventoryWeight();
    const percentage = (parseFloat(weight) / capacity) * 100;
    
    if (percentage >= 100) {
      return {
        status: "Heavily Encumbered",
        description: "Speed reduced by 20 feet. Disadvantage on ability checks, attack rolls, and saving throws that use Strength, Dexterity, or Constitution.",
        color: "text-red-600"
      };
    } else if (percentage >= 66.67) {
      return {
        status: "Encumbered",
        description: "Speed reduced by 10 feet. Disadvantage on ability checks that use Strength, Dexterity, or Constitution.",
        color: "text-amber-600"
      };
    } else if (percentage >= 33.33) {
      return {
        status: "Partially Encumbered",
        description: "No penalties, but approaching encumbrance.",
        color: "text-amber-500"
      };
    } else {
      return {
        status: "Unencumbered",
        description: "No movement or ability penalties.",
        color: "text-green-600"
      };
    }
  };
  
  const encumbranceInfo = getEncumbranceStatus();
  
  // Get all characters in the campaign that aren't the current character
  const otherCharacters = campaignCharacters.filter(c => c.id !== characterId);
  
  // Random item generation
  const generateRandomItemMutation = useMutation({
    mutationFn: async (params: { 
      itemType?: string, 
      rarity?: string, 
      category?: string, 
      characterLevel?: number 
    }) => {
      const response = await apiRequest('POST', '/api/generate/items', params);
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Item discovered!",
        description: `You found: ${data.name}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to generate item",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Add item to inventory mutation
  const addItemMutation = useMutation({
    mutationFn: async (item: any) => {
      const response = await apiRequest('POST', `/api/characters/${characterId}/items`, item);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Item added",
        description: "Item has been added to your inventory",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/characters/${characterId}`] });
      if (onItemUpdate) onItemUpdate();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add item",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Remove item from inventory mutation
  const removeItemMutation = useMutation({
    mutationFn: async (itemIndex: number) => {
      const response = await apiRequest('DELETE', `/api/characters/${characterId}/items/${itemIndex}`);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Item removed",
        description: "Item has been removed from your inventory",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/characters/${characterId}`] });
      if (onItemUpdate) onItemUpdate();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to remove item",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Equip/unequip item mutation
  const equipItemMutation = useMutation({
    mutationFn: async ({ itemIndex, equip }: { itemIndex: number, equip: boolean }) => {
      const response = await apiRequest('POST', `/api/characters/${characterId}/items/${itemIndex}/equip`, { equip });
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: selectedItem?.item.isEquipped ? "Item unequipped" : "Item equipped",
        description: `${selectedItem?.item.name} has been ${selectedItem?.item.isEquipped ? "unequipped" : "equipped"}`,
      });
      queryClient.invalidateQueries({ queryKey: [`/api/characters/${characterId}`] });
      if (onItemUpdate) onItemUpdate();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to equip item",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Transfer item mutation
  const transferItemMutation = useMutation({
    mutationFn: async ({ toCharacterId, itemIndex, quantity }: { toCharacterId: number, itemIndex: number, quantity: number }) => {
      const response = await apiRequest('POST', `/api/characters/${characterId}/items/${itemIndex}/transfer/${toCharacterId}`, { quantity });
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Item transferred",
        description: `${quantity}x ${selectedItem?.item.name} has been transferred`,
      });
      queryClient.invalidateQueries({ queryKey: [`/api/characters/${characterId}`] });
      if (onItemUpdate) onItemUpdate();
      setSelectedItem(null);
      setSelectedCharacter(null);
      setQuantity(1);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to transfer item",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Random item discovery handler
  const handleRandomItemDiscovery = async () => {
    try {
      const item = await generateRandomItemMutation.mutateAsync({
        rarity: filterRarity === 'all' ? undefined : filterRarity,
        itemType: filterType === 'all' ? undefined : filterType,
        characterLevel: character?.level || 1
      });
      
      // Add the item to the character's inventory
      addItemMutation.mutate(item);
    } catch (error) {
      console.error("Error discovering item:", error);
    }
  };
  
  // Filter inventory items based on search and filters
  const filteredInventory = React.useMemo(() => {
    const inventory = character?.equipment?.inventory || [];
    
    return inventory.filter((item: any) => {
      const matchesSearch = !searchTerm || 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase());
        
      const matchesRarity = filterRarity === 'all' || 
        item.rarity.toLowerCase() === filterRarity.toLowerCase();
        
      const matchesType = filterType === 'all' ||
        item.type.toLowerCase() === filterType.toLowerCase();
        
      return matchesSearch && matchesRarity && matchesType;
    });
  }, [character, searchTerm, filterRarity, filterType]);
  
  // Handle item equip/unequip
  const handleEquipItem = (index: number, item: any) => {
    equipItemMutation.mutate({ 
      itemIndex: index, 
      equip: !item.isEquipped 
    });
  };
  
  // Handle item removal
  const handleRemoveItem = (index: number) => {
    if (confirm("Are you sure you want to remove this item?")) {
      removeItemMutation.mutate(index);
    }
  };
  
  // Handle item transfer
  const handleTransferItem = () => {
    if (!selectedCharacter || !selectedItem) return;
    
    transferItemMutation.mutate({
      toCharacterId: selectedCharacter,
      itemIndex: selectedItem.index,
      quantity: quantity
    });
  };
  
  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsOpen(true)}
              className="h-8 w-8"
            >
              <Package className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Inventory Management</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Inventory Management</DialogTitle>
            <DialogDescription>
              Manage your character's inventory, find items, and trade with party members.
            </DialogDescription>
          </DialogHeader>
          
          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="inventory">Inventory</TabsTrigger>
              <TabsTrigger value="discover">Discover Items</TabsTrigger>
              <TabsTrigger value="trade">Trade</TabsTrigger>
            </TabsList>
            
            {/* Inventory Tab */}
            <TabsContent value="inventory" className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <div className="space-y-1">
                  <h3 className="text-lg font-medium">{character?.name}'s Inventory</h3>
                  <div className="text-sm text-muted-foreground flex items-center space-x-2">
                    <Truck className="h-4 w-4" />
                    <span>
                      Weight: {calculateInventoryWeight()} / {calculateCarryingCapacity()} lbs
                    </span>
                  </div>
                  <div className={`text-xs flex items-center space-x-1 ${encumbranceInfo.color}`}>
                    <AlertCircle className="h-3 w-3" />
                    <span>Status: {encumbranceInfo.status}</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3 w-3 cursor-pointer" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p>{encumbranceInfo.description}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="relative w-[200px]">
                    <div className="absolute left-2 top-1/2 transform -translate-y-1/2">
                      <Search className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <Input
                      placeholder="Search items..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                  
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-[120px]">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="weapon">Weapons</SelectItem>
                      <SelectItem value="armor">Armor</SelectItem>
                      <SelectItem value="apparel">Apparel</SelectItem>
                      <SelectItem value="potion">Potions</SelectItem>
                      <SelectItem value="scroll">Scrolls</SelectItem>
                      <SelectItem value="tool">Tools</SelectItem>
                      <SelectItem value="trinket">Trinkets</SelectItem>
                      <SelectItem value="miscellaneous">Miscellaneous</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={filterRarity} onValueChange={setFilterRarity}>
                    <SelectTrigger className="w-[120px]">
                      <Sparkles className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Rarity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Rarities</SelectItem>
                      <SelectItem value="common">Common</SelectItem>
                      <SelectItem value="uncommon">Uncommon</SelectItem>
                      <SelectItem value="rare">Rare</SelectItem>
                      <SelectItem value="very rare">Very Rare</SelectItem>
                      <SelectItem value="legendary">Legendary</SelectItem>
                      <SelectItem value="artifact">Artifact</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                {filteredInventory.length > 0 ? (
                  filteredInventory.map((item: any, index: number) => (
                    <Card key={index} className={`border ${item.isEquipped ? 'border-primary' : 'border-border'}`}>
                      <CardHeader className="p-4 pb-2">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center">
                            <div className="mr-2">
                              {getItemIcon(item.type)}
                            </div>
                            <div>
                              <CardTitle className="text-base">{item.name}</CardTitle>
                              <CardDescription className="text-xs">
                                {item.type} • {item.weight} lbs • {item.value} gp
                              </CardDescription>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className={`${getRarityColor(item.rarity)}`}>
                              {item.rarity}
                            </Badge>
                            <div className="text-sm font-medium">
                              {item.quantity}x
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 pt-2 pb-2">
                        <p className="text-sm">{item.description}</p>
                        {item.properties && item.properties.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {item.properties.map((prop: string, i: number) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {prop}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </CardContent>
                      <CardFooter className="p-4 pt-2 justify-between">
                        <div className="text-xs text-muted-foreground">
                          {item.attunement && (
                            <span className="flex items-center">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Requires attunement
                            </span>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleEquipItem(index, item)}
                          >
                            {item.isEquipped ? 'Unequip' : 'Equip'}
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleRemoveItem(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardFooter>
                    </Card>
                  ))
                ) : (
                  <div className="text-center p-8 border border-dashed rounded-lg">
                    <Package className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                    <h3 className="text-lg font-medium mb-1">No items found</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {character?.equipment?.inventory?.length > 0 
                        ? "Try adjusting your search or filters" 
                        : "Your inventory is empty"}
                    </p>
                    {character?.equipment?.inventory?.length === 0 && (
                      <Button
                        onClick={() => setSelectedTab('discover')}
                        variant="outline"
                      >
                        Discover Items
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </TabsContent>
            
            {/* Discover Items Tab */}
            <TabsContent value="discover" className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Discover New Items</h3>
                <p className="text-sm text-muted-foreground">
                  Find random items during your adventure that match your preferences.
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="item-type">Item Type</Label>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger id="item-type">
                      <SelectValue placeholder="Select item type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Random Type</SelectItem>
                      <SelectItem value="weapon">Weapon</SelectItem>
                      <SelectItem value="armor">Armor</SelectItem>
                      <SelectItem value="apparel">Apparel</SelectItem>
                      <SelectItem value="potion">Potion</SelectItem>
                      <SelectItem value="scroll">Scroll</SelectItem>
                      <SelectItem value="tool">Tool</SelectItem>
                      <SelectItem value="trinket">Trinket</SelectItem>
                      <SelectItem value="miscellaneous">Miscellaneous</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="item-rarity">Item Rarity</Label>
                  <Select value={filterRarity} onValueChange={setFilterRarity}>
                    <SelectTrigger id="item-rarity">
                      <SelectValue placeholder="Select item rarity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Random Rarity</SelectItem>
                      <SelectItem value="common">Common</SelectItem>
                      <SelectItem value="uncommon">Uncommon</SelectItem>
                      <SelectItem value="rare">Rare</SelectItem>
                      <SelectItem value="very rare">Very Rare</SelectItem>
                      <SelectItem value="legendary">Legendary</SelectItem>
                      <SelectItem value="artifact">Artifact</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <Separator />
              
              <div className="flex justify-center">
                <Button
                  size="lg"
                  onClick={handleRandomItemDiscovery}
                  disabled={generateRandomItemMutation.isPending || addItemMutation.isPending}
                  className="w-full max-w-md"
                >
                  {generateRandomItemMutation.isPending || addItemMutation.isPending ? (
                    <>Searching...</>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-5 w-5" />
                      Discover Item
                    </>
                  )}
                </Button>
              </div>
              
              {generateRandomItemMutation.data && (
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle>{generateRandomItemMutation.data.name}</CardTitle>
                    <CardDescription>
                      {generateRandomItemMutation.data.type} • {generateRandomItemMutation.data.rarity}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p>{generateRandomItemMutation.data.description}</p>
                    
                    {generateRandomItemMutation.data.properties && generateRandomItemMutation.data.properties.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {generateRandomItemMutation.data.properties.map((prop: string, i: number) => (
                          <Badge key={i} variant="secondary">
                            {prop}
                          </Badge>
                        ))}
                      </div>
                    )}
                    
                    <div className="grid grid-cols-3 gap-2 mt-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Weight:</span> {generateRandomItemMutation.data.weight} lbs
                      </div>
                      <div>
                        <span className="text-muted-foreground">Value:</span> {generateRandomItemMutation.data.value} gp
                      </div>
                      <div>
                        {generateRandomItemMutation.data.attunement && (
                          <span className="text-warning">Requires attunement</span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button
                      onClick={() => addItemMutation.mutate(generateRandomItemMutation.data)}
                      disabled={addItemMutation.isPending}
                      className="w-full"
                    >
                      {addItemMutation.isPending ? "Adding..." : "Add to Inventory"}
                    </Button>
                  </CardFooter>
                </Card>
              )}
            </TabsContent>
            
            {/* Trade Tab */}
            <TabsContent value="trade" className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Trade with Party Members</h3>
                <p className="text-sm text-muted-foreground">
                  Transfer items to other characters in your party.
                </p>
              </div>
              
              {otherCharacters.length === 0 ? (
                <div className="text-center p-8 border border-dashed rounded-lg">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-medium mb-1">No other characters in party</h3>
                  <p className="text-sm text-muted-foreground">
                    You need other characters in your party to trade with.
                  </p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="select-item" className="mb-2 block">Select Item to Trade</Label>
                    <div className="max-h-[300px] overflow-y-auto space-y-2">
                      {(character?.equipment?.inventory || []).map((item: any, index: number) => (
                        <div 
                          key={index}
                          className={`p-3 border rounded-md cursor-pointer transition-colors ${
                            selectedItem?.index === index 
                              ? 'bg-primary/10 border-primary' 
                              : 'border-border hover:bg-accent'
                          }`}
                          onClick={() => setSelectedItem({ index, item })}
                        >
                          <div className="flex justify-between">
                            <div className="font-medium flex items-center">
                              {getItemIcon(item.type)}
                              <span className="ml-2">{item.name}</span>
                              <Badge variant="outline" className="ml-2">
                                {item.quantity}x
                              </Badge>
                            </div>
                            <Badge variant="outline" className={`${getRarityColor(item.rarity)}`}>
                              {item.rarity}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {item.type} • {item.weight} lbs
                          </p>
                        </div>
                      ))}
                      
                      {(!character?.equipment || 
                        !(character.equipment as any)?.inventory || 
                        ((character.equipment as any)?.inventory || []).length === 0) && (
                        <div className="text-center p-4 text-muted-foreground border border-dashed rounded-md">
                          <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>Your inventory is empty</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="trade-character" className="mb-2 block">Trade With</Label>
                        <Select 
                          value={selectedCharacter?.toString() || ''} 
                          onValueChange={(value) => setSelectedCharacter(parseInt(value))}
                        >
                          <SelectTrigger id="trade-character">
                            <SelectValue placeholder="Select character" />
                          </SelectTrigger>
                          <SelectContent>
                            {otherCharacters.map((char) => (
                              <SelectItem key={char.id} value={char.id.toString()}>
                                {char.name} (Level {char.level} {char.race} {char.class})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {selectedItem && selectedItem.item.quantity > 1 && (
                        <div>
                          <Label htmlFor="quantity" className="mb-2 block">Quantity</Label>
                          <div className="flex items-center">
                            <Input
                              id="quantity"
                              type="number"
                              min={1}
                              max={selectedItem.item.quantity}
                              value={quantity}
                              onChange={(e) => setQuantity(Math.min(
                                selectedItem.item.quantity,
                                Math.max(1, parseInt(e.target.value) || 1)
                              ))}
                            />
                            <span className="ml-2 text-sm text-muted-foreground">
                              / {selectedItem.item.quantity}
                            </span>
                          </div>
                        </div>
                      )}
                      
                      <Button
                        disabled={!selectedItem || !selectedCharacter || transferItemMutation.isPending}
                        onClick={handleTransferItem}
                        className="w-full mt-4"
                      >
                        {transferItemMutation.isPending ? "Trading..." : "Trade Item"}
                      </Button>
                    </div>
                    
                    {selectedItem && selectedCharacter && (
                      <Card className="mt-4">
                        <CardHeader className="p-3 pb-2">
                          <CardTitle className="text-sm">Trade Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="p-3 pt-0 space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Item:</span>
                            <span>{selectedItem.item.name}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Quantity:</span>
                            <span>{quantity}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">From:</span>
                            <span>{character?.name}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">To:</span>
                            <span>
                              {otherCharacters.find(c => c.id === selectedCharacter)?.name}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}