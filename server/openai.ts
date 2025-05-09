import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "missing_key" });

// Helper function to safely parse JSON from OpenAI response
function safeJsonParse(content: string | null | undefined) {
  if (!content) return {};
  try {
    return JSON.parse(content);
  } catch (error) {
    console.error("Error parsing JSON from OpenAI response:", error);
    return {};
  }
}

export interface AdventureGenerationOptions {
  theme?: string;
  setting?: string;
  difficulty?: string;
  partyLevel?: number;
  partySize?: number;
  includeElements?: string[];
}

export interface CharacterGenerationOptions {
  race?: string;
  class?: string;
  level?: number;
  alignment?: string;
}

export interface NPCGenerationOptions {
  race?: string;
  role?: string;
  alignment?: string;
  isHostile?: boolean;
}

export async function generateAdventure(options: AdventureGenerationOptions = {}) {
  const {
    theme = "fantasy",
    setting = "medieval",
    difficulty = "medium",
    partyLevel = 1,
    partySize = 4,
    includeElements = []
  } = options;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a Dungeon Master's assistant, skilled in creating engaging D&D adventures. Generate detailed adventures with a title, description, setting, NPCs, and quest objectives."
        },
        {
          role: "user",
          content: `Create a D&D adventure with the following parameters:
          - Theme: ${theme}
          - Setting: ${setting}
          - Difficulty: ${difficulty}
          - Party Level: ${partyLevel}
          - Party Size: ${partySize}
          - Elements to Include: ${includeElements.join(", ")}
          
          Format the response as a JSON object with these fields:
          - title: Adventure title
          - description: Brief adventure overview
          - setting: Detailed setting description
          - hooks: Ways to introduce the adventure to players
          - mainQuest: Object with title and description
          - sideQuests: Array of objects with title and description
          - npcs: Array of important NPCs with name, description, and role
          - locations: Array of key locations with name and description
          - encounters: Array of potential encounters with description and challenge rating
          - treasures: Array of treasures and rewards
          - conclusion: Possible ending scenarios`
        }
      ],
      response_format: { type: "json_object" }
    });

    return safeJsonParse(response.choices[0].message.content);
  } catch (error) {
    console.error("Error generating adventure:", error);
    throw new Error("Failed to generate adventure");
  }
}

export async function generateGameNarration(context: string, playerAction: string, isAutoAdvance: boolean = false) {
  try {
    let systemPrompt = `You are an expert Dungeon Master narrating a D&D game, creating a truly open-world experience. You adapt fluidly to ANY player action or decision, no matter how unexpected.
    
As the Auto-DM, your role is to:
1. Create a dynamic world that reacts realistically to player choices
2. Balance different types of encounters (puzzles, combat, social interactions, exploration)
3. Present meaningful moral choices that could affect character alignment
4. Introduce surprising but coherent plot developments based on player decisions
5. Remember details from earlier in the adventure and weave them into ongoing narrative
6. Allow player freedom while maintaining narrative cohesion
7. When you see dice roll results in the context or player action, use these results to drive the narrative consequences

IMPORTANT: When you identify a dice roll in the context (look for phrases like "rolled X for Y" or "rolls X against DC Y"), narrate the exact consequences of that roll - success or failure should meaningfully impact the story! If a roll was critical (natural 20 or natural 1), make the outcome especially dramatic. Be specific and vivid about what exactly happens as a result of the roll.

Your narration should be vivid and concise, focusing on immersion and meaningful player agency. When appropriate, suggest new checks or rolls that would be required for further actions, but don't force specific choices on the player.`;

    // Check if playerAction contains a dice roll
    const containsDiceRoll = playerAction.match(/roll(ed|s)\s+\d+|result\s+\d+|DC\s+\d+|success|failure|critical/i);
    
    let userPrompt = "";
    
    if (isAutoAdvance) {
      userPrompt = `Context: ${context}

The player wants to advance the story. Create a compelling narrative that progresses the adventure by introducing a new element, encounter, or development. Consider including one of the following (choose what makes most sense given the context):
- A moral dilemma that might affect character alignment
- A puzzle or mystery that requires creative thinking
- A potential combat encounter with appropriate challenge
- A social interaction that reveals important information
- An environmental challenge or exploration opportunity
- A surprising twist that builds on previous story elements

Describe what happens next in vivid detail as the Dungeon Master, moving the story forward in an open-ended way that gives the player genuine agency in how to respond.`;
    } else if (containsDiceRoll) {
      // Special handling for dice roll actions
      userPrompt = `Context: ${context}

Dice Roll: ${playerAction}

This is a dice roll result. Narrate the SPECIFIC CONSEQUENCES of this roll result in vivid detail. Don't just acknowledge the roll - show exactly what happens because of this roll result. 

If it was a:
- Critical success (natural 20): Describe an exceptionally positive outcome with additional benefits
- Success: Describe how the character accomplishes their goal
- Failure: Describe complications, partial success with a cost, or interesting failure
- Critical failure (natural 1): Describe a dramatic setback, complication, or twist

Your narrative should directly respond to the roll, making it clear that the character's success or failure has meaningful impact on the story.`;
    } else {
      userPrompt = `Context: ${context}

Player Action: ${playerAction}

Provide a narrative response as the DM, describing what happens next based on this specific player action. Allow this action to meaningfully impact the world and story direction. If this action could have alignment implications, subtly note this. If checks or rolls would be required, mention them but don't resolve them yourself.

Your response should open up new possibilities rather than constrain them, adapting to the player's approach whether it's combat-focused, diplomacy, stealth, creative problem-solving, or something unexpected.`;
    }
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: userPrompt
        }
      ],
      temperature: containsDiceRoll ? 0.7 : 0.8 // Slightly lower temperature for dice outcomes
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error("Error generating narration:", error);
    throw new Error("Failed to generate game narration");
  }
}

