import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useDice, DiceType, DiceRoll, DiceRequest, rollDice } from '@/hooks/use-dice';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Dice5, Dice2, Dice1, Dice3, Dice4, Dice6, Info, Target, PlusCircle, MinusCircle, AlertCircle, HelpCircle } from 'lucide-react';

// No need to re-export these anymore as we're importing directly from the source

interface DiceProps {
  diceType: DiceType;
  onRoll?: (result: number) => void;
}

// Individual die component with rolling animation
const Die = ({ diceType, onRoll }: DiceProps) => {
  const { roll } = useDice();
  const [animating, setAnimating] = useState(false);
  
  const handleClick = () => {
    setAnimating(true);
    
    // Roll using our new dice hook
    const diceRoll = roll({
      type: diceType,
      count: 1
    });
    
    // Pass the result immediately to the parent component
    if (onRoll) onRoll(diceRoll.result);
    
    // Reset animation when it completes
    setTimeout(() => {
      setAnimating(false);
    }, 800); // Same duration as in CSS animation
  };
  
  const getIcon = () => {
    switch (diceType) {
      case 'd4':
        return <Dice4 className="h-8 w-8" />;
      case 'd6':
        return <Dice6 className="h-8 w-8" />;
      case 'd8':
        return <Dice3 className="h-8 w-8" />;
      case 'd10':
        return <Dice4 className="h-8 w-8" />;
      case 'd12':
        return <Dice5 className="h-8 w-8" />;
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
      className={`dice p-2 rounded bg-parchment border border-accent hover:bg-accent/20 flex items-center justify-center ${animating ? 'dice-rolling' : ''}`}
      disabled={animating}
    >
      {getIcon()}
    </Button>
  );
};

interface DiceRollerProps {
  characterName: string;
  onRollResult?: (type: DiceType, result: number, modifier?: number, purpose?: string, threshold?: number) => void;
  characterModifiers?: Record<string, number>;
  // New prop for indicating that a roll is being requested
  requestedRoll?: {
    type: DiceType;
    purpose: string;
    dc?: number;
    count?: number;
    description?: string;
  };
}

export const DiceRoller = ({ 
  characterName, 
  onRollResult, 
  characterModifiers,
  requestedRoll 
}: DiceRollerProps) => {
  const [lastRoll, setLastRoll] = useState<{
    type: DiceType;
    result: number;
    total?: number;
    modifier?: number;
    context?: string;
  } | null>(null);
  
  const [rollPurpose, setRollPurpose] = useState<string>("general");
  const [rollDC, setRollDC] = useState<number | undefined>(undefined);
  const [diceCount, setDiceCount] = useState<number>(1);
  // Initialize autoRoll from localStorage if available
  const [autoRollEnabled, setAutoRollEnabled] = useState<boolean>(() => {
    const savedValue = localStorage.getItem('diceRollerAutoRoll');
    return savedValue === 'true';
  });
  const [rollPrompt, setRollPrompt] = useState<string | null>(null);
  
  const diceTypes: DiceType[] = ['d4', 'd6', 'd8', 'd10', 'd12', 'd20'];
  
  const { roll } = useDice();
  
  // Function to handle auto-rolling based on requested roll
  const handleRequestedRoll = () => {
    if (!requestedRoll || !autoRollEnabled) return;
    
    // Handle multi-dice rolls
    if ((requestedRoll.count || 1) > 1) {
      // Use our new dice hook
      const diceRoll = roll({
        type: requestedRoll.type,
        count: requestedRoll.count || 1,
        purpose: getPurposeLabel(requestedRoll.purpose),
        dc: requestedRoll.dc
      });
      
      // Get the last individual roll result
      const lastResult = diceRoll.rolls ? diceRoll.rolls[diceRoll.rolls.length - 1] : diceRoll.result;
      
      // Create context for multi-dice rolls
      let modifier = 0;
      let context = '';
      let purpose = getPurposeLabel(requestedRoll.purpose);
      
      if (requestedRoll.purpose === "damage") {
        context = `Damage Roll: ${diceRoll.rolls?.join(' + ')} = ${diceRoll.result}`;
      } else {
        context = `${purpose} with ${requestedRoll.count || 1} dice: ${diceRoll.rolls?.join(', ')} (Total: ${diceRoll.result})`;
      }
      
      const newRoll = {
        type: requestedRoll.type,
        result: lastResult,
        total: diceRoll.result,
        modifier: diceRoll.modifier || 0,
        context
      };
      
      setLastRoll(newRoll);
      
      if (onRollResult) {
        onRollResult(
          requestedRoll.type, 
          lastResult, 
          diceRoll.modifier || 0, 
          `${purpose} (${requestedRoll.count || 1} dice)`, 
          requestedRoll.dc
        );
      }
    } else {
      // Single dice roll
      const diceRoll = roll({
        type: requestedRoll.type,
        purpose: getPurposeLabel(requestedRoll.purpose),
        dc: requestedRoll.dc
      });
      
      handleRoll(requestedRoll.type, diceRoll.rolls ? diceRoll.rolls[0] : diceRoll.result);
    }
  };
  
  // Handle requested roll data
  useEffect(() => {
    if (requestedRoll) {
      setRollPurpose(requestedRoll.purpose);
      setRollDC(requestedRoll.dc);
      setDiceCount(requestedRoll.count || 1);
      setRollPrompt(requestedRoll.description || `Roll ${requestedRoll.count || 1}${requestedRoll.type} for ${getPurposeLabel(requestedRoll.purpose)}`);
      
      // Auto-roll if enabled
      handleRequestedRoll();
    }
  }, [requestedRoll]);
  
  // Handle changes to auto-roll setting
  useEffect(() => {
    if (autoRollEnabled && requestedRoll) {
      handleRequestedRoll();
    }
  }, [autoRollEnabled]);
  
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
    // Use our roll hook directly for single dice rolls with proper modifiers
    const diceRoll = roll({
      type,
      purpose: getPurposeLabel(rollPurpose),
      dc: rollDC,
      modifier: characterModifiers && 
        (type === 'd20' as DiceType || rollPurpose === "damage") ? 
        getModifierForRoll(type, rollPurpose) : 
        undefined
    });
    
    let modifier = diceRoll.modifier || 0;
    let context = '';
    let purpose = getPurposeLabel(rollPurpose);
    
    // Build context based on roll purpose and type
    if (type === 'd20' as DiceType) {
      if (rollPurpose === "ability" || rollPurpose === "skill") {
        const modName = 'STR'; // This would be dynamic based on the selected skill
        context = `${purpose} (DC ${rollDC || 'N/A'}) + ${modifier} (${modName}) = ${diceRoll.result}`;
      } else if (rollPurpose === "attack") {
        context = `${purpose} + ${modifier} = ${diceRoll.result}`;
      } else if (rollPurpose === "saving") {
        const saveName = "DEX"; // This would be dynamic based on the save type
        context = `${purpose} (DC ${rollDC || 'N/A'}) + ${modifier} (${saveName}) = ${diceRoll.result}`;
      } else if (rollPurpose === "initiative") {
        context = `${purpose} + ${modifier} = ${diceRoll.result}`;
      } else {
        context = `${purpose}`;
      }
    } else if (rollPurpose === "damage") {
      context = 'Damage Roll';
    } else {
      context = `${purpose}`;
    }
    
    // Create a custom roll object to display in the UI
    const newRoll = {
      type,
      result: diceRoll.rolls ? diceRoll.rolls[0] : diceRoll.result,
      total: diceRoll.result,
      modifier,
      context
    };
    
    setLastRoll(newRoll);
    
    if (onRollResult) {
      onRollResult(type, newRoll.result, modifier, purpose, rollDC);
    }
  };
  
  // Handle dice count change
  const handleDiceCountChange = (change: number) => {
    const newCount = Math.max(1, Math.min(10, diceCount + change));
    setDiceCount(newCount);
  };
  
  // Handle multiple dice rolls
  const handleMultipleRolls = (type: DiceType) => {
    // Use our new dice hook for multiple dice
    const diceRoll = roll({
      type,
      count: diceCount,
      purpose: getPurposeLabel(rollPurpose),
      dc: rollDC,
      modifier: characterModifiers && 
        (type === 'd20' as DiceType || rollPurpose === "damage") ? 
        getModifierForRoll(type, rollPurpose) : 
        undefined
    });
    
    // Use the last result as the "main" result, but track the total
    const lastResult = diceRoll.rolls ? diceRoll.rolls[diceRoll.rolls.length - 1] : diceRoll.result;
    
    let modifier = diceRoll.modifier || 0;
    let context = '';
    let purpose = getPurposeLabel(rollPurpose);
    
    // Create context specific to multiple dice
    if (rollPurpose === "damage") {
      context = `Damage Roll: ${diceRoll.rolls?.join(' + ')} = ${diceRoll.result}`;
    } else {
      context = `${purpose} with ${diceCount} dice: ${diceRoll.rolls?.join(', ')} (Total: ${diceRoll.result})`;
    }
    
    const newRoll = {
      type,
      result: lastResult,
      total: diceRoll.result,
      modifier,
      context
    };
    
    setLastRoll(newRoll);
    
    if (onRollResult) {
      onRollResult(type, lastResult, modifier, `${purpose} (${diceCount} dice)`, rollDC);
    }
  };
  
  // Helper function to get the appropriate modifier based on roll type and purpose
  const getModifierForRoll = (type: DiceType, purpose: string): number => {
    if (!characterModifiers) return 0;
    
    if (type === 'd20' as DiceType) {
      if (purpose === "ability" || purpose === "skill") {
        // This would be dynamic based on the selected skill
        return characterModifiers["STR"] || 0;
      } else if (purpose === "attack") {
        return characterModifiers["STR"] || 0; // Or DEX for ranged
      } else if (purpose === "saving") {
        // This would be dynamic based on the save type
        return characterModifiers["DEX"] || 0;
      } else if (purpose === "initiative") {
        return characterModifiers["DEX"] || 0;
      }
    }
    
    return 0;
  };
  
  return (
    <Card className="medieval-border bg-parchment">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-medieval text-secondary">Dice Roller</CardTitle>
        {rollPrompt && (
          <CardDescription className="mt-1 p-2 bg-amber-100 border border-amber-300 rounded-md text-amber-800 font-medieval animate-pulse">
            <AlertCircle className="inline-block h-4 w-4 mr-1 mb-1" />
            {rollPrompt}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        {/* Auto-roll toggle */}
        <div className="mb-3 flex items-center justify-between space-x-2 p-2 bg-secondary/5 rounded-md">
          <div className="flex flex-col">
            <Label htmlFor="auto-roll" className="text-sm font-semibold">
              Auto-Roll
            </Label>
            <span className="text-xs text-muted-foreground">
              Automatically roll dice when prompted
            </span>
          </div>
          <Switch 
            id="auto-roll" 
            checked={autoRollEnabled} 
            onCheckedChange={(value) => {
              setAutoRollEnabled(value);
              localStorage.setItem('diceRollerAutoRoll', value.toString());
            }}
          />
        </div>
        
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
          
          {/* Dice count selector */}
          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground flex items-center">
              <Info className="h-3 w-3 mr-1" />
              <span>Rolling as {characterName}</span>
            </div>
            
            <div className="flex items-center space-x-1">
              <Label htmlFor="dice-count" className="text-xs mr-1">Dice:</Label>
              <Button 
                type="button" 
                variant="outline" 
                size="icon" 
                className="h-6 w-6"
                onClick={() => handleDiceCountChange(-1)}
                disabled={diceCount <= 1}
              >
                <MinusCircle className="h-3 w-3" />
              </Button>
              <Badge variant="outline" className="px-2 h-6">
                {diceCount}
              </Badge>
              <Button 
                type="button" 
                variant="outline" 
                size="icon" 
                className="h-6 w-6"
                onClick={() => handleDiceCountChange(1)}
                disabled={diceCount >= 10}
              >
                <PlusCircle className="h-3 w-3" />
              </Button>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6 text-muted-foreground"
                    >
                      <HelpCircle className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Select how many dice to roll at once (1-10)</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-3 mb-4">
          {diceTypes.map((type) => (
            <Die 
              key={type} 
              diceType={type} 
              onRoll={diceCount === 1 
                ? (result) => handleRoll(type, result) 
                : () => handleMultipleRolls(type)
              } 
            />
          ))}
        </div>
        
        {lastRoll && (
          <div className="bg-darkBrown/10 rounded-lg p-3">
            <div className="flex justify-between mb-2">
              <span className="font-medieval">Last Roll</span>
              <span className="font-bold">
                {diceCount > 1 ? `${diceCount}` : ""}{lastRoll.type}: {lastRoll.result}
                {lastRoll.total !== lastRoll.result && (
                  <span className="ml-1 text-muted-foreground">
                    (Total: {lastRoll.total})
                  </span>
                )}
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
