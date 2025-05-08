import { v4 as uuidv4 } from 'uuid';

// Weapon damage profiles based on D&D 5e rules
export interface WeaponProfile {
  name: string;
  type: 'melee' | 'ranged';
  damage: {
    dice: string;  // Format: "1d6", "2d8", etc.
    type: string;  // "slashing", "piercing", "bludgeoning", etc.
    bonus?: number;
  };
  properties?: string[];
  isMagical?: boolean;
  requiredStat: 'strength' | 'dexterity';
}

// Spell damage profiles
export interface SpellProfile {
  name: string;
  level: number;
  damage?: {
    dice: string;
    type: string;
    scaling?: {
      perLevel?: string;  // Additional dice per spell slot level
      perCharacterLevel?: string;  // Additional dice per character level
    };
  };
  healing?: {
    dice: string;
    bonus?: number;
    scaling?: {
      perLevel?: string;
      perCharacterLevel?: string;
    };
  };
  savingThrow?: {
    type: 'strength' | 'dexterity' | 'constitution' | 'intelligence' | 'wisdom' | 'charisma';
    dc?: number;
    effect: 'half' | 'none';  // Damage on successful save
  };
  areaOfEffect?: {
    type: 'cone' | 'cube' | 'cylinder' | 'line' | 'sphere';
    size: number;  // In feet
  };
  duration?: string;
  requiredStat: 'intelligence' | 'wisdom' | 'charisma';
}

// Common weapons database following D&D 5e rules
export const COMMON_WEAPONS: Record<string, WeaponProfile> = {
  // Simple Melee Weapons
  'dagger': {
    name: 'Dagger',
    type: 'melee',
    damage: { dice: '1d4', type: 'piercing' },
    properties: ['finesse', 'light', 'thrown'],
    requiredStat: 'dexterity'
  },
  'club': {
    name: 'Club',
    type: 'melee',
    damage: { dice: '1d4', type: 'bludgeoning' },
    properties: ['light'],
    requiredStat: 'strength'
  },
  'mace': {
    name: 'Mace',
    type: 'melee',
    damage: { dice: '1d6', type: 'bludgeoning' },
    requiredStat: 'strength'
  },
  'quarterstaff': {
    name: 'Quarterstaff',
    type: 'melee',
    damage: { dice: '1d6', type: 'bludgeoning' },
    properties: ['versatile'],
    requiredStat: 'strength'
  },
  'spear': {
    name: 'Spear',
    type: 'melee',
    damage: { dice: '1d6', type: 'piercing' },
    properties: ['thrown', 'versatile'],
    requiredStat: 'strength'
  },
  
  // Simple Ranged Weapons
  'shortbow': {
    name: 'Shortbow',
    type: 'ranged',
    damage: { dice: '1d6', type: 'piercing' },
    properties: ['ammunition', 'two-handed'],
    requiredStat: 'dexterity'
  },
  'light crossbow': {
    name: 'Light Crossbow',
    type: 'ranged',
    damage: { dice: '1d8', type: 'piercing' },
    properties: ['ammunition', 'loading', 'two-handed'],
    requiredStat: 'dexterity'
  },
  
  // Martial Melee Weapons
  'battleaxe': {
    name: 'Battleaxe',
    type: 'melee',
    damage: { dice: '1d8', type: 'slashing' },
    properties: ['versatile'],
    requiredStat: 'strength'
  },
  'longsword': {
    name: 'Longsword',
    type: 'melee',
    damage: { dice: '1d8', type: 'slashing' },
    properties: ['versatile'],
    requiredStat: 'strength'
  },
  'greatsword': {
    name: 'Greatsword',
    type: 'melee',
    damage: { dice: '2d6', type: 'slashing' },
    properties: ['heavy', 'two-handed'],
    requiredStat: 'strength'
  },
  'rapier': {
    name: 'Rapier',
    type: 'melee',
    damage: { dice: '1d8', type: 'piercing' },
    properties: ['finesse'],
    requiredStat: 'dexterity'
  },
  'warhammer': {
    name: 'Warhammer',
    type: 'melee',
    damage: { dice: '1d8', type: 'bludgeoning' },
    properties: ['versatile'],
    requiredStat: 'strength'
  },
  
  // Martial Ranged Weapons
  'longbow': {
    name: 'Longbow',
    type: 'ranged',
    damage: { dice: '1d8', type: 'piercing' },
    properties: ['ammunition', 'heavy', 'two-handed'],
    requiredStat: 'dexterity'
  },
  'heavy crossbow': {
    name: 'Heavy Crossbow',
    type: 'ranged',
    damage: { dice: '1d10', type: 'piercing' },
    properties: ['ammunition', 'heavy', 'loading', 'two-handed'],
    requiredStat: 'dexterity'
  }
};