export async function generateNPC(options: NPCGenerationOptions = {}) {
  const {
    race = "random",
    role = "random",
    alignment = "random",
    isHostile = false
  } = options;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a D&D character creator specializing in generating detailed NPCs for campaigns."
        },
        {
          role: "user",
          content: `Create a D&D NPC with the following parameters:
          - Race: ${race === "random" ? "Choose an appropriate race" : race}
          - Role: ${role === "random" ? "Choose an appropriate role" : role}
          - Alignment: ${alignment === "random" ? "Choose an appropriate alignment" : alignment}
          - Disposition: ${isHostile ? "Hostile to players" : "Neutral or friendly"}
          
          Format the response as a JSON object with these fields:
          - name: NPC's full name
          - race: NPC's race
          - class: NPC's class or profession
          - description: Physical appearance
          - personality: Personality traits and behaviors
          - motivation: What drives this NPC
          - background: Brief history
          - stats: Basic D&D stats (strength, dexterity, etc.)
          - abilities: Special abilities or skills
          - items: Notable items they possess
          - hooks: How they might interact with players`
        }
      ],
      response_format: { type: "json_object" }
    });

    return safeJsonParse(response.choices[0].message.content);
  } catch (error) {
    console.error("Error generating NPC:", error);
    throw new Error("Failed to generate NPC");
  }
}

