import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

export interface CombatParticipant {
  id: string;
  name: string;
  type: 'ally' | 'enemy' | 'neutral';
  initiative: number;
  hp: number;
  maxHp: number;
  ac: number;
  conditions: string[];
  lastRoll?: {
    type: string;
    result: number;
    total: number;
    success?: boolean;
  };
}

export interface CombatLoot {
  id: string;
  name: string;
  description?: string;
  type: string;
  quantity: number;
  weight?: number;
  value?: number;
  rarity?: string;
  source: string;
}

export const useCombatDetection = (narrativeContent: string) => {
  const [inCombat, setInCombat] = useState(false);
  const [combatRound, setCombatRound] = useState(1);
  const [combatTurn, setCombatTurn] = useState(0);
  const [detectedThreats, setDetectedThreats] = useState<CombatParticipant[]>([]);
  const [detectedLoot, setDetectedLoot] = useState<CombatLoot[]>([]);

  useEffect(() => {
    // Don't reset detected threats when content changes if already in combat
    if (!inCombat) {
      setDetectedThreats([]);
    }
    
    if (!narrativeContent) return;
    
    // Check for combat indicators - expanded list with more common phrases
    const combatKeywords = [
      'initiative', 'roll for initiative', 'combat begins', 'battle starts',
      'draw your weapons', 'prepare for combat', 'attack', 'combat has begun',
      'hostile', 'enemy', 'enemies', 'fight', 'ambush', 'combat', 'battle',
      'draws weapon', 'readies weapon', 'attacks you', 'strikes', 'lunges',
      'roll initiative'
    ];
    
    const isCombatStarting = combatKeywords.some(keyword => 
      narrativeContent.toLowerCase().includes(keyword.toLowerCase())
    );
    
    // Check for combat ending indicators
    const combatEndingKeywords = [
      'combat ends', 'battle is over', 'fight is over', 'enemies defeated',
      'victory', 'combat has ended', 'the battle ends', 'defeated', 'won the battle',
      'retreat', 'flee', 'enemies are dead', 'vanquished', 'victorious'
    ];
    
    const isCombatEnding = combatEndingKeywords.some(keyword => 
      narrativeContent.toLowerCase().includes(keyword.toLowerCase())
    );
    
    if (isCombatStarting && !inCombat) {
      console.log("Combat detected! Setting inCombat to true");
      setInCombat(true);
      setCombatRound(1);
      setCombatTurn(0);
    } else if (isCombatEnding && inCombat) {
      console.log("Combat ending detected! Setting inCombat to false");
      setInCombat(false);
    }
    
    // Look for enemy descriptions - enhanced pattern to catch more enemy types
    const enemyRegexes = [
      // Standard pattern
      /(?:a|an|the)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:appears|attacks|emerges|charges|lunges|strikes|advances)/gi,
      // Monster type pattern
      /(?:a|an|the)\s+(?:group of|pack of|horde of|band of)?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:appears|attack|emerge|surround|ambush)/gi,
      // Enemy with descriptor
      /(?:a|an|the)\s+(?:fierce|angry|vicious|massive|towering|menacing)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi,
      // General hostile entities
      /(?:hostile|enemy)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi
    ];
    
    let allMatches: RegExpMatchArray[] = [];
    enemyRegexes.forEach(regex => {
      const matches = [...narrativeContent.matchAll(regex)];
      allMatches = [...allMatches, ...matches];
    });
    
    const newThreats = allMatches.map(match => {
      const name = match[1];
      return {
        id: uuidv4(),
        name,
        type: 'enemy' as const,
        initiative: Math.floor(Math.random() * 20) + 1,
        hp: Math.floor(Math.random() * 30) + 20,
        maxHp: Math.floor(Math.random() * 30) + 20,
        ac: Math.floor(Math.random() * 5) + 12,
        conditions: []
      };
    });
    
    if (newThreats.length > 0) {
      setDetectedThreats(prevThreats => {
        // Filter out duplicates (by name)
        const existingNames = prevThreats.map(threat => threat.name);
        const uniqueNewThreats = newThreats.filter(threat => !existingNames.includes(threat.name));
        return [...prevThreats, ...uniqueNewThreats];
      });
    }
    
    // Look for loot in the narrative
    detectLoot(narrativeContent);
    
  }, [narrativeContent, inCombat]);
  
  // Function to detect loot in narrative content
  const detectLoot = (content: string) => {
    // Look for "you find" or "you discover" patterns followed by item descriptions
    const lootRegexes = [
      /you (?:find|discover|obtained|receive|looted|acquired)(?:[^.!?]*?)(?:a|an|the|some) ([^.!?]*?)(?:\.|\!|\?)/gi,
      /(?:A|An|The) ([^.!?]*?)(?:was|were|is|are) (?:found|discovered|obtained|looted|in the pile|among the remains|inside|dropped)/gi,
      /treasure includes ([^.!?]*?)(?:\.|\!|\?)/gi,
      /loot consists of ([^.!?]*?)(?:\.|\!|\?)/gi,
      /dropped ([^.!?]*?)(?:\.|\!|\?)/gi
    ];
    
    let newLoot: CombatLoot[] = [];
    
    lootRegexes.forEach(regex => {
      const matches = [...content.matchAll(regex)];
      
      matches.forEach(match => {
        const lootDescription = match[1].trim();
        
        // Don't detect vague or short descriptions
        if (lootDescription.length < 3) return;
        
        // Parse the loot description to extract useful information
        const parseLoot = (description: string): CombatLoot | null => {
          // Skip very short descriptions
          if (description.length < 3) return null;
          
          // Try to identify common patterns
          const isGold = /(\d+)\s+(?:gold|silver|copper|platinum|gp|sp|cp|pp)\s+(?:pieces|coins)?/i.test(description);
          const isWeapon = /(sword|dagger|axe|mace|staff|wand|bow|arrow|crossbow|shield|armor)/i.test(description);
          const isArmor = /(armor|shield|helmet|gauntlet|boot|robe|cloak|amulet)/i.test(description);
          const isPotion = /(potion|elixir|vial|flask)/i.test(description);
          const isScroll = /(scroll|tome|book|spellbook)/i.test(description);
          const isGem = /(gem|ruby|emerald|sapphire|diamond|jewel|amulet|ring|necklace)/i.test(description);
          
          // Extract quantity
          const quantityMatch = description.match(/(\d+)\s+/);
          const quantity = quantityMatch ? parseInt(quantityMatch[1]) : 1;
          
          // Extract value if mentioned
          const valueMatch = description.match(/(?:worth|valued at)\s+(\d+)\s+(?:gold|gp)/i);
          const value = valueMatch ? parseInt(valueMatch[1]) : undefined;
          
          // Determine item type
          let type = 'Miscellaneous';
          if (isGold) type = 'Currency';
          else if (isWeapon) type = 'Weapon';
          else if (isArmor) type = 'Armor';
          else if (isPotion) type = 'Potion';
          else if (isScroll) type = 'Scroll';
          else if (isGem) type = 'Treasure';
          
          // Determine rarity if mentioned
          let rarity: string | undefined;
          if (/(common)/i.test(description)) rarity = 'Common';
          else if (/(uncommon)/i.test(description)) rarity = 'Uncommon';
          else if (/(rare)/i.test(description)) rarity = 'Rare';
          else if (/(very rare)/i.test(description)) rarity = 'Very Rare';
          else if (/(legendary)/i.test(description)) rarity = 'Legendary';
          
          // Extract the enemy/container the loot came from
          const sourceMatch = content.match(/(?:from|dropped by|belonging to)\s+(?:a|an|the)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i);
          let source = sourceMatch ? sourceMatch[1] : "Unknown";
          
          // Clean up the item name
          let name = description;
          if (quantityMatch) {
            name = name.replace(quantityMatch[0], '');
          }
          name = name.replace(/^(?:a|an|the)\s+/i, '').trim();
          
          // Make first letter uppercase
          name = name.charAt(0).toUpperCase() + name.slice(1);
          
          return {
            id: uuidv4(),
            name,
            type,
            quantity,
            value,
            rarity,
            source,
            description: description !== name ? description : undefined
          };
        };
        
        const loot = parseLoot(lootDescription);
        if (loot) {
          newLoot.push(loot);
        }
      });
    });
    
    if (newLoot.length > 0) {
      setDetectedLoot(prevLoot => {
        // Filter out duplicates by name
        const existingNames = prevLoot.map(item => item.name);
        const uniqueNewLoot = newLoot.filter(item => !existingNames.includes(item.name));
        return [...prevLoot, ...uniqueNewLoot];
      });
    }
  };
  
  return {
    inCombat,
    setInCombat,
    combatRound,
    setCombatRound,
    combatTurn,
    setCombatTurn,
    detectedThreats,
    detectedLoot
  };
};