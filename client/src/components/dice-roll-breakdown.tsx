import { useState } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { DicesIcon, Check, X, Info, Shield, Swords, Sparkles, Brain } from "lucide-react";
import { DiceType } from "./dice-roll";

interface DiceRollBreakdownProps {
  diceType: DiceType;
  result: number;
  modifier: number;
  purpose?: string;
  threshold?: number;
  context?: string;
  expanded?: boolean;
  onClose?: () => void;
}

export default function DiceRollBreakdown({
  diceType,
  result,
  modifier,
  purpose,
  threshold,
  context,
  expanded = false,
  onClose
}: DiceRollBreakdownProps) {
  const [isExpanded, setIsExpanded] = useState(expanded);
  
  const isCritical = result === 20 || result === 1;
  const isSuccess = threshold ? (result + modifier >= threshold) : true;
  const total = result + modifier;
  
  // Calculate the odds of this roll succeeding
  const calculateOdds = (): string => {
    if (!threshold) return "N/A";
    
    const diceMax = parseInt(diceType.substring(1));
    const requiredRoll = Math.max(1, threshold - modifier);
    const successCount = Math.max(0, diceMax - requiredRoll + 1);
    const percentage = (successCount / diceMax) * 100;
    
    return `${percentage.toFixed(1)}%`;
  };
  
  // Format the purpose for display
  const formatPurpose = (purpose?: string): string => {
    if (!purpose) return "General Roll";
    
    // Convert camelCase or snake_case to Title Case with spaces
    return purpose
      .replace(/([A-Z])/g, ' $1') // Add space before capital letters
      .replace(/_/g, ' ') // Replace underscores with spaces
      .replace(/^\w/, c => c.toUpperCase()) // Uppercase first letter
      .trim();
  };
  
  // Get explanatory text for the roll type
  const getRollExplanation = (): string => {
    switch (purpose) {
      case "attack":
        return "Attack rolls determine if your attack hits or misses. Roll a d20, add your attack bonus, and compare to the target's AC.";
      case "saving":
      case "save":
        return "Saving throws are made to resist effects. Roll a d20, add your saving throw bonus for the relevant ability, and compare to the DC.";
      case "skill":
        return "Skill checks test your character's abilities. Roll a d20, add your skill modifier, and compare to the DC set by the DM.";
      case "ability":
        return "Ability checks test your raw abilities. Roll a d20, add your ability modifier, and compare to the DC set by the DM.";
      case "initiative":
        return "Initiative determines turn order in combat. Roll a d20, add your Dexterity modifier, and the highest goes first.";
      case "damage":
        return `Damage rolls determine how much damage your attack deals. Roll the specified damage die (${diceType}) and add any modifiers.`;
      default:
        return `Rolling ${diceType} is used for various purposes in D&D, often to determine random outcomes or chances of success.`;
    }
  };
  
  // Get an icon for the roll type
  const getRollIcon = () => {
    switch (purpose) {
      case "attack":
        return <Swords className="h-4 w-4" />;
      case "saving":
      case "save":
        return <Shield className="h-4 w-4" />;
      case "initiative":
        return <Sparkles className="h-4 w-4" />;
      case "ability":
      case "skill":
        return <Brain className="h-4 w-4" />;
      default:
        return <DicesIcon className="h-4 w-4" />;
    }
  };
  
  return (
    <Card className={`w-full ${isCritical ? (result === 20 ? "border-green-400" : "border-red-400") : "border-muted"}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getRollIcon()}
            <span className="font-medium">{formatPurpose(purpose)}</span>
          </div>
          
          <div className="flex items-center gap-2">
            {threshold && (
              <Badge variant={isSuccess ? "default" : "destructive"} className="ml-auto">
                {isSuccess ? <Check className="h-3 w-3 mr-1" /> : <X className="h-3 w-3 mr-1" />}
                {isSuccess ? "Success" : "Failure"}
              </Badge>
            )}
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 w-6 p-0" 
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <Info className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="flex items-center gap-2 mt-2">
          <div className={`relative inline-flex items-center justify-center h-10 w-10 rounded-md font-bold text-lg ${
            result === 20 ? "bg-green-100 text-green-700" : 
            result === 1 ? "bg-red-100 text-red-700" : 
            "bg-muted/40"
          }`}>
            {result}
            <span className="absolute -top-1 -right-1 text-xs font-normal">{diceType}</span>
          </div>
          
          {modifier !== 0 && (
            <>
              <span className="text-muted-foreground">+</span>
              <div className="inline-flex items-center justify-center h-8 w-8 rounded-md bg-primary/10 text-primary font-medium text-sm">
                {modifier}
              </div>
            </>
          )}
          
          <span className="text-muted-foreground">=</span>
          
          <div className="inline-flex items-center justify-center h-10 w-10 rounded-md bg-primary/20 text-primary font-bold text-lg">
            {total}
          </div>
          
          {threshold && (
            <>
              <span className="text-muted-foreground">vs</span>
              <div className="inline-flex items-center justify-center h-10 w-10 rounded-md bg-muted font-medium text-sm">
                DC {threshold}
              </div>
            </>
          )}
        </div>
        
        {isExpanded && (
          <div className="mt-3 text-sm">
            <p className="text-muted-foreground">{getRollExplanation()}</p>
            
            {threshold && (
              <div className="mt-2 flex flex-col gap-1">
                <div className="flex justify-between">
                  <span>Chance of success:</span>
                  <span className="font-medium">{calculateOdds()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Needed to roll:</span>
                  <span className="font-medium">{Math.max(1, threshold - modifier)}+</span>
                </div>
              </div>
            )}
            
            {isCritical && (
              <div className="mt-2 p-2 rounded bg-muted/30">
                <p className="font-medium">
                  {result === 20 ? "Critical Success!" : "Critical Failure!"}
                </p>
                <p className="text-xs mt-1">
                  {result === 20 
                    ? "A natural 20 is always a critical success, often with additional beneficial effects."
                    : "A natural 1 is always a critical failure, often with additional negative consequences."
                  }
                </p>
              </div>
            )}
            
            {context && (
              <div className="mt-2 italic">
                {context}
              </div>
            )}
          </div>
        )}
      </CardContent>
      
      {expanded && onClose && (
        <CardFooter className="pt-0 px-4 pb-4">
          <Button variant="outline" size="sm" onClick={onClose} className="w-full">
            Close
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}