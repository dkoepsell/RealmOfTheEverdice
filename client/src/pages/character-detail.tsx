import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  Shield, 
  Swords, 
  Scroll, 
  Backpack, 
  Award, 
  Dices, 
  Clock, 
  ArrowUpCircle,
  BookOpen,
  Sparkles
} from "lucide-react";
import { DiceRoller } from "@/components/dice-roll";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

// Character experience thresholds
const EXPERIENCE_LEVELS = [
  0,      // Level 1
  300,    // Level 2
  900,    // Level 3
  2700,   // Level 4
  6500,   // Level 5
  14000,  // Level 6
  23000,  // Level 7
  34000,  // Level 8
  48000,  // Level 9
  64000,  // Level 10
  85000,  // Level 11
  100000, // Level 12
  120000, // Level 13
  140000, // Level 14
  165000, // Level 15
  195000, // Level 16
  225000, // Level 17
  265000, // Level 18
  305000, // Level 19
  355000  // Level 20
];

export default function CharacterDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [showLevelUpDialog, setShowLevelUpDialog] = useState(false);
  const [levelUpInfo, setLevelUpInfo] = useState({
    statsToIncrease: { strength: 0, dexterity: 0, constitution: 0, intelligence: 0, wisdom: 0, charisma: 0 },
    newAbilities: ""
  });
  const [experienceToAdd, setExperienceToAdd] = useState<number>(0);

  // Fetch character data
  const { data: character, isLoading, error } = useQuery({
    queryKey: [`/api/characters/${id}`],
    enabled: !!id
  });

  // Calculate character level and progress 
  const getExperienceInfo = (experience: number) => {
    // Find current level
    let currentLevel = 1;
    for (let i = 0; i < EXPERIENCE_LEVELS.length; i++) {
      if (experience >= EXPERIENCE_LEVELS[i]) {
        currentLevel = i + 1;
      } else {
        break;
      }
    }

    // Calculate progress to next level (percentage)
    let progressPercentage = 0;
    if (currentLevel < 20) {
      const currentLevelXP = EXPERIENCE_LEVELS[currentLevel - 1];
      const nextLevelXP = EXPERIENCE_LEVELS[currentLevel];
      const xpForNextLevel = nextLevelXP - currentLevelXP;
      const xpProgress = experience - currentLevelXP;
      progressPercentage = Math.round((xpProgress / xpForNextLevel) * 100);
    } else {
      progressPercentage = 100; // Already at max level
    }

    return {
      level: currentLevel,
      progress: progressPercentage,
      currentXP: experience,
      nextLevelXP: currentLevel < 20 ? EXPERIENCE_LEVELS[currentLevel] : null,
      xpToNextLevel: currentLevel < 20 ? EXPERIENCE_LEVELS[currentLevel] - experience : 0
    };
  };

  // Format stats with modifier
  const formatStat = (value: number) => {
    const modifier = Math.floor((value - 10) / 2);
    return `${value} (${modifier >= 0 ? '+' : ''}${modifier})`;
  };

  // Calculate level up options
  const calculateLevelUpOptions = () => {
    // Typical D&D progression allows for ability score improvement at certain levels
    const allowAbilityScoreImprovement = [4, 8, 12, 16, 19].includes(character?.level + 1);
    return { 
      abilities: allowAbilityScoreImprovement,
      hitPoints: true,
      skills: [character?.level + 1] % 3 === 0 // New skill every 3 levels
    };
  };

  // Level up mutation
  const levelUpMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest(
        "PUT", 
        `/api/characters/${id}`,
        {
          level: character.level + 1,
          stats: {
            ...character.stats,
            ...data.statsToIncrease
          },
          hp: character.hp + Math.floor(Math.random() * 6) + 1 + Math.floor((character.stats.constitution - 10) / 2),
          maxHp: character.maxHp + Math.floor(Math.random() * 6) + 1 + Math.floor((character.stats.constitution - 10) / 2),
          // Add additional abilities if provided
          abilities: {
            ...character.abilities,
            ...(data.newAbilities ? { [data.newAbilities]: true } : {})
          }
        }
      );
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Level Up!",
        description: `${character.name} has advanced to level ${character.level + 1}!`,
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/characters/${id}`] });
      setShowLevelUpDialog(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to level up character: " + error.message,
        variant: "destructive",
      });
    }
  });

  // Add experience mutation
  const addExperienceMutation = useMutation({
    mutationFn: async (xpAmount: number) => {
      const response = await apiRequest(
        "PUT", 
        `/api/characters/${id}`,
        {
          experience: (character.experience || 0) + xpAmount
        }
      );
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Experience Added",
        description: `Added ${experienceToAdd} XP to ${character.name}`,
        variant: "default",
      });
      
      queryClient.invalidateQueries({ queryKey: [`/api/characters/${id}`] });
      
      const oldLevel = getExperienceInfo(character.experience || 0).level;
      const newLevel = getExperienceInfo(data.experience || 0).level;
      
      // If the character has leveled up, show the level up dialog
      if (newLevel > oldLevel) {
        setShowLevelUpDialog(true);
      }
      
      setExperienceToAdd(0);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add experience: " + error.message,
        variant: "destructive",
      });
    }
  });

  // Handle level up action
  const handleLevelUp = () => {
    levelUpMutation.mutate(levelUpInfo);
  };

  // Handle adding experience
  const handleAddExperience = () => {
    if (experienceToAdd > 0) {
      addExperienceMutation.mutate(experienceToAdd);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4 text-lg">Loading character...</p>
        </div>
      </div>
    );
  }

  if (error || !character) {
    return (
      <div className="container mx-auto p-4 h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive">Error Loading Character</h1>
          <p className="mt-2">This character could not be found or you don't have permission to view it.</p>
          <Button className="mt-4" onClick={() => setLocation("/characters")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Characters
          </Button>
        </div>
      </div>
    );
  }

  const experienceInfo = getExperienceInfo(character.experience || 0);
  const levelUpOptions = calculateLevelUpOptions();

  return (
    <div className="container mx-auto p-4 pt-20 md:pt-6">
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <Button variant="ghost" className="mb-2 pl-0" onClick={() => setLocation("/characters")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Characters
          </Button>
          <h1 className="text-3xl font-bold">{character.name}</h1>
          <p className="text-muted-foreground">
            Level {experienceInfo.level} {character.race} {character.class} • {character.background}
          </p>
        </div>
        
        <div className="flex items-center space-x-2 mt-4 md:mt-0">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Clock className="mr-2 h-4 w-4" />
                Add Experience
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Experience Points</DialogTitle>
                <DialogDescription>
                  Enter the amount of XP to add to this character.
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="xp" className="text-right">
                    XP Amount
                  </Label>
                  <Input
                    id="xp"
                    type="number"
                    min="0"
                    className="col-span-3"
                    value={experienceToAdd}
                    onChange={(e) => setExperienceToAdd(parseInt(e.target.value) || 0)}
                  />
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Current XP</Label>
                  <div className="col-span-3">{character.experience || 0}</div>
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">New Total</Label>
                  <div className="col-span-3">{(character.experience || 0) + experienceToAdd}</div>
                </div>
              </div>
              
              <DialogFooter>
                <Button onClick={handleAddExperience} disabled={addExperienceMutation.isPending}>
                  {addExperienceMutation.isPending ? "Adding..." : "Add XP"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          {experienceInfo.level < 20 && (
            <Button 
              onClick={() => setShowLevelUpDialog(true)} 
              disabled={experienceInfo.level >= getExperienceInfo(character.experience || 0).level}
            >
              <ArrowUpCircle className="mr-2 h-4 w-4" />
              Level Up
            </Button>
          )}
        </div>
      </div>
      
      {/* Level progress bar */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Level {experienceInfo.level}</span>
              {experienceInfo.level < 20 && (
                <span>Level {experienceInfo.level + 1}</span>
              )}
            </div>
            <Progress value={experienceInfo.progress} />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>XP: {experienceInfo.currentXP}</span>
              {experienceInfo.level < 20 ? (
                <span>Next: {experienceInfo.nextLevelXP} ({experienceInfo.xpToNextLevel} XP needed)</span>
              ) : (
                <span>Maximum level reached</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Tabs defaultValue="stats">
            <TabsList className="mb-4">
              <TabsTrigger value="stats">
                <Shield className="h-4 w-4 mr-2" />
                Stats
              </TabsTrigger>
              <TabsTrigger value="inventory">
                <Backpack className="h-4 w-4 mr-2" />
                Inventory
              </TabsTrigger>
              <TabsTrigger value="abilities">
                <Scroll className="h-4 w-4 mr-2" />
                Abilities
              </TabsTrigger>
              <TabsTrigger value="history">
                <BookOpen className="h-4 w-4 mr-2" />
                History
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="stats" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Shield className="h-5 w-5 mr-2" />
                    Basic Stats
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="bg-muted p-3 rounded-lg">
                      <div className="text-sm text-muted-foreground">HP</div>
                      <div className="text-2xl font-bold">{character.hp}/{character.maxHp}</div>
                    </div>
                    <div className="bg-muted p-3 rounded-lg">
                      <div className="text-sm text-muted-foreground">Armor Class</div>
                      <div className="text-2xl font-bold">{10 + Math.floor((character.stats.dexterity - 10) / 2)}</div>
                    </div>
                    <div className="bg-muted p-3 rounded-lg">
                      <div className="text-sm text-muted-foreground">Initiative</div>
                      <div className="text-2xl font-bold">+{Math.floor((character.stats.dexterity - 10) / 2)}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Swords className="h-5 w-5 mr-2" />
                    Ability Scores
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="bg-muted p-3 rounded-lg">
                      <div className="text-sm text-muted-foreground">Strength</div>
                      <div className="text-xl font-bold">{formatStat(character.stats.strength)}</div>
                    </div>
                    <div className="bg-muted p-3 rounded-lg">
                      <div className="text-sm text-muted-foreground">Dexterity</div>
                      <div className="text-xl font-bold">{formatStat(character.stats.dexterity)}</div>
                    </div>
                    <div className="bg-muted p-3 rounded-lg">
                      <div className="text-sm text-muted-foreground">Constitution</div>
                      <div className="text-xl font-bold">{formatStat(character.stats.constitution)}</div>
                    </div>
                    <div className="bg-muted p-3 rounded-lg">
                      <div className="text-sm text-muted-foreground">Intelligence</div>
                      <div className="text-xl font-bold">{formatStat(character.stats.intelligence)}</div>
                    </div>
                    <div className="bg-muted p-3 rounded-lg">
                      <div className="text-sm text-muted-foreground">Wisdom</div>
                      <div className="text-xl font-bold">{formatStat(character.stats.wisdom)}</div>
                    </div>
                    <div className="bg-muted p-3 rounded-lg">
                      <div className="text-sm text-muted-foreground">Charisma</div>
                      <div className="text-xl font-bold">{formatStat(character.stats.charisma)}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="inventory">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Backpack className="h-5 w-5 mr-2" />
                    Equipment
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {character.equipment && character.equipment.items && character.equipment.items.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Item</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {character.equipment.items.map((item: any, index: number) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{item.name}</TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {item.type}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {item.isEquipped ? (
                                <Badge variant="default" className="bg-green-600">Equipped</Badge>
                              ) : (
                                <Badge variant="outline">In Backpack</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm">
                                {item.isEquipped ? "Unequip" : "Equip"}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center p-4 text-muted-foreground">
                      This character doesn't have any items yet.
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="abilities">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Scroll className="h-5 w-5 mr-2" />
                    Abilities & Skills
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {character.abilities && Object.keys(character.abilities).length > 0 ? (
                      Object.entries(character.abilities).map(([ability, value], index) => (
                        <div key={index} className="bg-muted p-3 rounded-lg">
                          <div className="font-medium">{ability}</div>
                          <div className="text-sm text-muted-foreground">
                            {typeof value === 'object' ? JSON.stringify(value) : value.toString()}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-full text-center p-4 text-muted-foreground">
                        No abilities recorded for this character yet.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="history">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BookOpen className="h-5 w-5 mr-2" />
                    Character History & Notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Backstory</h3>
                      <p className="text-muted-foreground whitespace-pre-line">
                        {character.backstory || "No backstory has been written for this character."}
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Appearance</h3>
                      <p className="text-muted-foreground whitespace-pre-line">
                        {character.appearance || "No appearance details have been recorded."}
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Adventure Milestones</h3>
                      {character.milestones && character.milestones.length > 0 ? (
                        <div className="space-y-2">
                          {character.milestones.map((milestone: any, index: number) => (
                            <div key={index} className="bg-muted p-3 rounded-lg">
                              <div className="flex justify-between">
                                <div className="font-medium">{milestone.title}</div>
                                <div className="text-sm text-muted-foreground">
                                  {new Date(milestone.date).toLocaleDateString()}
                                </div>
                              </div>
                              <div className="text-sm mt-1">{milestone.description}</div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground">No adventure milestones recorded yet.</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Dices className="h-5 w-5 mr-2" />
                Dice Roller
              </CardTitle>
              <CardDescription>Roll dice for this character</CardDescription>
            </CardHeader>
            <CardContent>
              <DiceRoller 
                characterName={character.name}
                characterModifiers={character.stats}
              />
            </CardContent>
          </Card>
          
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Award className="h-5 w-5 mr-2" />
                Achievements
              </CardTitle>
            </CardHeader>
            <CardContent>
              {character.achievements && character.achievements.length > 0 ? (
                <div className="space-y-2">
                  {character.achievements.map((achievement: any, index: number) => (
                    <div key={index} className="flex items-center p-2 bg-muted rounded-lg">
                      <div className="bg-primary/10 p-2 rounded-full mr-3">
                        <Sparkles className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium">{achievement.title}</div>
                        <div className="text-xs text-muted-foreground">{achievement.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-4 text-muted-foreground">
                  No achievements unlocked yet.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Level Up Dialog */}
      <Dialog open={showLevelUpDialog} onOpenChange={setShowLevelUpDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Level Up {character.name}</DialogTitle>
            <DialogDescription>
              Your character is advancing to level {(character.level || 1) + 1}!
              Select your improvements.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* HP increase notice */}
            <div className="space-y-2">
              <Label>Hit Points</Label>
              <div className="text-sm bg-muted p-2 rounded">
                Your hit points will automatically increase based on your class and Constitution.
              </div>
            </div>
            
            {/* Ability Score Improvement */}
            {levelUpOptions.abilities && (
              <div className="space-y-2">
                <Label>Ability Score Improvement</Label>
                <div className="text-sm mb-2">
                  Choose abilities to improve (total of +2 points):
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {Object.keys(character.stats).map((stat) => (
                    <div key={stat} className="space-y-1">
                      <Label htmlFor={`stat-${stat}`} className="text-xs capitalize">
                        {stat}
                      </Label>
                      <Select
                        value={levelUpInfo.statsToIncrease[stat as keyof typeof levelUpInfo.statsToIncrease].toString()}
                        onValueChange={(value) => setLevelUpInfo({
                          ...levelUpInfo,
                          statsToIncrease: {
                            ...levelUpInfo.statsToIncrease,
                            [stat]: parseInt(value)
                          }
                        })}
                      >
                        <SelectTrigger id={`stat-${stat}`}>
                          <SelectValue placeholder="0" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">+0</SelectItem>
                          <SelectItem value="1">+1</SelectItem>
                          <SelectItem value="2">+2</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
                <div className="text-xs text-muted-foreground">
                  Total points: {Object.values(levelUpInfo.statsToIncrease).reduce((a, b) => a + b, 0)}/2
                </div>
              </div>
            )}
            
            {/* New Ability */}
            <div className="space-y-2">
              <Label htmlFor="new-ability">New Ability or Feature</Label>
              <Input
                id="new-ability"
                value={levelUpInfo.newAbilities}
                onChange={(e) => setLevelUpInfo({...levelUpInfo, newAbilities: e.target.value})}
                placeholder="Enter a new ability or class feature"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLevelUpDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleLevelUp} disabled={levelUpMutation.isPending}>
              {levelUpMutation.isPending ? "Processing..." : "Confirm Level Up"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}