// Common spells database following D&D 5e rules
export const COMMON_SPELLS: Record<string, SpellProfile> = {
  'fire bolt': {
    name: 'Fire Bolt',
    level: 0, // Cantrip
    damage: {
      dice: '1d10',
      type: 'fire',
      scaling: {
        perCharacterLevel: '1d10 at 5th, 11th, and 17th level'
      }
    },
    requiredStat: 'intelligence'
  },
  'eldritch blast': {
    name: 'Eldritch Blast',
    level: 0,
    damage: {
      dice: '1d10',
      type: 'force',
      scaling: {
        perCharacterLevel: '1d10 at 5th, 11th, and 17th level'
      }
    },
    requiredStat: 'charisma'
  },
  'magic missile': {
    name: 'Magic Missile',
    level: 1,
    damage: {
      dice: '1d4+1',
      type: 'force',
      scaling: {
        perLevel: '1d4+1 per level above 1st'
      }
    },
    requiredStat: 'intelligence'
  },
  'cure wounds': {
    name: 'Cure Wounds',
    level: 1,
    healing: {
      dice: '1d8',
      scaling: {
        perLevel: '1d8 per level above 1st'
      }
    },
    requiredStat: 'wisdom'
  },
  'fireball': {
    name: 'Fireball',
    level: 3,
    damage: {
      dice: '8d6',
      type: 'fire',
      scaling: {
        perLevel: '1d6 per level above 3rd'
      }
    },
    savingThrow: {
      type: 'dexterity',
      effect: 'half'
    },
    areaOfEffect: {
      type: 'sphere',
      size: 20
    },
    requiredStat: 'intelligence'
  },
  'lightning bolt': {
    name: 'Lightning Bolt',
    level: 3,
    damage: {
      dice: '8d6',
      type: 'lightning',
      scaling: {
        perLevel: '1d6 per level above 3rd'
      }
    },
    savingThrow: {
      type: 'dexterity',
      effect: 'half'
    },
    requiredStat: 'intelligence'
  }
};

// Calculate ability modifier based on stat value
export function calculateAbilityModifier(stat: number): number {
  return Math.floor((stat - 10) / 2);
}

// Roll dice (e.g., "2d6", "1d20", etc.)
export function rollDice(diceNotation: string): { rolls: number[], total: number } {
  const [count, sides] = diceNotation.split('d').map(Number);
  const rolls: number[] = [];
  
  for (let i = 0; i < count; i++) {
    rolls.push(Math.floor(Math.random() * sides) + 1);
  }
  
  return {
    rolls,
    total: rolls.reduce((sum, roll) => sum + roll, 0)
  };
}

// Calculate damage for a weapon attack
export function calculateWeaponDamage(
  weaponName: string,
  characterStats: Record<string, number>,
  proficiencyBonus: number = 2,
  isProficient: boolean = true
): { 
  attackRoll: number,
  attackBonus: number,
  damage: number,
  damageRolls: number[],
  damageBonus: number,
  damageType: string,
  criticalHit?: boolean
} {
  // Find the weapon or default to a simple attack
  const weaponKey = Object.keys(COMMON_WEAPONS).find(key => 
    weaponName.toLowerCase().includes(key)
  );
  
  const weapon = weaponKey ? COMMON_WEAPONS[weaponKey] : {
    name: 'Unarmed Strike',
    type: 'melee' as const,
    damage: { dice: '1d1', type: 'bludgeoning' },
    requiredStat: 'strength' as const
  };
  
  // Determine the ability modifier to use
  const statName = weapon.properties?.includes('finesse') ? 
    (characterStats.dexterity > characterStats.strength ? 'dexterity' : 'strength') :
    weapon.requiredStat;
  
  const abilityModifier = calculateAbilityModifier(characterStats[statName] || 10);
  const attackBonus = abilityModifier + (isProficient ? proficiencyBonus : 0);
  
  // Roll for attack
  const attackDieRoll = Math.floor(Math.random() * 20) + 1;
  const attackRoll = attackDieRoll + attackBonus;
  const criticalHit = attackDieRoll === 20;
  
  // Roll for damage
  const { dice, type } = weapon.damage;
  const damageRoll = rollDice(dice);
  
  // On a critical hit, roll damage dice twice
  const damageRolls = criticalHit ? 
    [...damageRoll.rolls, ...rollDice(dice).rolls] : 
    damageRoll.rolls;
  
  const damage = damageRolls.reduce((sum, roll) => sum + roll, 0) + abilityModifier;
  
  return {
    attackRoll,
    attackBonus,
    damage: Math.max(1, damage), // Minimum damage is 1
    damageRolls,
    damageBonus: abilityModifier,
    damageType: type,
    criticalHit
  };
}

