/**
 * Character Equipment Generator
 * Provides class-specific starting equipment and apparel
 */

// Equipment Types
export interface Equipment {
  weapons: EquipmentItem[];
  armor: EquipmentItem[];
  potions: EquipmentItem[];
  magicItems: EquipmentItem[];
  tools: EquipmentItem[];
  gear: EquipmentItem[];
  [key: string]: EquipmentItem[];
}

export interface EquipmentItem {
  name: string;
  type: string;
  description: string;
  quantity: number;
  value: number;
  weight: number;
  properties?: string[];
  effects?: string[];
  damageType?: string;
  damageValue?: string;
  armorClass?: number;
  equipped?: boolean;
  consumable?: boolean;
  rarity?: 'common' | 'uncommon' | 'rare' | 'very rare' | 'legendary' | 'artifact';
  requiresAttunement?: boolean;
  attuned?: boolean;
}

export interface Apparel {
  head?: EquipmentItem;
  body?: EquipmentItem;
  hands?: EquipmentItem;
  feet?: EquipmentItem;
  back?: EquipmentItem;
  neck?: EquipmentItem;
  ring1?: EquipmentItem;
  ring2?: EquipmentItem;
}

// Default items that characters from any class can have
const basicAdventuringGear: EquipmentItem[] = [
  {
    name: 'Backpack',
    type: 'gear',
    description: 'A sturdy leather backpack for carrying equipment',
    quantity: 1,
    value: 2,
    weight: 5
  },
  {
    name: 'Waterskin',
    type: 'gear',
    description: 'A container for holding water',
    quantity: 1,
    value: 0.2,
    weight: 5,
    consumable: true
  },
  {
    name: 'Torch',
    type: 'gear',
    description: 'A wooden torch soaked in pitch',
    quantity: 5,
    value: 0.01,
    weight: 1,
    properties: ['illumination']
  },
  {
    name: 'Rations (1 day)',
    type: 'gear',
    description: 'Dried food suitable for travel',
    quantity: 5,
    value: 0.5,
    weight: 2,
    consumable: true
  }
];

// Fighter Class Equipment
const fighterEquipment = (level: number): Equipment => {
  const equipment: Equipment = {
    weapons: [
      {
        name: 'Longsword',
        type: 'weapon',
        description: 'A versatile sword that can be used with one or two hands',
        quantity: 1,
        value: 15,
        weight: 3,
        properties: ['versatile'],
        damageType: 'slashing',
        damageValue: '1d8',
        equipped: true
      },
      {
        name: 'Shortsword',
        type: 'weapon',
        description: 'A quick, lightweight blade for close combat',
        quantity: 1,
        value: 10,
        weight: 2,
        properties: ['finesse', 'light'],
        damageType: 'piercing',
        damageValue: '1d6'
      }
    ],
    armor: [
      {
        name: 'Chain Mail',
        type: 'armor',
        description: 'Heavy armor made of interlocking metal rings',
        quantity: 1,
        value: 75,
        weight: 55,
        armorClass: 16,
        equipped: true,
        properties: ['heavy', 'noisy']
      },
      {
        name: 'Shield',
        type: 'armor',
        description: 'A wooden shield reinforced with metal',
        quantity: 1,
        value: 10,
        weight: 6,
        armorClass: 2,
        equipped: true
      }
    ],
    potions: [
      {
        name: 'Potion of Healing',
        type: 'potion',
        description: 'A red potion that restores 2d4+2 hit points when consumed',
        quantity: 2,
        value: 50,
        weight: 0.5,
        consumable: true,
        effects: ['Restores 2d4+2 hit points']
      }
    ],
    tools: [],
    magicItems: [],
    gear: [...basicAdventuringGear]
  };

  // Add level-appropriate gear
  if (level >= 3) {
    equipment.weapons.push({
      name: 'Heavy Crossbow',
      type: 'weapon',
      description: 'A powerful ranged weapon that requires time to reload',
      quantity: 1,
      value: 50,
      weight: 18,
      properties: ['heavy', 'loading', 'two-handed', 'ammunition'],
      damageType: 'piercing',
      damageValue: '1d10'
    });
    
    equipment.gear.push({
      name: 'Crossbow Bolts',
      type: 'ammunition',
      description: 'Ammunition for a crossbow',
      quantity: 20,
      value: 1,
      weight: 1.5
    });
  }

  if (level >= 5) {
    // Upgrade armor for higher level fighters
    equipment.armor = [
      {
        name: 'Splint Armor',
        type: 'armor',
        description: 'Heavy armor made of vertical metal strips riveted to a backing',
        quantity: 1,
        value: 200,
        weight: 60,
        armorClass: 17,
        equipped: true,
        properties: ['heavy', 'noisy']
      },
      {
        name: 'Shield',
        type: 'armor',
        description: 'A wooden shield reinforced with metal',
        quantity: 1,
        value: 10,
        weight: 6,
        armorClass: 2,
        equipped: true
      }
    ];
  }

  return equipment;
};

