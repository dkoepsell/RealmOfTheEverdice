import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Card } from "@/components/ui/card";
import { DicesIcon, Info, Award, Shield, Brain, Heart } from "lucide-react";
import { Character, GameLog } from "@shared/schema";
import { DiceType } from "./dice-roll";

interface InteractiveDiceSuggestionsProps {
  content: string;
  character: Character;
  onRollComplete: (
    type: DiceType,
    result: number,
    modifier: number,
    purpose: string,
    threshold?: number,
    effects?: {
      stats?: Partial<Record<string, number>>;
      alignment?: string;
      description: string;
    }
  ) => void;
}

// Regex patterns for detecting dice roll suggestions
const ROLL_PATTERNS = [
  // Pattern for skill checks: Roll a [Skill] check
  {
    regex: /Roll (?:an?\s+)?(\w+)(?:\s+)(?:skill\s+)?check(?: DC (\d+))?/gi,
    type: "skill",
    diceType: "d20" as DiceType
  },
  // Pattern for ability checks: Roll a [Ability] check
  {
    regex: /Roll (?:an?\s+)?(\w+)(?:\s+)(?:ability\s+)?check(?: DC (\d+))?/gi,
    type: "ability",
    diceType: "d20" as DiceType
  },
  // Pattern for saving throws: Make a [Ability] saving throw
  {
    regex: /(?:Make|Roll) (?:an?\s+)?(\w+) saving throw(?: DC (\d+))?/gi,
    type: "save",
    diceType: "d20" as DiceType
  },
  // Pattern for attack rolls: Make an attack roll
  {
    regex: /(?:Make|Roll) (?:an?\s+)?(?:(\w+)\s+)?attack roll/gi,
    type: "attack",
    diceType: "d20" as DiceType
  },
  // Pattern for generic dice rolls: Roll a dX
  {
    regex: /Roll (?:a|an|\d+)\s+(d4|d6|d8|d10|d12|d20|d100)(?:\s+(?:for|to)\s+(\w+))?/gi,
    type: "generic",
    diceType: null
  },
  // Pattern for damage rolls: Roll XdY damage
  {
    regex: /Roll (?:(\d+)?(?:d\d+))(?:\s+(\w+))?\s+damage/gi,
    type: "damage",
    diceType: null
  },
  // Pattern for initiative
  {
    regex: /Roll (?:for )?initiative/gi,
    type: "initiative",
    diceType: "d20" as DiceType
  }
];

// Map abilities to their standard abbreviations
const ABILITY_ABBR: Record<string, string> = {
  "strength": "STR",
  "dexterity": "DEX",
  "constitution": "CON", 
  "intelligence": "INT",
  "wisdom": "WIS",
  "charisma": "CHA"
};

// Map abbreviated abilities to full names
const ABILITY_FULL: Record<string, string> = {
  "STR": "Strength",
  "DEX": "Dexterity",
  "CON": "Constitution",
  "INT": "Intelligence", 
  "WIS": "Wisdom",
  "CHA": "Charisma"
};

// Common skills and their ability associations
const SKILL_ABILITY: Record<string, string> = {
  "athletics": "STR",
  "acrobatics": "DEX", 
  "sleight of hand": "DEX",
  "stealth": "DEX",
  "arcana": "INT",
  "history": "INT",
  "investigation": "INT",
  "nature": "INT",
  "religion": "INT",
  "animal handling": "WIS",
  "insight": "WIS",
  "medicine": "WIS",
  "perception": "WIS",
  "survival": "WIS",
  "deception": "CHA",
  "intimidation": "CHA",
  "performance": "CHA",
  "persuasion": "CHA"
};

