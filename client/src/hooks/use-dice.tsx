import { useState } from "react";
import { useToast } from "./use-toast";

type DiceType = "d4" | "d6" | "d8" | "d10" | "d12" | "d20";

interface UseDiceReturn {
  rollDice: (type: DiceType) => number;
  rollResult: number | null;
  diceType: DiceType | null;
  isRolling: boolean;
  resetDice: () => void;
}

export function useDice(): UseDiceReturn {
  const [rollResult, setRollResult] = useState<number | null>(null);
  const [diceType, setDiceType] = useState<DiceType | null>(null);
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const { toast } = useToast();

  // Calculate the max value for a given dice type
  const getMaxValue = (type: DiceType): number => {
    switch (type) {
      case "d4":
        return 4;
      case "d6":
        return 6;
      case "d8":
        return 8;
      case "d10":
        return 10;
      case "d12":
        return 12;
      case "d20":
        return 20;
      default:
        return 6;
    }
  };

  // Roll a dice of the specified type
  const rollDice = (type: DiceType): number => {
    setIsRolling(true);
    setDiceType(type);
    
    // Simulate rolling animation time
    setTimeout(() => {
      const max = getMaxValue(type);
      const result = Math.floor(Math.random() * max) + 1;
      setRollResult(result);
      setIsRolling(false);
      
      // Show toast for critical rolls on d20
      if (type === "d20") {
        if (result === 20) {
          toast({
            title: "Critical Success!",
            description: "You rolled a natural 20!",
            variant: "default",
          });
        } else if (result === 1) {
          toast({
            title: "Critical Failure!",
            description: "You rolled a natural 1!",
            variant: "destructive",
          });
        }
      }
      
      return result;
    }, 800); // Match the animation duration

    // Return a temporary random number while animation is playing
    return Math.floor(Math.random() * getMaxValue(type)) + 1;
  };

  // Reset dice state
  const resetDice = () => {
    setRollResult(null);
    setDiceType(null);
    setIsRolling(false);
  };

  return {
    rollDice,
    rollResult,
    diceType,
    isRolling,
    resetDice,
  };
}
