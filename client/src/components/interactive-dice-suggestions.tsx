import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useDice, rollDice as diceRoll, DiceType } from '@/hooks/use-dice';
import { Dice1, Dice3, Dice5, Dice6 } from 'lucide-react';
import { Character, CharacterStats } from '@shared/schema';

interface DiceSuggestion {
  type: string;      // "skill", "attack", "save", etc.
  skill?: string;    // For skill checks: "strength", "dexterity", etc.
  dc?: number;       // Difficulty class for checks/saves
  bonus?: number;    // Additional bonus to apply
  targetAC?: number; // For attack rolls
  damage?: string;   // Damage formula for attack rolls
  description: string; // What this roll is for
}

interface InteractiveDiceSuggestionsProps {
  narrative: string;
  character?: Character;
  onRollComplete?: (result: DiceRollResult) => void;
}

interface DiceRollResult {
  suggestion: DiceSuggestion;
  roll: number;
  total: number;
  success: boolean;
  critical?: 'success' | 'failure';
  damage?: number;
}

// Helper to extract ability modifier from character stats
const getAbilityModifier = (stats: CharacterStats | undefined, ability: string): number => {
  if (!stats) return 0;
  
  let score = 0;
  switch (ability.toLowerCase()) {
    case 'strength': score = stats.strength; break;
    case 'dexterity': score = stats.dexterity; break;
    case 'constitution': score = stats.constitution; break;
    case 'intelligence': score = stats.intelligence; break;
    case 'wisdom': score = stats.wisdom; break;
    case 'charisma': score = stats.charisma; break;
    default: return 0;
  }
  
  // D&D 5e ability modifier formula: (score - 10) / 2, rounded down
  return Math.floor((score - 10) / 2);
};

// Helper to process damage dice expressions like "2d6+3"
const rollDamage = (damageFormula: string): number => {
  if (!damageFormula) return 0;
  
  try {
    // Parse the formula (format like "2d6+3")
    const match = damageFormula.match(/(\d+)d(\d+)(?:([+-])(\d+))?/);
    if (!match) return 0;
    
    const [_, numDice, dieSize, operator, modifier] = match;
    let total = 0;
    
    // Roll the dice
    for (let i = 0; i < parseInt(numDice); i++) {
      total += Math.floor(Math.random() * parseInt(dieSize)) + 1;
    }
    
    // Apply modifier if present
    if (modifier) {
      if (operator === '+') {
        total += parseInt(modifier);
      } else if (operator === '-') {
        total -= parseInt(modifier);
      }
    }
    
    return total;
  } catch (error) {
    console.error('Error parsing damage formula:', error);
    return 0;
  }
};