export async function generateCharacter(options: CharacterGenerationOptions = {}) {
  const {
    race = "random",
    class: characterClass = "random",
    level = 1,
    alignment = "random"
  } = options;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: `You are a D&D character creator specializing in generating detailed player characters with nuanced moral alignments. 
          
Characters should have rich, evolving moral compasses that can shift over time based on their choices, not static alignments. Characters should start with tendencies or inclinations that can evolve along two axes:
- The Law-Chaos axis (respect for order vs. freedom)
- The Good-Evil axis (altruism vs. selfishness)

These alignments should be presented as nuanced positions, not just simple labels.`
        },
        {
          role: "user",
          content: `Create a D&D character with the following parameters:
          - Race: ${race === "random" ? "Choose an appropriate race" : race}
          - Class: ${characterClass === "random" ? "Choose an appropriate class" : characterClass}
          - Level: ${level}
          - Alignment: ${alignment === "random" ? "Choose an appropriate alignment" : alignment}
          
          Format the response as a JSON object with these fields:
          - name: Character's full name
          - race: Character's race
          - class: Character's class
          - background: Character's background
          - level: Character level
          - alignment: Character alignment (e.g. "Chaotic Good")
          - alignmentDescription: A paragraph explaining the character's moral compass, personal ethics, and how their alignment might evolve based on different choices
          - lawChaosValue: A number from 0-100 representing where they fall on Law (0) to Chaos (100) axis
          - goodEvilValue: A number from 0-100 representing where they fall on Good (0) to Evil (100) axis
          - appearance: Physical description
          - personality: Personality traits
          - backstory: Brief character history
          - moralChoices: Array of 3 past moral decisions that helped shape their current alignment
          - stats: Object with strength, dexterity, constitution, intelligence, wisdom, charisma values
          - hp: Hit points value
          - maxHp: Maximum hit points
          - proficiencies: Array of proficiencies
          - equipment: Object with weapons, armor, and items arrays
          - spells: Array of spells if applicable
          - abilities: Array of special abilities
          - traits: Character traits`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.8 // Add more creative variation
    });

    return safeJsonParse(response.choices[0].message.content);
  } catch (error) {
    console.error("Error generating character:", error);
    throw new Error("Failed to generate character");
  }
}

export async function generateDialogue(npcInfo: string, context: string, playerPrompt?: string) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert RPG dialogue writer creating authentic D&D NPC responses. Create dialogue that matches the NPC's personality and background while responding to the player's actions or questions."
        },
        {
          role: "user",
          content: `NPC Information: ${npcInfo}\n\nContext: ${context}\n\n${playerPrompt ? `Player says: ${playerPrompt}` : "Generate an initial NPC greeting or reaction based on the context."}\n\nProvide only the NPC's dialogue response. Make it feel authentic to the character and setting.`
        }
      ]
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error("Error generating dialogue:", error);
    throw new Error("Failed to generate NPC dialogue");
  }
}

export interface CampaignGenerationOptions {
  genre?: string;
  theme?: string;
  tone?: string;
}

export interface ItemGenerationOptions {
  itemType?: string;
  rarity?: string;
  category?: string;
  characterLevel?: number;
  context?: string;
  enemyType?: string;
}

export async function generateRandomItem(options: ItemGenerationOptions = {}) {
  const {
    itemType = "random",
    rarity = "common",
    category = "any",
    characterLevel = 1,
    context = "",
    enemyType = ""
  } = options;
  
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: `You are an expert Dungeons & Dragons narrative designer who creates immersive, context-appropriate items based on the current game story and environment.
          
          Instead of randomly generating items, you carefully craft items that:
          1. Match the narrative context provided
          2. Feel like natural discoveries within the game world
          3. Have a plausible origin story or connection to the environment
          4. Follow D&D 5e rules and balance considerations
          5. Are appropriate for level ${characterLevel} characters
          
          ${enemyType ? `This item is being dropped from a defeated ${enemyType}. Consider what such a creature might realistically possess.` : ''}
          ${context ? `The current narrative context is: "${context}"` : ''}`
        },
        {
          role: "user",
          content: `Create a narrative-appropriate ${rarity} item for this D&D adventure:
          
          ${context ? `Story Context: ${context}` : 'No specific context provided'}
          ${enemyType ? `Dropped by: ${enemyType}` : 'Found within the environment'}
          ${itemType !== "random" ? `Preferred Item Type: ${itemType}` : ''}
          ${category !== "any" ? `Category: ${category}` : ''}
          Character Level: ${characterLevel}
          
          Format your response as a JSON object with these fields:
          - name: A distinctive name for the item
          - description: A concise description of the item's appearance and function
          - backstory: A detailed narrative history of the item's origin, previous owners, and how it came to be in this location (8-10 sentences)
          - type: One of "weapon", "armor", "apparel", "potion", "scroll", "tool", "trinket", "quest", or "miscellaneous"
          - apparelSlot: If type is "apparel", include one of "head", "chest", "legs", "feet", "hands", "back", "neck", "finger", "waist"
          - rarity: One of "common", "uncommon", "rare", "very rare", "legendary", "artifact"
          - weight: The weight in pounds (can be decimal)
          - value: The value in gold pieces
          - properties: Array of special properties like "magical", "cursed", etc.
          - attunement: Boolean, whether it requires attunement
          - quantity: How many of this item (usually 1)
          - isEquipped: false (default unequipped state)
          - slot: 0 (will be assigned when added to inventory)
          - source: One of "loot", "crafted", "quest", "purchased", "starting"`
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 800,
      temperature: 0.7,
    });

    return safeJsonParse(response.choices[0].message.content);
  } catch (error) {
    console.error("Error generating random item:", error);
    throw new Error("Failed to generate random item");
  }
}