// Calculate damage for a spell attack
export function calculateSpellDamage(
  spellName: string,
  characterStats: Record<string, number>,
  characterLevel: number = 1,
  spellSlotLevel?: number,
  proficiencyBonus: number = 2
): {
  attackRoll?: number,
  attackBonus?: number,
  damage?: number,
  damageRolls?: number[],
  damageType?: string,
  healing?: number,
  healingRolls?: number[],
  saveDC?: number,
  criticalHit?: boolean
} {
  // Find the spell or return empty result
  const spellKey = Object.keys(COMMON_SPELLS).find(key => 
    spellName.toLowerCase().includes(key)
  );
  
  if (!spellKey) {
    return {};
  }
  
  const spell = COMMON_SPELLS[spellKey];
  
  // Default to the spell's level if slot level not specified
  const effectiveSpellLevel = spellSlotLevel || spell.level;
  
  // Calculate spell attack bonus or save DC
  const spellcastingAbilityModifier = calculateAbilityModifier(characterStats[spell.requiredStat] || 10);
  const spellAttackBonus = spellcastingAbilityModifier + proficiencyBonus;
  const saveDC = 8 + spellcastingAbilityModifier + proficiencyBonus;
  
  let result: any = {
    saveDC: spell.savingThrow ? saveDC : undefined
  };
  
  // Handle attack roll spells
  if (spell.damage && !spell.savingThrow) {
    const attackDieRoll = Math.floor(Math.random() * 20) + 1;
    result.attackRoll = attackDieRoll + spellAttackBonus;
    result.attackBonus = spellAttackBonus;
    result.criticalHit = attackDieRoll === 20;
  }
  
  // Calculate damage
  if (spell.damage) {
    let damageDice = spell.damage.dice;
    
    // Apply spell slot scaling
    if (spell.damage.scaling?.perLevel && effectiveSpellLevel > spell.level) {
      const additionalLevels = effectiveSpellLevel - spell.level;
      const [bonusDiceCount, bonusDiceSides] = spell.damage.scaling.perLevel.split(' ')[0].split('d').map(Number);
      damageDice = `${parseInt(damageDice.split('d')[0]) + (bonusDiceCount * additionalLevels)}d${damageDice.split('d')[1]}`;
    }
    
    // Apply character level scaling for cantrips
    if (spell.level === 0 && spell.damage.scaling?.perCharacterLevel) {
      // Parse the scaling string to determine how many times to apply scaling
      const scalingLevels = [5, 11, 17];
      const applicableScalings = scalingLevels.filter(level => characterLevel >= level).length;
      
      if (applicableScalings > 0) {
        const [baseDiceCount, diceSides] = damageDice.split('d').map(Number);
        damageDice = `${baseDiceCount * (applicableScalings + 1)}d${diceSides}`;
      }
    }
    
    const damageRoll = rollDice(damageDice);
    
    // Double damage dice on critical hit for attack roll spells
    const damageRolls = (result.criticalHit && !spell.savingThrow) ?
      [...damageRoll.rolls, ...rollDice(damageDice).rolls] :
      damageRoll.rolls;
    
    result.damage = damageRolls.reduce((sum, roll) => sum + roll, 0);
    result.damageRolls = damageRolls;
    result.damageType = spell.damage.type;
  }
  
  // Calculate healing
  if (spell.healing) {
    let healingDice = spell.healing.dice;
    
    // Apply spell slot scaling
    if (spell.healing.scaling?.perLevel && effectiveSpellLevel > spell.level) {
      const additionalLevels = effectiveSpellLevel - spell.level;
      const [bonusDiceCount, bonusDiceSides] = spell.healing.scaling.perLevel.split(' ')[0].split('d').map(Number);
      healingDice = `${parseInt(healingDice.split('d')[0]) + (bonusDiceCount * additionalLevels)}d${healingDice.split('d')[1]}`;
    }
    
    const healingRoll = rollDice(healingDice);
    result.healingRolls = healingRoll.rolls;
    result.healing = healingRoll.total + (spell.healing.bonus || 0) + spellcastingAbilityModifier;
  }
  
  return result;
}