export function InteractiveDiceSuggestions({ narrative, character, onRollComplete }: InteractiveDiceSuggestionsProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentSuggestion, setCurrentSuggestion] = useState<DiceSuggestion | null>(null);
  const [rollResult, setRollResult] = useState<DiceRollResult | null>(null);
  
  const { roll } = useDice();
  
  // Parse narrative for dice suggestions
  // This is a simple parser - in a real implementation you would use a more robust solution
  const diceSuggestions = React.useMemo(() => {
    const suggestions: DiceSuggestion[] = [];
    
    // Pattern for skill checks: "make a DC 15 Strength check"
    const skillCheckPattern = /make a (DC (\d+) )?([A-Za-z]+) check/gi;
    let match;
    
    while ((match = skillCheckPattern.exec(narrative)) !== null) {
      suggestions.push({
        type: 'skill',
        skill: match[3].toLowerCase(),
        dc: match[2] ? parseInt(match[2]) : undefined,
        description: match[0]
      });
    }
    
    // Pattern for saving throws: "make a DC 12 Dexterity saving throw"
    const savePattern = /make a (DC (\d+) )?([A-Za-z]+) saving throw/gi;
    while ((match = savePattern.exec(narrative)) !== null) {
      suggestions.push({
        type: 'save',
        skill: match[3].toLowerCase(),
        dc: match[2] ? parseInt(match[2]) : undefined,
        description: match[0]
      });
    }
    
    // Pattern for attack rolls: "make an attack roll"
    const attackPattern = /make an attack roll( against AC (\d+))?/gi;
    while ((match = attackPattern.exec(narrative)) !== null) {
      suggestions.push({
        type: 'attack',
        targetAC: match[2] ? parseInt(match[2]) : undefined,
        damage: '1d8+3', // Default damage formula, would be based on character's weapon
        description: match[0]
      });
    }
    
    return suggestions;
  }, [narrative]);
  
  const handleRollClick = (suggestion: DiceSuggestion) => {
    setCurrentSuggestion(suggestion);
    setIsModalOpen(true);
  };
  
  const performRoll = () => {
    if (!currentSuggestion) return;
    
    // Roll d20
    const d20Result = rollDice(20);
    let total = d20Result;
    let success = false;
    let critical: 'success' | 'failure' | undefined = undefined;
    let damageRoll: number | undefined = undefined;
    
    // Critical hit/failure
    if (d20Result === 20) {
      critical = 'success';
    } else if (d20Result === 1) {
      critical = 'failure';
    }
    
    // Add relevant modifiers
    if (currentSuggestion.type === 'skill' || currentSuggestion.type === 'save') {
      const abilityMod = currentSuggestion.skill ? 
        getAbilityModifier(character?.stats, currentSuggestion.skill) : 0;
      
      total += abilityMod;
      
      // Add any additional bonus
      if (currentSuggestion.bonus) {
        total += currentSuggestion.bonus;
      }
      
      // Check for success against DC
      if (currentSuggestion.dc) {
        success = total >= currentSuggestion.dc;
      }
    } else if (currentSuggestion.type === 'attack') {
      // For attacks, add relevant ability modifier (assuming strength for melee)
      const abilityMod = getAbilityModifier(character?.stats, 'strength');
      total += abilityMod;
      
      // Add any additional bonus (like proficiency)
      if (currentSuggestion.bonus) {
        total += currentSuggestion.bonus;
      }
      
      // Check for hit against AC
      if (currentSuggestion.targetAC) {
        success = total >= currentSuggestion.targetAC;
      }
      
      // Roll damage if hit or critical
      if (success || critical === 'success') {
        if (currentSuggestion.damage) {
          damageRoll = rollDamage(currentSuggestion.damage);
          
          // Double damage on critical hit
          if (critical === 'success') {
            damageRoll *= 2;
          }
        }
      }
    }
    
    const result: DiceRollResult = {
      suggestion: currentSuggestion,
      roll: d20Result,
      total,
      success,
      critical,
      damage: damageRoll
    };
    
    setRollResult(result);
    
    // Notify parent
    if (onRollComplete) {
      onRollComplete(result);
    }
  };
  
  const getSkillIcon = () => {
    return <Dice5 className="h-4 w-4" />;
  };
  
  const getSaveIcon = () => {
    return <Dice3 className="h-4 w-4" />;
  };
  
  const getAttackIcon = () => {
    return <Dice6 className="h-4 w-4" />;
  };
  
  const getIconForSuggestion = (suggestion: DiceSuggestion) => {
    switch (suggestion.type) {
      case 'skill': return getSkillIcon();
      case 'save': return getSaveIcon();
      case 'attack': return getAttackIcon();
      default: return <Dice1 className="h-4 w-4" />;
    }
  };
  
  const closeModal = () => {
    setIsModalOpen(false);
    setRollResult(null);
  };
  
  if (diceSuggestions.length === 0) {
    return null;
  }
  
  return (
    <>
      <div className="my-3 p-3 border rounded-md bg-muted">
        <h3 className="text-sm font-semibold mb-2">Suggested Dice Rolls</h3>
        <div className="flex flex-wrap gap-2">
          {diceSuggestions.map((suggestion, index) => (
            <TooltipProvider key={index}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="flex items-center gap-1"
                    onClick={() => handleRollClick(suggestion)}
                  >
                    {getIconForSuggestion(suggestion)}
                    <span className="text-xs">
                      {suggestion.type === 'skill' ? 'Skill Check' : 
                        suggestion.type === 'save' ? 'Saving Throw' : 
                          suggestion.type === 'attack' ? 'Attack Roll' : 
                            'Roll'
                      }
                    </span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-sm">{suggestion.description}</p>
                  {suggestion.dc && <p className="text-xs">DC {suggestion.dc}</p>}
                  {suggestion.targetAC && <p className="text-xs">Target AC {suggestion.targetAC}</p>}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>
      </div>
      
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {currentSuggestion?.type === 'skill' ? `${currentSuggestion.skill} Check` : 
                currentSuggestion?.type === 'save' ? `${currentSuggestion.skill} Saving Throw` : 
                  currentSuggestion?.type === 'attack' ? 'Attack Roll' : 
                    'Dice Roll'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <p className="mb-3">{currentSuggestion?.description}</p>
            
            {rollResult ? (
              <div className="space-y-2">
                <div className="p-3 bg-muted rounded-md text-center">
                  <div className="text-3xl font-bold mb-1">
                    {rollResult.roll}
                  </div>
                  <p className="text-sm">on d20</p>
                </div>
                
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm">Total: <span className="font-semibold">{rollResult.total}</span></p>
                    {(currentSuggestion?.dc || currentSuggestion?.targetAC) && (
                      <p className="text-sm">
                        Result: <span className={`font-bold ${rollResult.success ? 'text-green-500' : 'text-red-500'}`}>
                          {rollResult.success ? 'Success!' : 'Failure!'}
                        </span>
                      </p>
                    )}
                    {rollResult.critical && (
                      <p className={`text-sm font-semibold ${rollResult.critical === 'success' ? 'text-amber-500' : 'text-red-600'}`}>
                        {rollResult.critical === 'success' ? 'Critical Success!' : 'Critical Failure!'}
                      </p>
                    )}
                  </div>
                  
                  {rollResult.damage !== undefined && (
                    <div className="p-3 bg-muted rounded-md text-center">
                      <div className="text-2xl font-bold mb-1">
                        {rollResult.damage}
                      </div>
                      <p className="text-sm">damage</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center my-4">
                <Button onClick={performRoll}>Roll d20</Button>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={closeModal}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}