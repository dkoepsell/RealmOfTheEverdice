import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useDice } from '@/hooks/use-dice';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dice5, Dice2, Info, Target } from 'lucide-react';

export type DiceType = 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20';

interface DiceProps {
  diceType: DiceType;
  onRoll?: (result: number) => void;
}

// Individual die component with rolling animation
const Die = ({ diceType, onRoll }: DiceProps) => {
  const { rollDice, isRolling } = useDice();
  
  const handleClick = () => {
    const result = rollDice(diceType);
    if (onRoll) onRoll(result);
  };
  
  const getIcon = () => {
    switch (diceType) {
      case 'd20':
        return <Dice5 className="h-8 w-8" />;
      default:
        return <Dice2 className="h-8 w-8" />;
    }
  };
  
  return (
    <Button 
      variant="outline" 
      onClick={handleClick}
      className={`dice p-2 rounded bg-parchment border border-accent hover:bg-accent/20 flex items-center justify-center ${isRolling ? 'dice-rolling' : ''}`}
      disabled={isRolling}
    >
      {getIcon()}
    </Button>
  );
};

interface DiceRollerProps {
  characterName: string;
  onRollResult?: (type: DiceType, result: number, modifier?: number, purpose?: string, threshold?: number) => void;
  characterModifiers?: Record<string, number>;
}

export const DiceRoller = ({ characterName, onRollResult, characterModifiers }: DiceRollerProps) => {
  const [lastRoll, setLastRoll] = useState<{
    type: DiceType;
    result: number;
    total?: number;
    modifier?: number;
    context?: string;
  } | null>(null);
  
  const [rollPurpose, setRollPurpose] = useState<string>("general");
  const [rollDC, setRollDC] = useState<number | undefined>(undefined);
  
  const diceTypes: DiceType[] = ['d4', 'd6', 'd8', 'd10', 'd12', 'd20'];
  
  const getPurposeLabel = (purpose: string): string => {
    switch (purpose) {
      case "attack": return "Attack Roll";
      case "saving": return "Saving Throw";
      case "skill": return "Skill Check";
      case "ability": return "Ability Check";
      case "damage": return "Damage Roll";
      case "initiative": return "Initiative";
      default: return "General Roll";
    }
  };
  
  const handleRoll = (type: DiceType, result: number) => {
    let modifier = 0;
    let context = '';
    let purpose = getPurposeLabel(rollPurpose);
    
    if (type === 'd20' && characterModifiers) {
      // For ability checks, apply relevant modifier
      if (rollPurpose === "ability" || rollPurpose === "skill") {
        const modName = 'STR'; // This would be dynamic based on the selected skill
        modifier = characterModifiers[modName] || 0;
        context = `${purpose} (DC ${rollDC || 'N/A'}) + ${modifier} (${modName}) = ${result + modifier}`;
      } else if (rollPurpose === "attack") {
        modifier = characterModifiers["STR"] || 0; // Or DEX for ranged
        context = `${purpose} + ${modifier} = ${result + modifier}`;
      } else if (rollPurpose === "saving") {
        const saveName = "DEX"; // This would be dynamic based on the save type
        modifier = characterModifiers[saveName] || 0;
        context = `${purpose} (DC ${rollDC || 'N/A'}) + ${modifier} (${saveName}) = ${result + modifier}`;
      } else if (rollPurpose === "initiative") {
        modifier = characterModifiers["DEX"] || 0;
        context = `${purpose} + ${modifier} = ${result + modifier}`;
      } else {
        context = `${purpose}`;
      }
    } else if (type !== 'd20' && rollPurpose === "damage") {
      context = 'Damage Roll';
    } else {
      context = `${purpose}`;
    }
    
    const newRoll = {
      type,
      result,
      total: result + (modifier || 0),
      modifier,
      context
    };
    
    setLastRoll(newRoll);
    
    if (onRollResult) {
      onRollResult(type, result, modifier, purpose, rollDC);
    }
  };
  
  return (
    <Card className="medieval-border bg-parchment">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-medieval text-secondary">Dice Roller</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-3 space-y-2">
          <div className="flex gap-2">
            <Select value={rollPurpose} onValueChange={setRollPurpose}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Roll Purpose" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General Roll</SelectItem>
                <SelectItem value="attack">Attack Roll</SelectItem>
                <SelectItem value="saving">Saving Throw</SelectItem>
                <SelectItem value="skill">Skill Check</SelectItem>
                <SelectItem value="ability">Ability Check</SelectItem>
                <SelectItem value="damage">Damage Roll</SelectItem>
                <SelectItem value="initiative">Initiative</SelectItem>
              </SelectContent>
            </Select>
            
            {(rollPurpose === "saving" || rollPurpose === "skill" || rollPurpose === "ability") && (
              <Select 
                value={rollDC ? rollDC.toString() : undefined} 
                onValueChange={(value) => setRollDC(parseInt(value))}
              >
                <SelectTrigger className="w-24">
                  <SelectValue placeholder="DC" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">DC 5</SelectItem>
                  <SelectItem value="10">DC 10</SelectItem>
                  <SelectItem value="15">DC 15</SelectItem>
                  <SelectItem value="20">DC 20</SelectItem>
                  <SelectItem value="25">DC 25</SelectItem>
                  <SelectItem value="30">DC 30</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
          
          <div className="text-xs text-muted-foreground flex items-center">
            <Info className="h-3 w-3 mr-1" />
            <span>Rolling as {characterName}</span>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-3 mb-4">
          {diceTypes.map((type) => (
            <Die 
              key={type} 
              diceType={type} 
              onRoll={(result) => handleRoll(type, result)} 
            />
          ))}
        </div>
        
        {lastRoll && (
          <div className="bg-darkBrown/10 rounded-lg p-3">
            <div className="flex justify-between mb-2">
              <span className="font-medieval">Last Roll</span>
              <span className="font-bold">
                {lastRoll.type}: {lastRoll.result}
              </span>
            </div>
            {lastRoll.context && (
              <div className="text-sm italic">
                {lastRoll.context}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DiceRoller;
