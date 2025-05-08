import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { COMMON_WEAPONS, COMMON_SPELLS } from '@/lib/combat-utils';

export interface CombatThreat {
  id: string;
  name: string;
  description: string;
  hp: number;
  maxHp: number;
  ac?: number;
  initiative?: number;
  attacks?: string[];
  abilities?: string[];
  stats?: {
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
  };
  weapons?: string[];
  spells?: string[];
  loot?: CombatLoot[];
  image?: string;
}

export interface CombatLoot {
  id: string;
  name: string;
  description: string;
  type: 'weapon' | 'armor' | 'potion' | 'scroll' | 'wondrous' | 'gold' | 'gem' | 'other';
  value?: number;
  weight?: number;
  properties?: string[];
  rarity?: 'common' | 'uncommon' | 'rare' | 'very rare' | 'legendary';
  magical?: boolean;
  quantity?: number;
}

export function useCombatDetection(narrativeText: string) {
  const [inCombat, setInCombat] = useState(false);
  const [detectedThreats, setDetectedThreats] = useState<CombatThreat[]>([]);
  const [availableLoot, setAvailableLoot] = useState<CombatLoot[]>([]);
  
  // Detect combat triggers in narrative text
  const detectCombatTriggers = useCallback((text: string) => {
    // Common phrases that indicate combat is starting
    const combatStartTriggers = [
      'combat begins', 
      'roll for initiative', 
      'prepare for battle',
      'draws their weapon',
      'attacks you',
      'you are ambushed',
      'hostile creatures appear',
      'monsters attack',
      'enemy approaches',
      'battle starts'
    ];
    
    // Common phrases that indicate combat is ending
    const combatEndTriggers = [
      'combat ends',
      'battle is over',
      'defeat your enemies',
      'the threat is eliminated',
      'victory is yours',
      'the fighting stops',
      'collect your rewards',
      'search the bodies',
      'loot the fallen',
      'the dust settles'
    ];
    
    // Check if any combat start triggers are found
    const isCombatStarting = combatStartTriggers.some(trigger => 
      text.toLowerCase().includes(trigger.toLowerCase())
    );
    
    // Check if any combat end triggers are found
    const isCombatEnding = combatEndTriggers.some(trigger => 
      text.toLowerCase().includes(trigger.toLowerCase())
    );
    
    // Update combat state
    if (isCombatStarting && !inCombat) {
      setInCombat(true);
      // Analyze text for enemies when combat starts
      const threats = detectThreats(text);
      setDetectedThreats(prev => {
        // Merge with existing threats, avoid duplicates
        const existingIds = prev.map(t => t.name);
        const newThreats = threats.filter(t => !existingIds.includes(t.name));
        return [...prev, ...newThreats];
      });
    } else if (isCombatEnding && inCombat) {
      setInCombat(false);
      // Analyze text for loot when combat ends
      const loot = detectLoot(text);
      setAvailableLoot(prev => [...prev, ...loot]);
    }
  }, [inCombat]);
  
  // Detect potential threats in the narrative
  const detectThreats = useCallback((text: string) => {
    // Common enemy types to look for
    const enemyTypes = [
      { type: 'goblin', hp: [7, 10], ac: 15, str: 8, dex: 14, con: 10, int: 10, wis: 8, cha: 8, weapons: ['shortsword', 'shortbow'] },
      { type: 'orc', hp: [15, 20], ac: 13, str: 16, dex: 12, con: 16, int: 7, wis: 11, cha: 10, weapons: ['greataxe', 'javelin'] },
      { type: 'bandit', hp: [11, 16], ac: 12, str: 11, dex: 12, con: 12, int: 10, wis: 10, cha: 10, weapons: ['scimitar', 'light crossbow'] },
      { type: 'wolf', hp: [11, 13], ac: 13, str: 12, dex: 15, con: 12, int: 3, wis: 12, cha: 6, attacks: ['bite'] },
      { type: 'zombie', hp: [22, 27], ac: 8, str: 13, dex: 6, con: 16, int: 3, wis: 6, cha: 5, attacks: ['slam'] },
      { type: 'skeleton', hp: [13, 18], ac: 13, str: 10, dex: 14, con: 15, int: 6, wis: 8, cha: 5, weapons: ['shortsword', 'shortbow'] },
      { type: 'ogre', hp: [59, 65], ac: 11, str: 19, dex: 8, con: 16, int: 5, wis: 7, cha: 7, weapons: ['greatclub'] },
      { type: 'troll', hp: [84, 90], ac: 15, str: 18, dex: 13, con: 20, int: 7, wis: 9, cha: 7, attacks: ['bite', 'claw'] },
      { type: 'dragon', hp: [170, 200], ac: 18, str: 23, dex: 14, con: 21, int: 16, wis: 13, cha: 21, attacks: ['bite', 'claw', 'breath weapon'] },
      { type: 'demon', hp: [120, 150], ac: 16, str: 18, dex: 17, con: 18, int: 14, wis: 12, cha: 20, attacks: ['claw', 'bite', 'demonic fury'] },
      { type: 'cultist', hp: [9, 13], ac: 12, str: 11, dex: 12, con: 10, int: 10, wis: 11, cha: 10, weapons: ['dagger', 'scimitar'] },
      { type: 'giant spider', hp: [26, 32], ac: 14, str: 14, dex: 16, con: 12, int: 2, wis: 11, cha: 4, attacks: ['bite', 'web'] },
      { type: 'kobold', hp: [5, 7], ac: 12, str: 7, dex: 15, con: 9, int: 8, wis: 7, cha: 8, weapons: ['dagger', 'sling'] },
      { type: 'guard', hp: [11, 16], ac: 16, str: 13, dex: 12, con: 12, int: 10, wis: 11, cha: 10, weapons: ['spear', 'crossbow'] },
      { type: 'mage', hp: [40, 45], ac: 12, str: 9, dex: 14, con: 11, int: 17, wis: 12, cha: 11, spells: ['magic missile', 'fire bolt', 'shield'] }
    ];

    const detectedEnemies: CombatThreat[] = [];
    
    // Look for mentions of enemies in the text
    enemyTypes.forEach(enemy => {
      // Use regex to find mentions with word boundaries
      const regex = new RegExp(`\\b${enemy.type}s?\\b`, 'gi');
      const matches = text.match(regex);
      
      if (matches) {
        // For each mention, create a threat
        matches.forEach((match, index) => {
          // Generate HP within the range
          const hp = Math.floor(Math.random() * (enemy.hp[1] - enemy.hp[0] + 1)) + enemy.hp[0];
          
          // Create threat object
          const threat: CombatThreat = {
            id: uuidv4(),
            name: `${match} ${index + 1}`,
            description: `A hostile ${enemy.type}`,
            hp,
            maxHp: hp,
            ac: enemy.ac,
            initiative: Math.floor(Math.random() * 20) + 1 + Math.floor((enemy.dex - 10) / 2),
            stats: {
              strength: enemy.str,
              dexterity: enemy.dex,
              constitution: enemy.con,
              intelligence: enemy.int,
              wisdom: enemy.wis,
              charisma: enemy.cha
            },
            weapons: enemy.weapons || [],
            attacks: enemy.attacks || [],
            spells: enemy.spells || [],
            loot: generateEnemyLoot(enemy.type)
          };
          
          detectedEnemies.push(threat);
        });
      }
    });
    
    // Also detect custom enemies that aren't in our predefined list
    const customEnemyRegex = /\b(\w+\s?\w*)\s+(?:attacks|lunges|charges|ambushes)/gi;
    let customMatch;
    
    while ((customMatch = customEnemyRegex.exec(text)) !== null) {
      const enemyName = customMatch[1];
      
      // Check if this enemy is already in our detected list
      const isDuplicate = detectedEnemies.some(enemy => 
        enemy.name.toLowerCase().includes(enemyName.toLowerCase())
      );
      
      if (!isDuplicate && !enemyTypes.some(e => enemyName.toLowerCase().includes(e.type))) {
        // Generate random stats for unknown enemy
        const hp = Math.floor(Math.random() * 20) + 10;
        
        detectedEnemies.push({
          id: uuidv4(),
          name: enemyName,
          description: `A mysterious hostile creature`,
          hp,
          maxHp: hp,
          ac: Math.floor(Math.random() * 5) + 10,
          initiative: Math.floor(Math.random() * 20) + 1,
          loot: generateEnemyLoot('unknown')
        });
      }
    }
    
    return detectedEnemies;
  }, []);
  
  // Generate appropriate loot for an enemy type
  const generateEnemyLoot = useCallback((enemyType: string): CombatLoot[] => {
    const loot: CombatLoot[] = [];
    
    // Add gold based on enemy type
    let goldAmount = 0;
    switch (enemyType) {
      case 'goblin':
      case 'kobold':
        goldAmount = Math.floor(Math.random() * 10) + 1;
        break;
      case 'orc':
      case 'bandit':
      case 'guard':
        goldAmount = Math.floor(Math.random() * 20) + 10;
        break;
      case 'zombie':
      case 'skeleton':
        goldAmount = Math.floor(Math.random() * 5);
        break;
      case 'cultist':
      case 'mage':
        goldAmount = Math.floor(Math.random() * 30) + 15;
        break;
      case 'ogre':
      case 'troll':
        goldAmount = Math.floor(Math.random() * 50) + 20;
        break;
      case 'dragon':
      case 'demon':
        goldAmount = Math.floor(Math.random() * 300) + 100;
        break;
      default:
        goldAmount = Math.floor(Math.random() * 15) + 5;
    }
    
    if (goldAmount > 0) {
      loot.push({
        id: uuidv4(),
        name: `${goldAmount} gold pieces`,
        description: `A small pouch containing ${goldAmount} gold pieces`,
        type: 'gold',
        value: goldAmount,
        weight: Math.max(0.1, goldAmount * 0.02),
        quantity: 1
      });
    }
    
    // Add weapons or items based on enemy type
    const weaponChance = Math.random();
    if (weaponChance > 0.5) {
      // Select a weapon from the enemy's typical weapons or a default
      let weaponName = '';
      
      switch (enemyType) {
        case 'goblin':
          weaponName = Math.random() > 0.5 ? 'shortsword' : 'shortbow';
          break;
        case 'orc':
          weaponName = Math.random() > 0.5 ? 'greataxe' : 'javelin';
          break;
        case 'bandit':
          weaponName = Math.random() > 0.5 ? 'scimitar' : 'light crossbow';
          break;
        case 'skeleton':
          weaponName = Math.random() > 0.5 ? 'shortsword' : 'shortbow';
          break;
        case 'ogre':
          weaponName = 'greatclub';
          break;
        case 'cultist':
          weaponName = Math.random() > 0.5 ? 'dagger' : 'scimitar';
          break;
        case 'kobold':
          weaponName = Math.random() > 0.5 ? 'dagger' : 'sling';
          break;
        case 'guard':
          weaponName = Math.random() > 0.5 ? 'spear' : 'crossbow';
          break;
        case 'mage':
          weaponName = 'dagger';
          break;
        default:
          // Pick a random weapon from our database
          const weaponKeys = Object.keys(COMMON_WEAPONS);
          weaponName = weaponKeys[Math.floor(Math.random() * weaponKeys.length)];
      }
      
      // Get weapon details from our database
      const weapon = COMMON_WEAPONS[weaponName];
      
      if (weapon) {
        // Small chance for magical weapon
        const isMagical = Math.random() > 0.9;
        const magicalPrefix = isMagical ? ['Enchanted', 'Glowing', 'Fine', 'Masterwork', 'Ornate'][Math.floor(Math.random() * 5)] : '';
        
        loot.push({
          id: uuidv4(),
          name: `${magicalPrefix} ${weapon.name}`.trim(),
          description: `A ${isMagical ? 'finely crafted' : 'standard'} ${weapon.name} used by the ${enemyType}`,
          type: 'weapon',
          value: isMagical ? 50 : 10,
          weight: weapon.type === 'melee' ? 3 : 2,
          properties: weapon.properties || [],
          rarity: isMagical ? 'uncommon' : 'common',
          magical: isMagical,
          quantity: 1
        });
      }
    }
    
    // Add consumable items with a lower chance
    const potionChance = Math.random();
    if (potionChance > 0.8) {
      const potionTypes = ['healing', 'poison', 'strength', 'invisibility', 'fire resistance'];
      const potionType = potionTypes[Math.floor(Math.random() * potionTypes.length)];
      
      loot.push({
        id: uuidv4(),
        name: `Potion of ${potionType}`,
        description: `A small vial containing a ${
          potionType === 'healing' ? 'red' :
          potionType === 'poison' ? 'green' :
          potionType === 'strength' ? 'blue' :
          potionType === 'invisibility' ? 'clear' : 'orange'
        } liquid`,
        type: 'potion',
        value: 50,
        weight: 0.5,
        rarity: potionType === 'healing' ? 'common' : 'uncommon',
        magical: true,
        quantity: 1
      });
    }
    
    return loot;
  }, []);
  
  // Detect loot in narrative text
  const detectLoot = useCallback((text: string) => {
    const loot: CombatLoot[] = [];
    
    // Look for loot descriptions in text
    const lootPhrases = [
      { regex: /(\d+)\s+gold\s+(?:pieces|coins)/gi, type: 'gold' },
      { regex: /(\w+\s+\w+)\s+(?:sword|axe|mace|dagger|bow|hammer|staff)/gi, type: 'weapon' },
      { regex: /(\w+\s+\w+)\s+(?:armor|shield|helmet|gauntlets|bracers)/gi, type: 'armor' },
      { regex: /(?:potion|vial|elixir)\s+of\s+(\w+)/gi, type: 'potion' },
      { regex: /(?:scroll|tome|book)\s+of\s+(\w+)/gi, type: 'scroll' },
      { regex: /(?:amulet|ring|necklace|bracelet)\s+of\s+(\w+)/gi, type: 'wondrous' },
      { regex: /(?:gem|ruby|emerald|diamond|sapphire|pearl)\s+worth\s+(\d+)\s+gold/gi, type: 'gem' },
    ];
    
    // Search for each type of loot
    lootPhrases.forEach(({ regex, type }) => {
      let match;
      while ((match = regex.exec(text)) !== null) {
        const name = match[0];
        let value = 0;
        
        // Calculate value based on item type
        switch (type) {
          case 'gold':
            value = parseInt(match[1]);
            break;
          case 'weapon':
          case 'armor':
            value = Math.floor(Math.random() * 50) + 10;
            break;
          case 'potion':
          case 'scroll':
            value = Math.floor(Math.random() * 100) + 50;
            break;
          case 'wondrous':
            value = Math.floor(Math.random() * 200) + 100;
            break;
          case 'gem':
            value = parseInt(match[1]) || Math.floor(Math.random() * 500) + 100;
            break;
        }
        
        // Create loot item
        loot.push({
          id: uuidv4(),
          name,
          description: `Found after the battle: ${name}`,
          type: type as any,
          value,
          weight: type === 'gold' ? Math.max(0.1, value * 0.02) : 1,
          rarity: value > 100 ? 'uncommon' : 'common',
          magical: type !== 'gold' && type !== 'gem' && Math.random() > 0.7,
          quantity: 1
        });
      }
    });
    
    return loot;
  }, []);
  
  // Extract weapon info from threats for damage calculation
  const extractWeaponInfo = useCallback((threats: CombatThreat[]) => {
    threats.forEach(threat => {
      if (!threat.weapons) {
        threat.weapons = [];
      }
      
      // Try to detect weapons from common categories
      if (threat.weapons.length === 0) {
        // Common weapon categories
        const meleeWeapons = ['sword', 'axe', 'mace', 'spear', 'hammer', 'club'];
        const rangedWeapons = ['bow', 'crossbow', 'sling', 'javelin'];
        
        // Check threat description and name for weapon hints
        const fullText = `${threat.name} ${threat.description}`.toLowerCase();
        
        // Check for melee weapons
        for (const weapon of meleeWeapons) {
          if (fullText.includes(weapon)) {
            // Look for a matching weapon in our database
            const matchedWeapon = Object.keys(COMMON_WEAPONS).find(key => 
              key.includes(weapon)
            );
            
            if (matchedWeapon) {
              threat.weapons.push(matchedWeapon);
            }
            break;
          }
        }
        
        // Check for ranged weapons
        for (const weapon of rangedWeapons) {
          if (fullText.includes(weapon)) {
            // Look for a matching weapon in our database
            const matchedWeapon = Object.keys(COMMON_WEAPONS).find(key => 
              key.includes(weapon)
            );
            
            if (matchedWeapon) {
              threat.weapons.push(matchedWeapon);
            }
            break;
          }
        }
        
        // Default weapon if none detected
        if (threat.weapons.length === 0) {
          threat.weapons.push('dagger');
        }
      }
    });
    
    return threats;
  }, []);
  
  // Call detectCombatTriggers when narrativeText changes
  useEffect(() => {
    if (narrativeText) {
      detectCombatTriggers(narrativeText);
    }
  }, [narrativeText, detectCombatTriggers]);
  
  // Process detected threats to add weapon and spell data
  useEffect(() => {
    if (detectedThreats.length > 0) {
      const updatedThreats = extractWeaponInfo(detectedThreats);
      setDetectedThreats(updatedThreats);
    }
  }, [detectedThreats, extractWeaponInfo]);
  
  return {
    inCombat,
    detectedThreats,
    availableLoot,
    setInCombat,
    setDetectedThreats,
    setAvailableLoot
  };
}