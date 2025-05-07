import React, { useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Book,
  DicesIcon,
  Shield,
  Swords,
  ArrowUpDown,
  Eye,
  Brain,
  Target,
  SquareUser,
  User,
  Users,
  Timer,
  Sparkles,
  ScrollText,
  Compass,
  HelpCircle,
  Skull,
  BookOpen,
  ChevronRight,
  ChevronDown
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

// The different types of rules we want to explain
export type RuleType =
  | "ability-check"
  | "saving-throw"
  | "attack-roll"
  | "initiative"
  | "combat-turn"
  | "damage"
  | "advantage"
  | "disadvantage"
  | "proficiency"
  | "spell-casting"
  | "conditions"
  | "movement"
  | "death-saves"
  | "exhaustion";

interface DndRuleTooltipProps {
  ruleType: RuleType;
  children: React.ReactNode;
  showAsPopover?: boolean;
  triggerClassName?: string;
}

interface RuleContent {
  title: string;
  icon: React.ReactNode;
  shortDescription: string;
  longDescription: string[];
  formula?: string;
  examples?: string[];
}

// Comprehensive D&D 5e rules content
const ruleContents: Record<RuleType, RuleContent> = {
  "ability-check": {
    title: "Ability Checks",
    icon: <Brain className="h-4 w-4 text-blue-500" />,
    shortDescription: "Roll d20 + ability modifier [+ proficiency bonus] vs DC",
    longDescription: [
      "When your character attempts an action that has a chance of failure, the DM may ask for an ability check.",
      "Roll a d20 and add the relevant ability modifier. If you're proficient in a relevant skill, add your proficiency bonus too.",
      "The DM sets a Difficulty Class (DC) from 5 (very easy) to 30 (nearly impossible). If your roll equals or exceeds the DC, you succeed."
    ],
    formula: "d20 + Ability Modifier [+ Proficiency Bonus if applicable]",
    examples: [
      "Strength check to break down a door (DC 15)",
      "Dexterity check to pick a lock (DC 20)",
      "Intelligence (Arcana) check to identify a spell (DC varies)",
      "Wisdom (Perception) check to spot a hidden enemy (DC varies)"
    ]
  },
  "saving-throw": {
    title: "Saving Throws",
    icon: <Shield className="h-4 w-4 text-red-500" />,
    shortDescription: "Roll d20 + ability modifier [+ proficiency bonus] vs DC to resist an effect",
    longDescription: [
      "A saving throw represents an attempt to resist a spell, trap, poison, disease, or similar threat.",
      "Roll a d20 and add the relevant ability modifier. If you're proficient in that saving throw, add your proficiency bonus too.",
      "Each class provides proficiency in different saving throws.",
      "If your roll equals or exceeds the DC, you succeed at avoiding the threat or reducing its effect."
    ],
    formula: "d20 + Ability Modifier [+ Proficiency Bonus if proficient]",
    examples: [
      "Dexterity save to avoid a fireball (typically half damage on success)",
      "Constitution save to resist poison (often negates effect on success)",
      "Wisdom save to resist mind control (typically negates effect on success)"
    ]
  },
  "attack-roll": {
    title: "Attack Rolls",
    icon: <Swords className="h-4 w-4 text-amber-500" />,
    shortDescription: "Roll d20 + attack bonus vs target's AC",
    longDescription: [
      "When you make an attack against a creature or object, you make an attack roll to determine if you hit.",
      "Roll a d20 and add your attack bonus. For melee weapons, this is usually Strength modifier + proficiency. For ranged weapons, it's usually Dexterity modifier + proficiency.",
      "If your roll equals or exceeds the target's Armor Class (AC), your attack hits and you roll damage.",
      "A natural 20 is a critical hit, doubling the number of damage dice rolled."
    ],
    formula: "d20 + Attack Bonus vs target's AC",
    examples: [
      "A fighter with +3 Strength and +2 proficiency has a +5 bonus to hit with a longsword",
      "A rogue with +4 Dexterity and +3 proficiency has a +7 bonus to hit with a bow",
      "Rolling a natural 20 causes a critical hit, doubling damage dice"
    ]
  },
  "initiative": {
    title: "Initiative",
    icon: <Timer className="h-4 w-4 text-green-500" />,
    shortDescription: "Roll d20 + Dexterity modifier to determine turn order",
    longDescription: [
      "At the beginning of combat, everyone rolls initiative to determine the order of turns.",
      "Roll a d20 and add your Dexterity modifier.",
      "Combatants act in order from highest initiative to lowest, with ties broken by Dexterity score.",
      "Once the last combatant has acted, the round ends and a new round begins with the first combatant acting again."
    ],
    formula: "d20 + Dexterity modifier",
    examples: [
      "A character with +3 Dexterity rolls a 15, for a total initiative of 18",
      "The Alert feat gives a +5 bonus to initiative"
    ]
  },
  "combat-turn": {
    title: "Combat Turn",
    icon: <Swords className="h-4 w-4 text-red-500" />,
    shortDescription: "Move + Action + Bonus Action + (possible) Reaction",
    longDescription: [
      "On your turn in combat, you can move a distance up to your speed.",
      "You can take one action, such as Attack, Cast a Spell, Dash, Disengage, Dodge, Help, Hide, Ready, Search, or Use an Object.",
      "You might be able to take a bonus action if a feature, spell, or other ability grants one.",
      "You can take one reaction per round, usually on someone else's turn, such as an opportunity attack or certain spells."
    ],
    examples: [
      "Move 30 feet, take the Attack action, and use a bonus action to attack with your off-hand weapon",
      "Cast a spell as your action and use your movement to get behind cover",
      "Use your reaction to make an opportunity attack when an enemy leaves your reach"
    ]
  },
  "damage": {
    title: "Damage Rolls",
    icon: <Target className="h-4 w-4 text-red-600" />,
    shortDescription: "Roll specified dice + modifiers for weapon/spell damage",
    longDescription: [
      "After a successful attack, you roll damage to determine how much harm you cause.",
      "The weapon or spell description specifies the damage dice to roll.",
      "For melee weapons, add your Strength modifier to damage. For ranged weapons, add your Dexterity modifier.",
      "Some abilities might add extra damage dice or bonuses."
    ],
    formula: "Weapon/Spell Dice + Ability Modifier + any bonuses",
    examples: [
      "Longsword: 1d8 (or 1d10 if two-handed) + Strength modifier",
      "Shortbow: 1d6 + Dexterity modifier",
      "Sneak Attack adds extra dice based on rogue level"
    ]
  },
  "advantage": {
    title: "Advantage",
    icon: <ArrowUpDown className="h-4 w-4 text-green-600 rotate-180" />,
    shortDescription: "Roll 2d20 and take the higher result",
    longDescription: [
      "When you have advantage, you roll a second d20 and use the higher of the two rolls.",
      "Various circumstances can grant advantage, such as attacking a prone target in melee, using the Help action, or through class features.",
      "Advantage represents a situation that's favorable to you.",
      "If multiple circumstances grant advantage, you still roll only two dice."
    ],
    examples: [
      "Attacking a prone enemy in melee combat",
      "Attacking an enemy that can't see you",
      "Making an ability check with help from an ally"
    ]
  },
  "disadvantage": {
    title: "Disadvantage",
    icon: <ArrowUpDown className="h-4 w-4 text-red-600" />,
    shortDescription: "Roll 2d20 and take the lower result",
    longDescription: [
      "When you have disadvantage, you roll a second d20 and use the lower of the two rolls.",
      "Various circumstances can impose disadvantage, such as attacking a prone target at range, being restrained, or being heavily obscured.",
      "Disadvantage represents a situation that's unfavorable to you.",
      "If multiple circumstances impose disadvantage, you still roll only two dice."
    ],
    examples: [
      "Attacking while prone",
      "Attacking an enemy you can't see",
      "Making a Dexterity check while wearing armor you're not proficient with"
    ]
  },
  "proficiency": {
    title: "Proficiency Bonus",
    icon: <Target className="h-4 w-4 text-blue-600" />,
    shortDescription: "+2 to +6 bonus based on character level",
    longDescription: [
      "Your proficiency bonus represents your experience and aptitude with the skills, tools, and abilities you're trained in.",
      "It ranges from +2 at level 1 to +6 at level 17 and higher.",
      "You add your proficiency bonus to attack rolls with weapons you're proficient with, saving throws you're proficient in, ability checks using skills you're proficient in, and ability checks using tools you're proficient with."
    ],
    formula: "+2 (levels 1-4), +3 (levels 5-8), +4 (levels 9-12), +5 (levels 13-16), +6 (levels 17+)",
    examples: [
      "A level 1 wizard has a +2 proficiency bonus to Intelligence saving throws",
      "A level 5 rogue adds a +3 proficiency bonus to Dexterity (Stealth) checks",
      "A level 9 fighter adds a +4 proficiency bonus to attack rolls with martial weapons"
    ]
  },
  "spell-casting": {
    title: "Spellcasting",
    icon: <Sparkles className="h-4 w-4 text-purple-500" />,
    shortDescription: "Cast spells using slots, DC = 8 + proficiency + ability modifier",
    longDescription: [
      "Spellcasting allows characters to produce magical effects by expending spell slots.",
      "Each class has a different spellcasting ability: Intelligence (Wizard), Wisdom (Cleric, Druid), or Charisma (Bard, Sorcerer, Warlock).",
      "Your spell save DC is 8 + proficiency bonus + spellcasting ability modifier.",
      "Your spell attack modifier is your proficiency bonus + spellcasting ability modifier.",
      "Spell slots are consumed when casting spells and recovered on a long rest (or short rest for some classes)."
    ],
    formula: "Spell Save DC = 8 + Proficiency Bonus + Spellcasting Ability Modifier",
    examples: [
      "A level 5 wizard with +4 Intelligence has a spell save DC of 15 (8 + 3 + 4)",
      "A level 1 cleric with +3 Wisdom has a spell attack modifier of +5 (+2 + 3)",
      "Cantrips can be cast without using spell slots"
    ]
  },
  "conditions": {
    title: "Conditions",
    icon: <Skull className="h-4 w-4 text-gray-700" />,
    shortDescription: "Status effects that alter a creature's capabilities",
    longDescription: [
      "Conditions alter a creature's capabilities in various ways and can arise as a result of a spell, class feature, attack, or environmental effect.",
      "Common conditions include: Blinded, Charmed, Deafened, Frightened, Grappled, Incapacitated, Invisible, Paralyzed, Petrified, Poisoned, Prone, Restrained, Stunned, and Unconscious.",
      "Most conditions are detrimental and impose penalties or restrictions on actions."
    ],
    examples: [
      "Blinded: You automatically fail ability checks requiring sight, attack rolls have disadvantage, and attacks against you have advantage",
      "Poisoned: You have disadvantage on attack rolls and ability checks",
      "Prone: You can only crawl, have disadvantage on attack rolls, and melee attacks against you have advantage"
    ]
  },
  "movement": {
    title: "Movement",
    icon: <Compass className="h-4 w-4 text-green-600" />,
    shortDescription: "Move up to your speed on your turn, difficult terrain costs extra",
    longDescription: [
      "Each character has a speed, typically 30 feet per round for most races.",
      "You can move up to your full speed on your turn, and you can break up your movement before, during, and after your action.",
      "Difficult terrain (rubble, ice, dense vegetation) costs double movement (10 feet to move 5 feet).",
      "Climbing, swimming, and crawling also cost extra movement unless you have a special speed for that type of movement."
    ],
    examples: [
      "A character with 30-foot speed can move 15 feet, attack, and then move another 15 feet",
      "Moving through 10 feet of difficult terrain consumes 20 feet of movement",
      "Climbing a wall costs 2 feet of movement for every 1 foot climbed"
    ]
  },
  "death-saves": {
    title: "Death Saving Throws",
    icon: <Skull className="h-4 w-4 text-red-800" />,
    shortDescription: "When at 0 HP, roll d20: <10 = failure, ≥10 = success, 20 = regain 1 HP",
    longDescription: [
      "When you start your turn with 0 hit points, you must make a death saving throw: a d20 roll with no modifiers.",
      "On a roll of 10 or higher, you succeed. On a roll less than 10, you fail.",
      "On your third success, you become stable. On your third failure, you die.",
      "Rolling a 1 counts as two failures. Rolling a 20 means you regain 1 hit point.",
      "Taking damage while at 0 hit points causes a death save failure, and critical hits cause two failures."
    ],
    formula: "d20 (no modifiers): <10 = failure, ≥10 = success",
    examples: [
      "If you roll 12, 7, and 15, you have 2 successes and 1 failure",
      "If you roll a natural 20, you immediately regain 1 hit point and become conscious",
      "Taking damage while at 0 HP causes an automatic failure"
    ]
  },
  "exhaustion": {
    title: "Exhaustion",
    icon: <User className="h-4 w-4 text-amber-700" />,
    shortDescription: "Cumulative penalty levels from 1-6, with level 6 causing death",
    longDescription: [
      "Exhaustion is measured in six levels, each more debilitating than the last.",
      "Level 1: Disadvantage on ability checks",
      "Level 2: Speed halved",
      "Level 3: Disadvantage on attack rolls and saving throws",
      "Level 4: Hit point maximum halved",
      "Level 5: Speed reduced to 0",
      "Level 6: Death",
      "You typically gain a level of exhaustion from effects like starvation, extreme cold, or certain spells.",
      "A long rest reduces exhaustion by 1 level if you have food and drink."
    ],
    examples: [
      "Going without a long rest for 24+ hours can cause exhaustion",
      "The Sickened condition often imposes a level of exhaustion",
      "Casting certain powerful spells might cause exhaustion"
    ]
  }
};

/**
 * A component to display D&D 5e rules information in a tooltip or popover
 */
export function DndRuleTooltip({
  ruleType,
  children,
  showAsPopover = false,
  triggerClassName
}: DndRuleTooltipProps) {
  const rule = ruleContents[ruleType];
  const [isCollapsibleOpen, setIsCollapsibleOpen] = useState(false);
  
  if (!rule) return <>{children}</>;
  
  // Simple tooltip for shorter explanations
  if (!showAsPopover) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild className={triggerClassName}>
            {children}
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <div className="flex items-start gap-2">
              <div className="mt-0.5">{rule.icon}</div>
              <div>
                <h4 className="font-medium text-sm">{rule.title}</h4>
                <p className="text-xs text-muted-foreground">{rule.shortDescription}</p>
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  
  // Popover for more detailed explanations
  return (
    <Popover>
      <PopoverTrigger asChild className={triggerClassName}>
        {children}
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <Card className="border-none shadow-none p-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              {rule.icon} {rule.title}
            </CardTitle>
            <CardDescription className="text-xs">
              {rule.shortDescription}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0 pb-2 text-sm">
            <Collapsible
              open={isCollapsibleOpen}
              onOpenChange={setIsCollapsibleOpen}
              className="space-y-2"
            >
              <div>
                {rule.longDescription[0]}
              </div>
              
              <CollapsibleContent className="space-y-2 pt-1">
                {rule.longDescription.slice(1).map((paragraph, i) => (
                  <p key={i}>{paragraph}</p>
                ))}
                
                {rule.formula && (
                  <div className="pt-1">
                    <div className="text-xs font-medium uppercase text-muted-foreground">Formula</div>
                    <code className="text-xs bg-muted p-1 rounded">{rule.formula}</code>
                  </div>
                )}
                
                {rule.examples && rule.examples.length > 0 && (
                  <div className="pt-1">
                    <div className="text-xs font-medium uppercase text-muted-foreground">Examples</div>
                    <ul className="text-xs list-disc list-inside">
                      {rule.examples.map((example, i) => (
                        <li key={i}>{example}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CollapsibleContent>
              
              <CollapsibleTrigger asChild>
                <Button variant="link" size="sm" className="p-0 text-xs flex items-center">
                  {isCollapsibleOpen ? (
                    <>
                      <ChevronDown className="h-3 w-3 mr-1" /> Less
                    </>
                  ) : (
                    <>
                      <ChevronRight className="h-3 w-3 mr-1" /> Details
                    </>
                  )}
                </Button>
              </CollapsibleTrigger>
            </Collapsible>
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
}

/**
 * Quick inline rule reference that can be used in text
 */
export function InlineRuleReference({
  ruleType,
  children,
  showAsPopover = false
}: Omit<DndRuleTooltipProps, "triggerClassName" | "children"> & {
  children?: React.ReactNode;
}) {
  const rule = ruleContents[ruleType];
  
  return (
    <DndRuleTooltip
      ruleType={ruleType}
      showAsPopover={showAsPopover}
      triggerClassName="inline-flex items-center text-primary font-medium underline underline-offset-4 decoration-dotted cursor-help"
    >
      <span className="inline-flex items-center gap-1">
        {children || rule.title}
        <HelpCircle className="inline-block h-3 w-3 text-muted-foreground" />
      </span>
    </DndRuleTooltip>
  );
}

/**
 * A button that shows D&D rule information
 */
export function DndRuleButton({
  ruleType,
  variant = "outline",
  size = "sm"
}: {
  ruleType: RuleType;
  variant?: "outline" | "ghost" | "link";
  size?: "sm" | "default";
}) {
  const rule = ruleContents[ruleType];
  
  return (
    <DndRuleTooltip
      ruleType={ruleType}
      showAsPopover={true}
    >
      <Button variant={variant} size={size} className="flex items-center gap-1">
        {rule.icon}
        <span>{rule.title}</span>
      </Button>
    </DndRuleTooltip>
  );
}

/**
 * A panel with D&D rule buttons for quick reference
 */
export function DndReferencePanel() {
  return (
    <div className="p-4 border rounded-md shadow-sm bg-card">
      <h3 className="font-medium text-lg flex items-center gap-2 mb-3">
        <BookOpen className="h-5 w-5 text-primary" />
        D&D Quick Reference
      </h3>
      
      <div className="grid grid-cols-2 gap-2">
        <DndRuleButton ruleType="ability-check" />
        <DndRuleButton ruleType="saving-throw" />
        <DndRuleButton ruleType="attack-roll" />
        <DndRuleButton ruleType="damage" />
        <DndRuleButton ruleType="advantage" />
        <DndRuleButton ruleType="disadvantage" />
        <DndRuleButton ruleType="initiative" />
        <DndRuleButton ruleType="combat-turn" />
        <DndRuleButton ruleType="spell-casting" />
        <DndRuleButton ruleType="conditions" />
        <DndRuleButton ruleType="movement" />
        <DndRuleButton ruleType="death-saves" />
      </div>
    </div>
  );
}