// Rogue Class Equipment
const rogueEquipment = (level: number): Equipment => {
  const equipment: Equipment = {
    weapons: [
      {
        name: 'Shortsword',
        type: 'weapon',
        description: 'A quick, lightweight blade ideal for precise strikes',
        quantity: 1,
        value: 10,
        weight: 2,
        properties: ['finesse', 'light'],
        damageType: 'piercing',
        damageValue: '1d6',
        equipped: true
      },
      {
        name: 'Dagger',
        type: 'weapon',
        description: 'A small knife that can be thrown or used in close combat',
        quantity: 2,
        value: 2,
        weight: 1,
        properties: ['finesse', 'light', 'thrown'],
        damageType: 'piercing',
        damageValue: '1d4'
      },
      {
        name: 'Shortbow',
        type: 'weapon',
        description: 'A compact bow effective at short to medium range',
        quantity: 1,
        value: 25,
        weight: 2,
        properties: ['ammunition', 'two-handed'],
        damageType: 'piercing',
        damageValue: '1d6'
      }
    ],
    armor: [
      {
        name: 'Leather Armor',
        type: 'armor',
        description: 'Light armor made of treated leather',
        quantity: 1,
        value: 10,
        weight: 10,
        armorClass: 11,
        equipped: true,
        properties: ['light']
      }
    ],
    potions: [
      {
        name: 'Potion of Healing',
        type: 'potion',
        description: 'A red potion that restores 2d4+2 hit points when consumed',
        quantity: 1,
        value: 50,
        weight: 0.5,
        consumable: true,
        effects: ['Restores 2d4+2 hit points']
      }
    ],
    tools: [
      {
        name: "Thieves' Tools",
        type: 'tool',
        description: 'A set of tools for picking locks and disarming traps',
        quantity: 1,
        value: 25,
        weight: 1,
        properties: ['lockpicking']
      }
    ],
    magicItems: [],
    gear: [
      ...basicAdventuringGear,
      {
        name: 'Arrows',
        type: 'ammunition',
        description: 'Arrows for a bow',
        quantity: 20,
        value: 1,
        weight: 1
      },
      {
        name: 'Caltrops',
        type: 'gear',
        description: 'Sharp metal spikes that can slow down pursuers',
        quantity: 1,
        value: 1,
        weight: 2
      },
      {
        name: 'Crowbar',
        type: 'gear',
        description: 'A metal bar used for prying things open',
        quantity: 1,
        value: 2,
        weight: 5
      },
      {
        name: 'Grappling Hook',
        type: 'gear',
        description: 'A metal hook attached to a rope, useful for climbing',
        quantity: 1,
        value: 2,
        weight: 4
      },
      {
        name: 'Rope, Hempen (50 feet)',
        type: 'gear',
        description: 'A coil of sturdy rope',
        quantity: 1,
        value: 1,
        weight: 10
      }
    ]
  };

  // Add level-appropriate gear
  if (level >= 3) {
    equipment.weapons.push({
      name: 'Hand Crossbow',
      type: 'weapon',
      description: 'A small, one-handed crossbow ideal for stealth attacks',
      quantity: 1,
      value: 75,
      weight: 3,
      properties: ['light', 'loading', 'ammunition'],
      damageType: 'piercing',
      damageValue: '1d6'
    });
    
    equipment.gear.push({
      name: 'Crossbow Bolts',
      type: 'ammunition',
      description: 'Ammunition for a crossbow',
      quantity: 20,
      value: 1,
      weight: 1.5
    });
  }

  if (level >= 5) {
    // Upgrade armor for higher level rogues
    equipment.armor = [
      {
        name: 'Studded Leather Armor',
        type: 'armor',
        description: 'Light armor reinforced with metal studs',
        quantity: 1,
        value: 45,
        weight: 13,
        armorClass: 12,
        equipped: true,
        properties: ['light']
      }
    ];
    
    // Add poison for higher level rogues
    equipment.potions.push({
      name: 'Basic Poison',
      type: 'poison',
      description: 'A vial of poison that can be applied to weapons',
      quantity: 1,
      value: 100,
      weight: 0.25,
      consumable: true,
      effects: ['Deals 1d4 poison damage when applied to a weapon and the weapon hits']
    });
  }

  return equipment;
};

