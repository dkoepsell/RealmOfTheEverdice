import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertCharacterSchema, CharacterStats } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import Navbar from "@/components/navbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Dice5, Sparkles, RefreshCw, UserCircle, ScrollText } from "lucide-react";

// Character races
const races = [
  "Human",
  "Elf",
  "Dwarf",
  "Halfling",
  "Half-Elf",
  "Half-Orc",
  "Tiefling",
  "Dragonborn",
  "Gnome",
];

// Character classes
const classes = [
  "Barbarian",
  "Bard",
  "Cleric",
  "Druid",
  "Fighter",
  "Monk",
  "Paladin",
  "Ranger",
  "Rogue",
  "Sorcerer",
  "Warlock",
  "Wizard",
];

// Character backgrounds
const backgrounds = [
  "Acolyte",
  "Charlatan",
  "Criminal",
  "Entertainer",
  "Folk Hero",
  "Guild Artisan",
  "Hermit",
  "Noble",
  "Outlander",
  "Sage",
  "Sailor",
  "Soldier",
];

// Character ability scores validation
const statsSchema = z.object({
  strength: z.coerce.number().min(3).max(20),
  dexterity: z.coerce.number().min(3).max(20),
  constitution: z.coerce.number().min(3).max(20),
  intelligence: z.coerce.number().min(3).max(20),
  wisdom: z.coerce.number().min(3).max(20),
  charisma: z.coerce.number().min(3).max(20),
});

// Extend the insert schema with validation rules
const characterSchema = insertCharacterSchema
  .extend({
    stats: statsSchema,
    // Add form-specific fields
    confirmCreate: z.boolean().optional(),
  })
  .refine((data) => data.confirmCreate === true, {
    message: "You must confirm character creation",
    path: ["confirmCreate"],
  });

type CharacterFormValues = z.infer<typeof characterSchema>;