// Calculate attack and damage for the provided action
export function calculateActionResult(
  actionText: string,
  character: any,
  proficiencyBonus: number = 2
) {
  // Extract character stats with proper typing
  const stats: {
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
  } = {
    strength: character.stats?.strength || 10,
    dexterity: character.stats?.dexterity || 10,
    constitution: character.stats?.constitution || 10,
    intelligence: character.stats?.intelligence || 10,
    wisdom: character.stats?.wisdom || 10,
    charisma: character.stats?.charisma || 10
  };
  
  // Calculate character level
  const characterLevel = character.level || 1;
  
  // Check if action is a weapon attack
  const isWeaponAttack = /attack|strike|slash|stab|shoot|throw/i.test(actionText);
  
  // Check if action is a spell cast
  const isSpellCast = /cast|spell|incantation/i.test(actionText);
  
  // Extract weapon name
  let weaponName = 'Unarmed Strike';
  if (isWeaponAttack) {
    // Look for weapon names in the action text
    for (const weapon of Object.keys(COMMON_WEAPONS)) {
      if (actionText.toLowerCase().includes(weapon)) {
        weaponName = COMMON_WEAPONS[weapon].name;
        break;
      }
    }
    
    // Also check character equipment if available
    if (character.equipment?.items) {
      const equippedWeapons = character.equipment.items.filter((item: any) => 
        item.type === 'weapon' && item.isEquipped
      );
      
      if (equippedWeapons.length > 0) {
        weaponName = equippedWeapons[0].name;
      }
    }
  }
  
  // Extract spell name
  let spellName = '';
  let spellSlotLevel;
  
  if (isSpellCast) {
    // Look for spell names in the action text
    for (const spell of Object.keys(COMMON_SPELLS)) {
      if (actionText.toLowerCase().includes(spell)) {
        spellName = COMMON_SPELLS[spell].name;
        break;
      }
    }
    
    // Try to determine spell slot level
    const levelMatch = actionText.match(/level (\d+)|(\d+)(st|nd|rd|th) level/i);
    if (levelMatch) {
      spellSlotLevel = parseInt(levelMatch[1] || levelMatch[2]);
    }
  }
  
  // Calculate results
  let result: any = {
    id: uuidv4(),
    type: isWeaponAttack ? 'weapon' : isSpellCast ? 'spell' : 'ability',
    actionText: actionText,
    timestamp: new Date()
  };
  
  if (isWeaponAttack) {
    const weaponResult = calculateWeaponDamage(weaponName, stats, proficiencyBonus);
    
    result = {
      ...result,
      weaponName,
      attackRoll: weaponResult.attackRoll,
      attackBonus: weaponResult.attackBonus,
      damage: weaponResult.damage,
      damageRolls: weaponResult.damageRolls,
      damageBonus: weaponResult.damageBonus,
      damageType: weaponResult.damageType,
      criticalHit: weaponResult.criticalHit
    };
  } else if (isSpellCast && spellName) {
    const spellResult = calculateSpellDamage(
      spellName, 
      stats, 
      characterLevel, 
      spellSlotLevel,
      proficiencyBonus
    );
    
    result = {
      ...result,
      spellName,
      spellSlotLevel,
      ...spellResult
    };
  } else {
    // Ability check or saving throw
    const abilities = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];
    let ability;
    
    for (const a of abilities) {
      if (actionText.toLowerCase().includes(a)) {
        ability = a;
        break;
      }
    }
    
    if (ability) {
      // Use type assertion to index into stats safely
      const abilityValue = stats[ability as keyof typeof stats];
      const abilityModifier = calculateAbilityModifier(abilityValue);
      const dieRoll = Math.floor(Math.random() * 20) + 1;
      const total = dieRoll + abilityModifier;
      
      result = {
        ...result,
        abilityName: ability,
        dieRoll,
        abilityModifier,
        total
      };
    }
  }
  
  return result;
}