// Wizard Class Equipment
const wizardEquipment = (level: number): Equipment => {
  const equipment: Equipment = {
    weapons: [
      {
        name: 'Quarterstaff',
        type: 'weapon',
        description: 'A sturdy wooden staff that can be used as a walking stick',
        quantity: 1,
        value: 0.2,
        weight: 4,
        properties: ['versatile'],
        damageType: 'bludgeoning',
        damageValue: '1d6',
        equipped: true
      },
      {
        name: 'Dagger',
        type: 'weapon',
        description: 'A small knife that can be thrown or used in close combat',
        quantity: 1,
        value: 2,
        weight: 1,
        properties: ['finesse', 'light', 'thrown'],
        damageType: 'piercing',
        damageValue: '1d4'
      }
    ],
    armor: [],
    potions: [
      {
        name: 'Potion of Healing',
        type: 'potion',
        description: 'A red potion that restores 2d4+2 hit points when consumed',
        quantity: 1,
        value: 50,
        weight: 0.5,
        consumable: true,
        effects: ['Restores 2d4+2 hit points']
      }
    ],
    tools: [],
    magicItems: [
      {
        name: 'Arcane Focus (Crystal)',
        type: 'focus',
        description: 'A special crystal that channels arcane energy',
        quantity: 1,
        value: 10,
        weight: 1,
        properties: ['spellcasting focus'],
        equipped: true
      }
    ],
    gear: [
      ...basicAdventuringGear,
      {
        name: 'Spellbook',
        type: 'gear',
        description: 'A leather-bound book containing wizard spells',
        quantity: 1,
        value: 50,
        weight: 3
      },
      {
        name: 'Component Pouch',
        type: 'gear',
        description: 'A small pouch containing spell components',
        quantity: 1,
        value: 25,
        weight: 2
      },
      {
        name: 'Ink (1 ounce bottle)',
        type: 'gear',
        description: 'A bottle of ink for writing in a spellbook',
        quantity: 1,
        value: 10,
        weight: 0.1
      },
      {
        name: 'Ink Pen',
        type: 'gear',
        description: 'A pen for writing with ink',
        quantity: 1,
        value: 0.02,
        weight: 0.1
      },
      {
        name: 'Parchment (10 sheets)',
        type: 'gear',
        description: 'Sheets of parchment for writing',
        quantity: 1,
        value: 1,
        weight: 0.1
      }
    ]
  };

  // Add level-appropriate gear
  if (level >= 3) {
    equipment.magicItems.push({
      name: 'Wand of Magic Detection',
      type: 'wand',
      description: 'A wand that can detect magic within 30 feet',
      quantity: 1,
      value: 150,
      weight: 0.1,
      properties: ['magical'],
      rarity: 'uncommon',
      requiresAttunement: false
    });
  }

  if (level >= 5) {
    equipment.magicItems.push({
      name: 'Ring of Protection',
      type: 'ring',
      description: 'A ring that grants a +1 bonus to AC and saving throws',
      quantity: 1,
      value: 3500,
      weight: 0.1,
      properties: ['magical'],
      rarity: 'rare',
      requiresAttunement: true,
      attuned: false
    });
  }

  return equipment;
};

