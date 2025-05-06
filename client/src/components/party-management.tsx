import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Character, CampaignCharacter } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
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
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Combine,
  Map,
  MapPin,
  Scroll,
  Split,
  Users,
  UserCheck,
  LocateFixed,
  ArrowRight,
  Tent,
  Footprints,
  PartyPopper,
  Swords
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";

// Types for the component
interface PartyManagementProps {
  campaignId: number;
  isCampaignDm: boolean;
}

export interface PartyGroup {
  id: number;
  name: string;
  location: string;
  characters: CharacterWithDetails[];
  status: string;
  tasks?: string;
}

export interface CharacterWithDetails extends Character {
  user?: {
    id: number;
    username: string;
  };
  campaignStatus?: string;
}

// Form schemas
const createPartyGroupSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").max(50),
  location: z.string().min(3, "Location must be at least 3 characters").max(100),
  tasks: z.string().optional(),
});

const manageGroupsSchema = z.object({
  characters: z.array(z.object({
    id: z.number(),
    groupId: z.number().nullable(),
  })),
});

export function PartyManagement({ campaignId, isCampaignDm }: PartyManagementProps) {
  const { toast } = useToast();
  const [isPartyManagementOpen, setIsPartyManagementOpen] = useState(false);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  
  // Form for creating a new party group
  const createGroupForm = useForm<z.infer<typeof createPartyGroupSchema>>({
    resolver: zodResolver(createPartyGroupSchema),
    defaultValues: {
      name: "",
      location: "",
      tasks: "",
    },
  });
  
  // Create mock data for demonstration purposes
  const mockCharacters: CharacterWithDetails[] = [
    {
      id: 1,
      userId: 1,
      name: "Elrond the Wise",
      race: "Elf",
      class: "Wizard",
      level: 5,
      background: "Sage",
      appearance: "Tall, with silver hair and wise eyes",
      backstory: "Born in the forests of Rivendell...",
      stats: { strength: 8, dexterity: 14, constitution: 12, intelligence: 18, wisdom: 16, charisma: 14 },
      hp: 28,
      maxHp: 30,
      equipment: { weapons: ["Staff of the Magi"], armor: "Robes of Protection", items: ["Spellbook", "Component Pouch"] },
      spells: [],
      abilities: [],
      createdAt: new Date(),
      user: { id: 1, username: "JohnDoe" },
      campaignStatus: "active"
    },
    {
      id: 2,
      userId: 2,
      name: "Grimnar Ironfist",
      race: "Dwarf",
      class: "Fighter",
      level: 5,
      background: "Soldier",
      appearance: "Stout, with a braided beard and armor",
      backstory: "Forged in the fires of the mountain halls...",
      stats: { strength: 18, dexterity: 12, constitution: 16, intelligence: 8, wisdom: 10, charisma: 8 },
      hp: 48,
      maxHp: 48,
      equipment: { weapons: ["Warhammer", "Handaxe"], armor: "Chain Mail", items: ["Shield", "Adventurer's Pack"] },
      spells: [],
      abilities: [],
      createdAt: new Date(),
      user: { id: 2, username: "JaneSmith" },
      campaignStatus: "active"
    },
    {
      id: 3,
      userId: 3,
      name: "Lyra Nightshade",
      race: "Human",
      class: "Rogue",
      level: 5,
      background: "Criminal",
      appearance: "Slender, with dark clothing and quick movements",
      backstory: "Raised in the shadows of the city streets...",
      stats: { strength: 10, dexterity: 18, constitution: 12, intelligence: 14, wisdom: 12, charisma: 14 },
      hp: 32,
      maxHp: 35,
      equipment: { weapons: ["Shortbow", "Dagger"], armor: "Leather Armor", items: ["Thieves' Tools", "Cloak of Elvenkind"] },
      spells: [],
      abilities: [],
      createdAt: new Date(),
      user: { id: 3, username: "SamGreen" },
      campaignStatus: "active"
    },
    {
      id: 4,
      userId: 4,
      name: "Thora Lightbringer",
      race: "Half-Elf",
      class: "Cleric",
      level: 5,
      background: "Acolyte",
      appearance: "Radiant, with gleaming armor and holy symbols",
      backstory: "Devoted to the temple from an early age...",
      stats: { strength: 14, dexterity: 10, constitution: 14, intelligence: 12, wisdom: 18, charisma: 16 },
      hp: 42,
      maxHp: 42,
      equipment: { weapons: ["Mace of Disruption"], armor: "Chain Mail", items: ["Holy Symbol", "Shield"] },
      spells: [],
      abilities: [],
      createdAt: new Date(),
      user: { id: 4, username: "AlexWilson" },
      campaignStatus: "active"
    },
  ];
  
  const mockPartyGroups: PartyGroup[] = [
    {
      id: 1,
      name: "Scout Team",
      location: "Misty Forest",
      characters: [mockCharacters[0], mockCharacters[2]],
      status: "Exploring",
      tasks: "Search for the hidden shrine described in the old map"
    },
    {
      id: 2,
      name: "Main Party",
      location: "Village of Greenbrook",
      characters: [mockCharacters[1], mockCharacters[3]],
      status: "Resupplying",
      tasks: "Gather information from locals about the recent goblin attacks"
    },
  ];
  
  // In a real implementation, we'd fetch party members and groups from the API
  const {
    data: characters = mockCharacters,
    isLoading: charactersLoading,
  } = useQuery<CharacterWithDetails[]>({
    queryKey: ['/api/mock/party-members'],
    enabled: false, // Disabled for mock implementation
  });
  
  const {
    data: partyGroups = mockPartyGroups,
    isLoading: groupsLoading,
  } = useQuery<PartyGroup[]>({
    queryKey: ['/api/mock/party-groups'],
    enabled: false, // Disabled for mock implementation
  });
  
  // In a real implementation, these would be mutations to the API
  const handleCreatePartyGroup = (data: z.infer<typeof createPartyGroupSchema>) => {
    toast({
      title: "Party Group Created",
      description: `Created group "${data.name}" at ${data.location}`,
    });
    
    setIsCreateGroupOpen(false);
    createGroupForm.reset();
  };
  
  const handleJoinGroup = (characterId: number, groupId: number) => {
    toast({
      title: "Character Moved",
      description: "Character has joined the group",
    });
  };
  
  const handleLeaveGroup = (characterId: number) => {
    toast({
      title: "Character Moved",
      description: "Character has left their current group",
    });
  };
  
  const handleReuniteParty = () => {
    toast({
      title: "Party Reunited",
      description: "All party members have been reunited at the main location",
    });
  };
  
  const handleUpdateTasks = (groupId: number, tasks: string) => {
    toast({
      title: "Tasks Updated",
      description: "Group tasks have been updated",
    });
  };
  
  // Get character initials for avatar fallback
  const getCharacterInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  // Helper to get group by id
  const getGroupById = (groupId: number) => {
    return partyGroups.find(g => g.id === groupId);
  };
  
  // Get characters without a group
  const ungroupedCharacters = characters.filter(
    c => !partyGroups.some(g => g.characters.some(gc => gc.id === c.id))
  );
  
  // Determine if the party is currently split
  const isPartySplit = partyGroups.length > 1 || (partyGroups.length === 1 && ungroupedCharacters.length > 0);
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-3 sm:flex-row sm:justify-between sm:space-y-0">
        <div>
          <h2 className="text-xl font-medieval text-primary">Party Management</h2>
          <p className="text-sm text-muted-foreground">
            {isPartySplit 
              ? "Your party is currently split into different groups" 
              : "Your party is currently together"}
          </p>
        </div>
        
        <div className="flex space-x-2">
          {isPartySplit ? (
            <Button onClick={handleReuniteParty}>
              <Combine className="mr-2 h-4 w-4" /> Reunite Party
            </Button>
          ) : (
            <Button onClick={() => setIsPartyManagementOpen(true)}>
              <Split className="mr-2 h-4 w-4" /> Split Party
            </Button>
          )}
          
          {isCampaignDm && (
            <Button variant="outline" onClick={() => setIsCreateGroupOpen(true)}>
              <Users className="mr-2 h-4 w-4" /> New Group
            </Button>
          )}
        </div>
      </div>
      
      {isPartySplit ? (
        <div className="space-y-4">
          <Tabs defaultValue="groups" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="groups">
                <Users className="mr-2 h-4 w-4" /> Party Groups
              </TabsTrigger>
              <TabsTrigger value="map">
                <Map className="mr-2 h-4 w-4" /> Locations
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="groups" className="space-y-4 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {partyGroups.map(group => (
                  <Card key={group.id}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between">
                        <div>
                          <CardTitle className="font-medieval">{group.name}</CardTitle>
                          <CardDescription className="flex items-center">
                            <MapPin className="h-3 w-3 mr-1" /> {group.location}
                          </CardDescription>
                        </div>
                        <div className="text-xs py-1 px-2 rounded-full bg-accent/20">
                          {group.status}
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      <div className="mb-3">
                        <h4 className="text-sm font-semibold mb-1">Members:</h4>
                        <div className="flex flex-wrap gap-2">
                          {group.characters.map(character => (
                            <div 
                              key={character.id} 
                              className="flex items-center gap-2 p-2 rounded-lg bg-accent/10"
                            >
                              <Avatar className="h-6 w-6">
                                <AvatarFallback className="text-xs">
                                  {getCharacterInitials(character.name)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm">{character.name}</span>
                              <span className="text-xs text-muted-foreground">
                                ({character.class})
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {group.tasks && (
                        <div>
                          <h4 className="text-sm font-semibold mb-1">Current Tasks:</h4>
                          <p className="text-sm text-muted-foreground">{group.tasks}</p>
                        </div>
                      )}
                    </CardContent>
                    
                    <CardFooter className="flex justify-between pt-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setIsPartyManagementOpen(true)}
                      >
                        <UserCheck className="mr-1 h-4 w-4" /> Manage
                      </Button>
                      
                      {isCampaignDm && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Scroll className="mr-1 h-4 w-4" /> Set Tasks
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Update Tasks for {group.name}</DialogTitle>
                              <DialogDescription>
                                Assign tasks for this group to complete while separated
                              </DialogDescription>
                            </DialogHeader>
                            
                            <div className="space-y-4 py-4">
                              <div className="space-y-2">
                                <h4 className="font-medium">Current Location</h4>
                                <div className="flex items-center text-muted-foreground">
                                  <MapPin className="h-4 w-4 mr-2" />
                                  {group.location}
                                </div>
                              </div>
                              
                              <div className="space-y-2">
                                <label 
                                  htmlFor={`tasks-${group.id}`} 
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                  Tasks and Objectives
                                </label>
                                <Textarea 
                                  id={`tasks-${group.id}`}
                                  defaultValue={group.tasks}
                                  placeholder="What should this group accomplish?"
                                  rows={4}
                                />
                              </div>
                            </div>
                            
                            <DialogFooter>
                              <Button onClick={() => handleUpdateTasks(group.id, "New tasks set by DM")}>
                                Save Tasks
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      )}
                    </CardFooter>
                  </Card>
                ))}
                
                {ungroupedCharacters.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="font-medieval">Ungrouped Characters</CardTitle>
                      <CardDescription>
                        Characters not assigned to any group
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {ungroupedCharacters.map(character => (
                          <div 
                            key={character.id} 
                            className="flex items-center gap-2 p-2 rounded-lg bg-accent/10"
                          >
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-xs">
                                {getCharacterInitials(character.name)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{character.name}</span>
                            <span className="text-xs text-muted-foreground">
                              ({character.class})
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                    
                    <CardFooter>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        onClick={() => setIsPartyManagementOpen(true)}
                      >
                        <UserCheck className="mr-2 h-4 w-4" /> Assign to Group
                      </Button>
                    </CardFooter>
                  </Card>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="map" className="pt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Party Locations</CardTitle>
                  <CardDescription>
                    See where different members of your party are located
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="relative">
                  <div className="aspect-video bg-accent/10 rounded-md border flex items-center justify-center">
                    <div className="text-center">
                      <Map className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-muted-foreground mb-2">Map visualization would appear here</p>
                      <div className="flex flex-col gap-2 max-w-sm mx-auto text-sm">
                        {partyGroups.map(group => (
                          <div 
                            key={group.id}
                            className="flex items-center gap-2 p-2 rounded-lg border"
                          >
                            <div className="flex-1">
                              <span className="font-medium">{group.name}</span>
                              <div className="text-xs text-muted-foreground">
                                Location: {group.location}
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-xs">{group.characters.length} members</span>
                              <Button size="icon" variant="ghost" className="h-6 w-6">
                                <LocateFixed className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="font-medieval">Party Status</CardTitle>
            <CardDescription>
              Your entire party is currently together
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <div className="flex items-center justify-center py-6">
              <div className="text-center">
                <PartyPopper className="h-16 w-16 mx-auto mb-4 text-accent/50" />
                <h3 className="text-lg font-medieval mb-2">Party United</h3>
                <p className="text-muted-foreground mb-6 max-w-sm">
                  All party members are traveling together. Use the Split Party button when the group needs to divide to accomplish multiple objectives.
                </p>
                
                <div className="flex flex-wrap justify-center gap-2 mb-4">
                  {characters.map(character => (
                    <div 
                      key={character.id} 
                      className="flex items-center gap-2 p-2 rounded-lg bg-accent/10"
                    >
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">
                          {getCharacterInitials(character.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{character.name}</span>
                      <span className="text-xs text-muted-foreground">
                        ({character.class})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-center">
            <Button onClick={() => setIsPartyManagementOpen(true)}>
              <Split className="mr-2 h-4 w-4" /> Split Party
            </Button>
          </CardFooter>
        </Card>
      )}
      
      {/* Dialog for party management */}
      <Dialog open={isPartyManagementOpen} onOpenChange={setIsPartyManagementOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Party Management</DialogTitle>
            <DialogDescription>
              {isPartySplit 
                ? "Manage your party members and their group assignments" 
                : "Split your party into separate groups"}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <h3 className="font-medieval text-lg">Characters</h3>
            
            <div className="space-y-3">
              {characters.map(character => {
                // Find the group this character belongs to (if any)
                const currentGroup = partyGroups.find(g => 
                  g.characters.some(c => c.id === character.id)
                );
                
                return (
                  <div 
                    key={character.id} 
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>{getCharacterInitials(character.name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{character.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {character.race} {character.class}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {currentGroup && (
                        <div className="text-xs bg-accent/20 py-1 px-2 rounded">
                          {currentGroup.name}
                        </div>
                      )}
                      
                      <Select
                        defaultValue={currentGroup ? String(currentGroup.id) : "none"}
                        onValueChange={(value) => {
                          if (value === "none") {
                            handleLeaveGroup(character.id);
                          } else {
                            handleJoinGroup(character.id, parseInt(value));
                          }
                        }}
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue placeholder="Select group" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No Group</SelectItem>
                          {partyGroups.map(group => (
                            <SelectItem key={group.id} value={String(group.id)}>
                              {group.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          <DialogFooter>
            <Button onClick={() => setIsPartyManagementOpen(false)}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Dialog for creating a new party group */}
      <Dialog open={isCreateGroupOpen} onOpenChange={setIsCreateGroupOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Party Group</DialogTitle>
            <DialogDescription>
              Create a new group for party members to join
            </DialogDescription>
          </DialogHeader>
          
          <Form {...createGroupForm}>
            <form onSubmit={createGroupForm.handleSubmit(handleCreatePartyGroup)} className="space-y-4">
              <FormField
                control={createGroupForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Group Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Scout Team" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={createGroupForm.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Western Forest" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={createGroupForm.control}
                name="tasks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tasks (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="What should this group accomplish?"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Describe the objectives for this group
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="submit">Create Group</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default PartyManagement;