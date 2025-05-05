import { useState } from "react";
import Navbar from "@/components/navbar";
import { useAuth } from "@/hooks/use-auth";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  BookOpen, 
  Dice5, 
  User, 
  Shield, 
  Scroll,
  Map,
  Swords,
  FileText,
  Play,
  MessageSquare
} from "lucide-react";

export default function LearnPage() {
  const { user } = useAuth();
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    if (expandedSection === section) {
      setExpandedSection(null);
    } else {
      setExpandedSection(section);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <header className="mb-8 text-center">
            <h1 className="text-4xl font-medieval text-primary mb-2">Learn D&D</h1>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Welcome to the Dragon's Realm learning guide. Whether you're a complete beginner or looking to brush up on the rules,
              these resources will help you become a better player or Dungeon Master.
            </p>
          </header>

          <Tabs defaultValue="basics" className="space-y-6">
            <TabsList className="bg-accent/20 w-full flex justify-center">
              <TabsTrigger value="basics">
                <BookOpen className="mr-2 h-4 w-4" />
                D&D Basics
              </TabsTrigger>
              <TabsTrigger value="character">
                <User className="mr-2 h-4 w-4" />
                Characters
              </TabsTrigger>
              <TabsTrigger value="gameplay">
                <Dice5 className="mr-2 h-4 w-4" />
                Gameplay
              </TabsTrigger>
              <TabsTrigger value="dm">
                <Shield className="mr-2 h-4 w-4" />
                Dungeon Master
              </TabsTrigger>
            </TabsList>

            {/* D&D Basics Tab */}
            <TabsContent value="basics" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-parchment border-accent shadow-md">
                  <CardHeader>
                    <CardTitle className="flex items-center text-primary">
                      <BookOpen className="mr-2 h-5 w-5" />
                      What is D&D?
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p>
                      Dungeons & Dragons (D&D) is a tabletop roleplaying game where players create characters that embark on imaginary adventures in a fantasy world.
                    </p>
                    <p>
                      One player serves as the Dungeon Master (DM), who acts as the game's referee and storyteller, maintaining the setting and adjudicating the rules.
                      The rest of the players each create a character who navigates the DM's world and story.
                    </p>
                    <div className="bg-accent/10 p-4 rounded-md font-medieval text-center italic">
                      "D&D gives you the ability to be anyone, do anything, and go anywhere through the power of imagination."
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-parchment border-accent shadow-md">
                  <CardHeader>
                    <CardTitle className="flex items-center text-primary">
                      <Dice5 className="mr-2 h-5 w-5" />
                      The Core Mechanics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p>
                      The primary rule of D&D is simple: roll a 20-sided die (d20), add any relevant modifiers, and try to meet or exceed a target number (Difficulty Class or DC).
                    </p>
                    <ol className="list-decimal list-inside space-y-2">
                      <li>The DM describes the environment</li>
                      <li>The players describe what they want to do</li>
                      <li>The DM calls for ability checks, saving throws, or attack rolls when necessary</li>
                      <li>Dice are rolled to determine outcomes</li>
                      <li>The DM narrates the results and the cycle continues</li>
                    </ol>
                  </CardContent>
                </Card>

                <Card className="bg-parchment border-accent shadow-md md:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center text-primary">
                      <Scroll className="mr-2 h-5 w-5" />
                      The Three Pillars of Adventure
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <h3 className="font-medieval text-xl text-secondary">Exploration</h3>
                        <p>
                          Characters explore dungeons, wilderness, and cities, discovering locations, solving puzzles, 
                          and interacting with the environment.
                        </p>
                        <ul className="list-disc list-inside text-muted-foreground">
                          <li>Finding secret doors</li>
                          <li>Navigating dangerous terrain</li>
                          <li>Deciphering clues</li>
                          <li>Discovering treasure</li>
                        </ul>
                      </div>

                      <div className="space-y-2">
                        <h3 className="font-medieval text-xl text-secondary">Social Interaction</h3>
                        <p>
                          Characters interact with NPCs (Non-Player Characters) through dialogue, negotiation,
                          intimidation, and persuasion.
                        </p>
                        <ul className="list-disc list-inside text-muted-foreground">
                          <li>Gathering information</li>
                          <li>Making allies</li>
                          <li>Negotiating with enemies</li>
                          <li>Engaging in politics</li>
                        </ul>
                      </div>

                      <div className="space-y-2">
                        <h3 className="font-medieval text-xl text-secondary">Combat</h3>
                        <p>
                          Characters battle monsters and villains using weapons, spells, and abilities in a
                          turn-based tactical system.
                        </p>
                        <ul className="list-disc list-inside text-muted-foreground">
                          <li>Initiative and turn order</li>
                          <li>Attack rolls vs. Armor Class</li>
                          <li>Dealing and taking damage</li>
                          <li>Using spells and abilities</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Accordion type="single" collapsible>
                <AccordionItem value="key-terms">
                  <AccordionTrigger className="font-medieval text-lg text-secondary">
                    Key D&D Terms & Concepts
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
                      <div className="border p-3 rounded-md bg-accent/10">
                        <h4 className="font-bold">Ability Scores</h4>
                        <p>The six attributes that define a character's capabilities: Strength, Dexterity, Constitution, Intelligence, Wisdom, and Charisma.</p>
                      </div>
                      <div className="border p-3 rounded-md bg-accent/10">
                        <h4 className="font-bold">Armor Class (AC)</h4>
                        <p>A number representing how difficult a character is to hit in combat.</p>
                      </div>
                      <div className="border p-3 rounded-md bg-accent/10">
                        <h4 className="font-bold">Hit Points (HP)</h4>
                        <p>A measure of a character's health and ability to withstand damage.</p>
                      </div>
                      <div className="border p-3 rounded-md bg-accent/10">
                        <h4 className="font-bold">Proficiency Bonus</h4>
                        <p>A bonus added to rolls when using skills, tools, weapons, or abilities a character is proficient with.</p>
                      </div>
                      <div className="border p-3 rounded-md bg-accent/10">
                        <h4 className="font-bold">Advantage/Disadvantage</h4>
                        <p>Rolling two d20s and taking the higher (advantage) or lower (disadvantage) result.</p>
                      </div>
                      <div className="border p-3 rounded-md bg-accent/10">
                        <h4 className="font-bold">Saving Throws</h4>
                        <p>Rolls made to resist or mitigate harmful effects like spells, traps, or poisons.</p>
                      </div>
                      <div className="border p-3 rounded-md bg-accent/10">
                        <h4 className="font-bold">Experience Points (XP)</h4>
                        <p>Points earned through adventures that allow characters to level up and become more powerful.</p>
                      </div>
                      <div className="border p-3 rounded-md bg-accent/10">
                        <h4 className="font-bold">Initiative</h4>
                        <p>A roll determining the order in which creatures act during combat.</p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </TabsContent>

            {/* Character Tab */}
            <TabsContent value="character" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-parchment border-accent shadow-md">
                  <CardHeader>
                    <CardTitle className="flex items-center text-primary">
                      <User className="mr-2 h-5 w-5" />
                      Character Creation
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p>
                      Creating a character is the entry point to the world of D&D. Each character is a unique combination of race, class, background, and personality.
                    </p>
                    <ol className="list-decimal list-inside space-y-2">
                      <li>Choose a race (e.g., Human, Elf, Dwarf)</li>
                      <li>Select a class (e.g., Fighter, Wizard, Rogue)</li>
                      <li>Determine ability scores</li>
                      <li>Pick a background</li>
                      <li>Select equipment</li>
                      <li>Develop personality traits, ideals, bonds, and flaws</li>
                    </ol>
                  </CardContent>
                </Card>

                <Card className="bg-parchment border-accent shadow-md">
                  <CardHeader>
                    <CardTitle className="flex items-center text-primary">
                      <Shield className="mr-2 h-5 w-5" />
                      Classes & Races
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="classes">
                      <TabsList className="w-full">
                        <TabsTrigger value="classes">Classes</TabsTrigger>
                        <TabsTrigger value="races">Races</TabsTrigger>
                      </TabsList>
                      <TabsContent value="classes" className="pt-4">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="border p-2 rounded-md">
                            <h4 className="font-bold">Fighter</h4>
                            <p className="text-sm">Masters of combat and weapons</p>
                          </div>
                          <div className="border p-2 rounded-md">
                            <h4 className="font-bold">Wizard</h4>
                            <p className="text-sm">Scholarly magic-users</p>
                          </div>
                          <div className="border p-2 rounded-md">
                            <h4 className="font-bold">Rogue</h4>
                            <p className="text-sm">Stealthy and skillful experts</p>
                          </div>
                          <div className="border p-2 rounded-md">
                            <h4 className="font-bold">Cleric</h4>
                            <p className="text-sm">Divine spellcasters of faith</p>
                          </div>
                          <div className="border p-2 rounded-md">
                            <h4 className="font-bold">Bard</h4>
                            <p className="text-sm">Magical performers</p>
                          </div>
                          <div className="border p-2 rounded-md">
                            <h4 className="font-bold">Barbarian</h4>
                            <p className="text-sm">Rage-fueled warriors</p>
                          </div>
                          <div className="border p-2 rounded-md">
                            <h4 className="font-bold">Druid</h4>
                            <p className="text-sm">Nature's guardians</p>
                          </div>
                          <div className="border p-2 rounded-md">
                            <h4 className="font-bold">Monk</h4>
                            <p className="text-sm">Martial arts masters</p>
                          </div>
                        </div>
                      </TabsContent>
                      <TabsContent value="races" className="pt-4">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="border p-2 rounded-md">
                            <h4 className="font-bold">Human</h4>
                            <p className="text-sm">Versatile and adaptable</p>
                          </div>
                          <div className="border p-2 rounded-md">
                            <h4 className="font-bold">Elf</h4>
                            <p className="text-sm">Graceful and long-lived</p>
                          </div>
                          <div className="border p-2 rounded-md">
                            <h4 className="font-bold">Dwarf</h4>
                            <p className="text-sm">Hardy and traditional</p>
                          </div>
                          <div className="border p-2 rounded-md">
                            <h4 className="font-bold">Halfling</h4>
                            <p className="text-sm">Small but brave</p>
                          </div>
                          <div className="border p-2 rounded-md">
                            <h4 className="font-bold">Half-Elf</h4>
                            <p className="text-sm">Combining elven and human traits</p>
                          </div>
                          <div className="border p-2 rounded-md">
                            <h4 className="font-bold">Half-Orc</h4>
                            <p className="text-sm">Strong and enduring</p>
                          </div>
                          <div className="border p-2 rounded-md">
                            <h4 className="font-bold">Dragonborn</h4>
                            <p className="text-sm">Dragon-like humanoids</p>
                          </div>
                          <div className="border p-2 rounded-md">
                            <h4 className="font-bold">Gnome</h4>
                            <p className="text-sm">Inquisitive and energetic</p>
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>

                <Card className="bg-parchment border-accent shadow-md md:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center text-primary">
                      <FileText className="mr-2 h-5 w-5" />
                      Character Sheet Explained
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <h3 className="font-medieval text-xl text-secondary">Ability Scores & Modifiers</h3>
                        <p>
                          Ability scores range from 3-18 (or higher with magic), with 10-11 being average. Modifiers are calculated as: <code>(score - 10) / 2</code>, rounded down.
                        </p>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="border p-2 rounded-md">
                            <span className="font-bold">Strength:</span> Physical power and carrying capacity
                          </div>
                          <div className="border p-2 rounded-md">
                            <span className="font-bold">Dexterity:</span> Agility, reflexes, and balance
                          </div>
                          <div className="border p-2 rounded-md">
                            <span className="font-bold">Constitution:</span> Endurance, stamina, and health
                          </div>
                          <div className="border p-2 rounded-md">
                            <span className="font-bold">Intelligence:</span> Memory, reasoning, and learning
                          </div>
                          <div className="border p-2 rounded-md">
                            <span className="font-bold">Wisdom:</span> Perception, intuition, and insight
                          </div>
                          <div className="border p-2 rounded-md">
                            <span className="font-bold">Charisma:</span> Force of personality and leadership
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <h3 className="font-medieval text-xl text-secondary">Skills & Proficiencies</h3>
                        <p>
                          Characters are proficient in certain skills based on their class, background, and other choices. 
                          Add your proficiency bonus to skill checks you're proficient in.
                        </p>
                        <div className="text-sm space-y-2">
                          <div className="border p-2 rounded-md">
                            <span className="font-bold">Skill Checks:</span> Roll d20 + ability modifier + proficiency bonus (if proficient)
                          </div>
                          <div className="border p-2 rounded-md">
                            <span className="font-bold">Saving Throws:</span> Similar to skill checks but for resisting effects
                          </div>
                          <div className="border p-2 rounded-md">
                            <span className="font-bold">Attack Rolls:</span> Roll d20 + ability modifier + proficiency bonus vs. target's AC
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Gameplay Tab */}
            <TabsContent value="gameplay" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-parchment border-accent shadow-md">
                  <CardHeader>
                    <CardTitle className="flex items-center text-primary">
                      <Dice5 className="mr-2 h-5 w-5" />
                      Rolling the Dice
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p>
                      D&D uses different types of dice, each with a different number of sides. 
                      These are abbreviated as d4, d6, d8, d10, d12, and d20.
                    </p>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="border p-2 rounded-md">
                        <div className="font-bold">d20</div>
                        <div className="text-sm">Ability checks, attack rolls, saving throws</div>
                      </div>
                      <div className="border p-2 rounded-md">
                        <div className="font-bold">d12</div>
                        <div className="text-sm">Barbarian hit points, greataxe damage</div>
                      </div>
                      <div className="border p-2 rounded-md">
                        <div className="font-bold">d10</div>
                        <div className="text-sm">Fighter hit points, longsword damage</div>
                      </div>
                      <div className="border p-2 rounded-md">
                        <div className="font-bold">d8</div>
                        <div className="text-sm">Rogue hit points, rapier damage</div>
                      </div>
                      <div className="border p-2 rounded-md">
                        <div className="font-bold">d6</div>
                        <div className="text-sm">Wizard hit points, short sword damage</div>
                      </div>
                      <div className="border p-2 rounded-md">
                        <div className="font-bold">d4</div>
                        <div className="text-sm">Dagger damage, some spell effects</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-parchment border-accent shadow-md">
                  <CardHeader>
                    <CardTitle className="flex items-center text-primary">
                      <Swords className="mr-2 h-5 w-5" />
                      Combat Basics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p>
                      Combat is turn-based and organized into rounds, with each participant getting one turn per round. A round represents about 6 seconds in game time.
                    </p>
                    <ol className="list-decimal list-inside space-y-2">
                      <li><span className="font-bold">Roll Initiative:</span> d20 + Dexterity modifier</li>
                      <li><span className="font-bold">Take Turns:</span> In initiative order</li>
                      <li><span className="font-bold">On Your Turn:</span> Move and take one action</li>
                      <li><span className="font-bold">Actions:</span> Attack, Cast a Spell, Dash, Disengage, Dodge, Help, Hide, etc.</li>
                      <li><span className="font-bold">Bonus Actions:</span> Some abilities and spells use a bonus action</li>
                      <li><span className="font-bold">Reactions:</span> Opportunity attacks and certain abilities</li>
                    </ol>
                  </CardContent>
                </Card>

                <Card className="bg-parchment border-accent shadow-md">
                  <CardHeader>
                    <CardTitle className="flex items-center text-primary">
                      <Map className="mr-2 h-5 w-5" />
                      Exploration
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p>
                      Exploration involves traveling, investigating environments, and interacting with the world.
                    </p>
                    <div className="space-y-2">
                      <div className="border p-2 rounded-md">
                        <h4 className="font-bold">Travel</h4>
                        <p className="text-sm">Characters can travel at normal, fast, or slow pace, with different advantages and disadvantages for each.</p>
                      </div>
                      <div className="border p-2 rounded-md">
                        <h4 className="font-bold">Investigation</h4>
                        <p className="text-sm">Searching for clues, hidden objects, or secret doors. Typically uses Intelligence (Investigation) checks.</p>
                      </div>
                      <div className="border p-2 rounded-md">
                        <h4 className="font-bold">Perception</h4>
                        <p className="text-sm">Noticing things with your senses. Uses Wisdom (Perception) checks.</p>
                      </div>
                      <div className="border p-2 rounded-md">
                        <h4 className="font-bold">Resting</h4>
                        <p className="text-sm">Short rests (1 hour) allow spending Hit Dice to recover HP. Long rests (8 hours) restore all HP and some resources.</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-parchment border-accent shadow-md">
                  <CardHeader>
                    <CardTitle className="flex items-center text-primary">
                      <MessageSquare className="mr-2 h-5 w-5" />
                      Social Interaction
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p>
                      Characters interact with NPCs through roleplay, which may involve ability checks.
                    </p>
                    <div className="space-y-2">
                      <div className="border p-2 rounded-md">
                        <h4 className="font-bold">Persuasion</h4>
                        <p className="text-sm">Convincing someone to agree with you. Uses Charisma (Persuasion) checks.</p>
                      </div>
                      <div className="border p-2 rounded-md">
                        <h4 className="font-bold">Deception</h4>
                        <p className="text-sm">Lying or hiding the truth. Uses Charisma (Deception) checks.</p>
                      </div>
                      <div className="border p-2 rounded-md">
                        <h4 className="font-bold">Intimidation</h4>
                        <p className="text-sm">Influencing through threats. Uses Charisma (Intimidation) checks.</p>
                      </div>
                      <div className="border p-2 rounded-md">
                        <h4 className="font-bold">Insight</h4>
                        <p className="text-sm">Determining if someone is being truthful. Uses Wisdom (Insight) checks.</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Accordion type="single" collapsible>
                <AccordionItem value="common-rules">
                  <AccordionTrigger className="font-medieval text-lg text-secondary">
                    Common Rules Questions
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
                      <div className="border p-3 rounded-md bg-accent/10">
                        <h4 className="font-bold">How do critical hits work?</h4>
                        <p>When you roll a 20 on an attack roll, you score a critical hit. You roll all of the attack's damage dice twice and add them together.</p>
                      </div>
                      <div className="border p-3 rounded-md bg-accent/10">
                        <h4 className="font-bold">What is advantage/disadvantage?</h4>
                        <p>Roll two d20s and take the higher result (advantage) or the lower result (disadvantage). These don't stack—you either have advantage, disadvantage, or neither.</p>
                      </div>
                      <div className="border p-3 rounded-md bg-accent/10">
                        <h4 className="font-bold">How does death and dying work?</h4>
                        <p>At 0 HP, you're unconscious. Make death saving throws: 3 failures = death, 3 successes = stabilized. Any damage while at 0 HP = 1 failure.</p>
                      </div>
                      <div className="border p-3 rounded-md bg-accent/10">
                        <h4 className="font-bold">What actions can I take in combat?</h4>
                        <p>On your turn: one action (Attack, Cast a Spell, Dash, Disengage, Dodge, Help, Hide, Search), movement, and possibly a bonus action.</p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </TabsContent>

            {/* Dungeon Master Tab */}
            <TabsContent value="dm" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-parchment border-accent shadow-md">
                  <CardHeader>
                    <CardTitle className="flex items-center text-primary">
                      <Shield className="mr-2 h-5 w-5" />
                      Role of the Dungeon Master
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p>
                      The Dungeon Master (DM) creates and runs the world and the adventures. They're responsible for:
                    </p>
                    <ul className="list-disc list-inside space-y-2">
                      <li>Creating the world and storylines</li>
                      <li>Playing all non-player characters (NPCs)</li>
                      <li>Describing environments and situations</li>
                      <li>Adjudicating rules and determining outcomes</li>
                      <li>Managing combat and other challenges</li>
                      <li>Awarding experience points and treasure</li>
                    </ul>
                    <div className="bg-accent/10 p-4 rounded-md font-medieval text-center italic">
                      "The DM is not the players' opponent—they're the players' guide to adventure."
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-parchment border-accent shadow-md">
                  <CardHeader>
                    <CardTitle className="flex items-center text-primary">
                      <Scroll className="mr-2 h-5 w-5" />
                      Creating Adventures
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p>
                      Good adventures include a mix of combat, exploration, social interaction, puzzles, and meaningful choices.
                    </p>
                    <div className="space-y-2">
                      <div className="border p-2 rounded-md">
                        <h4 className="font-bold">Adventure Structure</h4>
                        <p className="text-sm">A hook, multiple encounters, and a satisfying conclusion.</p>
                      </div>
                      <div className="border p-2 rounded-md">
                        <h4 className="font-bold">Balancing Encounters</h4>
                        <p className="text-sm">Challenge Rating (CR) helps gauge monster difficulty relative to party level.</p>
                      </div>
                      <div className="border p-2 rounded-md">
                        <h4 className="font-bold">Player Agency</h4>
                        <p className="text-sm">Allow players to make meaningful choices that affect the story.</p>
                      </div>
                      <div className="border p-2 rounded-md">
                        <h4 className="font-bold">Rewards</h4>
                        <p className="text-sm">Experience points, treasure, story revelations, and character development.</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-parchment border-accent shadow-md md:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center text-primary">
                      <Play className="mr-2 h-5 w-5" />
                      Running the Game
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <h3 className="font-medieval text-xl text-secondary">Preparation</h3>
                        <p>
                          Good preparation leads to smoother sessions, but don't over-prepare.
                        </p>
                        <ul className="list-disc list-inside text-muted-foreground">
                          <li>Create key NPCs</li>
                          <li>Plan important locations</li>
                          <li>Design encounters</li>
                          <li>Prepare for likely player actions</li>
                        </ul>
                      </div>

                      <div className="space-y-2">
                        <h3 className="font-medieval text-xl text-secondary">Improvisation</h3>
                        <p>
                          Players will always surprise you, so be ready to think on your feet.
                        </p>
                        <ul className="list-disc list-inside text-muted-foreground">
                          <li>Say "yes, and..." when possible</li>
                          <li>Have backup NPCs and encounters</li>
                          <li>Use random tables for inspiration</li>
                          <li>Take notes on improvised elements</li>
                        </ul>
                      </div>

                      <div className="space-y-2">
                        <h3 className="font-medieval text-xl text-secondary">Pacing</h3>
                        <p>
                          Good pacing keeps players engaged and the story moving forward.
                        </p>
                        <ul className="list-disc list-inside text-muted-foreground">
                          <li>Alternate between action and roleplay</li>
                          <li>Allow downtime and rest</li>
                          <li>Know when to hand-wave details</li>
                          <li>Create moments for each character to shine</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Accordion type="single" collapsible>
                <AccordionItem value="dm-tips">
                  <AccordionTrigger className="font-medieval text-lg text-secondary">
                    DM Tips & Tricks
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
                      <div className="border p-3 rounded-md bg-accent/10">
                        <h4 className="font-bold">The Rule of Cool</h4>
                        <p>If a player wants to do something awesome but not strictly within the rules, consider allowing it if it makes the game more fun.</p>
                      </div>
                      <div className="border p-3 rounded-md bg-accent/10">
                        <h4 className="font-bold">Session Zero</h4>
                        <p>Hold a session before the campaign starts to establish expectations, boundaries, and character connections.</p>
                      </div>
                      <div className="border p-3 rounded-md bg-accent/10">
                        <h4 className="font-bold">Fail Forward</h4>
                        <p>Failed checks shouldn't halt progress—they should introduce complications or alternative paths forward.</p>
                      </div>
                      <div className="border p-3 rounded-md bg-accent/10">
                        <h4 className="font-bold">Delegate</h4>
                        <p>Let players track initiative, handle rules lookups, or manage NPC allies to reduce your workload.</p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </TabsContent>
          </Tabs>

          <div className="mt-10 text-center">
            <h3 className="text-2xl font-medieval text-primary mb-2">Ready to Apply What You've Learned?</h3>
            <p className="text-lg mb-6">Put your knowledge to use in an actual adventure!</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" className="bg-primary text-white">
                <Play className="mr-2 h-5 w-5" />
                Create a Campaign
              </Button>
              <Button size="lg" className="bg-secondary text-white">
                <User className="mr-2 h-5 w-5" />
                Create a Character
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}