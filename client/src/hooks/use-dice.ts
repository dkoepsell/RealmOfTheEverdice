import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

export type DiceType = 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20' | 'd100';

export interface DiceRoll {
  id: string;
  type: DiceType;
  result: number;
  timestamp: Date;
  purpose?: string;
  total?: number;
  rolls?: number[];
  success?: boolean;
  criticalSuccess?: boolean;
  criticalFailure?: boolean;
  modifier?: number;
  dc?: number;
}

export interface DiceRequest {
  type: DiceType;
  count?: number;
  modifier?: number;
  purpose?: string;
  dc?: number;
}

// Helper function to roll a single die
export function rollDice(type: DiceType): number {
  const sides = parseInt(type.substring(1));
  return Math.floor(Math.random() * sides) + 1;
}

// Hook for dice rolling throughout the application
export function useDice() {
  const [rolls, setRolls] = useState<DiceRoll[]>([]);
  const [lastRoll, setLastRoll] = useState<DiceRoll | null>(null);

  // Function to roll dice with optional count, modifier and purpose
  const roll = useCallback((request: DiceRequest): DiceRoll => {
    const { type, count = 1, modifier = 0, purpose = '', dc } = request;
    
    // Perform the dice rolls
    const results: number[] = [];
    for (let i = 0; i < count; i++) {
      results.push(rollDice(type));
    }
    
    // Calculate the total result
    const baseTotal = results.reduce((sum, result) => sum + result, 0);
    const total = baseTotal + modifier;
    
    // Check for success/failure if DC is provided
    let success = undefined;
    if (dc !== undefined) {
      success = total >= dc;
    }
    
    // Determine critical success/failure for d20 rolls
    let criticalSuccess = false;
    let criticalFailure = false;
    
    if (type === 'd20') {
      if (count === 1) {
        criticalSuccess = results[0] === 20;
        criticalFailure = results[0] === 1;
      } else {
        // For advantage/disadvantage scenarios
        criticalSuccess = results.some(r => r === 20);
        criticalFailure = results.some(r => r === 1);
      }
    }
    
    // Create the roll object
    const rollObj: DiceRoll = {
      id: uuidv4(),
      type,
      result: total,
      timestamp: new Date(),
      purpose,
      total,
      rolls: results,
      success,
      criticalSuccess,
      criticalFailure,
      modifier,
      dc
    };
    
    // Update state
    setRolls(prev => [rollObj, ...prev]);
    setLastRoll(rollObj);
    
    return rollObj;
  }, []);
  
  // Function to clear roll history
  const clearRolls = useCallback(() => {
    setRolls([]);
    setLastRoll(null);
  }, []);
  
  return {
    rolls,
    lastRoll,
    roll,
    clearRolls
  };
}