export default function CharacterCreation() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [currentTab, setCurrentTab] = useState("basic");

  // Initialize form with default values
  const form = useForm<CharacterFormValues>({
    resolver: zodResolver(characterSchema),
    defaultValues: {
      userId: user?.id || 0,
      name: "",
      race: "Human",
      class: "Fighter",
      level: 1,
      background: "Soldier",
      appearance: "",
      backstory: "",
      stats: {
        strength: 10,
        dexterity: 10,
        constitution: 10,
        intelligence: 10,
        wisdom: 10,
        charisma: 10,
      },
      hp: 10,
      maxHp: 10,
      equipment: { weapons: [], armor: "None", items: [] },
      spells: [],
      abilities: [],
      confirmCreate: false,
    },
  });

  // Character creation mutation
  const createCharacterMutation = useMutation({
    mutationFn: async (characterData: CharacterFormValues) => {
      // Remove confirmCreate field before sending to API
      const { confirmCreate, ...character } = characterData;

      // Force userId to be the current user's ID
      character.userId = user?.id || 0;

      const res = await apiRequest("POST", "/api/characters", character);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Character Created",
        description: "Your character has been created successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/characters"] });
      navigate("/");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create character: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // AI character generation mutation
  const generateCharacterMutation = useMutation({
    mutationFn: async (options: { race?: string; class?: string }) => {
      const res = await apiRequest("POST", "/api/characters/generate", options);
      return await res.json();
    },
    onSuccess: (data) => {
      // Parse the AI-generated character data
      const stats = data.stats as CharacterStats;
      const equipment = data.equipment || { weapons: [], armor: "None", items: [] };
      const spells = data.spells || [];
      const abilities = data.abilities || [];

      // Update form with AI-generated data
      form.reset({
        ...form.getValues(),
        name: data.name,
        race: data.race,
        class: data.class,
        background: data.background,
        level: data.level || 1,
        appearance: data.appearance,
        backstory: data.backstory,
        stats,
        hp: data.hp,
        maxHp: data.maxHp,
        equipment,
        spells,
        abilities,
      });

      toast({
        title: "Character Generated",
        description: "An AI-generated character has been created!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to generate character: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = (values: CharacterFormValues) => {
    createCharacterMutation.mutate(values);
  };

  // Generate random ability score (3d6)
  const rollAbilityScore = () => {
    return Math.floor(Math.random() * 6) + 1 + 
           Math.floor(Math.random() * 6) + 1 + 
           Math.floor(Math.random() * 6) + 1;
  };

  // Roll random ability scores
  const rollAbilityScores = () => {
    const newStats = {
      strength: rollAbilityScore(),
      dexterity: rollAbilityScore(),
      constitution: rollAbilityScore(),
      intelligence: rollAbilityScore(),
      wisdom: rollAbilityScore(),
      charisma: rollAbilityScore(),
    };
    
    // Update form with new stats
    form.setValue("stats", newStats);
    
    // Calculate and update HP based on constitution
    updateHP(newStats.constitution);
  };

  // Update HP based on class and constitution
  const updateHP = (constitution: number) => {
    const characterClass = form.getValues("class");
    let hitDie = 8; // default

    // Set hit die based on class
    switch (characterClass) {
      case "Barbarian":
        hitDie = 12;
        break;
      case "Fighter":
      case "Paladin":
      case "Ranger":
        hitDie = 10;
        break;
      case "Sorcerer":
      case "Wizard":
        hitDie = 6;
        break;
      default:
        hitDie = 8;
    }

    // Calculate constitution modifier
    const conModifier = Math.floor((constitution - 10) / 2);
    const hp = hitDie + conModifier;
    
    form.setValue("hp", Math.max(1, hp)); // Minimum 1 HP
    form.setValue("maxHp", Math.max(1, hp));
  };

  // Generate character using AI
  const generateCharacter = () => {
    const race = form.getValues("race");
    const characterClass = form.getValues("class");
    
    generateCharacterMutation.mutate({ 
      race: race !== "Random" ? race : undefined,
      class: characterClass !== "Random" ? characterClass : undefined 
    });
  };

  // Navigate between tabs
  const nextTab = () => {
    if (currentTab === "basic") setCurrentTab("abilities");
    else if (currentTab === "abilities") setCurrentTab("background");
    else if (currentTab === "background") setCurrentTab("review");
  };

  const prevTab = () => {
    if (currentTab === "review") setCurrentTab("background");
    else if (currentTab === "background") setCurrentTab("abilities");
    else if (currentTab === "abilities") setCurrentTab("basic");
  };

  // Calculate ability modifier
  const getAbilityModifier = (score: number) => {
    return Math.floor((score - 10) / 2);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <header className="mb-8 text-center">
            <h1 className="text-4xl font-medieval text-primary mb-2">Create Your Character</h1>
            <p className="text-muted-foreground">Forge your hero's identity and embark on epic adventures</p>
          </header>

          <Card className="medieval-border bg-parchment">
            <CardHeader>
              <CardTitle className="text-2xl font-medieval text-secondary">Character Creation</CardTitle>
              <CardDescription>
                Fill out the details below or use our AI to generate a complete character
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <Tabs defaultValue="basic" value={currentTab} onValueChange={setCurrentTab}>
                    <TabsList className="grid grid-cols-4 w-full bg-accent/20">
                      <TabsTrigger value="basic">
                        <UserCircle className="mr-2 h-4 w-4" />
                        Basics
                      </TabsTrigger>
                      <TabsTrigger value="abilities">
                        <Dice5 className="mr-2 h-4 w-4" />
                        Abilities
                      </TabsTrigger>
                      <TabsTrigger value="background">
                        <ScrollText className="mr-2 h-4 w-4" />
                        Background
                      </TabsTrigger>
                      <TabsTrigger value="review">
                        Review
                      </TabsTrigger>
                    </TabsList>

                    {/* Basic Info Tab */}
                    <TabsContent value="basic" className="space-y-4 pt-4">
                      <div className="grid grid-cols-1 gap-4">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Character Name</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  className="bg-parchment border-accent"
                                  placeholder="Enter your character's name"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name="race"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Race</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger className="bg-parchment border-accent">
                                    <SelectValue placeholder="Select a race" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent className="bg-parchment">
                                  {races.map((race) => (
                                    <SelectItem key={race} value={race}>
                                      {race}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="class"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Class</FormLabel>
                              <Select
                                onValueChange={(value) => {
                                  field.onChange(value);
                                  // Update HP when class changes
                                  const constitution = form.getValues("stats.constitution");
                                  updateHP(constitution);
                                }}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger className="bg-parchment border-accent">
                                    <SelectValue placeholder="Select a class" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent className="bg-parchment">
                                  {classes.map((cls) => (
                                    <SelectItem key={cls} value={cls}>
                                      {cls}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="level"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Level</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="number"
                                  min={1}
                                  max={20}
                                  className="bg-parchment border-accent"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="background"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Background</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger className="bg-parchment border-accent">
                                  <SelectValue placeholder="Select a background" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="bg-parchment">
                                {backgrounds.map((background) => (
                                  <SelectItem key={background} value={background}>
                                    {background}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="hp"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Hit Points</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="number"
                                  min={1}
                                  className="bg-parchment border-accent"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="maxHp"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Maximum Hit Points</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="number"
                                  min={1}
                                  className="bg-parchment border-accent"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="flex justify-end pt-2">
                        <Button type="button" onClick={nextTab}>
                          Next: Abilities
                        </Button>
                      </div>
                    </TabsContent>

                    {/* Abilities Tab */}
                    <TabsContent value="abilities" className="space-y-4 pt-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-medieval">Ability Scores</h3>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={rollAbilityScores}
                          className="bg-accent/20 border-accent"
                        >
                          <Dice5 className="mr-2 h-4 w-4" />
                          Roll Scores
                        </Button>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name="stats.strength"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                Strength{" "}
                                <span className="text-muted-foreground">
                                  (Mod: {getAbilityModifier(field.value)})
                                </span>
                              </FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="number"
                                  min={3}
                                  max={20}
                                  className="bg-parchment border-accent"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="stats.dexterity"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                Dexterity{" "}
                                <span className="text-muted-foreground">
                                  (Mod: {getAbilityModifier(field.value)})
                                </span>
                              </FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="number"
                                  min={3}
                                  max={20}
                                  className="bg-parchment border-accent"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="stats.constitution"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                Constitution{" "}
                                <span className="text-muted-foreground">
                                  (Mod: {getAbilityModifier(field.value)})
                                </span>
                              </FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="number"
                                  min={3}
                                  max={20}
                                  className="bg-parchment border-accent"
                                  onChange={(e) => {
                                    field.onChange(e);
                                    updateHP(parseInt(e.target.value));
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="stats.intelligence"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                Intelligence{" "}
                                <span className="text-muted-foreground">
                                  (Mod: {getAbilityModifier(field.value)})
                                </span>
                              </FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="number"
                                  min={3}
                                  max={20}
                                  className="bg-parchment border-accent"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="stats.wisdom"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                Wisdom{" "}
                                <span className="text-muted-foreground">
                                  (Mod: {getAbilityModifier(field.value)})
                                </span>
                              </FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="number"
                                  min={3}
                                  max={20}
                                  className="bg-parchment border-accent"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="stats.charisma"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                Charisma{" "}
                                <span className="text-muted-foreground">
                                  (Mod: {getAbilityModifier(field.value)})
                                </span>
                              </FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="number"
                                  min={3}
                                  max={20}
                                  className="bg-parchment border-accent"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="flex justify-between pt-2">
                        <Button type="button" variant="outline" onClick={prevTab}>
                          Previous: Basics
                        </Button>
                        <Button type="button" onClick={nextTab}>
                          Next: Background
                        </Button>
                      </div>
                    </TabsContent>

                    {/* Background Tab */}
                    <TabsContent value="background" className="space-y-4 pt-4">
                      <FormField
                        control={form.control}
                        name="appearance"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Appearance</FormLabel>
                            <FormControl>
                              <Textarea
                                {...field}
                                className="resize-none h-24 bg-parchment border-accent"
                                placeholder="Describe your character's physical appearance..."
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="backstory"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Backstory</FormLabel>
                            <FormControl>
                              <Textarea
                                {...field}
                                className="resize-none h-32 bg-parchment border-accent"
                                placeholder="Write your character's background story..."
                              />
                            </FormControl>
                            <FormDescription>
                              Provide details about your character's past, motivations, and connections.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex justify-between pt-2">
                        <Button type="button" variant="outline" onClick={prevTab}>
                          Previous: Abilities
                        </Button>
                        <Button type="button" onClick={nextTab}>
                          Review Character
                        </Button>
                      </div>
                    </TabsContent>

                    {/* Review Tab */}
                    <TabsContent value="review" className="space-y-4 pt-4">
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-xl font-medieval text-primary mb-3">Character Summary</h3>
                          <div className="bg-accent/10 p-4 rounded-lg">
                            <p className="text-lg font-bold">{form.getValues("name")}</p>
                            <p>
                              Level {form.getValues("level")} {form.getValues("race")}{" "}
                              {form.getValues("class")}
                            </p>
                            <p>Background: {form.getValues("background")}</p>
                            <p>
                              HP: {form.getValues("hp")}/{form.getValues("maxHp")}
                            </p>
                          </div>
                        </div>

                        <div>
                          <h3 className="text-lg font-medieval mb-2">Ability Scores</h3>
                          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                            {Object.entries(form.getValues("stats")).map(([key, value]) => (
                              <div key={key} className="text-center border rounded-lg p-2">
                                <div className="uppercase font-medieval">{key.substring(0, 3)}</div>
                                <div className="text-xl font-bold">{value}</div>
                                <div className="text-xs">
                                  {getAbilityModifier(value) >= 0 ? "+" : ""}
                                  {getAbilityModifier(value)}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <Separator />

                        <FormField
                          control={form.control}
                          name="confirmCreate"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                              <FormControl>
                                <input
                                  type="checkbox"
                                  checked={field.value}
                                  onChange={field.onChange}
                                  className="h-4 w-4 mt-1"
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel>Confirm Character Creation</FormLabel>
                                <FormDescription>
                                  I am satisfied with my character and ready to begin my adventure.
                                </FormDescription>
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="flex justify-between pt-2">
                        <Button type="button" variant="outline" onClick={prevTab}>
                          Previous: Background
                        </Button>
                        <Button
                          type="submit"
                          className="bg-primary text-white"
                          disabled={createCharacterMutation.isPending}
                        >
                          Create Character
                        </Button>
                      </div>
                    </TabsContent>
                  </Tabs>
                </form>
              </Form>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Separator />
              <div className="w-full flex justify-center">
                <Button
                  variant="outline"
                  className="bg-secondary text-white"
                  onClick={generateCharacter}
                  disabled={generateCharacterMutation.isPending}
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  {generateCharacterMutation.isPending
                    ? "Generating..."
                    : "Generate Random Character"}
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>
      </main>
    </div>
  );
}