export async function generateWorldMap(campaignId: number, campaignInfo: any, everdiceWorld = null) {
  try {
    // First, extract key geographical features from the campaign description
    const geographyAnalysis = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: `You are an expert geographical analyzer specializing in extracting landforms, terrain features, and spatial relationships from fantasy world descriptions. 
          Your task is to carefully analyze campaign descriptions and identify ALL explicit and implied geographical features that should be represented on a map.
          
          This campaign takes place in the greater world of Everdice - a vast realm containing numerous continents, nations, and regions. Each campaign exists within a specific region of Everdice.`
        },
        {
          role: "user",
          content: `Analyze this D&D campaign description and extract all geographical features that should be reflected on a map. This campaign takes place in a region of the Everdice world.
          
          Campaign Name: "${campaignInfo.name}"
          Setting Type: ${campaignInfo.setting || "fantasy world"}
          Campaign Description: ${campaignInfo.description || "An epic adventure in a fantasy realm."}
          
          Format your response as a JSON object with these fields:
          - everdiceContinent: Which continent of Everdice this region would logically belong to (e.g., "The Northern Reaches", "Mystara", "Solaran Peninsula", etc.)
          - regionName: A name for this specific region within the continent
          - regionType: The type of region (e.g., "island chain", "mountain valley", "coastal kingdom", "desert emirate", etc.)
          - primaryLandforms: Array of the dominant geographical features (e.g., "peninsula", "mountain range", "archipelago", "desert", etc.)
          - secondaryFeatures: Array of additional geographical elements mentioned or implied
          - terrainDistribution: Object describing roughly what percentage of the map should be different terrain types
          - coastalFeatures: Any specific coastal elements mentioned (bays, gulfs, etc.)
          - waterBodies: Any oceans, seas, lakes, or rivers mentioned
          - settlements: Major cities, towns, or other settlements mentioned
          - regionLayout: Brief description of how regions are arranged relative to each other
          - connectionToEverdice: How this region connects to or relates to the broader world of Everdice`
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 1000,
      temperature: 0.3, // Lower temperature for more precise analysis
    });
    
    const geographyData = safeJsonParse(geographyAnalysis.choices[0].message.content);
    
    // Now, generate more detailed world information informed by the geographical analysis
    const worldDetails = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: `You are an expert fantasy cartographer and worldbuilder specializing in D&D campaign worlds.
          Generate rich geographical and cultural details for a unique campaign world that will be used to create a detailed map.
          You MUST ensure the world you create accurately reflects ALL geographical features identified in the analysis.`
        },
        {
          role: "user",
          content: `Create a detailed fantasy world for this D&D campaign, ensuring it precisely matches the geographical analysis:
          
          Campaign Name: "${campaignInfo.name}"
          Setting Type: ${campaignInfo.setting || "fantasy world"}
          Campaign Description: ${campaignInfo.description || "An epic adventure in a fantasy realm."}
          
          Geographical Analysis:
          ${JSON.stringify(geographyData, null, 2)}
          
          Format your response as a JSON object with these fields:
          - geographicalFeatures: Array of unique landforms, bodies of water, and natural landmarks THAT MATCH the geography analysis
          - majorKingdoms: Array of 3-5 realms/nations with their characteristics and geographical positions
          - pointsOfInterest: Array of 6-8 specific notable locations (cities, dungeons, ruins, magical sites)
          - magicalElements: Unique magical aspects of this world that might appear on a map
          - aestheticTheme: The visual style/theme that should inform the map's appearance`
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 1200,
      temperature: 0.7,
    });
    
    const worldData = safeJsonParse(worldDetails.choices[0].message.content);
    
    // Use the combined geographical analysis and world details to create a precise prompt for DALL-E
    const mapPrompt = `Create a highly detailed, accurate fantasy map for a D&D campaign called "${campaignInfo.name}" set in ${campaignInfo.setting || "a fantasy world"}. 

This map MUST accurately represent the following geographical features exactly as described:
${geographyData.primaryLandforms.map((feature: string) => `- ${feature}`).join('\n')}

The terrain distribution should be: 
${Object.entries(geographyData.terrainDistribution).map(([terrain, percentage]) => `- ${terrain}: ${percentage}`).join('\n')}

The map should include these specific bodies of water:
${geographyData.waterBodies.map((water: string) => `- ${water}`).join('\n')}

The map should show these major kingdoms and realms in their proper geographical positions:
${worldData.majorKingdoms.map((k: any) => `- ${typeof k === 'string' ? k : k.name}`).join('\n')}

Include these specific points of interest, clearly labeled:
${worldData.pointsOfInterest.map((p: any) => `- ${typeof p === 'string' ? p : p.name}`).join('\n')}

The map should incorporate these unique magical elements:
${worldData.magicalElements.join(', ')}

Style the map with this aesthetic: ${worldData.aestheticTheme}. Design it as an old-style hand-drawn map on aged parchment with ornate borders, a compass rose, and decorative elements. Create a high-contrast style with a color palette of rich browns, deep blues, and vibrant greens for good readability as a game reference.

Do not include any text that says "Dungeons and Dragons", "D&D", or any trademarked terms. Make sure all map features have clear fantasy names that are unique to this world.`;

    const response = await openai.images.generate({
      model: "dall-e-3", 
      prompt: mapPrompt,
      n: 1,
      size: "1024x1024",
      quality: "hd",
      response_format: "url"
    });

    if (!response.data || !response.data[0] || !response.data[0].url) {
      throw new Error("No image URL returned from OpenAI");
    }

    // Combine the geographical data with the Everdice world information
    return { 
      url: response.data[0].url, 
      campaignId,
      worldData: worldData,
      everdiceData: {
        continent: geographyData.everdiceContinent || "Unknown Continent",
        regionName: geographyData.regionName || campaignInfo.name,
        regionType: geographyData.regionType || "region",
        connectionToEverdice: geographyData.connectionToEverdice || "This region exists within the world of Everdice."
      }
    };
  } catch (error: any) {
    console.error("Error generating world map:", error);
    throw new Error(`Failed to generate world map: ${error.message || "Unknown error"}`);
  }
}