// Cleric Class Equipment
const clericEquipment = (level: number): Equipment => {
  const equipment: Equipment = {
    weapons: [
      {
        name: 'Mace',
        type: 'weapon',
        description: 'A metal club with a heavy head',
        quantity: 1,
        value: 5,
        weight: 4,
        damageType: 'bludgeoning',
        damageValue: '1d6',
        equipped: true
      },
      {
        name: 'Light Crossbow',
        type: 'weapon',
        description: 'A ranged weapon that fires bolts',
        quantity: 1,
        value: 25,
        weight: 5,
        properties: ['ammunition', 'loading', 'two-handed'],
        damageType: 'piercing',
        damageValue: '1d8'
      }
    ],
    armor: [
      {
        name: 'Scale Mail',
        type: 'armor',
        description: 'Medium armor made of overlapping metal scales',
        quantity: 1,
        value: 50,
        weight: 45,
        armorClass: 14,
        equipped: true,
        properties: ['medium']
      },
      {
        name: 'Shield',
        type: 'armor',
        description: 'A wooden shield emblazoned with a holy symbol',
        quantity: 1,
        value: 10,
        weight: 6,
        armorClass: 2,
        equipped: true
      }
    ],
    potions: [
      {
        name: 'Potion of Healing',
        type: 'potion',
        description: 'A red potion that restores 2d4+2 hit points when consumed',
        quantity: 2,
        value: 50,
        weight: 0.5,
        consumable: true,
        effects: ['Restores 2d4+2 hit points']
      }
    ],
    tools: [],
    magicItems: [
      {
        name: 'Holy Symbol',
        type: 'focus',
        description: 'A holy symbol representing your deity',
        quantity: 1,
        value: 5,
        weight: 1,
        properties: ['spellcasting focus'],
        equipped: true
      }
    ],
    gear: [
      ...basicAdventuringGear,
      {
        name: 'Crossbow Bolts',
        type: 'ammunition',
        description: 'Ammunition for a crossbow',
        quantity: 20,
        value: 1,
        weight: 1.5
      },
      {
        name: 'Priest\'s Pack',
        type: 'gear',
        description: 'Includes a blanket, candles, alms box, incense, and holy water',
        quantity: 1,
        value: 19,
        weight: 24
      }
    ]
  };

  // Add level-appropriate gear
  if (level >= 3) {
    equipment.armor = [
      {
        name: 'Chain Mail',
        type: 'armor',
        description: 'Heavy armor made of interlocking metal rings',
        quantity: 1,
        value: 75,
        weight: 55,
        armorClass: 16,
        equipped: true,
        properties: ['heavy', 'noisy']
      },
      {
        name: 'Shield',
        type: 'armor',
        description: 'A wooden shield emblazoned with a holy symbol',
        quantity: 1,
        value: 10,
        weight: 6,
        armorClass: 2,
        equipped: true
      }
    ];
  }

  if (level >= 5) {
    equipment.magicItems.push({
      name: 'Pearl of Power',
      type: 'wondrous item',
      description: 'Allows you to regain one expended spell slot of up to 3rd level once per day',
      quantity: 1,
      value: 750,
      weight: 0.1,
      properties: ['magical'],
      rarity: 'uncommon',
      requiresAttunement: true,
      attuned: false
    });
  }

  return equipment;
};

// Fighter Default Apparel
const fighterApparel = (level: number): Apparel => {
  const apparel: Apparel = {
    head: {
      name: 'Steel Helmet',
      type: 'head',
      description: 'A protective metal helmet',
      quantity: 1,
      value: 20,
      weight: 5,
      equipped: true
    },
    body: {
      name: 'Chain Mail',
      type: 'body',
      description: 'Heavy armor made of interlocking metal rings',
      quantity: 1,
      value: 75,
      weight: 55,
      armorClass: 16,
      equipped: true,
      properties: ['heavy', 'noisy']
    },
    hands: {
      name: 'Leather Gauntlets',
      type: 'hands',
      description: 'Protective hand covering made of leather and metal',
      quantity: 1,
      value: 5,
      weight: 2,
      equipped: true
    },
    feet: {
      name: 'Steel-toed Boots',
      type: 'feet',
      description: 'Sturdy boots with reinforced toes',
      quantity: 1,
      value: 10,
      weight: 4,
      equipped: true
    },
    back: {
      name: 'Red Cape',
      type: 'back',
      description: 'A flowing cape that catches the wind',
      quantity: 1,
      value: 5,
      weight: 1,
      equipped: true
    }
  };

  // Upgrade for higher levels
  if (level >= 5) {
    apparel.body = {
      name: 'Splint Armor',
      type: 'body',
      description: 'Heavy armor made of vertical metal strips',
      quantity: 1,
      value: 200,
      weight: 60,
      armorClass: 17,
      equipped: true,
      properties: ['heavy', 'noisy']
    };
  }

  return apparel;
};