// Effects based on roll results
const getAlignmentEffect = (
  rollType: string, 
  skillName: string, 
  isSuccess: boolean,
  rollResult: number
) => {
  // Only major successes or failures affect alignment
  if (rollResult === 20 || rollResult === 1) {
    if (skillName.toLowerCase() === "deception" || skillName.toLowerCase() === "stealth") {
      return isSuccess ? "shift-chaotic" : null;
    }
    
    if (skillName.toLowerCase() === "intimidation") {
      return isSuccess ? "shift-evil" : null;
    }
    
    if (skillName.toLowerCase() === "persuasion" || skillName.toLowerCase() === "diplomacy") {
      return isSuccess ? "shift-good" : null;
    }
    
    if (skillName.toLowerCase() === "religion" || skillName.toLowerCase() === "insight") {
      return isSuccess ? "shift-lawful" : null;
    }
  }
  
  return null;
};

// Interactive dice roll suggestion component
export default function InteractiveDiceSuggestions({ 
  content,
  character,
  onRollComplete
}: InteractiveDiceSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<Array<{
    type: string;
    diceType: DiceType;
    text: string;
    ability?: string;
    dc?: number;
    purpose?: string;
    rollComplete: boolean;
  }>>([]);
  
  // Parse content for dice roll suggestions
  useEffect(() => {
    const found: Array<{
      type: string;
      diceType: DiceType;
      text: string;
      ability?: string;
      dc?: number;
      purpose?: string;
      rollComplete: boolean;
    }> = [];
    
    ROLL_PATTERNS.forEach(pattern => {
      const regex = new RegExp(pattern.regex);
      let match;
      
      while ((match = regex.exec(content)) !== null) {
        let ability = match[1]?.toLowerCase() || "";
        const dc = match[2] ? parseInt(match[2]) : undefined;
        let diceType = pattern.diceType as DiceType;
        
        // For generic die rolls, the dice type is in the first capture group
        if (pattern.type === "generic" && match[1]?.toLowerCase().match(/^d\d+$/)) {
          diceType = match[1].toLowerCase() as DiceType;
          ability = match[2] || "";
        }
        
        // For damage rolls, parse the dice expression
        if (pattern.type === "damage") {
          const dicePart = match[0].match(/\d*d\d+/i);
          if (dicePart) {
            // Extract just the dX part
            const dieType = dicePart[0].match(/d\d+/i);
            if (dieType) {
              diceType = dieType[0].toLowerCase() as DiceType;
            }
          }
        }
        
        // Handle skill checks by mapping to their corresponding ability
        if (pattern.type === "skill" && ability) {
          const abilityForSkill = SKILL_ABILITY[ability.toLowerCase()];
          if (abilityForSkill) {
            ability = abilityForSkill;
          }
        }
        
        // Normalize ability names
        if (ABILITY_ABBR[ability.toLowerCase()]) {
          ability = ABILITY_ABBR[ability.toLowerCase()];
        }
        
        found.push({
          type: pattern.type,
          diceType: diceType || "d20" as DiceType,
          text: match[0],
          ability: ability || undefined,
          dc,
          purpose: match[2] || undefined,
          rollComplete: false
        });
      }
    });
    
    setSuggestions(found);
  }, [content]);
  
  // Function to get stat modifier from character stats
  const getModifier = (abilityName: string): number => {
    if (!character.stats) return 0;
    
    const stats = character.stats as any;
    let score: number = 10; // Default
    
    if (abilityName in stats) {
      score = stats[abilityName];
    } else if (ABILITY_ABBR[abilityName.toLowerCase()]) {
      score = stats[ABILITY_ABBR[abilityName.toLowerCase()]];
    } else if (abilityName.toUpperCase() in stats) {
      score = stats[abilityName.toUpperCase()];
    }
    
    // Calculate modifier: (score - 10) / 2, rounded down
    return Math.floor((score - 10) / 2);
  };
  
  // Roll the dice and process results
  const handleRoll = (suggestion: typeof suggestions[0]) => {
    // Roll the dice
    const diceMax = parseInt(suggestion.diceType.substring(1));
    const result = Math.floor(Math.random() * diceMax) + 1;
    
    // Get modifier
    let modifier = 0;
    
    if (suggestion.ability) {
      modifier = getModifier(suggestion.ability);
    } else if (suggestion.type === "initiative") {
      modifier = getModifier("DEX");
    }
    
    // Determine if roll is a success
    const isSuccess = suggestion.dc ? (result + modifier >= suggestion.dc) : true;
    
    // Determine any effects on character stats or alignment
    const effects: {
      stats?: Partial<Record<string, number>>;
      alignment?: string;
      description: string;
    } = {
      description: isSuccess ? "Success" : "Failure"
    };
    
    // Check for stat or alignment effects based on the roll
    const alignmentEffect = getAlignmentEffect(
      suggestion.type,
      suggestion.ability || "",
      isSuccess,
      result
    );
    
    if (alignmentEffect) {
      effects.alignment = alignmentEffect;
      
      if (alignmentEffect === "shift-good") {
        effects.description = "Your good deeds are shifting your alignment toward Good";
      } else if (alignmentEffect === "shift-evil") {
        effects.description = "Your intimidating actions are shifting your alignment toward Evil";
      } else if (alignmentEffect === "shift-lawful") {
        effects.description = "Your respect for tradition shifts your alignment toward Lawful";
      } else if (alignmentEffect === "shift-chaotic") {
        effects.description = "Your deceptive ways shift your alignment toward Chaotic";
      }
    }
    
    // Check for critical success/failure (natural 20/1)
    if (result === 20) {
      effects.description = "Critical Success! " + effects.description;
    } else if (result === 1) {
      effects.description = "Critical Failure! " + effects.description;
    }
    
    // Update the suggestion as complete
    setSuggestions(prev => 
      prev.map(s => 
        s === suggestion 
          ? { ...s, rollComplete: true } 
          : s
      )
    );
    
    // Call the callback with the roll results
    onRollComplete(
      suggestion.diceType,
      result,
      modifier,
      suggestion.type,
      suggestion.dc,
      effects
    );
  };
  
  // If no suggestions, don't render anything
  if (suggestions.length === 0) {
    return null;
  }
  
  return (
    <div className="dice-suggestions mt-4 space-y-2">
      {suggestions.filter(s => !s.rollComplete).map((suggestion, idx) => (
        <div key={idx} className="flex items-center">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2 bg-primary/5 border-primary/20 text-primary hover:bg-primary/10"
            onClick={() => handleRoll(suggestion)}
          >
            <DicesIcon className="h-4 w-4" />
            <span>
              {suggestion.type === "ability" ? "Ability Check: " : 
               suggestion.type === "skill" ? "Skill Check: " : 
               suggestion.type === "save" ? "Saving Throw: " : 
               suggestion.type === "attack" ? "Attack Roll: " : 
               suggestion.type === "damage" ? "Damage Roll: " : 
               suggestion.type === "initiative" ? "Initiative: " : 
               "Roll: "}
               
              {suggestion.ability && ABILITY_FULL[suggestion.ability.toUpperCase()] 
                ? ABILITY_FULL[suggestion.ability.toUpperCase()] 
                : suggestion.ability
                ? suggestion.ability.charAt(0).toUpperCase() + suggestion.ability.slice(1)
                : suggestion.diceType
              }
              
              {suggestion.dc ? ` (DC ${suggestion.dc})` : ""}
            </span>
          </Button>
          
          <Tooltip>
            <TooltipTrigger>
              <Info className="h-4 w-4 ml-2 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent className="max-w-sm">
              <p>
                Roll a {suggestion.diceType} for {suggestion.type}
                {suggestion.ability
                  ? ` (${suggestion.ability}) with modifier: ${getModifier(suggestion.ability)}`
                  : ""
                }
                {suggestion.dc
                  ? `. You need to meet or exceed ${suggestion.dc} to succeed.`
                  : ""
                }
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
      ))}
    </div>
  );
}