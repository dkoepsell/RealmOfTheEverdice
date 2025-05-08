import { useState, useEffect } from 'react';
import { CombatParticipant } from '@/components/battle-tracker';
import { v4 as uuidv4 } from 'uuid';

interface UseCombatDetectionProps {
  content: string;
  currentCharacter?: any;
  partyCharacters?: any[];
}

export function useCombatDetection({ 
  content, 
  currentCharacter, 
  partyCharacters = [] 
}: UseCombatDetectionProps) {
  const [inCombat, setInCombat] = useState(false);
  const [combatRound, setCombatRound] = useState(1);
  const [combatTurn, setCombatTurn] = useState(0);
  const [combatParticipants, setCombatParticipants] = useState<CombatParticipant[]>([]);
  const [availableLoot, setAvailableLoot] = useState<LootItem[]>([]);

  // Combat detection patterns
  const COMBAT_START_PATTERNS = [
    /combat begins/i,
    /initiative order/i,
    /roll(?:s|ed)? (?:for )?initiative/i,
    /battle starts/i,
    /enemies appear/i,
    /hostile creatures/i,
    /prepare for combat/i,
    /combat has begun/i,
    /attack(?:s|ed)?(?:.{1,30})you/i,
    /you are under attack/i,
    /you are ambushed/i,
    /you spot (?:.{1,20}) enemies/i,
    /you encounter (?:.{1,20}) enemies/i
  ];

  // Pattern to extract enemies from the text
  const ENEMY_EXTRACTION_PATTERN = /(?:You encounter|You face|You are attacked by|You spot)(?: a| an| some)? (.+?)(?:\.|\n|$)/i;

  // Enemy race/type patterns to assist in enemy identification
  const ENEMY_TYPES = [
    'goblin', 'orc', 'troll', 'dragon', 'zombie', 'skeleton', 'bandit',
    'cultist', 'kobold', 'wolf', 'bear', 'giant', 'undead', 'demon',
    'devil', 'elemental', 'gnoll', 'hobgoblin', 'ogre', 'spider', 'vampire',
    'werewolf', 'wraith', 'aberration', 'beast', 'construct', 'fey', 'fiend',
    'monstrosity', 'ooze', 'plant', 'bugbear', 'owlbear', 'harpy', 'minotaur',
    'griffon', 'manticore', 'chimera', 'hydra', 'beholder', 'mind flayer',
    'drow', 'duergar', 'guard', 'assassin', 'priest', 'mage', 'warlock',
    'barbarian', 'fighter', 'wizard', 'sorcerer', 'ranger', 'rogue', 'cleric'
  ];

  // Pattern to detect when combat is over
  const COMBAT_END_PATTERNS = [
    /combat(?:.{1,20})ends/i,
    /battle(?:.{1,20})over/i,
    /(?:enemies|foes)(?:.{1,30})(?:defeated|vanquished|slain)/i,
    /victory(?:.{1,20})yours/i,
    /all enemies(?:.{1,30})defeated/i,
    /combat has ended/i,
    /the fight is over/i,
    /(\d+) experience points/i,
    /you defeated the/i,
    /you (?:have )?(?:defeated|killed|vanquished|slain) all/i,
    /peace returns/i,
    /the threat has been (?:eliminated|neutralized)/i
  ];

  // Pattern to detect loot after combat
  const LOOT_PATTERNS = [
    /you found (?:a|an|some) (.+)/i,
    /(\w+) drops (?:a|an|some) (.+)/i,
    /among the remains you find (?:a|an|some) (.+)/i,
    /searching the (?:body|bodies|corpse|remains|area) reveals (?:a|an|some) (.+)/i,
    /(\w+) was carrying (?:a|an|some) (.+)/i,
    /looting the (?:.+) yields (?:a|an|some) (.+)/i,
    /you discover (?:a|an|some) (.+)/i
  ];

  // Extract HP pattern
  const HP_PATTERN = /(\d+) hit points/i;

  // Define the type for loot items
  interface LootItem {
    id: string;
    name: string;
    description: string;
    type: string;
    quantity: number;
    weight: number;
    value: number;
    source: string;
  }

  // Function to process loot from combat text
  const processLoot = (text: string) => {
    const newLoot: LootItem[] = [];

    for (const pattern of LOOT_PATTERNS) {
      const matches = text.match(new RegExp(pattern, 'g'));
      if (matches) {
        matches.forEach(match => {
          const itemMatch = match.match(pattern);
          if (itemMatch) {
            const source = itemMatch[1] || 'defeated enemy';
            const itemName = itemMatch[itemMatch.length - 1].trim();
            
            // Basic categorization of item type
            let itemType = 'miscellaneous';
            if (/sword|axe|bow|dagger|mace|staff|wand|club|hammer|spear|weapon/i.test(itemName)) {
              itemType = 'weapon';
            } else if (/armor|shield|helm|helmet|robe|cloak|gauntlet|glove|boot/i.test(itemName)) {
              itemType = 'armor';
            } else if (/potion|elixir|flask|vial/i.test(itemName)) {
              itemType = 'potion';
            } else if (/scroll|book|tome|grimoire/i.test(itemName)) {
              itemType = 'scroll';
            } else if (/ring|amulet|necklace|pendant|crown|circlet|jewel/i.test(itemName)) {
              itemType = 'trinket';
            } else if (/tool|kit|set|instrument/i.test(itemName)) {
              itemType = 'tool';
            }

            // Make a rough guess at the weight
            let weight = 1.0; // Default weight in pounds
            if (itemType === 'weapon') weight = 3.0;
            else if (itemType === 'armor') weight = 10.0;
            else if (itemType === 'potion') weight = 0.5;
            else if (itemType === 'scroll') weight = 0.1;
            
            // Make a rough guess at the value
            let value = 10; // Default value in gold pieces
            if (/rare|unique|magical|enchanted|ancient|legendary/i.test(itemName)) {
              value = 100;
            } else if (/fine|quality|valuable|silver|gold/i.test(itemName)) {
              value = 50;
            }
            
            newLoot.push({
              id: uuidv4(),
              name: itemName,
              description: `Found on ${source}`,
              type: itemType,
              quantity: 1,
              weight,
              value,
              source
            });
          }
        });
      }
    }

    if (newLoot.length > 0) {
      setAvailableLoot(prevLoot => [...prevLoot, ...newLoot]);
    }
  };

  // Function to initialize participant based on character data
  const createParticipantFromCharacter = (character: any, isActive: boolean = false): CombatParticipant => {
    return {
      id: character.id.toString(),
      name: character.name,
      initiative: Math.floor(Math.random() * 20) + 1 + (((character.stats?.dexterity || 10) - 10) / 2),
      isEnemy: false,
      isActive,
      hp: character.hp || character.maxHp || 10,
      maxHp: character.maxHp || 10,
      ac: 10 + Math.floor(((character.stats?.dexterity || 10) - 10) / 2),
      conditions: [],
      actions: ["Attack", "Cast Spell", "Dodge", "Disengage", "Help", "Hide", "Use Item"],
      race: character.race,
      class: character.class
    };
  };

  // Creates an enemy participant from name
  const createEnemyParticipant = (name: string): CombatParticipant => {
    // Roughly estimate enemy difficulty based on name
    const isBoss = /boss|leader|chief|lord|king|queen|master|champion|elder|ancient/i.test(name);
    const isPowerful = /powerful|mighty|fearsome|deadly|dangerous|elite/i.test(name);
    
    let hp = 10;
    let initiative = 10;
    let ac = 12;
    
    if (isBoss) {
      hp = 50 + Math.floor(Math.random() * 50);
      initiative = 12 + Math.floor(Math.random() * 8);
      ac = 16 + Math.floor(Math.random() * 3);
    } else if (isPowerful) {
      hp = 30 + Math.floor(Math.random() * 30);
      initiative = 10 + Math.floor(Math.random() * 8);
      ac = 14 + Math.floor(Math.random() * 2);
    } else {
      hp = 10 + Math.floor(Math.random() * 20);
      initiative = 8 + Math.floor(Math.random() * 6);
      ac = 12 + Math.floor(Math.random() * 2);
    }
    
    return {
      id: uuidv4(),
      name,
      initiative,
      isEnemy: true,
      isActive: false,
      hp,
      maxHp: hp,
      ac,
      conditions: [],
      actions: ["Attack", "Special Attack", "Dodge", "Move"]
    };
  };

  // Extract enemies from the text
  const extractEnemiesFromText = (text: string) => {
    // First, try to match the specific enemy extraction pattern
    const enemyMatch = text.match(ENEMY_EXTRACTION_PATTERN);
    if (enemyMatch && enemyMatch[1]) {
      const enemyText = enemyMatch[1];
      
      // Check if the text contains multiple enemies (comma or 'and' separated)
      const multipleEnemies = enemyText.split(/(?:,|\s+and\s+)/);
      
      return multipleEnemies.map(enemy => {
        return enemy.trim();
      }).filter(Boolean);
    }
    
    // If specific pattern fails, scan for known enemy types
    const enemies = [];
    for (const enemyType of ENEMY_TYPES) {
      const regex = new RegExp(`\\b((?:a|an|the|\\d+)\\s+${enemyType}(?:s|es)?)\\b`, 'gi');
      const matches = text.match(regex);
      if (matches) {
        enemies.push(...matches);
      }
    }
    
    return enemies.map(enemy => enemy.trim());
  };

  // Process new content for combat triggers
  useEffect(() => {
    if (!content) return;
    
    // Check for combat end if already in combat
    if (inCombat) {
      const isEnding = COMBAT_END_PATTERNS.some(pattern => pattern.test(content));
      if (isEnding) {
        // Process any loot before ending combat
        processLoot(content);
        
        // End combat mode
        setInCombat(false);
        setCombatRound(1);
        setCombatTurn(0);
        return;
      }
    }
    
    // Check for combat start
    const isStarting = !inCombat && COMBAT_START_PATTERNS.some(pattern => pattern.test(content));
    
    if (isStarting) {
      // Initialize combat
      const initialParticipants: CombatParticipant[] = [];
      
      // Add current player character
      if (currentCharacter) {
        initialParticipants.push(createParticipantFromCharacter(currentCharacter, true));
      }
      
      // Add party members
      partyCharacters.forEach(character => {
        if (character.id !== currentCharacter?.id) {
          initialParticipants.push(createParticipantFromCharacter(character));
        }
      });
      
      // Extract and add enemies
      const enemies = extractEnemiesFromText(content);
      enemies.forEach(enemyName => {
        initialParticipants.push(createEnemyParticipant(enemyName));
      });
      
      // Sort by initiative
      initialParticipants.sort((a, b) => b.initiative - a.initiative);
      
      // Set the first participant as active if none already
      if (!initialParticipants.some(p => p.isActive) && initialParticipants.length > 0) {
        initialParticipants[0].isActive = true;
      }
      
      setCombatParticipants(initialParticipants);
      setInCombat(true);
      setCombatRound(1);
      setCombatTurn(0);
    }
  }, [content, currentCharacter, partyCharacters]);

  // Handle advancing to the next turn in combat
  const handleNextTurn = () => {
    if (!inCombat || combatParticipants.length === 0) return;
    
    // Find the index of the currently active participant
    const activeIndex = combatParticipants.findIndex(p => p.isActive);
    
    // Calculate the next active participant index
    let nextIndex = activeIndex + 1;
    
    // If we've gone through all participants, increment the round
    if (nextIndex >= combatParticipants.length) {
      nextIndex = 0;
      setCombatRound(prevRound => prevRound + 1);
    }
    
    // Update the turn counter
    setCombatTurn(prevTurn => prevTurn + 1);
    
    // Set the new active participant
    setCombatParticipants(prevParticipants => 
      prevParticipants.map((participant, index) => ({
        ...participant,
        isActive: index === nextIndex
      }))
    );
  };

  // Handle ending combat
  const handleEndCombat = () => {
    setInCombat(false);
    setCombatRound(1);
    setCombatTurn(0);
  };

  // Handle adding a new participant
  const handleAddParticipant = (participant: Omit<CombatParticipant, 'id'>) => {
    const newParticipant: CombatParticipant = {
      ...participant,
      id: uuidv4()
    };
    
    setCombatParticipants(prevParticipants => [...prevParticipants, newParticipant]);
  };

  // Handle applying damage to a participant
  const handleApplyDamage = (participantId: string, amount: number) => {
    setCombatParticipants(prevParticipants => 
      prevParticipants.map(participant => {
        if (participant.id === participantId) {
          const newHp = Math.max(0, participant.hp - amount);
          return {
            ...participant,
            hp: newHp
          };
        }
        return participant;
      })
    );
  };

  // Handle applying healing to a participant
  const handleApplyHealing = (participantId: string, amount: number) => {
    setCombatParticipants(prevParticipants => 
      prevParticipants.map(participant => {
        if (participant.id === participantId) {
          const newHp = Math.min(participant.maxHp, participant.hp + amount);
          return {
            ...participant,
            hp: newHp
          };
        }
        return participant;
      })
    );
  };

  // Handle adding a condition to a participant
  const handleAddCondition = (participantId: string, condition: string) => {
    setCombatParticipants(prevParticipants => 
      prevParticipants.map(participant => {
        if (participant.id === participantId) {
          const conditions = [...(participant.conditions || [])];
          if (!conditions.includes(condition)) {
            conditions.push(condition);
          }
          return {
            ...participant,
            conditions
          };
        }
        return participant;
      })
    );
  };

  // Handle removing a condition from a participant
  const handleRemoveCondition = (participantId: string, condition: string) => {
    setCombatParticipants(prevParticipants => 
      prevParticipants.map(participant => {
        if (participant.id === participantId) {
          const conditions = (participant.conditions || []).filter(c => c !== condition);
          return {
            ...participant,
            conditions
          };
        }
        return participant;
      })
    );
  };

  // Handle dice roll for a participant
  const handleDiceRoll = (participantId: string, diceType: string, purpose: string) => {
    const result = Math.floor(Math.random() * parseInt(diceType.substring(1))) + 1;
    
    setCombatParticipants(prevParticipants => 
      prevParticipants.map(participant => {
        if (participant.id === participantId) {
          return {
            ...participant,
            lastRoll: {
              type: purpose,
              result,
              total: result,
              success: undefined
            }
          };
        }
        return participant;
      })
    );
  };

  // Return combat state and handlers
  return {
    inCombat,
    combatRound,
    combatTurn,
    combatParticipants,
    availableLoot,
    onNextTurn: handleNextTurn,
    onEndCombat: handleEndCombat,
    onAddParticipant: handleAddParticipant,
    onApplyDamage: handleApplyDamage,
    onApplyHealing: handleApplyHealing,
    onAddCondition: handleAddCondition,
    onRemoveCondition: handleRemoveCondition,
    onDiceRoll: handleDiceRoll,
    setAvailableLoot
  };
}

export default useCombatDetection;