// Rogue Default Apparel
const rogueApparel = (level: number): Apparel => {
  const apparel: Apparel = {
    head: {
      name: 'Leather Hood',
      type: 'head',
      description: 'A hood that helps conceal your identity',
      quantity: 1,
      value: 5,
      weight: 1,
      equipped: true
    },
    body: {
      name: 'Leather Armor',
      type: 'body',
      description: 'Light armor made of treated leather',
      quantity: 1,
      value: 10,
      weight: 10,
      armorClass: 11,
      equipped: true,
      properties: ['light']
    },
    hands: {
      name: 'Fingerless Gloves',
      type: 'hands',
      description: 'Gloves that allow for better dexterity',
      quantity: 1,
      value: 2,
      weight: 0.5,
      equipped: true
    },
    feet: {
      name: 'Soft-soled Boots',
      type: 'feet',
      description: 'Boots designed for silent movement',
      quantity: 1,
      value: 10,
      weight: 2,
      equipped: true
    },
    neck: {
      name: 'Lockpick Necklace',
      type: 'neck',
      description: 'A necklace with a hidden lockpick',
      quantity: 1,
      value: 25,
      weight: 0.1,
      equipped: true
    }
  };

  // Upgrade for higher levels
  if (level >= 5) {
    apparel.body = {
      name: 'Studded Leather Armor',
      type: 'body',
      description: 'Light armor reinforced with metal studs',
      quantity: 1,
      value: 45,
      weight: 13,
      armorClass: 12,
      equipped: true,
      properties: ['light']
    };
  }

  return apparel;
};

// Wizard Default Apparel
const wizardApparel = (level: number): Apparel => {
  const apparel: Apparel = {
    head: {
      name: 'Wizard\'s Hat',
      type: 'head',
      description: 'A pointed hat that marks you as a student of the arcane',
      quantity: 1,
      value: 5,
      weight: 1,
      equipped: true
    },
    body: {
      name: 'Embroidered Robes',
      type: 'body',
      description: 'Comfortable robes with arcane symbols',
      quantity: 1,
      value: 15,
      weight: 4,
      equipped: true
    },
    hands: {
      name: 'Spellcasting Gloves',
      type: 'hands',
      description: 'Gloves with runes that help channel magic',
      quantity: 1,
      value: 10,
      weight: 0.5,
      equipped: true
    },
    feet: {
      name: 'Traveler\'s Boots',
      type: 'feet',
      description: 'Comfortable boots for long journeys',
      quantity: 1,
      value: 5,
      weight: 2,
      equipped: true
    },
    neck: {
      name: 'Amulet of Concentration',
      type: 'neck',
      description: 'A simple amulet that helps maintain focus',
      quantity: 1,
      value: 25,
      weight: 0.1,
      equipped: true
    }
  };

  // Upgrade for higher levels
  if (level >= 5) {
    apparel.neck = {
      name: 'Amulet of Protection',
      type: 'neck',
      description: 'An amulet that protects against harmful magic',
      quantity: 1,
      value: 100,
      weight: 0.1,
      equipped: true,
      properties: ['magical'],
      effects: ['Advantage on saving throws against spells']
    };
  }

  return apparel;
};

// Cleric Default Apparel
const clericApparel = (level: number): Apparel => {
  const apparel: Apparel = {
    head: {
      name: 'Holy Circlet',
      type: 'head',
      description: 'A metal circlet with a religious symbol',
      quantity: 1,
      value: 15,
      weight: 1,
      equipped: true
    },
    body: {
      name: 'Scale Mail',
      type: 'body',
      description: 'Medium armor made of overlapping metal scales',
      quantity: 1,
      value: 50,
      weight: 45,
      armorClass: 14,
      equipped: true,
      properties: ['medium']
    },
    hands: {
      name: 'Prayer Wraps',
      type: 'hands',
      description: 'Cloth wraps with prayers inscribed',
      quantity: 1,
      value: 5,
      weight: 0.5,
      equipped: true
    },
    feet: {
      name: 'Holy Sandals',
      type: 'feet',
      description: 'Simple sandals worn by worshippers',
      quantity: 1,
      value: 5,
      weight: 1,
      equipped: true
    },
    neck: {
      name: 'Holy Symbol Necklace',
      type: 'neck',
      description: 'A necklace with your deity\'s symbol',
      quantity: 1,
      value: 25,
      weight: 0.1,
      equipped: true,
      properties: ['spellcasting focus']
    }
  };

  // Upgrade for higher levels
  if (level >= 5) {
    apparel.body = {
      name: 'Chain Mail',
      type: 'body',
      description: 'Heavy armor made of interlocking metal rings',
      quantity: 1,
      value: 75,
      weight: 55,
      armorClass: 16,
      equipped: true,
      properties: ['heavy', 'noisy']
    };
  }

  return apparel;
};

/**
 * Generates default equipment and apparel based on character class and level
 */
