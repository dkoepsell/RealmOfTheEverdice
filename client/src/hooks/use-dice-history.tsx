import { useState, useEffect } from "react";
import { DiceType } from "@/components/dice-roll";
import { DiceRollResult } from "@/components/dice-roll-results";
import { v4 as uuidv4 } from 'uuid';

// Generate a UUID for unique identification of dice rolls
// If uuid package isn't installed, we'll use a simpler ID generator
const generateId = () => {
  try {
    return uuidv4();
  } catch (e) {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }
};

export function useDiceHistory(characterName: string) {
  const [rollHistory, setRollHistory] = useState<DiceRollResult[]>([]);
  
  // Add a new roll to the history
  const addRoll = (
    diceType: DiceType, 
    result: number, 
    modifier: number = 0,
    purpose?: string,
    threshold?: number
  ) => {
    const timestamp = new Date();
    const isSuccess = threshold !== undefined ? (result + modifier) >= threshold : undefined;
    
    const newRoll: DiceRollResult = {
      id: generateId(),
      characterName,
      diceType,
      result,
      modifier,
      total: result + modifier,
      timestamp,
      purpose,
      isSuccess,
      threshold
    };
    
    setRollHistory(prev => [newRoll, ...prev]);
    return newRoll;
  };
  
  // Clear roll history
  const clearRollHistory = () => {
    setRollHistory([]);
  };
  
  return {
    rollHistory,
    addRoll,
    clearRollHistory
  };
}

// This hook can be used at a campaign level to collect rolls from all characters
export function useCampaignDiceHistory() {
  const [campaignRolls, setCampaignRolls] = useState<DiceRollResult[]>([]);
  
  // Add a roll to the campaign history
  const addCampaignRoll = (roll: DiceRollResult) => {
    setCampaignRolls(prev => [roll, ...prev.slice(0, 49)]); // Keep only the last 50 rolls
  };
  
  // Clear campaign roll history
  const clearCampaignRolls = () => {
    setCampaignRolls([]);
  };
  
  return {
    campaignRolls,
    addCampaignRoll,
    clearCampaignRolls
  };
}