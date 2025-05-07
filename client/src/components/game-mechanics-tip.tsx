import { useState } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  Book, 
  Sword, 
  Shield, 
  DicesIcon, 
  Crosshair,
  Brain,
  Map,
  Users,
  ChevronRight,
  ChevronDown, 
  Timer,
  Sparkles
} from "lucide-react";

interface GameMechanicsTipProps {
  mechanicType: 
    | "ability-check" 
    | "saving-throw" 
    | "attack-roll" 
    | "damage-roll"
    | "advantage-disadvantage"
    | "combat-turn"
    | "initiative"
    | "skills"
    | "spellcasting"
    | "roleplaying";
  brief?: boolean;
}

const MECHANIC_DATA = {
  "ability-check": {
    title: "Ability Checks",
    icon: <Brain className="h-5 w-5 text-blue-500" />,
    description: "Ability checks test a character's innate talents with one of the six abilities: Strength, Dexterity, Constitution, Intelligence, Wisdom, or Charisma.",
    formula: "d20 + Ability Modifier [+ Proficiency Bonus]",
    explanation: "The DM sets a Difficulty Class (DC) from 5 (very easy) to 30 (nearly impossible). You roll a d20, add your ability modifier, and potentially your proficiency bonus if you're proficient. If your total equals or exceeds the DC, you succeed.",
    examples: ["Breaking down a door (Strength)", "Recalling lore (Intelligence)", "Spotting a hidden enemy (Wisdom)", "Persuading an NPC (Charisma)"],
    tips: ["Think about creative ways to use your best abilities", "Ask if you can apply proficiency from relevant skills", "Remember that natural 20s are not automatic successes on ability checks (unlike attack rolls)"]
  },
  "saving-throw": {
    title: "Saving Throws",
    icon: <Shield className="h-5 w-5 text-red-500" />,
    description: "Saving throws represent your attempt to resist harmful effects like poison, fire, or mind control.",
    formula: "d20 + Ability Modifier [+ Proficiency Bonus if proficient]",
    explanation: "When forced to make a saving throw, you roll a d20 and add the relevant ability modifier. If you're proficient in that saving throw, you also add your proficiency bonus. If your total equals or exceeds the DC, you succeed in avoiding the threat or reducing its effect.",
    examples: ["Dexterity save to avoid a fireball", "Constitution save to resist poison", "Wisdom save to resist mind control"],
    tips: ["Different classes are proficient in different saving throws", "Failed saves usually result in taking full damage or effects", "Successful saves often mean half damage or no effect"]
  },
  "attack-roll": {
    title: "Attack Rolls",
    icon: <Sword className="h-5 w-5 text-amber-500" />,
    description: "Attack rolls determine whether an attack hits or misses its target.",
    formula: "d20 + Attack Bonus",
    explanation: "To make an attack, roll a d20 and add your attack bonus. For melee attacks, this is usually Strength modifier + proficiency bonus. For ranged attacks, it's usually Dexterity modifier + proficiency bonus. If your total equals or exceeds the target's Armor Class (AC), your attack hits.",
    examples: ["Swinging a sword (Strength-based melee attack)", "Firing a bow (Dexterity-based ranged attack)", "Casting a spell that requires an attack roll"],
    tips: ["A natural 20 is a critical hit, dealing extra damage", "A natural 1 is always a miss", "Cover can increase a target's AC"]
  },
  "damage-roll": {
    title: "Damage Rolls",
    icon: <Crosshair className="h-5 w-5 text-red-500" />,
    description: "Damage rolls determine how much damage is dealt after a successful attack.",
    formula: "Weapon Dice [+ Ability Modifier]",
    explanation: "After a successful attack, roll the damage dice for your weapon or spell. Add your relevant ability modifier to the roll (usually Strength for melee weapons, Dexterity for ranged weapons). On a critical hit, you roll all damage dice twice.",
    examples: ["Longsword: 1d8 + Strength modifier", "Shortbow: 1d6 + Dexterity modifier", "Fireball spell: 8d6 fire damage"],
    tips: ["Different weapons have different damage dice", "Critical hits double the number of damage dice", "Some effects like resistance halve damage"]
  },
  "advantage-disadvantage": {
    title: "Advantage & Disadvantage",
    icon: <DicesIcon className="h-5 w-5 text-purple-500" />,
    description: "Advantage and disadvantage represent favorable or unfavorable circumstances that affect your chances of success.",
    formula: "Roll 2d20 and take the higher (advantage) or lower (disadvantage) result",
    explanation: "When you have advantage, you roll two d20s and take the higher result. With disadvantage, you roll two d20s and take the lower result. If you have both advantage and disadvantage, they cancel each other out, and you roll normally.",
    examples: ["Attacking an invisible enemy (disadvantage)", "Attacking a prone enemy in melee (advantage)", "Stealth check while hidden (advantage)"],
    tips: ["Multiple sources of advantage don't stack", "Advantage roughly gives a +5 bonus on average", "Critical hits still only occur on a natural 20"]
  },
  "combat-turn": {
    title: "Combat Turns",
    icon: <Timer className="h-5 w-5 text-gray-500" />,
    description: "Combat is organized into rounds where each participant takes a turn in initiative order.",
    formula: "Action + Bonus Action + Movement + Reaction",
    explanation: "On your turn, you can move up to your speed, take one action, and possibly one bonus action. You can also take one reaction per round, usually on someone else's turn in response to a trigger.",
    examples: ["Action: Attack, Cast a Spell, Dash, Disengage", "Bonus Action: Off-hand attack, certain spells", "Reaction: Opportunity attack, certain spells"],
    tips: ["You can split up your movement before and after your action", "Some actions, like attacking, can involve multiple rolls", "Plan your turn while others are playing to speed up the game"]
  },
  "initiative": {
    title: "Initiative",
    icon: <Sparkles className="h-5 w-5 text-yellow-500" />,
    description: "Initiative determines the order in which creatures take turns in combat.",
    formula: "d20 + Dexterity Modifier",
    explanation: "When combat begins, everyone rolls initiative. Roll a d20 and add your Dexterity modifier. The DM will then arrange everyone in order from highest to lowest initiative, and turns proceed in that order each round.",
    examples: ["A rogue with +3 Dexterity rolls a 15, for a total of 18", "A wizard with -1 Dexterity rolls a 12, for a total of 11"],
    tips: ["Some abilities and features can give you advantage on initiative", "Ties in initiative can be broken by Dexterity score", "The Alert feat gives a +5 bonus to initiative"]
  },
  "skills": {
    title: "Skills",
    icon: <Book className="h-5 w-5 text-blue-500" />,
    description: "Skills represent specific areas of expertise tied to your ability scores.",
    formula: "d20 + Ability Modifier [+ Proficiency Bonus if proficient]",
    explanation: "There are 18 skills in D&D, each associated with a particular ability score. When making a skill check, you roll a d20, add the relevant ability modifier, and your proficiency bonus if you're proficient in that skill.",
    examples: ["Athletics (Strength)", "Stealth (Dexterity)", "Arcana (Intelligence)", "Perception (Wisdom)", "Persuasion (Charisma)"],
    tips: ["Expertise doubles your proficiency bonus for a skill", "Background typically gives you proficiency in two skills", "Your class determines which skills you can choose from at character creation"]
  },
  "spellcasting": {
    title: "Spellcasting",
    icon: <Sparkles className="h-5 w-5 text-violet-500" />,
    description: "Spellcasting allows characters to use magical effects by casting spells.",
    formula: "Spell Save DC = 8 + Proficiency Bonus + Spellcasting Ability Modifier",
    explanation: "To cast a spell, you need to meet the spell's requirements (components, casting time, etc.). Some spells require attack rolls, while others force the target to make a saving throw against your spell save DC. Your spellcasting ability depends on your class.",
    examples: ["Wizard: Intelligence", "Cleric: Wisdom", "Bard: Charisma"],
    tips: ["Spell slots limit how many spells you can cast", "Cantrips can be cast unlimited times", "Concentration limits you to maintaining one concentration spell at a time"]
  },
  "roleplaying": {
    title: "Roleplaying",
    icon: <Users className="h-5 w-5 text-green-500" />,
    description: "Roleplaying is embodying your character's personality, goals, and flaws during the game.",
    formula: "Character Background + Traits + Bonds + Ideals + Flaws",
    explanation: "While not tied to specific die rolls, roleplaying is a core part of D&D. You make decisions as your character would, based on their personality, history, and goals. The DM might award Inspiration for good roleplaying.",
    examples: ["Speaking in character", "Making decisions based on your character's ideals", "Reacting to situations based on your character's fears or desires"],
    tips: ["Your character's flaws can create interesting story moments", "Think about how your character would react in different situations", "Roleplaying isn't about doing silly voices—it's about consistent decision-making from your character's perspective"]
  }
};