export function generateDefaultEquipment(characterClass: string, level: number = 1): { equipment: Equipment, apparel: Apparel } {
  let equipment: Equipment;
  let apparel: Apparel;
  
  switch (characterClass.toLowerCase()) {
    case 'fighter':
      equipment = fighterEquipment(level);
      apparel = fighterApparel(level);
      break;
    case 'rogue':
      equipment = rogueEquipment(level);
      apparel = rogueApparel(level);
      break;
    case 'wizard':
      equipment = wizardEquipment(level);
      apparel = wizardApparel(level);
      break;
    case 'cleric':
      equipment = clericEquipment(level);
      apparel = clericApparel(level);
      break;
    default:
      // Default equipment for unknown classes
      equipment = {
        weapons: [
          {
            name: 'Dagger',
            type: 'weapon',
            description: 'A small knife suitable for close combat',
            quantity: 1,
            value: 2,
            weight: 1,
            properties: ['finesse', 'light', 'thrown'],
            damageType: 'piercing',
            damageValue: '1d4',
            equipped: true
          }
        ],
        armor: [
          {
            name: 'Padded Armor',
            type: 'armor',
            description: 'Simple quilted armor',
            quantity: 1,
            value: 5,
            weight: 8,
            armorClass: 11,
            equipped: true,
            properties: ['light']
          }
        ],
        potions: [
          {
            name: 'Potion of Healing',
            type: 'potion',
            description: 'A red potion that restores 2d4+2 hit points when consumed',
            quantity: 1,
            value: 50,
            weight: 0.5,
            consumable: true,
            effects: ['Restores 2d4+2 hit points']
          }
        ],
        tools: [],
        magicItems: [],
        gear: [...basicAdventuringGear]
      };
      
      apparel = {
        head: {
          name: 'Cloth Hat',
          type: 'head',
          description: 'A simple cloth hat',
          quantity: 1,
          value: 2,
          weight: 0.5,
          equipped: true
        },
        body: {
          name: 'Padded Armor',
          type: 'body',
          description: 'Simple quilted armor',
          quantity: 1,
          value: 5,
          weight: 8,
          armorClass: 11,
          equipped: true,
          properties: ['light']
        },
        feet: {
          name: 'Leather Boots',
          type: 'feet',
          description: 'Simple boots made of leather',
          quantity: 1,
          value: 5,
          weight: 2,
          equipped: true
        }
      };
  }
  
  return { equipment, apparel };
}

/**
 * Generates default ethical alignment based on character class
 */
export function generateDefaultAlignment(characterClass: string, race: string): { lawChaos: number, goodEvil: number } {
  // Default starting point is neutral (0,0)
  let lawChaos = 0; // -10 chaotic to +10 lawful
  let goodEvil = 0; // -10 evil to +10 good
  
  // Class-based tendencies
  switch(characterClass.toLowerCase()) {
    case 'fighter':
      lawChaos += 2; // Fighters tend to be slightly lawful
      break;
    case 'rogue':
      lawChaos -= 3; // Rogues tend to be more chaotic
      break;
    case 'wizard':
      lawChaos += 2; // Wizards tend to be more lawful (study, discipline)
      break;
    case 'cleric':
      lawChaos += 4; // Clerics tend to be lawful (following religious doctrines)
      goodEvil += 3; // Clerics tend to be good
      break;
    case 'paladin':
      lawChaos += 6; // Paladins are strongly lawful
      goodEvil += 6; // Paladins are strongly good
      break;
    case 'barbarian':
      lawChaos -= 4; // Barbarians tend to be chaotic
      break;
    case 'bard':
      lawChaos -= 2; // Bards tend to be slightly chaotic
      break;
    case 'warlock':
      goodEvil -= 2; // Warlocks tend to be slightly evil due to their pacts
      break;
  }
  
  // Race-based tendencies
  switch(race.toLowerCase()) {
    case 'dwarf':
      lawChaos += 2; // Dwarves tend to be lawful
      break;
    case 'elf':
      // Elves are balanced but slightly chaotic
      lawChaos -= 1;
      goodEvil += 1;
      break;
    case 'half-orc':
      // Half-orcs have chaotic tendencies
      lawChaos -= 2;
      break;
    case 'tiefling':
      // Tieflings can have evil tendencies due to their heritage
      goodEvil -= 2;
      break;
    case 'dragonborn':
      // Dragonborn are honorable and tend toward lawful
      lawChaos += 2;
      break;
  }
  
  // Clamp values to -10 to +10 range
  lawChaos = Math.max(-10, Math.min(10, lawChaos));
  goodEvil = Math.max(-10, Math.min(10, goodEvil));
  
  return { lawChaos, goodEvil };
}