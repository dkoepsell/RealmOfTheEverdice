import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BookOpen, 
  HelpCircle, 
  Info, 
  ScrollText, 
  Lightbulb, 
  AlertCircle, 
  MessageSquare, 
  MapPin 
} from "lucide-react";

interface DMGuidePanelProps {
  onClose: () => void;
  currentContext?: string; // e.g., "combat", "social", "exploration"
}

export const DMGuidePanel = ({ onClose, currentContext = "general" }: DMGuidePanelProps) => {
  const [selectedTab, setSelectedTab] = useState(currentContext);

  // Change tab based on context
  useState(() => {
    if (currentContext && currentContext !== "general") {
      setSelectedTab(currentContext);
    }
  });

  return (
    <Card className="bg-parchment border-accent w-full max-w-4xl mx-auto overflow-hidden">
      <CardHeader className="bg-accent/20 flex flex-row items-center justify-between">
        <CardTitle className="flex items-center">
          <BookOpen className="mr-2 h-5 w-5 text-primary" />
          <span className="font-medieval text-primary">Dungeon Master Guide</span>
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
          <span className="sr-only">Close</span>
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="grid grid-cols-5 bg-accent/10">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="combat">Combat</TabsTrigger>
            <TabsTrigger value="social">Social</TabsTrigger>
            <TabsTrigger value="exploration">Exploration</TabsTrigger>
            <TabsTrigger value="rules">Rules</TabsTrigger>
          </TabsList>

          {/* General Guidance Tab */}
          <TabsContent value="general" className="p-4 max-h-[70vh] overflow-y-auto">
            <div className="space-y-4">
              <div className="bg-accent/10 p-4 rounded-md">
                <h3 className="text-lg font-medieval text-primary flex items-center">
                  <Info className="mr-2 h-5 w-5" />
                  Teaching D&D While Playing
                </h3>
                <p className="mt-2">
                  As a Dungeon Master, you have the opportunity to teach the game while creating an enjoyable 
                  experience. Here are some tips to help new players learn the game through play:
                </p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Explain rules as they become relevant rather than all at once</li>
                  <li>Demonstrate concepts by narrating examples</li>
                  <li>Encourage players to describe what they want to do in plain language</li>
                  <li>Provide gentle reminders about character abilities</li>
                  <li>Use visual aids and reference sheets</li>
                </ul>
              </div>

              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="session-structure">
                  <AccordionTrigger className="font-medieval text-primary px-4 py-2 rounded-t-md bg-accent/10">
                    Session Structure
                  </AccordionTrigger>
                  <AccordionContent className="bg-accent/5 p-4 rounded-b-md">
                    <p className="mb-2">A well-structured session helps players learn the game flow:</p>
                    <ol className="list-decimal list-inside space-y-1">
                      <li><span className="font-bold">Recap:</span> Briefly summarize the previous session</li>
                      <li><span className="font-bold">Introduction:</span> Set the scene for the current session</li>
                      <li><span className="font-bold">Main Content:</span> Present challenges, encounters, and opportunities</li>
                      <li><span className="font-bold">Downtime:</span> Allow for character development and preparation</li>
                      <li><span className="font-bold">Cliffhanger or Resolution:</span> End with a hook for the next session</li>
                      <li><span className="font-bold">Feedback:</span> Ask what players enjoyed and what was confusing</li>
                    </ol>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="player-types">
                  <AccordionTrigger className="font-medieval text-primary px-4 py-2 rounded-t-md bg-accent/10">
                    Engaging Different Player Types
                  </AccordionTrigger>
                  <AccordionContent className="bg-accent/5 p-4 rounded-b-md">
                    <p className="mb-2">Different players enjoy different aspects of D&D. Try to include elements for each:</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div className="border p-2 rounded-md">
                        <h4 className="font-bold">Actors</h4>
                        <p className="text-sm">Enjoy roleplaying and character development. Give them NPC interactions and character moments.</p>
                      </div>
                      <div className="border p-2 rounded-md">
                        <h4 className="font-bold">Explorers</h4>
                        <p className="text-sm">Enjoy discovering the world. Include secrets, lore, and interesting locations.</p>
                      </div>
                      <div className="border p-2 rounded-md">
                        <h4 className="font-bold">Tacticians</h4>
                        <p className="text-sm">Enjoy combat and strategy. Create dynamic battles with interesting terrain and objectives.</p>
                      </div>
                      <div className="border p-2 rounded-md">
                        <h4 className="font-bold">Problem Solvers</h4>
                        <p className="text-sm">Enjoy puzzles and challenges. Include riddles, mysteries, and multiple solutions.</p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="learning-curve">
                  <AccordionTrigger className="font-medieval text-primary px-4 py-2 rounded-t-md bg-accent/10">
                    Managing the Learning Curve
                  </AccordionTrigger>
                  <AccordionContent className="bg-accent/5 p-4 rounded-b-md">
                    <p className="mb-2">D&D has many rules. Here's a suggested learning progression:</p>
                    <ol className="list-decimal list-inside space-y-1">
                      <li><span className="font-bold">Session 1:</span> Basic ability checks, combat actions, and roleplaying</li>
                      <li><span className="font-bold">Session 2:</span> Special abilities, spell casting, and exploration</li>
                      <li><span className="font-bold">Session 3:</span> Advanced combat tactics, conditions, and interaction skills</li>
                      <li><span className="font-bold">Session 4:</span> Resource management, downtime activities, and character advancement</li>
                      <li><span className="font-bold">Session 5+:</span> More complex rules as they become relevant</li>
                    </ol>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </TabsContent>

          {/* Combat Tab */}
          <TabsContent value="combat" className="p-4 max-h-[70vh] overflow-y-auto">
            <div className="space-y-4">
              <div className="bg-accent/10 p-4 rounded-md">
                <h3 className="text-lg font-medieval text-primary flex items-center">
                  <AlertCircle className="mr-2 h-5 w-5" />
                  Running Combat Effectively
                </h3>
                <p className="mt-2">
                  Combat is often the most rule-intensive part of D&D. Here's how to make it educational and exciting:
                </p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Use a visual initiative tracker that all players can see</li>
                  <li>Remind players of their options on their turn</li>
                  <li>Describe combat outcomes vividly to keep players engaged</li>
                  <li>Use terrain and environmental features to add tactical depth</li>
                  <li>Allow creative solutions and reward smart play</li>
                </ul>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-accent/50 rounded-md p-4 bg-secondary/5">
                  <h3 className="font-medieval text-secondary mb-2">Combat Sequence Reference</h3>
                  <ol className="list-decimal list-inside text-sm space-y-1">
                    <li><span className="font-bold">Roll initiative:</span> d20 + DEX modifier</li>
                    <li><span className="font-bold">Start of round:</span> Apply effects that occur at the start of a round</li>
                    <li><span className="font-bold">Turn sequence:</span> Each creature takes their turn in initiative order</li>
                    <ol className="list-decimal list-inside ml-5 space-y-1">
                      <li>Start of turn effects</li>
                      <li>Movement (split before/after action if desired)</li>
                      <li>Action (Attack, Cast a Spell, Dash, etc.)</li>
                      <li>Bonus action (if available)</li>
                      <li>Free interaction (draw weapon, open door, etc.)</li>
                      <li>End of turn effects</li>
                    </ol>
                    <li><span className="font-bold">End of round:</span> Apply effects that occur at the end of a round</li>
                  </ol>
                </div>

                <div className="border border-accent/50 rounded-md p-4 bg-primary/5">
                  <h3 className="font-medieval text-primary mb-2">Making Attack Rolls</h3>
                  <p className="text-sm mb-2">
                    When a character makes an attack, follow these steps:
                  </p>
                  <ol className="list-decimal list-inside text-sm space-y-1">
                    <li><span className="font-bold">Roll to hit:</span> d20 + modifiers vs. target's AC</li>
                    <li><span className="font-bold">Critical hits:</span> Natural 20 automatically hits and doubles damage dice</li>
                    <li><span className="font-bold">Critical failures:</span> Natural 1 automatically misses</li>
                    <li><span className="font-bold">Calculate damage:</span> Weapon/spell damage + ability modifier</li>
                    <li><span className="font-bold">Apply damage:</span> Subtract from target's hit points</li>
                    <li><span className="font-bold">Check conditions:</span> Apply any effects from the attack</li>
                  </ol>
                </div>
              </div>

              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="actions">
                  <AccordionTrigger className="font-medieval text-primary px-4 py-2 rounded-t-md bg-accent/10">
                    Action Options
                  </AccordionTrigger>
                  <AccordionContent className="bg-accent/5 p-4 rounded-b-md">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="border p-2 rounded-md">
                        <h4 className="font-bold">Attack</h4>
                        <p className="text-sm">Make a melee or ranged attack</p>
                      </div>
                      <div className="border p-2 rounded-md">
                        <h4 className="font-bold">Cast a Spell</h4>
                        <p className="text-sm">Cast a spell with a casting time of 1 action</p>
                      </div>
                      <div className="border p-2 rounded-md">
                        <h4 className="font-bold">Dash</h4>
                        <p className="text-sm">Double your movement speed for this turn</p>
                      </div>
                      <div className="border p-2 rounded-md">
                        <h4 className="font-bold">Disengage</h4>
                        <p className="text-sm">Your movement doesn't provoke opportunity attacks</p>
                      </div>
                      <div className="border p-2 rounded-md">
                        <h4 className="font-bold">Dodge</h4>
                        <p className="text-sm">Attacks against you have disadvantage</p>
                      </div>
                      <div className="border p-2 rounded-md">
                        <h4 className="font-bold">Help</h4>
                        <p className="text-sm">Give advantage to an ally's ability check or attack</p>
                      </div>
                      <div className="border p-2 rounded-md">
                        <h4 className="font-bold">Hide</h4>
                        <p className="text-sm">Make a Dexterity (Stealth) check to hide</p>
                      </div>
                      <div className="border p-2 rounded-md">
                        <h4 className="font-bold">Ready</h4>
                        <p className="text-sm">Prepare an action to trigger on a specific circumstance</p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="conditions">
                  <AccordionTrigger className="font-medieval text-primary px-4 py-2 rounded-t-md bg-accent/10">
                    Common Conditions
                  </AccordionTrigger>
                  <AccordionContent className="bg-accent/5 p-4 rounded-b-md">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="border p-2 rounded-md">
                        <h4 className="font-bold">Blinded</h4>
                        <p className="text-sm">Can't see; attack rolls have disadvantage, attacks against have advantage</p>
                      </div>
                      <div className="border p-2 rounded-md">
                        <h4 className="font-bold">Charmed</h4>
                        <p className="text-sm">Can't attack charmer; charmer has advantage on social checks</p>
                      </div>
                      <div className="border p-2 rounded-md">
                        <h4 className="font-bold">Frightened</h4>
                        <p className="text-sm">Disadvantage on ability checks/attacks while source of fear is visible</p>
                      </div>
                      <div className="border p-2 rounded-md">
                        <h4 className="font-bold">Paralyzed</h4>
                        <p className="text-sm">Incapacitated and can't move; auto-fail DEX/STR saves; critical hits when hit</p>
                      </div>
                      <div className="border p-2 rounded-md">
                        <h4 className="font-bold">Poisoned</h4>
                        <p className="text-sm">Disadvantage on attack rolls and ability checks</p>
                      </div>
                      <div className="border p-2 rounded-md">
                        <h4 className="font-bold">Stunned</h4>
                        <p className="text-sm">Incapacitated; auto-fail STR/DEX saves; advantage on attacks against</p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </TabsContent>

          {/* Social Tab */}
          <TabsContent value="social" className="p-4 max-h-[70vh] overflow-y-auto">
            <div className="space-y-4">
              <div className="bg-accent/10 p-4 rounded-md">
                <h3 className="text-lg font-medieval text-primary flex items-center">
                  <MessageSquare className="mr-2 h-5 w-5" />
                  Social Interaction
                </h3>
                <p className="mt-2">
                  Social encounters are opportunities for roleplaying and character development. Here's how to make them educational:
                </p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Encourage players to speak in character when possible</li>
                  <li>Use different voices and mannerisms for NPCs</li>
                  <li>Call for ability checks when the outcome is uncertain</li>
                  <li>Remind players of their character's personality traits</li>
                  <li>Create NPCs with clear motivations and goals</li>
                </ul>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-accent/50 rounded-md p-4 bg-secondary/5">
                  <h3 className="font-medieval text-secondary mb-2">Social Skill Checks</h3>
                  <div className="space-y-2">
                    <div className="border p-2 rounded-md">
                      <h4 className="font-bold">Persuasion (CHA)</h4>
                      <p className="text-sm">Convincing someone through logic, etiquette, or good faith</p>
                    </div>
                    <div className="border p-2 rounded-md">
                      <h4 className="font-bold">Intimidation (CHA)</h4>
                      <p className="text-sm">Influencing through threats, hostile actions, or physical force</p>
                    </div>
                    <div className="border p-2 rounded-md">
                      <h4 className="font-bold">Deception (CHA)</h4>
                      <p className="text-sm">Hiding the truth, telling a convincing lie, or bluffing</p>
                    </div>
                    <div className="border p-2 rounded-md">
                      <h4 className="font-bold">Insight (WIS)</h4>
                      <p className="text-sm">Determining intentions, detecting lies, and reading body language</p>
                    </div>
                  </div>
                </div>

                <div className="border border-accent/50 rounded-md p-4 bg-primary/5">
                  <h3 className="font-medieval text-primary mb-2">NPC Interaction Tips</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-bold">NPC Attitudes:</span> Consider where each NPC falls on the scale: hostile, indifferent, or friendly.</p>
                    <p><span className="font-bold">Conversation Goals:</span> NPCs have their own goals, which may align with or oppose the party's.</p>
                    <p><span className="font-bold">Information:</span> Decide what information an NPC knows and what they're willing to share.</p>
                    <p><span className="font-bold">Roleplaying:</span> Give each NPC a distinctive trait, like a speech pattern or physical quirk.</p>
                    <p><span className="font-bold">Reactions:</span> Consider how NPCs react to the party's appearance, reputation, and actions.</p>
                  </div>
                </div>
              </div>

              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="roleplaying">
                  <AccordionTrigger className="font-medieval text-primary px-4 py-2 rounded-t-md bg-accent/10">
                    Roleplaying Techniques
                  </AccordionTrigger>
                  <AccordionContent className="bg-accent/5 p-4 rounded-b-md">
                    <p className="mb-2">Help your players develop their roleplay skills with these techniques:</p>
                    <div className="space-y-2">
                      <div className="border p-2 rounded-md">
                        <h4 className="font-bold">First Person vs. Third Person</h4>
                        <p className="text-sm">Encourage but don't require first-person speech. Let players choose what's comfortable.</p>
                      </div>
                      <div className="border p-2 rounded-md">
                        <h4 className="font-bold">Yes, And...</h4>
                        <p className="text-sm">Build on player ideas and suggestions to create collaborative storytelling.</p>
                      </div>
                      <div className="border p-2 rounded-md">
                        <h4 className="font-bold">Character Voice</h4>
                        <p className="text-sm">Help players develop their character's voice based on personality, not just accent.</p>
                      </div>
                      <div className="border p-2 rounded-md">
                        <h4 className="font-bold">Consistency</h4>
                        <p className="text-sm">Encourage consistent behavior based on character traits, ideals, bonds, and flaws.</p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="social-encounters">
                  <AccordionTrigger className="font-medieval text-primary px-4 py-2 rounded-t-md bg-accent/10">
                    Social Encounter Types
                  </AccordionTrigger>
                  <AccordionContent className="bg-accent/5 p-4 rounded-b-md">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="border p-2 rounded-md">
                        <h4 className="font-bold">Negotiation</h4>
                        <p className="text-sm">Characters bargain for goods, services, or cooperation</p>
                      </div>
                      <div className="border p-2 rounded-md">
                        <h4 className="font-bold">Interrogation</h4>
                        <p className="text-sm">Characters attempt to extract information</p>
                      </div>
                      <div className="border p-2 rounded-md">
                        <h4 className="font-bold">Performance</h4>
                        <p className="text-sm">Characters entertain or impress an audience</p>
                      </div>
                      <div className="border p-2 rounded-md">
                        <h4 className="font-bold">Intrigue</h4>
                        <p className="text-sm">Characters navigate political or social maneuvering</p>
                      </div>
                      <div className="border p-2 rounded-md">
                        <h4 className="font-bold">Deception</h4>
                        <p className="text-sm">Characters attempt to mislead or hide information</p>
                      </div>
                      <div className="border p-2 rounded-md">
                        <h4 className="font-bold">Recruitment</h4>
                        <p className="text-sm">Characters try to gain followers or allies</p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </TabsContent>

          {/* Exploration Tab */}
          <TabsContent value="exploration" className="p-4 max-h-[70vh] overflow-y-auto">
            <div className="space-y-4">
              <div className="bg-accent/10 p-4 rounded-md">
                <h3 className="text-lg font-medieval text-primary flex items-center">
                  <MapPin className="mr-2 h-5 w-5" />
                  Exploration & Adventure
                </h3>
                <p className="mt-2">
                  Exploration covers travel, discovery, and interaction with the environment. Make it engaging by:
                </p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Describing environments with sensory details</li>
                  <li>Creating interesting landmarks and features</li>
                  <li>Including meaningful choices about routes and methods</li>
                  <li>Adding discoveries and rewards for thorough exploration</li>
                  <li>Using skill checks to overcome environmental challenges</li>
                </ul>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-accent/50 rounded-md p-4 bg-secondary/5">
                  <h3 className="font-medieval text-secondary mb-2">Travel & Environment</h3>
                  <div className="space-y-2">
                    <div className="border p-2 rounded-md">
                      <h4 className="font-bold">Travel Pace</h4>
                      <p className="text-sm">Fast (30 mi/day), Normal (24 mi/day), or Slow (18 mi/day) with different benefits and drawbacks</p>
                    </div>
                    <div className="border p-2 rounded-md">
                      <h4 className="font-bold">Activities While Traveling</h4>
                      <p className="text-sm">Navigate, draw maps, track, forage, or keep watch</p>
                    </div>
                    <div className="border p-2 rounded-md">
                      <h4 className="font-bold">Environmental Hazards</h4>
                      <p className="text-sm">Extreme weather, difficult terrain, hazardous substances, falling</p>
                    </div>
                    <div className="border p-2 rounded-md">
                      <h4 className="font-bold">Random Encounters</h4>
                      <p className="text-sm">Not just combat—consider social encounters, discoveries, or environmental events</p>
                    </div>
                  </div>
                </div>

                <div className="border border-accent/50 rounded-md p-4 bg-primary/5">
                  <h3 className="font-medieval text-primary mb-2">Exploration Skill Checks</h3>
                  <div className="space-y-2 text-sm">
                    <div className="border p-2 rounded-md">
                      <h4 className="font-bold">Perception (WIS)</h4>
                      <p className="text-sm">Spot, hear, or detect something; maintain awareness of threats</p>
                    </div>
                    <div className="border p-2 rounded-md">
                      <h4 className="font-bold">Investigation (INT)</h4>
                      <p className="text-sm">Search for clues, deduce from evidence, or find hidden details</p>
                    </div>
                    <div className="border p-2 rounded-md">
                      <h4 className="font-bold">Survival (WIS)</h4>
                      <p className="text-sm">Follow tracks, hunt wild game, navigate wilderness, predict weather</p>
                    </div>
                    <div className="border p-2 rounded-md">
                      <h4 className="font-bold">Nature (INT)</h4>
                      <p className="text-sm">Recall knowledge about terrain, plants, animals, and natural cycles</p>
                    </div>
                  </div>
                </div>
              </div>

              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="dungeon-design">
                  <AccordionTrigger className="font-medieval text-primary px-4 py-2 rounded-t-md bg-accent/10">
                    Location Types
                  </AccordionTrigger>
                  <AccordionContent className="bg-accent/5 p-4 rounded-b-md">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="border p-2 rounded-md">
                        <h4 className="font-bold">Dungeons</h4>
                        <p className="text-sm">Abandoned structures, caves, or ruins with multiple rooms and passages</p>
                      </div>
                      <div className="border p-2 rounded-md">
                        <h4 className="font-bold">Wilderness</h4>
                        <p className="text-sm">Forests, mountains, deserts, etc. with scattered points of interest</p>
                      </div>
                      <div className="border p-2 rounded-md">
                        <h4 className="font-bold">Urban</h4>
                        <p className="text-sm">Cities, towns, and villages with buildings, streets, and districts</p>
                      </div>
                      <div className="border p-2 rounded-md">
                        <h4 className="font-bold">Planar</h4>
                        <p className="text-sm">Other planes of existence with unique physics and characteristics</p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="exploration-activities">
                  <AccordionTrigger className="font-medieval text-primary px-4 py-2 rounded-t-md bg-accent/10">
                    Exploration Activities
                  </AccordionTrigger>
                  <AccordionContent className="bg-accent/5 p-4 rounded-b-md">
                    <div className="space-y-2">
                      <div className="border p-2 rounded-md">
                        <h4 className="font-bold">Searching</h4>
                        <p className="text-sm">Looking for hidden objects, secret doors, or clues. Uses Perception or Investigation.</p>
                      </div>
                      <div className="border p-2 rounded-md">
                        <h4 className="font-bold">Solving Puzzles</h4>
                        <p className="text-sm">Figuring out riddles, mechanisms, or other brain teasers. May use Intelligence checks.</p>
                      </div>
                      <div className="border p-2 rounded-md">
                        <h4 className="font-bold">Avoiding Traps</h4>
                        <p className="text-sm">Spotting and disarming traps. Uses Perception to spot, Investigation to understand, and tools to disarm.</p>
                      </div>
                      <div className="border p-2 rounded-md">
                        <h4 className="font-bold">Resource Management</h4>
                        <p className="text-sm">Managing food, water, light sources, and other supplies during exploration.</p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </TabsContent>

          {/* Rules Tab */}
          <TabsContent value="rules" className="p-4 max-h-[70vh] overflow-y-auto">
            <div className="space-y-4">
              <div className="bg-accent/10 p-4 rounded-md">
                <h3 className="text-lg font-medieval text-primary flex items-center">
                  <HelpCircle className="mr-2 h-5 w-5" />
                  Rules Reference
                </h3>
                <p className="mt-2">
                  Quick reference for common rules questions. Use these to help guide your game:
                </p>
              </div>

              <Accordion type="multiple" className="w-full">
                <AccordionItem value="ability-checks">
                  <AccordionTrigger className="font-medieval text-primary px-4 py-2 rounded-t-md bg-accent/10">
                    Ability Checks
                  </AccordionTrigger>
                  <AccordionContent className="bg-accent/5 p-4 rounded-b-md">
                    <p className="mb-2">When a character attempts something with an uncertain outcome:</p>
                    <ol className="list-decimal list-inside space-y-1 text-sm">
                      <li>DM calls for an ability check (STR, DEX, CON, INT, WIS, or CHA)</li>
                      <li>Player rolls d20 and adds their ability modifier</li>
                      <li>Add proficiency bonus if proficient in a relevant skill</li>
                      <li>Compare the total to the Difficulty Class (DC)</li>
                      <li>Success if total equals or exceeds the DC</li>
                    </ol>
                    <div className="mt-2 border p-2 rounded-md">
                      <h4 className="font-bold">Typical DCs:</h4>
                      <ul className="list-inside space-y-1 text-sm">
                        <li>Very Easy: DC 5</li>
                        <li>Easy: DC 10</li>
                        <li>Medium: DC 15</li>
                        <li>Hard: DC 20</li>
                        <li>Very Hard: DC 25</li>
                        <li>Nearly Impossible: DC 30</li>
                      </ul>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="saving-throws">
                  <AccordionTrigger className="font-medieval text-primary px-4 py-2 rounded-t-md bg-accent/10">
                    Saving Throws
                  </AccordionTrigger>
                  <AccordionContent className="bg-accent/5 p-4 rounded-b-md">
                    <p className="mb-2">When a character must resist an effect:</p>
                    <ol className="list-decimal list-inside space-y-1 text-sm">
                      <li>DM calls for a saving throw of a specific ability</li>
                      <li>Player rolls d20 and adds their ability modifier</li>
                      <li>Add proficiency bonus if proficient in that saving throw</li>
                      <li>Compare the total to the DC (often from spell or effect)</li>
                      <li>Success usually mitigates or avoids the effect</li>
                    </ol>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                      <div className="border p-2 rounded-md">
                        <h4 className="font-bold">Strength</h4>
                        <p>Resist forced movement or restraint</p>
                      </div>
                      <div className="border p-2 rounded-md">
                        <h4 className="font-bold">Dexterity</h4>
                        <p>Dodge area effects or traps</p>
                      </div>
                      <div className="border p-2 rounded-md">
                        <h4 className="font-bold">Constitution</h4>
                        <p>Resist poison, disease, or exhaustion</p>
                      </div>
                      <div className="border p-2 rounded-md">
                        <h4 className="font-bold">Intelligence</h4>
                        <p>Resist mental influence</p>
                      </div>
                      <div className="border p-2 rounded-md">
                        <h4 className="font-bold">Wisdom</h4>
                        <p>Resist charm, fear, or illusion</p>
                      </div>
                      <div className="border p-2 rounded-md">
                        <h4 className="font-bold">Charisma</h4>
                        <p>Resist possession or banishment</p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="advantage-disadvantage">
                  <AccordionTrigger className="font-medieval text-primary px-4 py-2 rounded-t-md bg-accent/10">
                    Advantage & Disadvantage
                  </AccordionTrigger>
                  <AccordionContent className="bg-accent/5 p-4 rounded-b-md">
                    <p className="mb-2">When circumstances are particularly favorable or unfavorable:</p>
                    <div className="space-y-2 text-sm">
                      <div className="border p-2 rounded-md">
                        <h4 className="font-bold">Advantage</h4>
                        <p>Roll two d20s and take the higher result</p>
                      </div>
                      <div className="border p-2 rounded-md">
                        <h4 className="font-bold">Disadvantage</h4>
                        <p>Roll two d20s and take the lower result</p>
                      </div>
                      <div className="border p-2 rounded-md">
                        <h4 className="font-bold">Cancellation</h4>
                        <p>Multiple sources of advantage and disadvantage cancel each other out, resulting in a normal roll</p>
                      </div>
                    </div>
                    <div className="mt-2 border p-2 rounded-md">
                      <h4 className="font-bold">Common sources of advantage:</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        <li>Attacking a prone target (melee only)</li>
                        <li>Attacking an invisible target</li>
                        <li>Attacking while hidden</li>
                        <li>Receiving help from an ally</li>
                      </ul>
                    </div>
                    <div className="mt-2 border p-2 rounded-md">
                      <h4 className="font-bold">Common sources of disadvantage:</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        <li>Attacking while prone</li>
                        <li>Attacking an invisible target</li>
                        <li>Attacking at long range</li>
                        <li>Being poisoned</li>
                      </ul>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="spell-casting">
                  <AccordionTrigger className="font-medieval text-primary px-4 py-2 rounded-t-md bg-accent/10">
                    Spellcasting
                  </AccordionTrigger>
                  <AccordionContent className="bg-accent/5 p-4 rounded-b-md">
                    <p className="mb-2">When characters cast spells:</p>
                    <div className="space-y-2 text-sm">
                      <div className="border p-2 rounded-md">
                        <h4 className="font-bold">Spell Level</h4>
                        <p>Spells range from cantrips (level 0) to 9th level. Higher levels are more powerful.</p>
                      </div>
                      <div className="border p-2 rounded-md">
                        <h4 className="font-bold">Spell Slots</h4>
                        <p>Represent magical energy available. Expended when casting spells (except cantrips).</p>
                      </div>
                      <div className="border p-2 rounded-md">
                        <h4 className="font-bold">Spell Save DC</h4>
                        <p>8 + proficiency bonus + spellcasting ability modifier</p>
                      </div>
                      <div className="border p-2 rounded-md">
                        <h4 className="font-bold">Spell Attack Bonus</h4>
                        <p>Proficiency bonus + spellcasting ability modifier</p>
                      </div>
                      <div className="border p-2 rounded-md">
                        <h4 className="font-bold">Components</h4>
                        <p>Verbal (V), Somatic (S), and Material (M). Some spells require specific components.</p>
                      </div>
                      <div className="border p-2 rounded-md">
                        <h4 className="font-bold">Concentration</h4>
                        <p>Some spells require concentration to maintain. Concentration can be broken by taking damage.</p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </TabsContent>
        </Tabs>

        <div className="p-4 bg-accent/10 border-t border-accent/20 mt-4">
          <div className="flex items-center">
            <Lightbulb className="text-accent h-5 w-5 mr-2" />
            <h3 className="font-medieval text-accent">Teaching Tip</h3>
          </div>
          <p className="mt-1">
            Remind players that there's no "winning" D&D—it's about collaborative storytelling. Encourage creativity and don't worry about perfect rules knowledge.
            Learning happens through play!
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default DMGuidePanel;