export default function GameMechanicsTip({ mechanicType, brief = false }: GameMechanicsTipProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const data = MECHANIC_DATA[mechanicType];
  
  if (!data) return null;
  
  return (
    <Card className="w-full border-primary/20 bg-primary/5 shadow-sm">
      <CardContent className="p-3">
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {data.icon}
              <h3 className="font-medium text-primary">{data.title}</h3>
            </div>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
          </div>
          
          <p className="text-sm mt-1 text-muted-foreground">{data.description}</p>
          
          <CollapsibleContent>
            <div className="mt-3 space-y-3 text-sm">
              <div>
                <h4 className="font-medium">Formula</h4>
                <div className="bg-muted/50 p-2 rounded mt-1 font-mono text-xs">
                  {data.formula}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium">How It Works</h4>
                <p className="mt-1">{data.explanation}</p>
              </div>
              
              {data.examples && data.examples.length > 0 && (
                <div>
                  <h4 className="font-medium">Examples</h4>
                  <ul className="list-disc list-inside mt-1">
                    {data.examples.map((example, idx) => (
                      <li key={idx}>{example}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {data.tips && data.tips.length > 0 && (
                <div>
                  <h4 className="font-medium">Tips</h4>
                  <ul className="list-disc list-inside mt-1">
                    {data.tips.map((tip, idx) => (
                      <li key={idx}>{tip}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}