export async function generateCampaign(options: CampaignGenerationOptions = {}) {
  // Randomize genre, theme and tone for more variety if not specifically provided
  const getRandomElement = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
  
  // Define diverse genre options
  const genreOptions = [
    "high fantasy", "dark fantasy", "sword and sorcery", "epic fantasy", 
    "steampunk fantasy", "urban fantasy", "gothic horror", "cosmic horror", 
    "swashbuckling adventure", "political intrigue", "frontier fantasy",
    "magical realism", "mythic fantasy", "planar adventure", "prehistoric fantasy"
  ];
  
  // Define diverse theme options
  const themeOptions = [
    "redemption", "corruption", "survival", "discovery", "revolution", 
    "justice", "vengeance", "ascension", "fall from grace", "rebirth",
    "ancient awakening", "eldritch mystery", "planar convergence", "prophecy", 
    "invasion", "conspiracy", "exploration", "colonization", "technological revolution"
  ];
  
  // Define diverse tone options
  const toneOptions = [
    "heroic", "grim", "whimsical", "mysterious", "tragic", "hopeful", 
    "comical", "suspenseful", "horrific", "morally ambiguous", "epic",
    "intimate", "philosophical", "gritty", "dreamlike", "surreal"
  ];

  const {
    genre = getRandomElement(genreOptions),
    theme = getRandomElement(themeOptions),
    tone = getRandomElement(toneOptions)
  } = options;

  try {
    // Generate a random world archetype as a starting point
    const worldArchetypes = [
      "shattered world of floating islands", "archipelago of island nations", 
      "underground civilization beneath a wasteland", "isolated valley surrounded by impassable mountains",
      "massive ancient forest with tree cities", "sprawling desert with oasis city-states",
      "frozen tundra with nomadic tribes", "volcanic island chain with diverse microclimates",
      "planar crossroads where multiple dimensions overlap", "coastal region with many peninsulas and bays",
      "endless steppes roamed by mounted clans", "jungle-covered ruins of an ancient empire",
      "massive city-state that spans an entire mountain", "foggy wetlands with isolated settlements",
      "frozen north with warring jarldoms", "dual world with mirrored light and shadow realms"
    ];
    
    const worldArchetype = getRandomElement(worldArchetypes);
    
    // Generate some unique magical elements for variety
    const magicalElementIdeas = [
      "sentient storms that can be bargained with", "crystallized memories that can be traded and experienced",
      "magical metals that respond to emotions", "dream-harvesting as a primary industry",
      "wild magic zones that constantly shift location", "ancient machines powered by starlight",
      "magical tattoos that grant temporary powers", "song-based magic that causes physical changes",
      "living architecture that grows and responds", "ancestral spirits bound to bloodlines",
      "color-based magic where pigments determine power", "runic language where written words manifest physically",
      "weather controlled by ritual dancing", "magical beasts that bond with compatible humans",
      "spellcasting that requires synchronized group effort", "enchantments bound to constellations"
    ];
    
    const magicalElement = getRandomElement(magicalElementIdeas);
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: `You are an innovative Dungeons & Dragons Dungeon Master renowned for creating imaginative, unconventional campaign worlds that break from standard fantasy tropes. You excel at worldbuilding that surprises and inspires both new and veteran players.
          
Your campaigns must:
1. Provide truly original concepts not commonly seen in typical D&D settings
2. Feature genuinely creative societies, magic systems, and ecological elements
3. Present complex, morally nuanced factions with unexpected motivations
4. Include distinctive geographical features that affect gameplay and story
5. Offer multiple paths, mysteries, and interconnected plot threads
6. Challenge standard fantasy assumptions with fresh takes on classic elements

IMPORTANT: Avoid generic medieval European fantasy tropes and standard Tolkien-inspired worlds. Create something that will genuinely surprise and delight experienced players.`
        },
        {
          role: "user",
          content: `Create a highly original D&D campaign setting with these parameters:
          - Genre: ${genre}
          - Theme: ${theme}
          - Tone: ${tone}
          - World Archetype: Consider a world that involves a "${worldArchetype}"
          - Unique Magical Element: Consider incorporating "${magicalElement}"
          
          Format your response as a JSON object with these fields:
          - name: A truly distinctive and evocative campaign name
          - description: A detailed description (300-400 words) of this unique world, emphasizing its most original elements. Include geography, societies, conflicts, magical systems, and potential adventure hooks.
          - setting: Indicate "Homebrew" and add some brief notes on what makes this setting distinctive from standard D&D worlds
          - worldQuirks: Array of 4-6 unusual features of this world that make it memorable and different
          - factions: Array of 4-5 groups with unconventional motivations and methods
          - keyLocations: Array of 5-7 distinctive locations that showcase the world's uniqueness
          - moralDilemmas: Array of 3-5 ethically complex situations players might face
          - secretThreats: Array of 2-4 hidden dangers or long-term threats players might gradually discover
          - introNarrative: A compelling campaign introduction narrative (300-400 words) that sets the scene and mood for players starting their adventure in this world. Written in second person ("you") perspective.`
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 2000,
      temperature: 0.9,
    });

    return safeJsonParse(response.choices[0].message.content);
  } catch (error) {
    console.error("Error generating campaign:", error);
    throw new Error("Failed to generate campaign");
  }
}
