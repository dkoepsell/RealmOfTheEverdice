import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useDice } from '@/hooks/use-dice';
import { Dice5, Dice2 } from 'lucide-react';

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
  onRollResult?: (type: DiceType, result: number, modifier?: number) => void;
  characterModifiers?: Record<string, number>;
}

export const DiceRoller = ({ onRollResult, characterModifiers }: DiceRollerProps) => {
  const [lastRoll, setLastRoll] = useState<{
    type: DiceType;
    result: number;
    total?: number;
    modifier?: number;
    context?: string;
  } | null>(null);
  
  const diceTypes: DiceType[] = ['d4', 'd6', 'd8', 'd10', 'd12', 'd20'];
  
  const handleRoll = (type: DiceType, result: number) => {
    let modifier = 0;
    let context = '';
    
    if (type === 'd20' && characterModifiers) {
      // For ability checks, apply relevant modifier
      const modName = 'STR'; // This would be dynamic based on the check type
      modifier = characterModifiers[modName] || 0;
      context = `Ability check + ${modifier} (${modName}) = ${result + modifier}`;
    } else if (type !== 'd20' && characterModifiers) {
      context = 'Damage roll';
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
      onRollResult(type, result, modifier);
    }
  };
  
  return (
    <Card className="medieval-border bg-parchment">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-medieval text-secondary">Dice Roller</CardTitle>
      </CardHeader>
      <CardContent>
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
